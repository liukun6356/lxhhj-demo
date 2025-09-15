<template>
  <div class="customPrimitive-wrap">
    <Tdt_img_d/>
  </div>
</template>

<script lang="ts" setup>
import {onMounted, onUnmounted} from "vue";
import GUI from "lil-gui";
import * as Cesium from "cesium";
import {usemapStore} from "@/store/modules/cesiumLastMap";
// Component
import Tdt_img_d from "@/views/cesiumLast/component/main/controlPanel/layerManagement/basicMap/tdt_img_d.vue"

const mapStore = usemapStore()
onMounted(() => {
  initGui()
  handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
  handler.setInputAction(onMouseClick, Cesium.ScreenSpaceEventType.LEFT_CLICK);
  viewer.scene.primitives.add(primitiveCollection);
})

onUnmounted(() => {
  viewer.scene.primitives.remove(primitiveCollection);
  gui.destroy()
})

const addTrianglePrimitive = () => {
  reset()
  const vertices = new Float64Array([
    0, 0, 0,
    100, 0, 0,
    0, 100, 0,
    0, 0, 10,
    0, 0, 100,
    100, 0, 10
  ])
  const modelMatrix = Cesium.Transforms.eastNorthUpToFixedFrame(Cesium.Cartesian3.fromDegrees(114.347137, 30.541429, 10))
  const geometry = new Cesium.Geometry({
    attributes: {
      position: new Cesium.GeometryAttribute({
        componentDatatype: Cesium.ComponentDatatype.DOUBLE, // 双面可见
        componentsPerAttribute: 3,
        values: vertices
      }),
    },
    primitiveType: Cesium.PrimitiveType.TRIANGLES,
    boundingSphere: Cesium.BoundingSphere.fromVertices(vertices)
  })
  const instance = new Cesium.GeometryInstance({
    geometry: geometry,
    modelMatrix,
    attributes: {color: Cesium.ColorGeometryInstanceAttribute.fromColor(Cesium.Color.RED)}
  })
  primitiveCollection.add(new Cesium.Primitive({
    geometryInstances: instance,
    asynchronous: false, // 关闭异步
    appearance: new Cesium.PerInstanceColorAppearance({
      flat: true,          // 不计算光照
      translucent: false   // 是否透明
    })
  }))
  const worldBoundingSphere = Cesium.BoundingSphere.transform(geometry.boundingSphere, modelMatrix, new Cesium.BoundingSphere());
  viewer.camera.flyToBoundingSphere(worldBoundingSphere);
}

const addCustomPrimitive = () => {
  reset()
  const vertices = new Float64Array([
    0, 0, 0,
    100, 0, 0,
    0, 100, 0,
    0, 100, 0,
    100, 0, 0,
    100, 100, 0
  ])
  const modelMatrix = Cesium.Transforms.eastNorthUpToFixedFrame(Cesium.Cartesian3.fromDegrees(114.347137, 30.541429, 10))
  const geometry = new Cesium.Geometry({
    attributes: {
      position: new Cesium.GeometryAttribute({
        componentDatatype: Cesium.ComponentDatatype.DOUBLE, // 双面可见
        componentsPerAttribute: 3,
        values: vertices
      }),
    },
    primitiveType: Cesium.PrimitiveType.TRIANGLES,
    boundingSphere: Cesium.BoundingSphere.fromVertices(vertices)
  })
  const instance = new Cesium.GeometryInstance({
    geometry: geometry,
    modelMatrix,
    attributes: {color: Cesium.ColorGeometryInstanceAttribute.fromColor(Cesium.Color.RED)}
  })
  primitiveCollection.add(new Cesium.Primitive({
    geometryInstances: instance,
    asynchronous: false, // 关闭异步
    appearance: new Cesium.PerInstanceColorAppearance({
      flat: true,          // 不计算光照
      translucent: false   // 是否透明
    })
  }))
  const worldBoundingSphere = Cesium.BoundingSphere.transform(geometry.boundingSphere, modelMatrix, new Cesium.BoundingSphere());
  viewer.camera.flyToBoundingSphere(worldBoundingSphere);
}

