//挖填方计算或者体积测量(基于WebGl)
import * as Cesium from "cesium";
import { DasClass,eventType } from "../core/DasClass";
import { centerOfMass } from "../util/point";
import { formatArea } from "../util/util";
import { setPositionsHeight } from "../util/point";
import { getDefStyle } from "../draw/attr/index";
import { style2Entity as polygonStyle2Entity } from "../draw/attr/Attr.Polygon";
import * as rx from "../util/rxjs.umd.min";
import { Draw } from "../draw/Draw";
//挖填方分析
export class CutFillAnalysis extends DasClass {
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
    this._viewer = options.viewer;
    this.scene = options.viewer.scene;
    this.context = this.scene.context;
    this.pointPrimitives = this._viewer.scene.primitives.add(new Cesium.PointPrimitiveCollection());
    // this.labelPrimitives = viewer.scene.primitives.add(new Cesium.LabelCollection());
    this.volumeResult = null; //测量结果
    this.polylinePrimitives = null; //测量结果
    //引用Rxjs
    this.rxjs = {
      of: rx.of,
      from: rx.from,
      fromEventPattern: rx.fromEventPattern,
      animationFrameScheduler: rx.animationFrameScheduler,
      operators: {
        concatMap: rx.operators.concatMap,
        observeOn: rx.operators.observeOn,
        delay: rx.operators.delay,
        map: rx.operators.map,
        first: rx.operators.first,
        toArray: rx.operators.toArray
      }
    };
  
