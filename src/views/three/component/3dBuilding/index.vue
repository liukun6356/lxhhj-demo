<template>
  <div class="building-wrap">
    <div ref="three-box"></div>
    <div class="building-floor-menu">
      <div :class="['building-floor-menu-item', item.select ? 'select' : '']" v-for="item in bottomData"
           :key="item.floor_level_type" @click="setCamera(item)" @mouseleave="item.select = false">
        <div class="inner-box">
          <div class="real-box">
            <div class="name">
              <span class="tit">{{ item.floor_level_type }}</span>
              <span class="pos">{{ item.pos }}</span>
            </div>
            <div class="con">
              <div class="con-list">
                <p>
                  <span class="temperature">{{ item.tt401_value_avg }}</span
                  ><span style="color: #cacaca; margin-left: 3px">°C</span>
                </p>
                <span class="average">平均室温</span>
              </div>
              <div class="con-list">
                <p>
                  <span class="temperature">{{ item.household_type_low }}</span>户
                </p>
                <span class="average">过冷住户</span>
              </div>
              <div class="con-list">
                <p>
                  <span class="temperature">{{ item.household_type_high }}</span>户
                </p>
                <span class="average">过热住户</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import {onMounted, onUnmounted, reactive, toRefs} from "vue";
import * as three from 'three';
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls';
import {EffectComposer} from 'three/examples/jsm/postprocessing/EffectComposer';
import {RenderPass} from 'three/examples/jsm/postprocessing/RenderPass';
import {OutlinePass} from 'three/examples/jsm/postprocessing/OutlinePass'; // 后处理
import {OutputPass} from 'three/examples/jsm/postprocessing/OutputPass';
import {ShaderPass} from 'three/examples/jsm/postprocessing/ShaderPass';
import {FXAAShader} from 'three/examples/jsm/shaders/FXAAShader';
import {FontLoader} from 'three/examples/jsm/loaders/FontLoader';
import {TextGeometry} from 'three/examples/jsm/geometries/TextGeometry';
import T1 from "@/assets/images/3dBuilding/T1.jpg"
import T2 from "@/assets/images/3dBuilding/T2.jpg"
import T3 from "@/assets/images/3dBuilding/T3.jpg"

const model = reactive({
  houseData: {
    floorCount: 18, // 层高
    houseCount: 6, // 户数
    unitCount: 5 // 单元数
  },
  info: {},
  bottomData: [
    {
      floor_level_type: '高区组名称', // 名称
      select: false,
      pos: '16F~22F', // 楼层
      tt401_value_avg: '20.1', // 平均室温
      household_type_low: 2,
      household_type_high: 3
    },
    {
      floor_level_type: '中区组名称',
      pos: '9F~15F',
      select: false,
      tt401_value_avg: '24.4',
      household_type_low: 2,
      household_type_high: 3
    },
    {
      floor_level_type: '低区组名称',
      pos: '1F~8F',
      select: false,
      tt401_value_avg: '23.7',
      household_type_low: 2,
      household_type_high: 3
    }
  ],
})
const {bottomData} = toRefs(model)

onMounted(() => {
  console.log("3d楼栋")
  scene = new three.Scene()
  scene.background = new three.Color("#212121");
  camera = new three.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 1000)

  renderer = new three.WebGLRenderer({antialias: true});
  renderer.setClearColor(0x000000, 0);
})

onUnmounted(() => {

})

const setCamera = (item) => { // 切换视角
                              // if (!item) {
                              //   camera.position.set(-80, 30, 26)
                              //   return
                              // }//默认视角
  model.bottomData.forEach((x) => (x.select = false));
  item.select = true;
  const {floor_level_type} = item
  // if (floor_level_type && floor_level_type == '低区组名称') {
  //   camera.position.set(-58, 10, 26.5); //低区
  // } else if (floor_level_type && floor_level_type == '中区组名称') {
  //   camera.position.set(-45, 20, 26.5); //中区
  // } else if (floor_level_type && floor_level_type == '高区组名称') {
  //   camera.position.set(-40, 47, 26); //高区
  // }
  // controls.update()
}

// 场景逻辑
let scene, ctx, texture, camera, renderer, raycaster, controls, outlinePass, animationFrameId, building = [], composer,
    ellipse

</script>

<style lang="scss" scoped>
.building-wrap {
  pointer-events: auto;

  .building-floor-menu {
    position: absolute;
    bottom: 30px;
    right: 50px;
    display: flex;
    z-index: 99;

    .building-floor-menu-item {
      display: flex;
      flex-direction: column;
      width: 112px;
      height: 112px;
      padding: 12px;
      border: 1px solid transparent;
      background: rgba(38, 38, 38, 0.8);
      box-shadow: -10px 0px 22px 0px rgba(0, 0, 0, 0.22);
      border-radius: 4px;
      box-sizing: border-box;
      margin-right: 10px;
      user-select: none;
      transition: all 0.5s ease-in-out 0.3s;
      cursor: pointer;

      &.select {
        width: 250px;
        border: 1px solid #fff;

        .inner-box {
          width: 250px;
        }
      }

      .inner-box {
        width: 80px;
        overflow: hidden;
        transition: all 0.5s ease-in-out 0.3s;

        .real-box {
          width: 225px;

          .name {
            display: flex;
            justify-content: space-between;
            flex-wrap: nowrap;
            overflow: hidden;

            .tit {
              font-size: 14px;
              color: #ffffff;
              letter-spacing: 0;
              font-weight: 500;
            }

            .pos {
              font-size: 12px;
              color: #cccccc;
              letter-spacing: 0;
              font-weight: 400;
            }
          }

          .con {
            display: flex;
            justify-content: space-between;

            .con-list {
              width: 80px;
              height: 68px;
              margin-right: 18px;

              p {
                margin: 15px 0 5px;

                .temperature {
                  font-size: 24px;
                  color: #ffffff;
                  letter-spacing: 0;
                  line-height: 16px;
                  font-weight: 400;
                }

                span {
                  font-size: 12px;
                  color: #cacaca;
                  letter-spacing: 0;
                  font-weight: 200;
                }
              }

              .average {
                opacity: 0.5;
                font-size: 12px;
                color: #ffffff;
                letter-spacing: 0;
                line-height: 16px;
                font-weight: 400;
              }
            }
          }
        }
      }
    }
  }
}
</style>
