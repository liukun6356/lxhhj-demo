<template>
  <div class="dxgw-wrap">
    <Tdt_img_d/>
  </div>
</template>

<script lang="ts" setup>
import {onMounted, reactive} from "vue";
import * as mars3d from "mars3d";
import {usemapStore} from "@/store/modules/cesiumMap";
// Component
import Tdt_img_d from "@/views/cesium/component/main/controlPanel/layerManagement/basicMap/tdt_img_d.vue"


const model = reactive({

})

onMounted(()=>{
  addNormalPrimitive()
})

const addGeometryPrimitive = () => {
  const positions = new Float64Array([
    1, -1, 1, // 0
    -1, -1, 1,  //1
    -1, 1, 1,  //2
    1, 1, 1, //3
    0, 0, -1  //4
  ])
  const indices = new Uint16Array([
    4, 0, 1,  // ABE面
    4, 1, 2,//BCE面
    4, 2, 3, //CDE面
    4, 3, 0, // DAE面
    0, 1, 2,  //平面拆分的三角形 ABC
    0, 3, 1//平面拆分的三角形 ABD
  ])

  const boundingSphere = Cesium.BoundingSphere.fromVertices(positions);

  const m = Cesium.Transforms.eastNorthUpToFixedFrame(
      Cesium.Cartesian3.fromDegrees(120.0, 30.0, 100)
  )

  const geometry = new Cesium.Geometry({
    attributes: {
      position: new Cesium.GeometryAttribute({
        componentDatatype: Cesium.ComponentDatatype.DOUBLE,
        componentsPerAttribute: 3,
        values: positions
      })
    },
    indices: indices,
    primitiveType: Cesium.PrimitiveType.TRIANGLES,
    boundingSphere: boundingSphere
  })
  const instance = new Cesium.GeometryInstance({
    geometry: geometry,
    modelMatrix: m,
    attributes: {
      color: Cesium.ColorGeometryInstanceAttribute.fromColor(
          Cesium.Color.RED
      )
    }
  })

  viewer.scene.primitives.add(
      new Cesium.Primitive({
        geometryInstances: instance,
        appearance: new Cesium.PerInstanceColorAppearance({
          translucent: true
        })
      }))

  const worldBoundingSphere = Cesium.BoundingSphere.transform(boundingSphere, m, new Cesium.BoundingSphere());
  viewer.camera.flyToBoundingSphere(worldBoundingSphere, {
    duration: 2, // 飞行时间（秒）
    offset: new Cesium.HeadingPitchRange(0, -0.5, worldBoundingSphere.radius * 2.0) // 可调节视角
  });
}