    this.drawControl = new Draw(this._viewer, {
      hasEdit: false
    });
    this.resultTempR = new Cesium.Cartesian3();
    this.resultTempO = new Cesium.Cartesian3();
    this.resultTempK = new Cesium.Cartesian3();
    this.NewCartographic = new Cesium.Cartographic();
    this.cartesiansIndex0ScalarResult = new Cesium.Cartesian3();
    this.cartesiansIndex1ScalarResult = new Cesium.Cartesian3();
    this.resultTempB = new Cesium.Cartesian3();
    this.differenceMatrixClone = new Cesium.Cartesian3();
  }
  //高度
  get height() {
    return this._jzmHeight;
  }
  set height(val) {
    if (!this.isComputing()) return;
    this._jzmHeight = val;
    var newFillV = this.updateVolume(val);
    this.fire(eventType.change, {
      height : val,
      ...newFillV
    });
  }
  get minHeight() {
    return this._minHeight;
  }
  get maxHeight() {
    return this._maxHeight;
  }
  isComputing() {
    return !!this._subsription;
  }
  cancel() {
    this.pointPrimitives.removeAll(); //移出所有点
    if(this.polylinePrimitives){
      this._viewer.scene.primitives.remove(this.polylinePrimitives);
      this.polylinePrimitives = null;
    }
    if(this.volumeResult){ //移出测量结果
      this.volumeResult.destroy();
      this.volumeResult = null;
    }
    this._subsription = this._subsription && this._subsription.unsubscribe();
    delete this._maxHeight;
    delete this._minHeight;
    delete this._jzmHeight;
    delete this.result;
    this.drawControl.removeAll(); //移除基准面
    delete this.polygonJzm;
  }
  selecteHeight(callback) {
    //拾取高度
    var that = this;
    this.drawControl.startDraw({
      type: "point",
      style: {
        color: "#00fff2"
      },
      success: function(entity) {
        if (!entity.point) return;
        var pos = entity._position._value;
        var height = Cesium.Cartographic.fromCartesian(pos).height;
        var newFillV = that.updateVolume(height);
        that.drawControl.deleteEntity(entity);
        var data = Object.assign({height : height}, newFillV);
        callback && callback(data);
      }
    });
  }
  copyArray(arr) {
    if (Array.isArray(arr)) {
      for (var t = 0, n = Array(arr.length); t < arr.length; t++)
        n[t] = arr[t];
      return n
    }
    return arr
  }
  //开始绘制
  startDraw(_options) {
    var that = this;
    if (that.isComputing()) {
      that.cancel();
    }
    var options = _options || {};
    var style = options.style || {};
    var splitNum = options.splitNum || 1000;
    var isShow = options.isShowPoint || true;
    that.drawControl.startDraw({
      type: "polygon",
      style: {
          color: "#007be6",
          opacity: 0.5,
          outline: true,
          outlineWidth: 1,
          outlineColor: "#ffffff",
          ...style,
          clampToGround: false
      },
      success: function (entity) {
        var positions = that._viewer.das.draw.getPositions(entity);
        that.drawControl.deleteEntity(entity);
        that.compute({cartesians:positions,
          splitNum:splitNum,
          isShowPoint : isShow
        }, function (result) {
          that.showResult(result);
        }, function (progress) {
          console.log(progress);
        });
      }
    })
  }
  getMinHeight(positions){
    var height = 0;
    for (let index = 0; index < positions.length; index++) {
      var cartographic = Cesium.Cartographic.fromCartesian(positions[index]);
      var h = cartographic.height;
      if(index==0){
        height = h;
      }else if(h<height){
        height = h;
      }
    }
    return height;
  }
  updateVolume(height){
    var that = this,cut=0,fill=0;
    if (!that.isComputing() || !that.polygonJzm) return {};
    var data = that.result,area = Number(data.area),
    itemArea = area / that.splitNum;
      for (let index = 0; index < data.diffHeights.length; index++) {
        const _height = data.diffHeights[index];
        if(height >= _height+that.minHeight){
          cut += 0,fill += itemArea * (height-(_height+that.minHeight));
        }else if(height < _height+that.minHeight){
          cut += itemArea * (_height+that.minHeight-height),fill += 0;
        }
      }
      //修改基准面高度  
      that._jzmHeight = height;
      that.drawControl.setPositions(setPositionsHeight(that.positions, height),that.polygonJzm);
      var html = "";
      if (fill > 0) {
        html += "<div>填方体积：" + that.formatNum(fill) + "立方米</div>";
      }
      if (cut > 0) {
        html += "<div>挖方体积：" + that.formatNum(cut) + "立方米</div>";
      }
      html += "<div>横切面积：" + formatArea(area)+"</div>";
      that.volumeResult._dom.html(`<div class='das3d-popup-content-volumeResult'>` + html + `<div class='das3d-popup-volume-wrapper'></div></div>`);
      return {
        fill : that.formatNum(fill) + "立方米",
        cut : that.formatNum(cut) + "立方米",
        area : formatArea(area)
      }
  }
  isShowPoint(isShow){
    if (!this.isComputing()) return;
    this.pointPrimitives._pointPrimitives.forEach(function(item){
      item.show =isShow;
    });
    this.polylinePrimitives.show = isShow;
  }
  showResult(result){
    var that = this;
    if (!this.isComputing()) return;
    that._addPointAndLine(result); //加载取样点和线
    // 显示基准面
    var _polygonJzm = polygonStyle2Entity(
      getDefStyle("polygon", {
        color: "#0000ff",
        opacity: 0.8
      }), {
        hierarchy: new Cesium.PolygonHierarchy(that.positions),
        height: new Cesium.CallbackProperty((time, result) => {
          return that.height;
        }, false)
      });
    delete _polygonJzm.perPositionHeight;
    that.polygonJzm = that.drawControl.dataSource.entities.add({
      polygon: _polygonJzm
    });
    var fillText = "";
    if (result.fill > 0) {
      fillText += "<div>填方体积：" + that.formatNum(result.fill) + "立方米</div>";
    }
    if (result.cut > 0) {
      fillText += "<div>挖方体积：" + that.formatNum(result.cut) + "立方米</div>";
    }
    fillText += "<div>横切面积：" + formatArea(Number(result.area))+"</div>";
    that.volumeResult = new das3d.DivPoint(that._viewer, {
        html: `<div class='das3d-popup-content-volumeResult'>` + fillText + `<div class='das3d-popup-volume-wrapper'></div></div>`,
        position: setPositionsHeight([result.ptcenter], result.maxHeight + 1)[0],
        horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
        verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
        heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
        distanceDisplayCondition: new Cesium.DistanceDisplayCondition(0, 30000),//按视距距离显示 
        scaleByDistance: new Cesium.NearFarScalar(800, 1.0, 25000, 0.1)
    });
  }
  
  showResult2(result){
    var that = this;
    if (!that.isComputing()) return;
    that._addPointAndLine(result); //加载取样点和线
    that.volumeResult = new das3d.DivPoint(that._viewer, {
        html: `<div class='das3d-popup-content-volumeResult'><div>体积测量结果：` + that.formatNum(result.cut) + `立方米</div><div class='das3d-popup-volume-wrapper'></div></div>`,
        position: setPositionsHeight([result.ptcenter], result.maxHeight + 1)[0],
        horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
        verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
        heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
        distanceDisplayCondition: new Cesium.DistanceDisplayCondition(0, 30000),//按视距距离显示 
        scaleByDistance: new Cesium.NearFarScalar(800, 1.0, 25000, 0.1)
    });
  }
  _addPointAndLine(result){
    var that = this;
    //Primitive方式
    var green = Cesium.Color.fromCssColorString('#00ff00').withAlpha(0.8);
    var red = Cesium.Color.fromCssColorString('#ff0000').withAlpha(0.8);
    var polylineinstances = [];
    for (var j = 0; j < result.diffHeights.length; ++j) {
      var item = result.diffHeights[j];
      that.pointPrimitives.add({
        pixelSize: 8,
        show : that.isShow,
        color: green,
        position: result.heightCartesians[j],
        disableDepthTestDistance : Number.POSITIVE_INFINITY //不遮挡
      });
      if (item > 0) {
        that.pointPrimitives.add({
          pixelSize: 8,
          show : that.isShow,
          color: red,
          position: result.clampCartesians[j],
          disableDepthTestDistance : Number.POSITIVE_INFINITY
        });
        var polylineinstance = new Cesium.GeometryInstance({
            geometry: new Cesium.PolylineGeometry({
                positions: [result.heightCartesians[j],result.clampCartesians[j]],
                width: 1
            }),
            vertexFormat: Cesium.PolylineMaterialAppearance.VERTEX_FORMAT,
            attributes : {
              color: Cesium.ColorGeometryInstanceAttribute.fromColor(Cesium.Color.YELLOW.withAlpha(0.6)),
              depthFailColor: Cesium.ColorGeometryInstanceAttribute.fromColor(Cesium.Color.YELLOW.withAlpha(0.2))
            },
        });
        polylineinstances.push(polylineinstance);

      }
    }
    var _primitive = new Cesium.Primitive({
        geometryInstances: polylineinstances,
        releaseGeometryInstances:false,
        appearance: new Cesium.PolylineColorAppearance(),
        depthFailAppearance: new Cesium.PolylineColorAppearance()
    });
    that.polylinePrimitives = that._viewer.scene.primitives.add(_primitive);
    that.polylinePrimitives.show = that.isShow;
  }
  compute(options, result, progress) {
    var cartesians = options.cartesians;
    var that = this,scene = this._viewer.scene;
    that.positions = cartesians;
    if (that.isComputing()) {
      that.cancel();
    }
    var area = that.area(cartesians).toFixed(2);
    //求中心点
    var ptcenter = centerOfMass(cartesians);
    // var gridWidth = Math.max(0.5, Math.sqrt(area / that.splitNum));
    that.splitNum = options.splitNum || 1000;
    that.isShow = options.isShowPoint || true;
    var gridWidth = Math.sqrt(area / that.splitNum);
    var finalHeight = that.getMinHeight(cartesians);
    that._minHeight = finalHeight;
    that._jzmHeight = finalHeight;
    that._maxHeight = result.maxHeight;
    this._subsription && this._subsription.unsubscribe(),
      this._subsription = function (cartesians, gridWidth, finalHeight, scene, result, progress) {
        if (!(cartesians.length < 3)) {
          progress && progress(0);
          var positionArr = [];
          cartesians.forEach(function (pointItem) {
            var tempPoint;
            if (finalHeight) {
             // (t = Cesium.Cartographic.fromCartesian(pointItem, void 0, that.NewCartographic)).height = finalHeight
              tempPoint = Cesium.Cartographic.fromCartesian(pointItem, void 0, that.NewCartographic);
              tempPoint.height = finalHeight;
            } else {
              tempPoint = Cesium.Cartographic.fromCartesian(pointItem, void 0, that.NewCartographic);
              finalHeight = tempPoint.height;
            }
            positionArr.push(Cesium.Cartesian3.fromRadians(tempPoint.longitude, tempPoint.latitude, tempPoint.height));
          });
          var center = Cesium.CoplanarPolygonGeometry.fromPositions({
            positions: positionArr
          });
          var cartesians = Cesium.CoplanarPolygonGeometry.createGeometry(center);
          var positionValue = cartesians.attributes.position.values;
          var indices = cartesians.indices;
          var boundingSphere = cartesians.boundingSphere;
          center = Cesium.Cartesian3.clone(boundingSphere.center);
          cartesians = Cesium.Cartographic.fromCartesian(center, void 0, that.NewCartographic);
          Cesium.Cartesian3.fromRadians(cartesians.longitude, cartesians.latitude, finalHeight, void 0, center);
          cartesians = Cesium.Transforms.eastNorthUpToFixedFrame(center);
          var cartesiansIndex0 = Cesium.Matrix4.getColumn(cartesians, 0, new Cesium.Cartesian3());
          var cartesiansIndex1 = Cesium.Matrix4.getColumn(cartesians, 1, new Cesium.Cartesian3());
          var differenceMatrix = Cesium.Cartesian3.subtract(center, Cesium.Cartesian3.multiplyByScalar(cartesiansIndex0, boundingSphere.radius, that.cartesiansIndex0ScalarResult), that.resultTempB);
          differenceMatrix = Cesium.Cartesian3.subtract(differenceMatrix, Cesium.Cartesian3.multiplyByScalar(cartesiansIndex1, boundingSphere.radius, that.cartesiansIndex1ScalarResult), differenceMatrix);
          var splitLength = Math.round(2 * boundingSphere.radius / gridWidth) + 1;
          var cellSize = gridWidth;
          var differenceMatrixClone = that.differenceMatrixClone;
          Cesium.Cartesian3.clone(differenceMatrix, differenceMatrixClone);
          for (var y = [], v = [], i = 0; i < splitLength; ++i)
            for (var x = 0; x < splitLength; ++x)
              if (Cesium.Cartesian3.add(differenceMatrix, Cesium.Cartesian3.multiplyByScalar(cartesiansIndex0, cellSize * i, that.cartesiansIndex0ScalarResult), differenceMatrixClone),
                Cesium.Cartesian3.add(differenceMatrixClone, Cesium.Cartesian3.multiplyByScalar(cartesiansIndex1, cellSize * x, that.cartesiansIndex1ScalarResult), differenceMatrixClone),
                !(0 < boundingSphere.distanceSquaredTo(differenceMatrixClone))) {
                for (var w = false, b = indices.length / 3, C = 0; C < b; ++C) {
                  var S = Cesium.Cartesian3.fromElements(positionValue[3 * indices[3 * C + 0] + 0], positionValue[3 * indices[3 * C + 0] + 1], positionValue[3 * indices[3 * C + 0] + 2], that.resultTempR)
                    , T = Cesium.Cartesian3.fromElements(positionValue[3 * indices[3 * C + 1] + 0], positionValue[3 * indices[3 * C + 1] + 1], positionValue[3 * indices[3 * C + 1] + 2], that.resultTempO)
                    , M = Cesium.Cartesian3.fromElements(positionValue[3 * indices[3 * C + 2] + 0], positionValue[3 * indices[3 * C + 2] + 1], positionValue[3 * indices[3 * C + 2] + 2], that.resultTempK);
                  if (that.D(differenceMatrixClone, S, T, M)) {
                    w = true;
                    break
                  }
                }
                w && (v.push(Cesium.Cartesian3.clone(differenceMatrixClone)),
                  y.push(Cesium.Ellipsoid.WGS84.scaleToGeodeticSurface(differenceMatrixClone)))
              }
          progress && progress(0.1);
          var E, P = 0;
          return that.rxjs.of({
            clampCartesians: y,
            heightCartesians: v
          }).pipe(that.rxjs.operators.concatMap(function (e) {
            for (var t = e.clampCartesians, n = e.heightCartesians, i = 0, r = t.length, a = []; i < r;) {
              var o = 10 < r - i ? i + 10 : r
                , l = t.slice(i, o)
                , s = n.slice(i, o);
              a.push({
                pClampCartesians: l,
                pHeightCartesians: s
              }),
                i = o
            }
            return E = a.length,
              that.rxjs.from(a).pipe(that.rxjs.operators.concatMap(function (e) {
                var t = e.pClampCartesians
                  , u = e.pHeightCartesians;
                return that.rxjs.fromEventPattern(function (n) {
                  scene.clampToHeightMostDetailed(t).then(function (e) {
                    ++P,
                      progress && progress(P / E * .8 + .1);
                    var t = e.some(function (e) {
                      return void 0 === e
                    });
                    n(t ? void 0 : e)
                  }).otherwise(function (e) {
                    n(void 0)
                  })
                }, function (e) { }).pipe(that.rxjs.operators.observeOn(that.rxjs.animationFrameScheduler), that.rxjs.operators.delay(10), that.rxjs.operators.map(function (e) {
                  if (!e)
                    throw new Error("clampToHeightMostDetailed error!");
                  for (var t = [], n = e.length, i = new Cesium.Cartesian3(), r = 0, a = 0, o = 0, mh = 0, mhNum = 0; o < n; ++o) {
                    var l = Cesium.Cartesian3.subtract(e[o], u[o], i);
                    var s = Cesium.Cartesian3.magnitude(l);
                    var sk=0;
                    if (Cesium.Cartesian3.dot(l, u[o]) > 0) {
                      t.push(s);
                      r += s * gridWidth * gridWidth;
                      sk=s;
                    } else {
                      t.push(-s);
                      sk=-s;
                      a += s * gridWidth * gridWidth;
                    }
                    if (sk > mh) {
                      mh = sk;
                      mhNum = Cesium.Cartographic.fromCartesian(e[o]).height;
                    }
                  }
                  return {
                    pHeightCartesians: u,
                    pClampCartesians: e,
                    pDiffHeights: t,
                    maxHeight:mhNum,
                    fill: a,
                    cut: r,
                    total: a - r
                  }
                }), that.rxjs.operators.first())
              }))
          }), that.rxjs.operators.toArray(), that.rxjs.operators.map(function (e) {
            var pHeightCartesiansList = [];
            var pClampCartesiansList = [];
            var pDiffHeightsList = [];
            var cutResult = 0;
            var fillResult = 0;
            var totalResult = 0;
            var pmaxHeight=0;
             e.forEach(function (e) {
              pHeightCartesiansList.push.apply(pHeightCartesiansList, that.copyArray(e.pHeightCartesians));
              pClampCartesiansList.push.apply(pClampCartesiansList, that.copyArray(e.pClampCartesians));
              pDiffHeightsList.push.apply(pDiffHeightsList, that.copyArray(e.pDiffHeights));
              if(e.maxHeight>pmaxHeight){
                pmaxHeight=e.maxHeight;
              }
              cutResult += e.cut;
              fillResult += e.fill;
              totalResult += e.total;
            })
            if(progress){
              progress(1)
            }
              return {
              heightCartesians: pHeightCartesiansList,
              clampCartesians: pClampCartesiansList,
              diffHeights: pDiffHeightsList,
              maxHeight:pmaxHeight,
              cut: cutResult,
              fill: fillResult,
              total: totalResult
            }
          }), 
          that.rxjs.operators.map(function (e) {
            e.area = area;
            e.ptcenter = ptcenter;
            that.result = e;
            return result(e)
          }))
        }
    }(cartesians, gridWidth, finalHeight, scene, result, progress).subscribe(function () { }, function (e) {
        that.cancel()//,
        //  o(e)
      }, function () { })
  }
  D(e, t, n, i) {
    var r = this.getMagnitude(t, n, i)
      , a = this.getMagnitude(e, t, n)
      , n = this.getMagnitude(e, n, i)
      , t = this.getMagnitude(e, i, t);
    return Math.abs(r - a - n - t) < 1e-5 * r;
  }


  area(e) {
    var h = new Cesium.Cartesian3();
    var d = new Cesium.Cartesian3();
    var f = new Cesium.Cartesian3();

    if (!(e.length <= 2)) {
      e = Cesium.CoplanarPolygonGeometry.fromPositions({
        positions: e
      }),
        e = Cesium.CoplanarPolygonGeometry.createGeometry(e);
      if (e) {
        for (var t = e.attributes.position.values, n = e.indices, i = n.length / 3, r = 0, a = 0; a < i; ++a) {
          var o = Cesium.Cartesian3.fromElements(t[3 * n[3 * a + 0] + 0], t[3 * n[3 * a + 0] + 1], t[3 * n[3 * a + 0] + 2], h)
            , l = Cesium.Cartesian3.fromElements(t[3 * n[3 * a + 1] + 0], t[3 * n[3 * a + 1] + 1], t[3 * n[3 * a + 1] + 2], d)
            , s = Cesium.Cartesian3.fromElements(t[3 * n[3 * a + 2] + 0], t[3 * n[3 * a + 2] + 1], t[3 * n[3 * a + 2] + 2], f);
          r += this.getMagnitude(o, l, s);
        }
        return r
      }
    }
  }
  getMagnitude(e, t, n) {
    var r = new Cesium.Cartesian3()
    var a = new Cesium.Cartesian3()
    var o = new Cesium.Cartesian3();
    return t = Cesium.Cartesian3.subtract(t, e, r),
      e = Cesium.Cartesian3.subtract(n, e, a),
      e = Cesium.Cartesian3.cross(t, e, o),
      0.5 * Cesium.Cartesian3.magnitude(e)
  }
  isDestroyed() {
    return false;
  }
  destroy() {
    if (this._subsription) {
      this._subsription.unsubscribe();
      this._subsription = null;
      return Cesium.destroyObject(this);
    }
  }
  //格式化数值
  formatNum(num) {
    if (num > 10000) {
      return (num / 10000).toFixed(2) + "万";
    }
    return num.toFixed(2);
  }

}
