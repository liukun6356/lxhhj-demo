<!--/**
* @author: liuk
* @date: 2024-07-15
* @describe:地图环境
*/-->
<template>
  <div class="map_scene-wrap">
    <div class="head_title_arrow">工具</div>
    <div class="second-level-heading">
      <span>天气模拟</span>
    </div>
    <div class="map_scene-content">
      <div @click="weatherClick(0)" :class="{ select: weatherItemSelectIndex === 0 }">晴天</div>
      <div @click="weatherClick(1)" :class="{ select: weatherItemSelectIndex === 1 }">下雨</div>
      <div @click="weatherClick(2)" :class="{ select: weatherItemSelectIndex === 2 }">下雪</div>
      <div @click="weatherClick(3)" :class="{ select: weatherItemSelectIndex === 3 }">大雾</div>
      <div @click="weatherClick(4)" :class="{ select: weatherItemSelectIndex === 4 }">风场</div>
    </div>
    <div class="second-level-heading">
      <span>日照模拟</span>
    </div>
    <div class="ymfxClass">
      <div class="nowDate">{{ moment(new Date()).format('YYYY-MM-DD') }}</div>
      <el-slider :marks="{0: '0点',24: '24点'}" v-model="hour" :min="0" :max="24" @input="shadowSliderChange"></el-slider>
    </div>
  </div>
</template>


<script lang="ts" setup>
import moment from "moment";
import {onMounted, reactive, toRefs} from "vue";
import {usemapStore} from "@/store/modules/cesiumMap";
import FogEffect from "./fogEffect.ts"
import rainGlsl from "./rain.glsl"
import snowGlsl from "./snow.glsl"
import LineFlowMaterial from "@/utils/material/LineFlowMaterial.glsl";
import ArrowOpacityPng from "@/assets/images/cesiumMap/controlPanel/ArrowOpacity.png"
import windpoint from "@/assets/data/windpoint.json"
import {midpoint} from "@turf/turf";

let lastStage, fogEffect

const mapStore = usemapStore()
const model = reactive({
  weatherItemSelectIndex: -1,
  hour: 12,
})
const {weatherItemSelectIndex, hour} = toRefs(model)

onMounted(() => {
  fogEffect = new FogEffect({
    show: false,
    viewer,
    maxHeight: 40000, //大于此高度后不显示
    fogByDistance: new Cesium.Cartesian4(100, 0.0, 9000, 0.9),
    color: Cesium.Color.WHITE,
  });
  fogEffect.show = false
})

const weatherClick = (index) => {
  model.weatherItemSelectIndex = model.weatherItemSelectIndex === index ? -1 : index
  removeStage()
  switch (model.weatherItemSelectIndex) {
    case 0:
      model.hour = 12
      shadowSliderChange(12)
      break;
    case 1:
      showRain();
      break;
    case 2:
      showSnow();
      break;
    case 3:
      showfogEffect();
      break;
    case 4:
      showWindField()
      break
  }
}
// 地图逻辑
const viewer = mapStore.getCesiumViewer();
const showSnow = () => {
  lastStage = viewer.scene.postProcessStages.add(new Cesium.PostProcessStage({fragmentShader: snowGlsl}));
}
const showRain = () => {
  lastStage = viewer.scene.postProcessStages.add(new Cesium.PostProcessStage({fragmentShader: rainGlsl}));
}
const showfogEffect = () => {
  fogEffect.show = true;
}
const shadowSliderChange = (val) => {
  viewer.scene.globe.enableLighting = true
  // JulianDate 与北京时间 相差8小时
  const time = new Date(new Date().setHours(Number(val)) - 8 * 60 * 60 * 1e3);
  time.setHours(val);
  viewer.clock.currentTime = Cesium.JulianDate.fromIso8601(time.toISOString())// iso8601String
}

