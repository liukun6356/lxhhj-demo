//提供测量长度、面积等 [绘制基于draw]

import * as Cesium from "cesium";
import { DasClass } from "../core/DasClass";
import * as util from "../util/util";
import { Draw } from "../draw/Draw";
import { MeasureBase } from "./measure/MeasureBase";
import { MeasureAngle } from "./measure/MeasureAngle";
import { MeasureArea } from "./measure/MeasureArea";
import { MeasureAreaSurface } from "./measure/MeasureAreaSurface";
import { MeasureHeight } from "./measure/MeasureHeight";
import { MeasureHeightTriangle } from "./measure/MeasureHeightTriangle";
import { MeasureLength } from "./measure/MeasureLength";
import { MeasureLengthSection } from "./measure/MeasureLengthSection";
import { MeasureLengthSurface } from "./measure/MeasureLengthSurface";
import { MeasurePoint } from "./measure/MeasurePoint";
import { MeasureVolume } from "./measure/MeasureVolume";

//量算类(统一入口)
export class Measure extends DasClass {
  constructor(options, oldparam) {
    super(options);

    //兼容v2.2之前旧版本处理,非升级用户可删除下面代码
    if (options instanceof Cesium.Viewer) {
      options = {
        viewer: options,
        ...oldparam
      };
    }
    this.clearMeasure = this.clear; //别名, 但不建议使用。
    this.measuerLength = this.length;
    this.measureSection = this.section;
    this.measureArea = this.area;
    this.measureHeight = this.height;
    this.measureAngle = this.angle;
    this.measurePoint = this.point;
    //兼容v2.2之前旧版本处理,非升级用户可删除上面代码

    this.options = options;

    // 标绘对象
    this.drawControl = new Draw(options.viewer, {
      hasEdit: options.hasEdit || true,
      isAutoEditing: false,
      hasDel: e => {
        return false;
      },
      ...options
    });
    this.options.draw = this.drawControl;
  }

  get draw() {
    return this.drawControl;
  }

  get dataSource() {
    return this.drawControl.dataSource;
  }

  /*长度测量*/
  length(opts) {
    this.stopDraw();
    if (opts && opts.terrain) {
      //兼容v2.2之前旧版本处理,贴地
      return this.surfaceLength(opts);
    } else {
      if (!this._measureLength) {
        this._measureLength = new MeasureLength(this.options, this);
      }
      this._measureLength.startDraw(opts);
      return this._measureLength;
    }
  }

  /*贴地 长度测量*/
  surfaceLength(opts) {
    this.stopDraw();
    if (!this._measureLengthSurface) {
      this._measureLengthSurface = new MeasureLengthSurface(this.options, this);
    }
    this._measureLengthSurface.startDraw(opts);
    return this._measureLengthSurface;
  }

  /*剖面分析*/
  section(opts) {
    this.stopDraw();
    if (!this._measureLengthSection) {
      this._measureLengthSection = new MeasureLengthSection(this.options, this);
    }
    this._measureLengthSection.startDraw(opts);
    return this._measureLengthSection;
  }

  /*面积测量*/
  area(opts) {
    this.stopDraw();
    if (opts && opts.terrain) {
      //兼容v2.2之前旧版本处理,贴地
      return this.surfaceeArea(opts);
    } else {
      if (!this._measureArea) {
        this._measureArea = new MeasureArea(this.options, this);
      }
      this._measureArea.startDraw(opts);
      return this._measureArea;
    }
  }

  /*贴地 面积测量*/
  surfaceeArea(opts) {
    this.stopDraw();
    if (!this._measureAreaSurface) {
      this._measureAreaSurface = new MeasureAreaSurface(this.options, this);
    }
    this._measureAreaSurface.startDraw(opts);
    return this._measureAreaSurface;
  }

  /*体积测量（方量分析）*/
  volume(opts) {
    this.stopDraw();
    if (!this._measureVolume) {
      this._measureVolume = new MeasureVolume(this.options, this);
    }
    this._measureVolume.startDraw(opts);
    return this._measureVolume;
  }