const addCustomIndexPrimitive = () => {
  reset()
  const vertices = new Float64Array([
    0, 0, 0,
    100, 0, 0,
    0, 100, 0,
    // 0, 100, 0,
    // 100, 0, 0,
    100, 100, 0
  ])
  const modelMatrix = Cesium.Transforms.eastNorthUpToFixedFrame(Cesium.Cartesian3.fromDegrees(114.347137, 30.541429, 10))
  const indices = new Uint16Array([0, 1, 2, 2, 1, 3])// //存储一份顶点索引
  const geometry = new Cesium.Geometry({
    attributes: {
      position: new Cesium.GeometryAttribute({
        componentDatatype: Cesium.ComponentDatatype.DOUBLE, // 双面可见
        componentsPerAttribute: 3,
        values: vertices
      }),
    },
    indices,
    primitiveType: Cesium.PrimitiveType.TRIANGLES,
    boundingSphere: Cesium.BoundingSphere.fromVertices(vertices)
  })
  const instance = new Cesium.GeometryInstance({
    geometry: geometry,
    modelMatrix,
    attributes: {color: Cesium.ColorGeometryInstanceAttribute.fromColor(Cesium.Color.RED)}
  })
  primitiveCollection.add(new Cesium.Primitive({
    geometryInstances: instance,
    asynchronous: false, // 关闭异步
    appearance: new Cesium.PerInstanceColorAppearance({
      flat: true,          // 不计算光照
      translucent: false   // 是否透明
    })
  }))
  const worldBoundingSphere = Cesium.BoundingSphere.transform(geometry.boundingSphere, modelMatrix, new Cesium.BoundingSphere());
  viewer.camera.flyToBoundingSphere(worldBoundingSphere);
}

const addCustomCylinderPrimitive = () => {
  reset()
  const vertices = new Float64Array([
    100, -100, 100, // 0
    -100, -100, 100,  //1
    -100, 100, 100,  //2
    100, 100, 100, //3
    0, 0, -100  //4
  ])
  const indices = new Uint16Array([
    4, 0, 1,  // ABE面
    4, 1, 2,//BCE面
    4, 2, 3, //CDE面
    4, 3, 0, // DAE面
    0, 1, 2,  //平面拆分的三角形 ABC
    0, 3, 1//平面拆分的三角形 ABD
  ])

  const boundingSphere = Cesium.BoundingSphere.fromVertices(vertices);
  const modelMatrix = Cesium.Transforms.eastNorthUpToFixedFrame(Cesium.Cartesian3.fromDegrees(114.347137, 30.541429, 200))

  const geometry = new Cesium.Geometry({
    attributes: {
      position: new Cesium.GeometryAttribute({
        componentDatatype: Cesium.ComponentDatatype.DOUBLE,
        componentsPerAttribute: 3,
        values: vertices
      })
    },
    indices: indices,
    primitiveType: Cesium.PrimitiveType.TRIANGLES,
    boundingSphere: boundingSphere
  })
  const instance = new Cesium.GeometryInstance({
    geometry: geometry,
    modelMatrix,
    attributes: {color: Cesium.ColorGeometryInstanceAttribute.fromColor(Cesium.Color.RED)}
  })
  primitiveCollection.add(new Cesium.Primitive({
    geometryInstances: instance,
    asynchronous: false, // 关闭异步
    appearance: new Cesium.PerInstanceColorAppearance({
      flat: true,          // 不计算光照
      translucent: false   // 是否透明
    })
  }))
  const worldBoundingSphere = Cesium.BoundingSphere.transform(geometry.boundingSphere, modelMatrix, new Cesium.BoundingSphere());
  viewer.camera.flyToBoundingSphere(worldBoundingSphere);
}

