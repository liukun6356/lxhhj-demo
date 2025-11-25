<!--台风-->
<template>
  <teleport to="body">
    <div class="typhoon-wrap" v-show="showPopup" :style="{ transform: `translate(${popupPos.x }px, ${popupPos.y}px)`}">
      <div class="device-title">苏拉台风</div>
      <div class="device-name">
        <span>等级：</span>
        <span class="value">12</span>
        <span class="unit">级</span>
      </div>
      <div class="device-num" style="top:85px">
        <span>气压：</span>
        <span class="value">892</span>
        <span class="unit">hPa</span>
      </div>
      <div class="device-name" style="top:110px">
        <span>速度：</span>
        <span class="value">36.9</span>
        <span class="unit">米/秒</span>
      </div>
    </div>
  </teleport>
</template>

<script lang="ts" setup>
import {onMounted, onUnmounted, reactive, toRefs, ref} from "vue";
import {usemapStore} from "@/store/modules/cesiumLastMap";
import * as Cesium from "cesium";
import arrowPng from "@/assets/images/cesiumMap/controlPanel/ArrowOpacity.png"
import mittBus from "@/utils/mittBus"

const mapStore = usemapStore()
const model = reactive({
  popupPos: {x: 0, y: 0},
  showPopup: true
})
const {popupPos, showPopup} = toRefs(model)

onMounted(() => {
  mittBus.emit("mapResetCamera")
  viewer.dataSources.add(typhoonDatasource);
  addEntity()
  addBoundary()
  viewer.scene.postRender.addEventListener(showPopupBox);
})

onUnmounted(() => {
  curPosition = new Cesium.Cartesian3()
  viewer.scene.primitives.remove(primitive);
  typhoonDatasource.entities.removeAll()
  viewer.dataSources.remove(typhoonDatasource);
  viewer.scene.postRender.removeEventListener(showPopupBox);
})

// 地图逻辑
const viewer = mapStore.getCesiumViewer();
const typhoonDatasource = new Cesium.CustomDataSource("typhoon")
let curPosition = new Cesium.Cartesian3(), entity, primitive

const addBoundary = () => {
  // GroundPolyline
  primitive = new Cesium.GroundPolylinePrimitive({
    geometryInstances: new Cesium.GeometryInstance({
      geometry: new Cesium.GroundPolylineGeometry({
        positions: Cesium.Cartesian3.fromDegreesArray([113.129544, 25.630585, 112.91728, 25.816368]),
        width: 8,
      })
    }),
    appearance: new Cesium.PolylineMaterialAppearance({
      material: new Cesium.Material({
        fabric: {
          uniforms: {
            axisY: false,
            hasImage2: false,
            image2: Cesium.Material.DefaultImageId,
            color2: new Cesium.Color(1, 1, 1),
            color: Cesium.Color.fromCssColorString("red"),
            repeat: new Cesium.Cartesian2(10.0, 1.0),
            image: arrowPng,
            speed: 20, //速度，建议取值范围1-100
          },
          source: `
            czm_material czm_getMaterial(czm_materialInput materialInput)
            {
                czm_material material = czm_getDefaultMaterial(materialInput);
                vec2 st = repeat * materialInput.st;

                vec2 uv = vec2(fract((axisY ? st.t : st.s) - speed * float(czm_frameNumber) / 1000.0), st.t);
                vec4 colorImage = texture(image, uv);

                if (color.a == 0.0) {
                    material.alpha = colorImage.a;
                    material.diffuse = colorImage.rgb;
                } else {
                    material.alpha = colorImage.a * color.a;
                    material.diffuse = max(color.rgb * material.alpha * 3.0, color.rgb);
                }

                if (hasImage2) {
                    vec4 colorBG = texture(image2, materialInput.st);
                    if (colorBG.a > 0.5) {
                        material.diffuse = color2.rgb;
                    }
                }

                return material;
            }
        `
        },
        translucent: false
      }),
    }),
    asynchronous: false
  });
  viewer.scene.primitives.add(primitive);
}

const addEntity = () => {
  viewer.clock.shouldAnimate = true;
  const startTime = Cesium.JulianDate.now()
  const startPosition = Cesium.Cartesian3.fromDegrees(113.129544, 25.630585);
  const targetPosition = Cesium.Cartesian3.fromDegrees(112.91728, 25.816368);
  entity = typhoonDatasource.entities.add({
    position: startPosition,
    point: {
      color: Cesium.Color.fromCssColorString("#2ea5ff").withAlpha(0),
      pixelSize: 10,
      clampToGround: true,
      disableDepthTestDistance: Number.POSITIVE_INFINITY,
    },
  });

  entity.position = new Cesium.CallbackProperty(function (time) {
    const ratio = Cesium.JulianDate.secondsDifference(time, startTime) / 10;
    switch (true) {
      case ratio >= 1.0:
        curPosition = targetPosition.clone()
        break
      case ratio <= 0:
        curPosition = startPosition.clone()
        break
      default:
        Cesium.Cartesian3.lerp(startPosition, targetPosition, ratio, curPosition);
    }
    return curPosition
  }, false);
}

const showPopupBox = () => {
  if (!curPosition) return
  const {x, y} = viewer.scene.cartesianToCanvasCoordinates(curPosition)
  model.popupPos.x = x + 50
  model.popupPos.y = y - 50
}

</script>

<style lang="scss" scoped>
.typhoon-wrap {
  position: fixed;
  left: 0;
  top: 0;
  padding: 5px;
  border: 1px solid;
  background-color: #fff;
  color: #000;

  &::after {
    content: "";
    position: absolute;
    top: 0px;
    left: -100px;
    width: 100px;
    height: 100px;
    background: url("@/assets/images/cesiumMap/controlPanel/tf.gif") no-repeat center/cover;
  }

  .device-name {
    .value {
      font-size: 15px;
      font-weight: bolder;
      color: #FFE103;
    }

    .unit {
      font-size: 14px;
      font-weight: 100;
      margin-left: 5px;
    }
  }
}
</style>
