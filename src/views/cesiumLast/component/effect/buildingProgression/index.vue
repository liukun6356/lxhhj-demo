<!--楼宇管线场景递进+白膜-->
<template>
  <div class="buildingProgression-wrap">
    <rightBar @changeMapType="changeMapType"/>
    <div v-if="curType===1">
      <systeam-entity @hideSysteamEntity="hideSysteamEntity" v-if="showSysteamEntity"/>
      <community-entity @hideCommunityEntity="hideCommunityEntity" v-if="showeCommunityEntity"/>
      <build-process-stage @hideBuildProcessStage="hideBuildProcessStage" v-if="showBuildProcessStage"/>
    </div>
    <div v-else>
      <station-entity/>
      <source-entity/>
      <pipeline-entity/>
    </div>
    <!-- 默认加载天地图-->
    <Tdt_img_d/>
  </div>
</template>

<script lang="ts" setup>
import {usemapStore} from "@/store/modules/cesiumLastMap";
import * as Cesium from "cesium";
import {onMounted, onUnmounted, reactive, toRefs} from "vue";
// Component
import Tdt_img_d from "./component/tdt_img_d.vue"
import RightBar from "./component/rightBar.vue"
import SysteamEntity from "./component/systeamEntity.vue"
import CommunityEntity from "./component/communityEntity.vue"
import BuildProcessStage from "./component/buildProcessStage.vue"
import StationEntity from "./component/stationEntity.vue"
import SourceEntity from "./component/sourceEntity.vue"
import PipelineEntity from "./component/pipelineEntity.vue"
import {ElMessage} from "element-plus";

const mapStore = usemapStore()
const model = reactive({
  curType: 1,// 1 区域 2 管线
  // 区域
  showSysteamEntity: true,// 第一步
  showeCommunityEntity: false,// 第二步
  showBuildProcessStage: false,// 第三步
})
const {curType, showSysteamEntity, showeCommunityEntity, showBuildProcessStage} = toRefs(model)

onMounted(() => {
  add3dtileset()
})

onUnmounted(() => {
  const primitive = viewer.scene.primitives._primitives.find(primitive => primitive.name === 'buildingProgression')
  viewer.scene.primitives.remove(primitive)
})

const changeMapType = (type) => {
  model.curType = type
  mapResetCamera()
}

const hideSysteamEntity = () => { // 第一步 -> 第二步
  model.showSysteamEntity = false
  model.showeCommunityEntity = true
}

const hideCommunityEntity = () => { // 第二步 -> 第三步
  cctlLayer.style = new Cesium.Cesium3DTileStyle({
    color: {
      conditions: [
        ["${Elevation} === 18", 'rgba(255,140,0, 1)'],
        ["${Elevation} < 35", 'rgba(0,0,0, 0.4)'],
        ["${Elevation} < 50", 'rgba(0,0,0, 0.4)'],
        ["true", 'rgba(	12,10,9, 1)']
      ]
    },
  });
  model.showeCommunityEntity = false
  model.showBuildProcessStage = true
}

const hideBuildProcessStage = () => { // 最后一步
  model.showSysteamEntity = false
  // this.showBuildProcessStage = false
  ElMessage.success("点击了楼栋")
}

// 地图逻辑
const viewer = mapStore.getCesiumViewer();
let cctlLayer
const add3dtileset = async () => {
  cctlLayer = await Cesium.Cesium3DTileset.fromUrl(
      import.meta.env.VITE_APP_GISDATA + '/cctl/osm_community/tileset.json',
      {
        maximumScreenSpaceError: 25,
        maximumMemoryUsage: 1024,
      }
  );
  cctlLayer.name = "buildingProgression"
  cctlLayer.style = new Cesium.Cesium3DTileStyle({
    color: {
      conditions: [
        ['${Elevation} === 18', 'rgba(255,140,0, 1)'],
        ['${Elevation} < 35', 'rgba(255,165,0, 1)'],
        ['${Elevation} < 50', 'rgba(30,144,255, 1)'],
        ['true', 'rgba(	12,10,9, 1)']
      ]
    }
  });
  viewer.scene.primitives.add(cctlLayer)
  mapResetCamera()
}

const mapResetCamera = () => {
  viewer.camera.flyTo({
    destination: Cesium.Cartesian3.fromDegrees(125.343775, 43.938308, 42278.27),
    orientation: {
      heading: Cesium.Math.toRadians(0),
      pitch: Cesium.Math.toRadians(-90),
      roll: 0.0
    }
  });
}
</script>

<style lang="scss" scoped>
.buildingProgression-wrap {

}
</style>