const addCustomNormalCylinderPrimitive = () => {
  reset()
  const vertices = new Float64Array([
    // 前
    0, 0, -100, // E点
    100, -100, 100, //A点
    -100, -100, 100, //B点
    // 后
    0, 0, -100, // E点
    -100, 100, 100, //C点
    100, 100, 100, //D点
    // 左
    0, 0, -100, // E点
    -100, -100, 100, //B点
    -100, 100, 100, //C点
    // 右
    0, 0, -100, // E点
    100, 100, 100, //D点
    100, -100, 100, //A点
    // 上
    100, -100, 100, //A点
    -100, -100, 100, //B点
    100, 100, 100, //D点
    -100, -100, 100,//B点
    100, 100, 100, //D点
    -100, 100, 100, //C点
  ])

  const triangles = [
    // 每个面由 3 个点组成
    [new Cesium.Cartesian3(0, 0, -100), new Cesium.Cartesian3(100, -100, 100), new Cesium.Cartesian3(-100, -100, 100)], // 前
    [new Cesium.Cartesian3(0, 0, -100), new Cesium.Cartesian3(-100, 100, 100), new Cesium.Cartesian3(100, 100, 100)],   // 后
    [new Cesium.Cartesian3(0, 0, -100), new Cesium.Cartesian3(-100, -100, 100), new Cesium.Cartesian3(-100, 100, 100)], // 左
    [new Cesium.Cartesian3(0, 0, -100), new Cesium.Cartesian3(100, 100, 100), new Cesium.Cartesian3(100, -100, 100)],   // 右
    [new Cesium.Cartesian3(100, -100, 100), new Cesium.Cartesian3(-100, -100, 100), new Cesium.Cartesian3(100, 100, 100)], // 上1
    [new Cesium.Cartesian3(-100, -100, 100), new Cesium.Cartesian3(100, 100, 100), new Cesium.Cartesian3(-100, 100, 100)], // 上2
  ]

  const computeNormal = (p0, p1, p2) => { // 三角形法线计算
    const d1 = Cesium.Cartesian3.subtract(p1, p0, new Cesium.Cartesian3())
    const d2 = Cesium.Cartesian3.subtract(p2, p0, new Cesium.Cartesian3())
    const normal = Cesium.Cartesian3.cross(d1, d2, new Cesium.Cartesian3())
    return Cesium.Cartesian3.normalize(normal, new Cesium.Cartesian3())
  }
  let normals = []
  for (const [p0, p1, p2] of triangles) {    // 每个三角形 3 个顶点的法线相同
    const normal = computeNormal(p0, p1, p2)
    normals.push(normal.x, normal.y, normal.z, normal.x, normal.y, normal.z, normal.x, normal.y, normal.z)
  }

  const boundingSphere = Cesium.BoundingSphere.fromVertices(vertices);
  const modelMatrix = Cesium.Transforms.eastNorthUpToFixedFrame(Cesium.Cartesian3.fromDegrees(114.347137, 30.541429, 200))
  const geometry = new Cesium.Geometry({
    attributes: {
      position: new Cesium.GeometryAttribute({
        componentDatatype: Cesium.ComponentDatatype.DOUBLE,
        componentsPerAttribute: 3,
        values: vertices
      }),
      normal: new Cesium.GeometryAttribute({
        componentDatatype: Cesium.ComponentDatatype.FLOAT,
        componentsPerAttribute: 3,
        values: new Float64Array(normals)
      })
    },
    primitiveType: Cesium.PrimitiveType.TRIANGLES,
    boundingSphere
  })
  const instance = new Cesium.GeometryInstance({
    geometry: geometry,
    modelMatrix,
    attributes: {color: Cesium.ColorGeometryInstanceAttribute.fromColor(Cesium.Color.RED)}
  })
  primitiveCollection.add(new Cesium.Primitive({
    geometryInstances: instance,
    asynchronous: false, // 关闭异步
    appearance: new Cesium.PerInstanceColorAppearance({
      translucent: false   // 是否透明
    })
  }))
  const worldBoundingSphere = Cesium.BoundingSphere.transform(geometry.boundingSphere, modelMatrix, new Cesium.BoundingSphere());
  viewer.camera.flyToBoundingSphere(worldBoundingSphere);
}

const generateCurvePoints = (flattenedPoints, multiplier = 30) => {
  const numOfPoints = flattenedPoints.length / 2 * multiplier
  const points = [];
  for (let i = 0; i < flattenedPoints.length; i += 2) points.push([flattenedPoints[i], flattenedPoints[i + 1]])
  const times = points.map((_, index) => index / (points.length - 1))
  const cartesianPoints = points.map(point => Cesium.Cartesian3.fromDegrees(point[0], point[1]))
  const spline = new Cesium.CatmullRomSpline({times: times, points: cartesianPoints});
  const curvePoints = [];
  for (let i = 0; i < numOfPoints; i++) curvePoints.push(spline.evaluate(i / (numOfPoints - 1)))
  return curvePoints;
}

const reset = () => {
  console.log(primitiveCollection)
  primitiveCollection.removeAll()
}

// 地图逻辑
const viewer = mapStore.getCesiumViewer();
let handler
const primitiveCollection = new Cesium.PrimitiveCollection()

const onMouseClick = () => {

}

// lil-gui逻辑
let gui, customFolder
const formData = {
  addTrianglePrimitive,
  addCustomPrimitive,
  addCustomIndexPrimitive,
  addCustomCylinderPrimitive,
  addCustomNormalCylinderPrimitive,
  reset
}
const initGui = () => {
  gui = new GUI({title: "appearance外观"});
  customFolder = gui.addFolder("自定义Primitive")
  customFolder.add(formData, "addTrianglePrimitive").name("两个三角形")
  customFolder.add(formData, "addCustomPrimitive").name("顶点正方形")
  customFolder.add(formData, "addCustomIndexPrimitive").name("顶点索引优化正方形")
  customFolder.add(formData, "addCustomCylinderPrimitive").name("顶点索引锥体")
  customFolder.add(formData, "addCustomNormalCylinderPrimitive").name("顶点法线锥体")
}

</script>

<style lang="scss" scoped>
.customPrimitive-wrap {

}
</style>
