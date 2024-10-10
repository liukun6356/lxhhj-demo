import * as Cesium from "cesium";
import { DasClass, eventType } from "../core/DasClass";
import * as daslog from "../util/log";
import { formatPosition } from "../util/point";
import { isString, clone } from "../util/util";
import { getSurfaceTerrainHeight } from "../util/point";

//Viewer扩展
export class Cesium3DTilesetEx extends DasClass {
  //========== 构造方法 ==========
  constructor(tileset, options) {
    super(options);

    this.options = clone(options || {});
    this.orginCenter = { x: 0, y: 0, z: 0 }; //原始的中心点位置
    this.orginRotation = { x: 0, y: 0, z: 0 }; //原始的旋转角度

    tileset._loadOk = false;
    tileset.readyPromise.then(tileset => {
      this._initData(tileset);
      tileset._loadOk = true;
    });
  }
  //========== 对外属性 ==========
  //透明度
  get opacity() {
    return this.options.opacity;
  }
  set opacity(value) {
    this.options.opacity = value;
    if (!this.tileset) return;

    this.tileset.style = new Cesium.Cesium3DTileStyle({
      color: "color() *vec4(1,1,1," + value + ")"
    });
  }

  //位置
  get position() {
    if (this.options.offset) {
      return Cesium.Cartesian3.fromDegrees(
        Cesium.defaultValue(this.options.offset.x, this.orginCenter.x),
        Cesium.defaultValue(this.options.offset.y, this.orginCenter.y),
        Cesium.defaultValue(this.options.offset.z, this.orginCenter.z)
      );
    }

    return this.orginPosition;
  }
  set position(value) {
    this.offset = formatPosition(value);
  }

  get offset() {
    if (this.options.offset) return this.options.offset;
    return this.orginCenter;
  }
  set offset(value) {
    this.options.offset = this.options.offset || {};
    for (var key in value) {
      this.options.offset[key] = value[key];
    }

    if (this.transform) {
      this.updateMatrix();
    } else {
      this.updateMatrix2();
    }
  }

  //只调整高度
  get height() {
    if (this.options.offset) return this.options.offset.z;
    return 0;
  }
  set height(value) {
    this.options.offset = this.options.offset || {};
    this.options.offset.z = value;

    if (!this.tileset) return;

    if (this.transform) {
      this.updateMatrix();
    } else {
      this.updateMatrix2();
    }
  }

  //旋转方向
  get rotation() {
    if (this.options.rotation) return this.options.rotation;
    return this.orginRotation;
  }
  set rotation(value) {
    this.options.rotation = value;
    this.updateMatrix();
  }

  get rotation_x() {
    if (this.options.rotation && Cesium.defined(this.options.rotation.x))
      return this.options.rotation.x;
    if (this.orginRotation && Cesium.defined(this.orginRotation.x)) return this.orginRotation.x;
    return 0;
  }
  set rotation_x(value) {
    this.options.rotation = this.options.rotation || {};
    this.options.rotation.x = value;
    this.updateMatrix();
  }
  get rotation_y() {
    if (this.options.rotation && Cesium.defined(this.options.rotation.y))
      return this.options.rotation.y;
    if (this.orginRotation && Cesium.defined(this.orginRotation.y)) return this.orginRotation.y;
    return 0;
  }
  set rotation_y(value) {
    this.options.rotation = this.options.rotation || {};
    this.options.rotation.y = value;
    this.updateMatrix();
  }

  get rotation_z() {
    if (this.options.rotation && Cesium.defined(this.options.rotation.z))
      return this.options.rotation.z;
    if (this.orginRotation && Cesium.defined(this.orginRotation.z)) return this.orginRotation.z;
    return 0;
  }
  set rotation_z(value) {
    this.options.rotation = this.options.rotation || {};
    this.options.rotation.z = value;
    this.updateMatrix();
  }

  //轴方向
  get axis() {
    return this.options.axis;
  }
  set axis(value) {
    this.options.axis = value;
    this.updateMatrix();
  }

  //缩放比例
  get scale() {
    return this.options.scale || 1;
  }
  set scale(value) {
    this.options.scale = value;
    this.updateMatrix();
  }

  //========== 方法 ==========

