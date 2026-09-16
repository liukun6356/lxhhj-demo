<template>
  <div class="spaceRadar-wrap">
    <!-- 默认加载天地图-->
    <Tdt_img_d/>
  </div>
</template>

<script lang="ts" setup>
import {usemapStore} from "@/store/modules/cesiumLastMap";
import GUI from "lil-gui";
import {onMounted, onUnmounted} from "vue";
import * as Cesium from "cesium";

// Component
import Tdt_img_d from "@/views/cesiumLast/component/effect/controlPanel/layerManagement/basicMap/tdt_img_d.vue"

const mapStore = usemapStore()
onMounted(async () => {
  initGui()
})

onUnmounted(() => {
  gui.destroy()
})

// 地图逻辑
const viewer = mapStore.getCesiumViewer()
let primitive

const addSpaceSensor = () => {
  class SensorPrimitive {
    show: true
    radius: Number.POSITIVE_INFINITY //传感器的半径
    xHalfAngle: 0 //传感器水平半角
    yHalfAngle: 0 //传感器垂直半角
    material: Cesium.Material.ColorType //目前用的统一材质
    lineColor: Cesium.Color.WHITE //线的颜色
    showScanPlane: true //是否显示扫描面
    scanPlaneColor: Cesium.Color.WHITE //扫描面颜色
    scanPlaneMode: "horizontal"  // 扫描面模式 垂直vertical/水平horizontal
    scanPlaneRate: 10 //扫描速率
    showThroughEllipsoid: undefined //此参数控制深度检测，为false启用深度检测，可以解决雷达一半在地球背面时显示的问题
    slice: 32 // 切分程度
    showSectorLines: true // 是否显示扇面的线
    showSectorSegmentLines: true // 是否显示扇面和圆顶面连接的线
    showLateralSurfaces: true //是否显示扇面
    lateralSurfaceMaterial: undefined //侧面材质(Material)
    showDomeSurfaces: true //是否显示圆顶表面
    domeSurfaceMaterial: undefined //圆顶表面材质(Material)
    showDomeLines: true //是否显示圆顶面线
    showIntersection: true //是否显示与地球相交的线
    intersectionColor: Cesium.Color.WHITE //与地球相交的线的颜色
    intersectionWidth: 5.0 //与地球相交的线的宽度（像素）

    _time
    _scanePlaneXHalfAngle
    _scanePlaneYHalfAngle
    _sectorFrontCommand //扇面 sector
    _sectorBackCommand
    _sectorLineCommand //扇面边线 sectorLine
    _sectorSegmentLineCommand //扇面分割线 sectorSegmentLine
    _domeFrontCommand //弧面 dome
    _domeBackCommand
    _domeLineCommand //弧面线 domeLine
    _scanPlaneFrontCommand //扫描面 scanPlane/scanRadial
    _scanPlaneBackCommand
    _sectorVA
    _sectorSegmentLineVA
    _domeVA
    _domeLineVA
    _frontFaceRS
    _backFaceRS
    _pickRS
    _attributeLocations = {
      position: 0,
      normal: 1
    };

    constructor(options) {
      this._sectorFrontCommand = new Cesium.DrawCommand({
        primitiveType: Cesium.PrimitiveType.TRIANGLES,
        boundingVolume: new Cesium.BoundingSphere()
      })
      this._sectorBackCommand = new Cesium.DrawCommand({
        primitiveType: Cesium.PrimitiveType.TRIANGLES,
        boundingVolume: new Cesium.BoundingSphere()
      });
      this._sectorLineCommand = new Cesium.DrawCommand({
        primitiveType: Cesium.PrimitiveType.LINES,
        boundingVolume: new Cesium.BoundingSphere()
      });
      this._sectorSegmentLineCommand = new Cesium.DrawCommand({
        primitiveType: Cesium.PrimitiveType.LINES,
        boundingVolume: new Cesium.BoundingSphere()
      });
      this._domeFrontCommand = new Cesium.DrawCommand({
        primitiveType: Cesium.PrimitiveType.TRIANGLES,
        boundingVolume: new Cesium.BoundingSphere()
      });
      this._domeBackCommand = new Cesium.DrawCommand({
        primitiveType: Cesium.PrimitiveType.TRIANGLES,
        boundingVolume: new Cesium.BoundingSphere()
      });
      this._domeLineCommand = new Cesium.DrawCommand({
        primitiveType: Cesium.PrimitiveType.LINES,
        boundingVolume: new Cesium.BoundingSphere()
      });
      this._scanPlaneFrontCommand = new Cesium.DrawCommand({
        primitiveType: Cesium.PrimitiveType.TRIANGLES,
        boundingVolume: new Cesium.BoundingSphere()
      });
      this._scanPlaneBackCommand = new Cesium.DrawCommand({
        primitiveType: Cesium.PrimitiveType.TRIANGLES,
        boundingVolume: new Cesium.BoundingSphere()
      });
      Object.assign(this, options)
    }

    update(frameState) {
      const {radius, scanPlaneRate, xHalfAngle, yHalfAngle} = this
      debugger
      if (!this.show || frameState.mode !== Cesium.SceneMode.SCENE3D) return;
      if (this.showScanPlane) {
        const time = frameState.time;
        const timeDiff = Cesium.JulianDate.secondsDifference(time, this._time);
        if (timeDiff < 0) this._time = Cesium.JulianDate.clone(time, this._time);
        const percentage = Math.max((timeDiff % scanPlaneRate) / scanPlaneRate, 0);
        let angle;
        if (this.scanPlaneMode == "horizontal") {
          angle = 2 * yHalfAngle * percentage - yHalfAngle;
          const cosYHalfAngle = Math.cos(angle);
          const tanXHalfAngle = Math.tan(xHalfAngle);
          const maxX = Math.atan(cosYHalfAngle * tanXHalfAngle);
          this._scanePlaneXHalfAngle = maxX;
          this._scanePlaneYHalfAngle = angle;
          Cesium.Matrix3.fromRotationX(this._scanePlaneYHalfAngle, new Cesium.Matrix3());
        } else {
          angle = 2 * xHalfAngle * percentage - xHalfAngle;
          const tanYHalfAngle = Math.tan(yHalfAngle);
          const cosXHalfAngle = Math.cos(angle);
          const maxY = Math.atan(cosXHalfAngle * tanYHalfAngle);
          this._scanePlaneXHalfAngle = angle;
          this._scanePlaneYHalfAngle = maxY;
          Cesium.Matrix3.fromRotationY(this._scanePlaneXHalfAngle, new Cesium.Matrix3());
        }
        Cesium.Matrix4.multiplyByMatrix3(new Cesium.Matrix4(), new Cesium.Matrix3(), new Cesium.Matrix4());
        Cesium.Matrix4.multiplyByUniformScale(new Cesium.Matrix4(), radius, new Cesium.Matrix4());
      }
      this.createVertexArray(frameState);
      this.createRenderState();
      this.createShaderProgram(frameState)
    }

    createShaderProgram(frameState){
      this.createCommonShaderProgram( frameState);
      if(this.showScanPlane)this.createScanPlaneShaderProgram(frameState)
    }

    createScanPlaneShaderProgram(frameState){


    }

    createCommonShaderProgram(frameState){
      const context = frameState.context;
      const vs = `
        attribute vec4 position;
        attribute vec3 normal;

        varying vec3 v_position;
        varying vec3 v_positionWC;
        varying vec3 v_positionEC;
        varying vec3 v_normalEC;

        void main()
        {
            gl_Position = czm_modelViewProjection * position;
            v_position = vec3(position);
            v_positionWC = (czm_model * position).xyz;
            v_positionEC = (czm_modelView * position).xyz;
            v_normalEC = czm_normal * normal;
        }
      `
      const RectangularSensor = `
        uniform vec4 u_intersectionColor;
        uniform float u_intersectionWidth;
        uniform vec4 u_lineColor;

        bool inSensorShadow(vec3 coneVertexWC, vec3 pointWC)
        {
            // Diagonal matrix from the unscaled ellipsoid space to the scaled space.
            vec3 D = czm_ellipsoidInverseRadii;

            // Sensor vertex in the scaled ellipsoid space
            vec3 q = D * coneVertexWC;
            float qMagnitudeSquared = dot(q, q);
            float test = qMagnitudeSquared - 1.0;

            // Sensor vertex to fragment vector in the ellipsoid's scaled space
            vec3 temp = D * pointWC - q;
            float d = dot(temp, q);

            // Behind silhouette plane and inside silhouette cone
            return (d < -test) && (d / length(temp) < -sqrt(test));
        }

        ///////////////////////////////////////////////////////////////////////////////

        vec4 getLineColor()
        {
            return u_lineColor;
        }

        vec4 getIntersectionColor()
        {
            return u_intersectionColor;
        }

        float getIntersectionWidth()
        {
            return u_intersectionWidth;
        }

        vec2 sensor2dTextureCoordinates(float sensorRadius, vec3 pointMC)
        {
            // (s, t) both in the range [0, 1]
            float t = pointMC.z / sensorRadius;
            float s = 1.0 + (atan(pointMC.y, pointMC.x) / czm_twoPi);
            s = s - floor(s);

            return vec2(s, t);
        }
      `
      const fs = new Cesium.ShaderSource({
        sources:[RectangularSensor,]
      })
    }

    createRenderState(){
      const {showThroughEllipsoid} = this
      if (this.material.isTranslucent()) {
        this._frontFaceRS = Cesium.RenderState.fromCache({
          depthTest: {
            enabled: !showThroughEllipsoid
          },
          depthMask: false,
          blending: Cesium.BlendingState.ALPHA_BLEND,
          cull: {
            enabled: true,
            face: Cesium.CullFace.BACK
          }
        });
        this._backFaceRS = Cesium.RenderState.fromCache({
          depthTest: {
            enabled: !showThroughEllipsoid
          },
          depthMask: false,
          blending: Cesium.BlendingState.ALPHA_BLEND,
          cull: {
            enabled: true,
            face: Cesium.CullFace.FRONT
          }
        });
        this._pickRS = Cesium.RenderState.fromCache({
          depthTest: {enabled: !showThroughEllipsoid},
          depthMask: false,
          blending: Cesium.BlendingState.ALPHA_BLEND
        });
      }else{
        this._frontFaceRS = Cesium.RenderState.fromCache({
          depthTest: {
            enabled: !showThroughEllipsoid
          },
          depthMask: true
        });
        this._pickRS = Cesium.RenderState.fromCache({
          depthTest: {enabled: true},
          depthMask: true
        });
      }
    }

    createVertexArray(frameState) {
      const {
        slice,
        xHalfAngle,
        yHalfAngle,
        showLateralSurfaces,
        showSectorSegmentLines,
        showDomeSurfaces,
        showDomeLines,
        showScanPlane
      } = this
      const context = frameState.context;
      const unitSectorPositions = this.computeUnitPosiiton(slice, xHalfAngle, yHalfAngle);
      const positions = this.computeSectorPositions(xHalfAngle, yHalfAngle, unitSectorPositions)
      if (showLateralSurfaces) this._sectorVA = this.createSectorVertexArray(context, positions);
      if (showSectorSegmentLines) this._sectorSegmentLineVA = this.createSectorSegmentLineVertexArray(context, positions);
      if (showDomeSurfaces) this._domeVA = this.createDomeVertexArray(context);
      if (showDomeLines) this._domeLineVA = this.createDomeLineVertexArray(context);
      if (showScanPlane) {
        if (primitive.scanPlaneMode == "horizontal") {
          const unitScanPlanePositions = this.computeUnitPosiiton(primitive, Cesium.Math.PI_OVER_TWO, 0);
          primitive._scanPlaneVA = this.createScanPlaneVertexArray(context, unitScanPlanePositions.zox);
        } else {
          const unitScanPlanePositions = this.computeUnitPosiiton(primitive, 0, Cesium.Math.PI_OVER_TWO);
          primitive._scanPlaneVA = this.createScanPlaneVertexArray(context, unitScanPlanePositions.zoy);
        }
      }
    }

    createScanPlaneVertexArray(context, positions) {
      const planeLength = positions.length - 1;
      const vertices = new Float32Array(3 * 3 * planeLength);
      let k = 0;
      for (let i = 0; i < planeLength; i++) {
        vertices[k++] = 0.0;
        vertices[k++] = 0.0;
        vertices[k++] = 0.0;

        vertices[k++] = positions[i].x;
        vertices[k++] = positions[i].y;
        vertices[k++] = positions[i].z;

        vertices[k++] = positions[i + 1].x;
        vertices[k++] = positions[i + 1].y;
        vertices[k++] = positions[i + 1].z;
      }
      const vertexBuffer = Cesium.Buffer.createVertexBuffer({
        context: context,
        typedArray: vertices,
        usage: Cesium.BufferUsage.STATIC_DRAW
      });
      const stride = 3 * Float32Array.BYTES_PER_ELEMENT;
      const attributes = [
        {
          index: this._attributeLocations.position,
          vertexBuffer: vertexBuffer,
          componentsPerAttribute: 3,
          componentDatatype: Cesium.ComponentDatatype.FLOAT,
          offsetInBytes: 0,
          strideInBytes: stride
        }
      ];

      return new Cesium.VertexArray({
        context: context,
        attributes: attributes
      });
    }

    createDomeLineVertexArray(context) {
      const geometry = Cesium.EllipsoidOutlineGeometry.createGeometry(
          new Cesium.EllipsoidOutlineGeometry({
            vertexFormat: Cesium.VertexFormat.POSITION_ONLY,
            stackPartitions: 32,
            slicePartitions: 32
          })
      );
      const vertexArray = Cesium.VertexArray.fromGeometry({
        context: context,
        geometry: geometry,
        attributeLocations: this._attributeLocations,
        bufferUsage: Cesium.BufferUsage.STATIC_DRAW,
        interleave: false
      });
      return vertexArray;
    }

    createDomeVertexArray(context) {
      const geometry = Cesium.EllipsoidGeometry.createGeometry(
          new Cesium.EllipsoidGeometry({
            vertexFormat: Cesium.VertexFormat.POSITION_ONLY,
            stackPartitions: 32,
            slicePartitions: 32
          })
      );
      const vertexArray = Cesium.VertexArray.fromGeometry({
        context: context,
        geometry: geometry,
        attributeLocations: this._attributeLocations,
        bufferUsage: Cesium.BufferUsage.STATIC_DRAW,
        interleave: false
      });
      return vertexArray;
    }

    createSectorSegmentLineVertexArray(context, positions) {
      const planeLength = Array.prototype.concat.apply([], positions).length - positions.length;
      const vertices = new Float32Array(3 * 3 * planeLength);
      let k = 0;
      for (let i = 0, len = positions.length; i < len; i++) {
        var planePositions = positions[i];

        for (let j = 0, planeLen = planePositions.length - 1; j < planeLen; j++) {
          vertices[k++] = planePositions[j].x;
          vertices[k++] = planePositions[j].y;
          vertices[k++] = planePositions[j].z;

          vertices[k++] = planePositions[j + 1].x;
          vertices[k++] = planePositions[j + 1].y;
          vertices[k++] = planePositions[j + 1].z;
        }
      }
      const vertexBuffer = Cesium.Buffer.createVertexBuffer({
        context: context,
        typedArray: vertices,
        usage: Cesium.BufferUsage.STATIC_DRAW
      });
      const stride = 3 * Float32Array.BYTES_PER_ELEMENT;
      const attributes = [
        {
          index: this._attributeLocations.position,
          vertexBuffer: vertexBuffer,
          componentsPerAttribute: 3,
          componentDatatype: Cesium.ComponentDatatype.FLOAT,
          offsetInBytes: 0,
          strideInBytes: stride
        }
      ];
      return new Cesium.VertexArray({
        context: context,
        attributes: attributes
      });
    }

    createSectorVertexArray(context, positions) {
      const planeLength = Array.prototype.concat.apply([], positions).length - positions.length;
      const vertices = new Float32Array(2 * 3 * 3 * planeLength);
      let k = 0;
      for (let i = 0, len = positions.length; i < len; i++) {
        const planePositions = positions[i];
        const n = Cesium.Cartesian3.normalize(Cesium.Cartesian3.cross(planePositions[0], planePositions[planePositions.length - 1], new Cesium.Cartesian3()), new Cesium.Cartesian3());
        for (let j = 0, planeLen = planePositions.length - 1; j < planeLen; j++) {
          vertices[k++] = 0.0;
          vertices[k++] = 0.0;
          vertices[k++] = 0.0;
          vertices[k++] = -n.x;
          vertices[k++] = -n.y;
          vertices[k++] = -n.z;

          vertices[k++] = planePositions[j].x;
          vertices[k++] = planePositions[j].y;
          vertices[k++] = planePositions[j].z;
          vertices[k++] = -n.x;
          vertices[k++] = -n.y;
          vertices[k++] = -n.z;

          vertices[k++] = planePositions[j + 1].x;
          vertices[k++] = planePositions[j + 1].y;
          vertices[k++] = planePositions[j + 1].z;
          vertices[k++] = -n.x;
          vertices[k++] = -n.y;
          vertices[k++] = -n.z;
        }
      }

      const vertexBuffer = Cesium.Buffer.createVertexBuffer({
        context: context,
        typedArray: vertices,
        usage: Cesium.BufferUsage.STATIC_DRAW
      });
      const stride = 2 * 3 * Float32Array.BYTES_PER_ELEMENT;
      const attributes = [
        {
          index: this._attributeLocations.position,
          vertexBuffer: vertexBuffer,
          componentsPerAttribute: 3,
          componentDatatype: Cesium.ComponentDatatype.FLOAT,
          offsetInBytes: 0,
          strideInBytes: stride
        },
        {
          index: this._attributeLocations.normal,
          vertexBuffer: vertexBuffer,
          componentsPerAttribute: 3,
          componentDatatype: Cesium.ComponentDatatype.FLOAT,
          offsetInBytes: 3 * Float32Array.BYTES_PER_ELEMENT,
          strideInBytes: stride
        }
      ];

      return new Cesium.VertexArray({
        context: context,
        attributes: attributes
      });
    }

    computeUnitPosiiton(slice, xHalfAngle, yHalfAngle) { // 计算zoy面和zoy面单位扇形位置
      const cosYHalfAngle = Math.cos(yHalfAngle);
      const tanYHalfAngle = Math.tan(yHalfAngle);
      const cosXHalfAngle = Math.cos(xHalfAngle);
      const tanXHalfAngle = Math.tan(xHalfAngle);
      const maxY = Math.atan(cosXHalfAngle * tanYHalfAngle);
      const maxX = Math.atan(cosYHalfAngle * tanXHalfAngle);
      const zoy = []; //ZOY面单位圆
      for (let i = 0; i < slice; i++) {
        const phi = (2 * maxY * i) / (slice - 1) - maxY;
        zoy.push(new Cesium.Cartesian3(0, Math.sin(phi), Math.cos(phi)));
      }
      const zox = []; //zox面单位圆
      for (let i = 0; i < slice; i++) {
        const phi = (2 * maxX * i) / (slice - 1) - maxX;
        zox.push(new Cesium.Cartesian3(Math.sin(phi), 0, Math.cos(phi)));
      }
      return {zoy: zoy, zox: zox};
    }

    computeSectorPositions(xHalfAngle, yHalfAngle, unitPosition) {//计算扇面的位置
      const zoy = unitPosition.zoy, zox = unitPosition.zox;
      const positions = [];
      //zoy面沿y轴逆时针转xHalfAngle
      let matrix3 = Cesium.Matrix3.fromRotationY(xHalfAngle, new Cesium.Matrix3());
      positions.push(zoy.map(p => Cesium.Matrix3.multiplyByVector(matrix3, p, new Cesium.Cartesian3())));
      //zox面沿x轴顺时针转yHalfAngle
      matrix3 = Cesium.Matrix3.fromRotationX(-yHalfAngle, new Cesium.Matrix3());
      positions.push(zox.map(p => Cesium.Matrix3.multiplyByVector(matrix3, p, new Cesium.Cartesian3())).reverse());
      //zoy面沿y轴顺时针转xHalfAngle
      matrix3 = Cesium.Matrix3.fromRotationY(-xHalfAngle, new Cesium.Matrix3());
      positions.push(zoy.map(p => Cesium.Matrix3.multiplyByVector(matrix3, p, new Cesium.Cartesian3())).reverse());
      //zox面沿x轴逆时针转yHalfAngle
      matrix3 = Cesium.Matrix3.fromRotationX(yHalfAngle, new Cesium.Matrix3());
      positions.push(zox.map(p => Cesium.Matrix3.multiplyByVector(matrix3, p, new Cesium.Cartesian3())));
      return positions;
    }
  }

  primitive = new SensorPrimitive({
    radius: 1e5,
    xHalfAngle: Cesium.Math.toRadians(50),
    yHalfAngle: Cesium.Math.toRadians(50),
    material: new Cesium.Color(0.0, 1.0, 1.0, 0.4),
    lineColor: new Cesium.Color(0.0, 1.0, 1.0, 1.0),
    showScanPlane: true,
    scanPlaneColor: new Cesium.Color(0.0, 1.0, 1.0, 1.0),
    scanPlaneMode: 'vertical',
    scanPlaneRate: 3,
    showThroughEllipsoid: false
  })

  debugger
}

const reset = () => {

}

// lil-gui逻辑
let gui
const formData = {
  addSpaceSensor,
  reset,
}

const initGui = () => {
  gui = new GUI({title: "spaceRadar"});
  gui.add(formData, "addSpaceSensor")
  gui.add(formData, "reset")
}

</script>

<style lang="scss" scoped>
.spaceRadar-wrap {

}
</style>