  /*高度测量*/
  height(opts) {
    this.stopDraw();
    if (opts && opts.isSuper) {
      //兼容v2.2之前旧版本处理,三角测量
      return this.triangleHeight(opts);
    } else {
      if (!this._measureHeight) {
        this._measureHeight = new MeasureHeight(this.options, this);
      }
      this._measureHeight.startDraw(opts);
      return this._measureHeight;
    }
  }

  /*三角高度测量*/
  triangleHeight(opts) {
    this.stopDraw();
    if (!this._measureHeightTriangle) {
      this._measureHeightTriangle = new MeasureHeightTriangle(this.options, this);
    }
    this._measureHeightTriangle.startDraw(opts);
    return this._measureHeightTriangle;
  }

  /*角度测量*/
  angle(opts) {
    this.stopDraw();
    if (!this._measureAngle) {
      this._measureAngle = new MeasureAngle(this.options, this);
    }
    this._measureAngle.startDraw(opts);
    return this._measureAngle;
  }

  /*坐标测量*/
  point(opts) {
    this.stopDraw();
    if (!this._measurePoint) {
      this._measurePoint = new MeasurePoint(this.options, this);
    }
    this._measurePoint.startDraw(opts);
    return this._measurePoint;
  }

  //取消并停止绘制
  //如果上次未完成绘制就单击了新的，清除之前未完成的。
  stopDraw() {
    if (this._measureAngle) this._measureAngle.stopDraw();
    if (this._measureArea) this._measureArea.stopDraw();
    if (this._measureAreaSurface) this._measureAreaSurface.stopDraw();
    if (this._measureHeight) this._measureHeight.stopDraw();
    if (this._measureHeightTriangle) this._measureHeightTriangle.stopDraw();
    if (this._measureLength) this._measureLength.stopDraw();
    if (this._measureLengthSection) this._measureLengthSection.stopDraw();
    if (this._measureLengthSurface) this._measureLengthSurface.stopDraw();
    if (this._measurePoint) this._measurePoint.stopDraw();
    if (this._measureVolume) this._measureVolume.stopDraw();
  }

  //外部控制，完成绘制，比如手机端无法双击结束
  endDraw() {
    if (this._measureAngle) this._measureAngle.endDraw();
    if (this._measureArea) this._measureArea.endDraw();
    if (this._measureAreaSurface) this._measureAreaSurface.endDraw();
    if (this._measureHeight) this._measureHeight.endDraw();
    if (this._measureHeightTriangle) this._measureHeightTriangle.endDraw();
    if (this._measureLength) this._measureLength.endDraw();
    if (this._measureLengthSection) this._measureLengthSection.endDraw();
    if (this._measureLengthSurface) this._measureLengthSurface.endDraw();
    if (this._measurePoint) this._measurePoint.endDraw();
    if (this._measureVolume) this._measureVolume.endDraw();
  }

  /*清除测量*/
  clear() {
    if (this._measureAngle) this._measureAngle.clear();
    if (this._measureArea) this._measureArea.clear();
    if (this._measureAreaSurface) this._measureAreaSurface.clear();
    if (this._measureHeight) this._measureHeight.clear();
    if (this._measureHeightTriangle) this._measureHeightTriangle.clear();
    if (this._measureLength) this._measureLength.clear();
    if (this._measureLengthSection) this._measureLengthSection.clear();
    if (this._measureLengthSurface) this._measureLengthSurface.clear();
    if (this._measurePoint) this._measurePoint.clear();
    if (this._measureVolume) this._measureVolume.clear();
  }

  /** 更新量测结果的单位 */
  updateUnit(unit, oldparam) {
    //兼容v2.2之前旧版本处理,非升级用户可删除下面代码
    if (oldparam) {
      unit = oldparam;
    }
    //兼容v2.2之前旧版本处理,非升级用户可删除上面代码

    var arr = this.dataSource.entities.values;
    for (var i = 0, len = arr.length; i < len; i++) {
      var entity = arr[i];
      if (entity.label && entity.attribute && entity.showText) {
        entity.showText(unit);
      }
    }
  }

  formatArea(val, unit) {
    return util.formatArea(val, unit);
  }
  formatLength(val, unit) {
    return util.formatLength(val, unit);
  }

  destroy() {
    this.stopDraw();
    this.clear();

    this.drawControl.destroy();
    super.destroy();
  }
}

//[静态属性]本类中支持的事件类型常量
Measure.event = MeasureBase.event;