  //记录一些原始值
  _initData(tileset) {
    this.tileset = tileset;

    //记录模型原始的中心点
    this.orginPosition = Cesium.clone(this.tileset.boundingSphere.center);

    //是否存在世界矩阵 _root.transform
    this.transform = Cesium.defaultValue(
      this.options.transform,
      tileset._root && tileset._root.transform
    );

    if (this.transform) {
      //原始矩阵
      this.orginMatrix = Cesium.Matrix4.inverse(
        Cesium.Matrix4.fromArray(tileset._root.transform),
        new Cesium.Matrix4()
      );

      //获取transform中的中心点
      var matrix = Cesium.Matrix4.fromArray(this.tileset._root.transform);
      var position = Cesium.Matrix4.getTranslation(matrix, new Cesium.Cartesian3());
      if (Cesium.defined(position) && Cesium.Cartographic.fromCartesian(position)) {
        this.orginPosition = position;

        //计算 orginRotation
        //取旋转矩阵
        var rotmat = Cesium.Matrix4.getMatrix3(matrix, new Cesium.Matrix3());
        //默认的旋转矩阵
        var defrotmat = Cesium.Matrix4.getMatrix3(
          Cesium.Transforms.eastNorthUpToFixedFrame(position),
          new Cesium.Matrix3()
        );

        //计算rotmat 的x轴，在defrotmat 上 旋转
        var xaxis = Cesium.Matrix3.getColumn(defrotmat, 0, new Cesium.Cartesian3());
        var yaxis = Cesium.Matrix3.getColumn(defrotmat, 1, new Cesium.Cartesian3());
        var zaxis = Cesium.Matrix3.getColumn(defrotmat, 2, new Cesium.Cartesian3());

        var dir = Cesium.Matrix3.getColumn(rotmat, 0, new Cesium.Cartesian3());

        dir = Cesium.Cartesian3.cross(dir, zaxis, dir);
        dir = Cesium.Cartesian3.cross(zaxis, dir, dir);
        dir = Cesium.Cartesian3.normalize(dir, dir);

        var heading = Cesium.Cartesian3.angleBetween(xaxis, dir);

        var ay = Cesium.Cartesian3.angleBetween(yaxis, dir);

        if (ay > Math.PI * 0.5) {
          heading = 2 * Math.PI - heading;
        }
        //原始的旋转角度
        this.orginRotation = {
          x: 0,
          y: 0,
          z: Number(Cesium.Math.toDegrees(heading).toFixed(1))
        };
      } else {
        this.transform = false;
      }
    }
    this.orginCenter = formatPosition(this.orginPosition);

    //打印下
    daslog.log((this.options.name || "") + " 模型中心为:" + JSON.stringify(this.orginCenter));

    //================设置相关配置参数===============

    //高度自动贴地处理
    if (this.options.offset) {
      if (this.options.offset.z == "auto" || this.options.offset.z == "-height") {
        this.clampToGround();
      }
    }

    //透明度
    if (Cesium.defined(this.options.opacity)) {
      this.opacity = this.options.opacity;
    }

    //设置style
    if (Cesium.defined(this.options.style)) {
      this.tileset.style = new Cesium.Cesium3DTileStyle(this.options.style);
    }

    if (this.transform) {
      this.updateMatrix();
    } else {
      this.updateMatrix2();
    }
    this.fire(eventType.load, { sourceTarget: tileset });
  }

  //自动贴地处理(因为模型中心位置不一定于地形匹配，此方法不是唯一准确的)
  clampToGround(viewer, offset) {
    offset = Cesium.defaultValue(offset, 1); //偏移点高度
    if (viewer && viewer.das.hasTerrain()) {
      //有地形时
      getSurfaceTerrainHeight(viewer.scene, this.orginCenter, {
        asyn: true, //是否异步求准确高度
        callback: (newHeight, cartOld) => {
          if (newHeight == null) return;
          this.height = newHeight - this.orginCenter.z + offset;
        }
      });
    } else {
      //无地形时
      this.height = -this.orginCenter.z + offset;
    }
  }

