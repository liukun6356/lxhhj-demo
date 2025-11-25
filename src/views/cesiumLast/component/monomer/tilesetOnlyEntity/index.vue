/**
* @author: liuk
* @date: 2024-11-21
* @describe: 模型单体化(entity)
*/
<template>
  <div class="tilesetOnlyEntity-wrap">
    <Tdt_img_d/>
  </div>
</template>

<script lang="ts" setup>
import {onMounted, onUnmounted, ref} from "vue";
import * as Cesium from "cesium";
import {usemapStore} from "@/store/modules/cesiumLastMap";

// Component
import Tdt_img_d from "@/views/cesiumLast/component/effect/controlPanel/layerManagement/basicMap/tdt_img_d.vue"
import {ElMessage} from "element-plus";

const timestamp = ref(null)
const mapStore = usemapStore()
onMounted(() => {
  add3dtileset()
  addEntity()
  viewer.dataSources.add(tilesetOnlyEntityDatasource);
  handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
  handler.setInputAction(onMouseMove, Cesium.ScreenSpaceEventType.MOUSE_MOVE);
  handler.setInputAction(onMouseClick, Cesium.ScreenSpaceEventType.LEFT_CLICK);
})

onUnmounted(() => {
  handler.destroy()
  viewer.dataSources.remove(tilesetOnlyEntityDatasource);
  viewer.scene.primitives.remove(tileset)
})

// 地图逻辑
const viewer = mapStore.getCesiumViewer();
let tileset, handler, preEntity;
const coordinates = [[114.393023, 30.39233], [114.393113, 30.391984], [114.393573, 30.392082], [114.393588, 30.392045], [114.393712, 30.39207], [114.393623, 30.392423], [114.393023, 30.39233]]
const tilesetOnlyEntityDatasource = new Cesium.CustomDataSource("tilesetOnlyEntity");

const add3dtileset = async () => {
  tileset = await Cesium.Cesium3DTileset.fromUrl('https://das-future-map-1301434080.cos.ap-nanjing.myqcloud.com/%E6%B6%88%E9%98%B2%E6%BC%94%E7%BB%83/3dtile/tileset.json')
  viewer.scene.primitives.add(tileset)
  viewer.flyTo(tileset)
}

const addEntity = () => {
  for (let i = 1; i < 5; i++) { // 5层楼
    tilesetOnlyEntityDatasource.entities.add({
      customType: "aaa",
      index: i,
      polygon: {
        hierarchy: Cesium.Cartesian3.fromDegreesArray(coordinates.flat()),
        extrudedHeight: 15 + 4.5 * i, // 初始高度 + 拉伸高度
        height: 15 + 4.5 * (i - 1),
        material: Cesium.Color.fromAlpha(Cesium.Color.BLUE, 0.01),
      },
    });
  }
}

const onMouseMove = (movement) => {
  const pickedObject = viewer.scene.pick(movement.endPosition);
  if (timestamp.value && new Date() - timestamp.value >= 500) {
    preEntity.polygon.material = Cesium.Color.AQUA.withAlpha(0.01)
  }
  if (!Cesium.defined(pickedObject) || !Cesium.defined(pickedObject.id)) return
  const entity = pickedObject.id;
  if (entity instanceof Cesium.Entity && entity.customType === 'aaa') {
    if (preEntity && preEntity !== entity) preEntity.polygon.material = Cesium.Color.AQUA.withAlpha(0.01)
    entity.polygon.material = Cesium.Color.AQUA.withAlpha(0.7);
    timestamp.value = +new Date()
    preEntity = entity
  }
}

const onMouseClick = (movement) => {
  const pickedObject = viewer.scene.pick(movement.position);
  if (!Cesium.defined(pickedObject) || !Cesium.defined(pickedObject.id)) return
  const entity = pickedObject.id;
  if (entity instanceof Cesium.Entity && entity.customType === 'aaa') {
    ElMessage.success('点击' + entity.index)
  }
}

</script>

<style lang="scss" scoped>
.tilesetOnlyEntity-wrap {

}
</style>