const showWindField = () => {
  const radius = 12000;
  const geometryInstances = [];
  windpoint.forEach(item => {
    const position = Cesium.Cartesian3.fromDegrees(item.x, item.y, 0);
    let pt1 = getPositionByDirectionAndLen(position, item.dir, radius);
    pt1 = setPositionsHeight(pt1, 1e4);
    const polylineinstance = new Cesium.GeometryInstance({
      geometry: new Cesium.PolylineGeometry({
        positions: [position, pt1],
        width: 8
      }),
      vertexFormat: Cesium.PolylineMaterialAppearance.VERTEX_FORMAT,
    });
    geometryInstances.push(polylineinstance);
  })
  Cesium.Material._materialCache.addMaterial(Cesium.Material.LineFlowType, {
    fabric: {
      type: "LineFlow",
      uniforms: {
        image: Cesium.Material.DefaultImageId,
        color: new Cesium.Color(1, 0, 0, 1.0),
        repeat: new Cesium.Cartesian2(1.0, 1.0),
        axisY: false,
        speed: 10.0,
        hasImage2: false,
        image2: Cesium.Material.DefaultImageId,
        color2: new Cesium.Color(1, 1, 1)
      },
      source: LineFlowMaterial
    },
    translucent: true
  });
  const primitive = new Cesium.Primitive({
    geometryInstances: geometryInstances,
    appearance: new Cesium.PolylineMaterialAppearance({
      material: Cesium.Material.fromType("LineFlow", {
        image: ArrowOpacityPng,
        color: Cesium.Color.fromCssColorString("#00ff00"),
        speed: 20,
        //速度，建议取值范围1-100
      }),
    }),
  });
  viewer.scene.primitives.add(primitive)
}

const removeStage = () => {
  viewer.scene.postProcessStages.remove(lastStage);
  fogEffect.show = false;
}

/**
 * 根据 距离方向 和 观察点 计算 目标点
 * @param {Object} viewPoint 观察点
 * @param {Object} direction 方向(正北方向为0)
 * @param {Object} radius 可视距离
 */
const getPositionByDirectionAndLen = (position, angle, radius) => {
  const matrix = Cesium.Transforms.eastNorthUpToFixedFrame(position);
  //旋转
  const mz = Cesium.Matrix3.fromRotationZ(Cesium.Math.toRadians(angle || 0));
  const rotationZ = Cesium.Matrix4.fromRotationTranslation(mz);
  Cesium.Matrix4.multiply(matrix, rotationZ, matrix);
  const result = Cesium.Matrix4.multiplyByPoint(
      matrix,
      new Cesium.Cartesian3(0, radius, 0),
      new Cesium.Cartesian3()
  );
  return result;
}

/**
 * 设置坐标中海拔高度为指定的高度值
 * @param {Array} positions Cartesian3类型的数组
 * @param {Number} height 高度值
 * @return {Array} Cartesian3类型的数组
 */
const setPositionsHeight = (positions, height) => {
  height = Number(height) || 0;

  if (positions instanceof Array) {
    var arr = [];
    for (var i = 0, len = positions.length; i < len; i++) {
      let car = Cesium.Cartographic.fromCartesian(positions[i]);
      let point = Cesium.Cartesian3.fromRadians(car.longitude, car.latitude, height);
      arr.push(point);
    }
    return arr;
  } else {
    let car = Cesium.Cartographic.fromCartesian(positions);
    return Cesium.Cartesian3.fromRadians(car.longitude, car.latitude, height);
  }
}
</script>

<style lang="scss" scoped>
.map_scene-wrap {
  align-items: flex-start;
  position: absolute;
  top: 70px;
  right: 65px;
  width: 310px;
  background: rgba(0, 0, 0, 0.6);
  border-radius: 4px;
  backdrop-filter: blur(2px);
  padding: 20px;

  .second-level-heading {
    margin-left: 10px;
    margin-top: 20px;
    font-size: 14px;
    color: #fff;
    position: relative;
    line-height: 1;
    padding-left: 10px;

    &::before {
      position: absolute;
      display: block;
      content: '';
      width: 3px;
      height: 70%;
      background-color: rgba(46, 165, 255, 1);
      left: 0;
      top: 50%;
      transform: translateY(-50%);
    }

    i {
      font-size: 16px;
      color: rgba(255, 255, 255, 0.8);
      cursor: pointer;

      &:hover {
        color: rgba(255, 255, 255, 1);
      }
    }
  }

  .map_scene-content {
    display: flex;
    flex-wrap: wrap;
    font-family: PingFang SC Regular;
    padding-top: 10px;

    & > div {
      padding: 4px 10px;
      margin-right: 5px;
      cursor: pointer;
      color: #fff;
      font-size: 13px;
      background: rgba(46, 165, 255, 0.3);
      border: 1px solid #2ea5ff;

      &:not(:first-child) {
        margin-left: 8px;
      }
    }

    .select {
      background: #2ea5ff;
      border: 1px solid #2ea5ff;
    }
  }

  .ymfxClass {
    margin: -17px 0 0 5px;

    .nowDate {
      text-align: right;
      font-size: 12px;
      font-family: SourceHanSansCN-Regular, SourceHanSansCN;
      font-weight: 400;
      color: #2ea5ff;
    }
  }
}
</style>
