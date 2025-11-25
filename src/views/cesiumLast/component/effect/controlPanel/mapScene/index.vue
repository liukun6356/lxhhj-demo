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
      <!--      <div @click="weatherClick(0)" :class="{ select: weatherItemSelectIndex === 0 }">晴天</div>-->
      <div @click="weatherClick(1)" :class="{ select: weatherItemSelectIndex === 1 }">下雨</div>
      <div @click="weatherClick(2)" :class="{ select: weatherItemSelectIndex === 2 }">下雪</div>
      <div @click="weatherClick(3)" :class="{ select: weatherItemSelectIndex === 3 }">大雾</div>
      <div @click="weatherClick(4)" :class="{ select: weatherItemSelectIndex === 4 }">风1</div>
      <!--      <div @click="weatherClick(5)" :class="{ select: weatherItemSelectIndex === 5 }">风2</div>-->
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
import {usemapStore} from "@/store/modules/cesiumLastMap";
import * as Cesium from "cesium";
import LineFlowMaterial from "@/utils/material/LineFlowMaterial.glsl";
import ArrowOpacityPng from "@/assets/images/cesiumMap/controlPanel/ArrowOpacity.png"
import windpoint from "@/assets/data/windpoint.json"
import {CanvasWindy} from "./canvasWindy"

let lastStage

const mapStore = usemapStore()
const model = reactive({
  weatherItemSelectIndex: -1,
  hour: 12,
})
const {weatherItemSelectIndex, hour} = toRefs(model)

onMounted(() => {
  // fogEffect = new FogEffect({
  //   show: false,
  //   viewer,
  //   maxHeight: 40000, //大于此高度后不显示
  //   fogByDistance: new Cesium.Cartesian4(100, 0.0, 9000, 0.9),
  //   color: Cesium.Color.WHITE,
  // });
  // fogEffect.show = false
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
    case 5:
      showWind()
      break
  }
}
// 地图逻辑
const viewer = mapStore.getCesiumViewer();
let primitive
const showSnow = () => {
  lastStage = new Cesium.PostProcessStage({
    fragmentShader: `
      uniform sampler2D colorTexture; //输入的场景渲染照片
      in vec2 v_textureCoordinates;
      out vec4 fragColor;

      float snow(vec2 uv,float scale){
          float time = czm_frameNumber / 60.0;
          float w=smoothstep(1.0, 0.0, -uv.y * (scale / 10.0));
          if(w < 0.1)return 0.0;
          uv += time / scale;
          uv.y += time * 2.0 / scale;
          uv.x += sin(uv.y + time * 0.5) / scale;
          uv *= scale;
          vec2 s = floor(uv), f = fract(uv), p;
          float k=3.0, d;
          p = 0.5 + 0.35 * sin(11.0 * fract(sin((s + p + scale) * mat2(7, 3, 6, 5)) * 5.0)) - f;
          d = length(p); k = min(d, k);
          k = smoothstep(0.0, k, sin(f.x + f.y) * 0.01);
          return k * w;
      }

      void main(void){
          vec2 resolution = czm_viewport.zw;
          vec2 uv = (gl_FragCoord.xy * 2.0 - resolution.xy) / min(resolution.x, resolution.y);
          vec3 finalColor = vec3(0);
          float c = 0.0;
          c += snow(uv, 10.0);
          c += snow(uv,8.0);
          c += snow(uv,6.0);
          c += snow(uv,5.0);
          finalColor = vec3(c); //屏幕上雪的颜色
          fragColor = mix(texture(colorTexture, v_textureCoordinates), vec4(finalColor,1), 0.5);  //将雪和三维场景融合
      }
    `
  })
  viewer.scene.postProcessStages.add(lastStage);
}

const showRain = () => {
  lastStage = new Cesium.PostProcessStage({
    fragmentShader: `
      uniform sampler2D colorTexture;//输入的场景渲染照片
      in vec2 v_textureCoordinates;
      out vec4 fragColor;

      float hash(float x){
          return fract(sin(x * 133.3) * 13.13);
      }

      void main(void){
          float time = czm_frameNumber / 240.0;
          vec2 resolution = czm_viewport.zw;

          vec2 uv = (gl_FragCoord.xy * 2.0 - resolution.xy) / min(resolution.x, resolution.y);
          vec3 c = vec3(.6,.7,.8);

          float a = -.4;
          float si = sin(a), co=cos(a);
          uv *= mat2(co, -si, si, co);
          uv *= length(uv + vec2(0, 4.9)) * 0.3 + 1.0;

          float v = 1.0 - sin(hash(floor(uv.x * 100.0)) * 2.0);
          float b = clamp(abs(sin(20.0 * time * v + uv.y * (5.0 / (2.0 + v)))) - 0.95, 0.0, 1.0) * 20.0;
          c *= v * b; //屏幕上雨的颜色

          fragColor = mix(texture(colorTexture, v_textureCoordinates), vec4(c,1), 0.5); //将雨和三维场景融合
      }
    `
  })
  viewer.scene.postProcessStages.add(lastStage);
}

const showfogEffect = () => {
  lastStage = new Cesium.PostProcessStage({
    fragmentShader: `
      uniform sampler2D colorTexture;
      uniform sampler2D depthTexture;
      in vec2 v_textureCoordinates;
      out vec4 fragColor;

      float getDistance(sampler2D depthTexture, vec2 texCoords){
          float depth = czm_unpackDepth(texture(depthTexture, texCoords));
          if (depth == 0.0) return czm_infinity;
          vec4 eyeCoordinate = czm_windowToEyeCoordinates(gl_FragCoord.xy, depth);
          return -eyeCoordinate.z / eyeCoordinate.w;
      }
      float interpolateByDistance(vec4 nearFarScalar, float distance){
          float startDistance = nearFarScalar.x;
          float startValue = nearFarScalar.y;
          float endDistance = nearFarScalar.z;
          float endValue = nearFarScalar.w;
          float t = clamp((distance - startDistance) / (endDistance - startDistance), 0.0, 1.0);
          return mix(startValue, endValue, t);
      }
      vec4 alphaBlend(vec4 sourceColor, vec4 destinationColor){
          return sourceColor * vec4(sourceColor.aaa, 1.0) + destinationColor * (1.0 - sourceColor.a);
      }

      void main(void){
          float distance = getDistance(depthTexture, v_textureCoordinates);
          vec4 sceneColor = texture(colorTexture, v_textureCoordinates);
          float blendAmount = interpolateByDistance(vec4(100, 0.0, 9000, 0.9) , distance);
          vec4 finalFogColor = vec4(vec3(1.0, 1.0, 1.0), 0.9 * blendAmount);
          fragColor = alphaBlend(finalFogColor, sceneColor);
      }
    `,
  })
  viewer.scene.postProcessStages.add(lastStage);
}
const shadowSliderChange = (val) => {
  viewer.scene.globe.enableLighting = true
  // JulianDate 与北京时间 相差8小时
  const time = new Date(new Date().setHours(Number(val)) - 8 * 60 * 60 * 1e3);
  time.setHours(val);
  viewer.clock.currentTime = Cesium.JulianDate.fromIso8601(time.toISOString())// iso8601String
}

const showWind = () => {
  new CanvasWindy({
    viewer: viewer,
    color: "#ffffff",
    //颜色
    frameRate: 30,
    //每秒刷新次数
    speedRate: 100,
    //风前进速率
    particlesNumber: 3000,
    maxAge: 120,
    lineWidth: 1,
  });
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
  primitive = new Cesium.Primitive({
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
  if (primitive) {
    viewer.scene.primitives.remove(primitive)
    primitive = null
  }
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