const addNormalPrimitive = () => {
  const positions = new Float64Array([
    // 前
    0, 0, -1, // E点
    1, -1, 1, //A点
    -1, -1, 1, //B点
    // 后
    0, 0, -1, // E点
    -1, 1, 1, //C点
    1, 1, 1, //D点
    // 左
    0, 0, -1, // E点
    -1, -1, 1, //B点
    -1, 1, 1, //C点
    // 右
    0, 0, -1, // E点
    1, 1, 1, //D点
    1, -1, 1, //A点
    // 上
    1, -1, 1, //A点
    -1, -1, 1, //B点
    1, 1, 1, //D点      // 上
    -1, -1, 1,//B点
    1, 1, 1, //D点
    -1, 1, 1, //C点
  ])
  let normals = []
  let c_0 = new Cesium.Cartesian3(0, 0, -1)
  let c_1 = new Cesium.Cartesian3(1, -1, 1)
  let c_2 = new Cesium.Cartesian3(-1, -1, 1)
  let d1 = Cesium.Cartesian3.subtract(c_1, c_0, new Cesium.Cartesian3())
  let d2 = Cesium.Cartesian3.subtract(c_2, c_0, new Cesium.Cartesian3())
  let normal = Cesium.Cartesian3.cross(d1, d2, new Cesium.Cartesian3())
  normal = Cesium.Cartesian3.normalize(normal, new Cesium.Cartesian3())
  normals.push(normal.x, normal.y, normal.z, normal.x, normal.y, normal.z, normal.x, normal.y, normal.z)
  c_1 = new Cesium.Cartesian3(1, -1, 1)
  c_2 = new Cesium.Cartesian3(1, 1, 1)
  d1 = Cesium.Cartesian3.subtract(c_1, c_0, new Cesium.Cartesian3())
  d2 = Cesium.Cartesian3.subtract(c_2, c_0, new Cesium.Cartesian3())
  normal = Cesium.Cartesian3.cross(d1, d2, new Cesium.Cartesian3())
  normal = Cesium.Cartesian3.normalize(normal, new Cesium.Cartesian3())
  normals.push(normal.x, normal.y, normal.z, normal.x, normal.y, normal.z, normal.x, normal.y, normal.z)
  c_1 = new Cesium.Cartesian3(1, 1, 1)
  c_2 = new Cesium.Cartesian3(-1, 1, 1)
  d1 = Cesium.Cartesian3.subtract(c_1, c_0, new Cesium.Cartesian3())
  d2 = Cesium.Cartesian3.subtract(c_2, c_0, new Cesium.Cartesian3())
  normal = Cesium.Cartesian3.cross(d1, d2, new Cesium.Cartesian3())
  normal = Cesium.Cartesian3.normalize(normal, new Cesium.Cartesian3())
  normals.push(normal.x, normal.y, normal.z, normal.x, normal.y, normal.z, normal.x, normal.y, normal.z)
  c_1 = new Cesium.Cartesian3(-1, 1, 1)
  c_2 = new Cesium.Cartesian3(-1, -1, 1)
  d1 = Cesium.Cartesian3.subtract(c_1, c_0, new Cesium.Cartesian3())
  d2 = Cesium.Cartesian3.subtract(c_2, c_0, new Cesium.Cartesian3())
  normal = Cesium.Cartesian3.cross(d1, d2, new Cesium.Cartesian3())
  normal = Cesium.Cartesian3.normalize(normal, new Cesium.Cartesian3())
  normals.push(normal.x, normal.y, normal.z, normal.x, normal.y, normal.z, normal.x, normal.y, normal.z)

  let m = Cesium.Transforms.eastNorthUpToFixedFrame(Cesium.Cartesian3.fromDegrees(120.0, 30.0, 10))
  let geometry = new Cesium.Geometry({
    attributes: {
      position: new Cesium.GeometryAttribute({
        componentDatatype: Cesium.ComponentDatatype.DOUBLE,
        componentsPerAttribute: 3,
        values: positions
      }),
      normal: new Cesium.GeometryAttribute({
        componentDatatype: Cesium.ComponentDatatype.FLOAT,
        componentsPerAttribute: 3,
        values: new Float64Array(normals)
      })
    }, primitiveType: Cesium.PrimitiveType.TRIANGLES, boundingSphere: Cesium.BoundingSphere.fromVertices(positions)
  })
  const instance = new Cesium.GeometryInstance({
    geometry: geometry,
    modelMatrix: m,
    attributes: {color: Cesium.ColorGeometryInstanceAttribute.fromColor(Cesium.Color.RED)}
  })
  viewer.scene.primitives.add(new Cesium.Primitive({
    geometryInstances: instance,
    appearance: new Cesium.PerInstanceColorAppearance({translucent: false})
  }))

  const worldBoundingSphere = Cesium.BoundingSphere.transform(Cesium.BoundingSphere.fromVertices(positions), m, new Cesium.BoundingSphere());
  viewer.camera.flyToBoundingSphere(worldBoundingSphere, {
    duration: 2, // 飞行时间（秒）
    offset: new Cesium.HeadingPitchRange(0, -0.5, worldBoundingSphere.radius * 2.0) // 可调节视角
  });
}

// 地图逻辑
const mapStore = usemapStore()
const viewer = mapStore.getCesiumViewer();
</script>
