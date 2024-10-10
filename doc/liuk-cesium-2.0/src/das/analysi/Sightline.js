import * as Cesium from "cesium";
import { DasClass, eventType } from "../core/DasClass";
import { addPositionsHeight } from "../util/point";
import { interLine, computeSurfacePoints } from "../util/polyline";

//通视分析 类
export class Sightline extends DasClass {
  constructor(options, oldparam) {
    super(options);

    //兼容v2.2之前旧版本处理,非升级用户可删除下面代码
    if (options instanceof Cesium.Viewer) {
      options = {
        viewer: options,
        ...oldparam
      };
    }
    //兼容v2.2之前旧版本处理,非升级用户可删除上面代码

    this.viewer = options.viewer;

    this.lines = [];
    this.realTime = Cesium.defaultValue(options.realTime, true); //实时更新
    this._visibleColor = Cesium.defaultValue(options.visibleColor, new Cesium.Color(0, 1, 0, 1)); //可视区域
    this._hiddenColor = Cesium.defaultValue(options.hiddenColor, new Cesium.Color(1, 0, 0, 1)); //不可视区域
    this._depthFailColor_visible = this.realTime ? options.depthFailColor : this._visibleColor;
    this._depthFailColor_hidden = this.realTime ? options.depthFailColor : this._hiddenColor;
    this._depthFailColor = options.depthFailColor;

    if (options.originPoint && options.targetPoint) {
      this.add(options.originPoint, options.targetPoint);
    }
  }
  //========== 对外属性 ==========

  //可视区域颜色
  get visibleColor() {
    return this._visibleColor;
  }
  set visibleColor(val) {
    this._visibleColor = val;
  }
  //不可视区域颜色
  get hiddenColor() {
    return this._hiddenColor;
  }
  set hiddenColor(val) {
    this._hiddenColor = val;
  }

  //depthFailMaterial颜色，默认为不可视区域颜色
  get depthFailColor() {
    return this._depthFailColor;
  }
  set depthFailColor(val) {
    this._depthFailColor_visible = this.realTime ? val : this._visibleColor;
    this._depthFailColor_hidden = this.realTime ? val : this._hiddenColor;
    this._depthFailColor = val;
  }

  //========== 方法 ==========
  add(origin, target, addHeight) {
    if (addHeight) {
      origin = addPositionsHeight(origin, addHeight); //加人的身高
    }

    var currDir = Cesium.Cartesian3.normalize(
      Cesium.Cartesian3.subtract(target, origin, new Cesium.Cartesian3()),
      new Cesium.Cartesian3()
    );
    var currRay = new Cesium.Ray(origin, currDir);
    var pickRes = this.viewer.scene.drillPickFromRay(currRay, 2, this.lines);

    if (
      Cesium.defined(pickRes) &&
      pickRes.length > 0 &&
      Cesium.defined(pickRes[0]) &&
      Cesium.defined(pickRes[0].position)
    ) {
      var position = pickRes[0].position;

      var distance = Cesium.Cartesian3.distance(origin, target);
      var distanceFx = Cesium.Cartesian3.distance(origin, position);
      if (distanceFx < distance) {
        //存在正常分析结果
        let arrEentity = this._showPolyline(origin, target, position);

        let result = {
          block: true, //存在遮挡
          position: position,
          entity: arrEentity
        };
        this.fire(eventType.end, result);
        return result;
      }
    }

    let arrEentity = this._showPolyline(origin, target);
    let result = {
      block: false,
      entity: arrEentity
    };
    this.fire(eventType.end, result);
    return result;
  }

  //插值异步分析
  add2(origin, target, options) {
    options = options || {};
    if (options.addHeight) {
      origin = addPositionsHeight(origin, options.addHeight); //加人的身高
    }

    //插值求新路线
    var positionsNew = interLine([origin, target], {
      splitNum: options.splitNum || 50
    });

    //求对比的贴地地面高度
    computeSurfacePoints({
      viewer: this.viewer,
      positions: positionsNew, //需要计算的源路线坐标数组
      callback: (raisedPositions, noHeight) => {
        if (!noHeight) {
          for (var i = 0; i < positionsNew.length; i++) {
            var position = positionsNew[i];
            var xHeight = Cesium.Cartographic.fromCartesian(position).height; //线高度
            var dHeight = Cesium.Cartographic.fromCartesian(raisedPositions[i]).height; //地面高度

            if (xHeight <= dHeight) {
              var arrEentity = this._showPolyline(origin, target, position);
              this.fire(eventType.end, {
                block: true, //存在遮挡
                position: position,
                entity: arrEentity
              });
              return;
            }
          }
        }
        let arrEentity2 = this._showPolyline(origin, target);
        this.fire(eventType.end, {
          block: false,
          entity: arrEentity2
        });
      }
    });
  }

  _showPolyline(origin, target, position) {
    if (position) {
      //存在正常分析结果
      var entity1 = this.viewer.entities.add(
        new Cesium.Entity({
          polyline: {
            positions: [origin, position],
            width: 2,
            material: this._visibleColor,
            depthFailMaterial: this._depthFailColor_visible
          }
        })
      );
      this.lines.push(entity1);

      var entity2 = this.viewer.entities.add(
        new Cesium.Entity({
          polyline: {
            positions: [position, target],
            width: 2,
            material: this._hiddenColor,
            depthFailMaterial: this._depthFailColor_hidden
          }
        })
      );
      this.lines.push(entity2);

      return [entity1, entity2];
    } else {
      //无正确分析结果时，直接返回
      var entity = this.viewer.entities.add(
        new Cesium.Entity({
          polyline: {
            positions: [origin, target],
            width: 2,
            material: this._visibleColor,
            depthFailMaterial: this._depthFailColor_visible
          }
        })
      );
      this.lines.push(entity);

      return [entity];
    }
  }

  clear() {
    for (var i = 0, len = this.lines.length; i < len; i++) {
      this.viewer.entities.remove(this.lines[i]);
    }
    this.lines = [];
  }

  destroy() {
    this.clear();
    super.destroy();
  }
}

//[静态属性]本类中支持的事件类型常量
Sightline.event = {
  end: eventType.end
};