  //重新计算当前矩阵
  updateMatrix() {
    if (!this.tileset || !this.transform) return;

    var matrix = Cesium.Transforms.eastNorthUpToFixedFrame(this.position);

    //旋转
    if (this.options.rotation) {
      let mx = Cesium.Matrix3.fromRotationX(Cesium.Math.toRadians(this.options.rotation.x || 0));
      let my = Cesium.Matrix3.fromRotationY(Cesium.Math.toRadians(this.options.rotation.y || 0));
      let mz = Cesium.Matrix3.fromRotationZ(Cesium.Math.toRadians(this.options.rotation.z || 0));
      let rotationX = Cesium.Matrix4.fromRotationTranslation(mx);
      let rotationY = Cesium.Matrix4.fromRotationTranslation(my);
      let rotationZ = Cesium.Matrix4.fromRotationTranslation(mz);
      //矩阵相乘
      Cesium.Matrix4.multiply(matrix, rotationX, matrix);
      Cesium.Matrix4.multiply(matrix, rotationY, matrix);
      Cesium.Matrix4.multiply(matrix, rotationZ, matrix);
    }

    //缩放比例
    if (this.options.scale > 0 && this.options.scale != 1)
      Cesium.Matrix4.multiplyByUniformScale(matrix, this.options.scale, matrix);

    //垂直轴变换 ，兼容旧版本数据z轴方向不对的情况
    //如果可以修改模型json源文件，可以在json文件里面加了一行来修正："gltfUpAxis" : "Z",
    if (Cesium.defined(this.options.axis)) {
      var rightaxis;
      if (isString(this.options.axis)) {
        switch (this.options.axis.toUpperCase()) {
          case "Y_UP_TO_Z_UP":
            rightaxis = Cesium.Axis.Y_UP_TO_Z_UP;
            break;
          case "Z_UP_TO_Y_UP":
            rightaxis = Cesium.Axis.Z_UP_TO_Y_UP;
            break;
          case "X_UP_TO_Z_UP":
            rightaxis = Cesium.Axis.X_UP_TO_Z_UP;
            break;
          case "Z_UP_TO_X_UP":
            rightaxis = Cesium.Axis.Z_UP_TO_X_UP;
            break;
          case "X_UP_TO_Y_UP":
            rightaxis = Cesium.Axis.X_UP_TO_Y_UP;
            break;
          case "Y_UP_TO_X_UP":
            rightaxis = Cesium.Axis.Y_UP_TO_X_UP;
            break;
        }
      } else if (this.options.axis instanceof Cesium.Axis) {
        rightaxis = this.options.axis;
      }

      if (rightaxis) {
        matrix = Cesium.Matrix4.multiplyTransformation(matrix, rightaxis, matrix);
      }
    }
    this.tileset._root.transform = matrix;
    return matrix;
  }

  //普通,此种方式[x，y不能多次更改]
  updateMatrix2() {
    if (!this.tileset || !this.options.offset) return;

    var catographic = Cesium.Cartographic.fromCartesian(this.tileset.boundingSphere.center);
    var surface = Cesium.Cartesian3.fromRadians(catographic.longitude, catographic.latitude, 0.0);
    var offset = this.position;
    var translation = Cesium.Cartesian3.subtract(offset, surface, new Cesium.Cartesian3());
    var matrix = Cesium.Matrix4.fromTranslation(translation);
    this.tileset.modelMatrix = matrix;
    return matrix;
  }
  //修改高度【独立方法】
  // setHeight(height) {
  //   let center = Cesium.Cartographic.fromCartesian(this.tileset.boundingSphere.center);
  //   let surface = Cesium.Cartesian3.fromRadians(center.longitude, center.latitude, center.height);
  //   let offset = Cesium.Cartesian3.fromRadians(
  //     center.longitude,
  //     center.latitude,
  //     center.height + height
  //   );
  //   let translation = Cesium.Cartesian3.subtract(offset, surface, new Cesium.Cartesian3());
  //   this.tileset.modelMatrix = Cesium.Matrix4.fromTranslation(translation);
  // }

  updateStyle(options) {
    for (var i in options) {
      if (typeof options[i] === "object" && this.options[i]) {
        for (var key2 in options[i]) {
          this.options[i][key2] = options[i][key2];
        }
      } else {
        this.options[i] = options[i];
      }
    }

    if (!this.tileset) return;

    if (this.transform) {
      this.updateMatrix();
    } else {
      this.updateMatrix2();
    }
    return this;
  }

  //获取构件节点位置，现对于原始矩阵变化后的新位置
  getPositionByOrginMatrix(position) {
    if (this.orginMatrix) {
      var mat = Cesium.Matrix4.multiply(
        this.tileset._root.transform,
        this.orginMatrix,
        new Cesium.Matrix4()
      );
      return Cesium.Matrix4.multiplyByPoint(mat, position, new Cesium.Cartesian3());
    }
    return position;
  }
}

//绑定到Viewer上
Object.defineProperties(Cesium.Cesium3DTileset.prototype, {
  das: {
    set: function(value) {
      if (this._das) {
        this._das.updateStyle(value);
      } else {
        if (value instanceof Cesium.Viewer) this._das = value;
        else this._das = new Cesium3DTilesetEx(this, value);
      }
    },
    get: function() {
      if (!this._das) {
        this._das = new Cesium3DTilesetEx(this);
      }
      return this._das;
    }
  }
});
