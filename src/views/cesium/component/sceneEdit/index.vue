<!--场景编辑-->
<template>
  <div class="sceneEdit-wrap">
    <div class="material-area">
      <div class="setting-tabs">配置</div>
      <div class="operate-area">
        <div class="model-title">
          <span></span>
          三维模型
        </div>
        <div class="model-item">
          <div class="son-item" @click="drwaModel('tree','树木')">
            <img src="@/assets/images/sceneEdit/树木@2x.jpg" alt=""/>
            <div>树木</div>
          </div>
          <div class="son-item">
            <img src="@/assets/images/sceneEdit/草地@2x.jpg" alt=""/>
            <div>草地</div>
          </div>
          <div class="son-item">
            <img src="@/assets/images/sceneEdit/建筑@2x.jpg" alt=""/>
            <div>建筑</div>
          </div>
          <div class="son-item">
            <img src="@/assets/images/sceneEdit/道路@2x.jpg" alt=""/>
            <div>道路</div>
          </div>
          <div class="son-item">
            <img src="@/assets/images/sceneEdit/河流@2x.jpg" alt=""/>
            <div>河流</div>
          </div>
          <div class="son-item">
            <img src="@/assets/images/sceneEdit/湖泊@2x.jpg" alt=""/>
            <div>湖泊</div>
          </div>
          <div class="son-item">
            <img src="@/assets/images/sceneEdit/教室@2x.jpg" alt=""/>
            <div>教室</div>
          </div>
          <div class="son-item">
            <img src="@/assets/images/sceneEdit/电脑@2x.jpg" alt=""/>
            <div>电脑</div>
          </div>
          <div class="son-item">
            <img src="@/assets/images/sceneEdit/课桌@2x.jpg" alt=""/>
            <div>课桌</div>
          </div>
        </div>
        <div class="model-title">
          <span></span>
          二维标注
        </div>
        <div class="model-item-btn">
          <el-button v-for="str in draw2dArr" :key="str" @click="drawWall(str)" size="small">{{ str }}</el-button>
        </div>
        <div class="model-title">
          <span></span>
          三维标注
        </div>
        <div class="model-item-btn">
          <el-button v-for="str in draw3dArr" :key="str" @click="drawWall(str)" size="small">{{ str }}</el-button>
        </div>
      </div>
      <div class="operate">
        <el-button type="primary" plain @click="cutImg">截取封面</el-button>
        <el-button type="primary" plain @click="perspective">默认视角</el-button>
        <el-button type="primary" class="preserve" @click="saveConfig">保存</el-button>
      </div>
    </div>
    <div class="render-area">
      <div class="head_title_arrow">图层管理</div>
      <div class="content">
        <el-tree
            ref="treeRef"
            :data="treeData"
            show-checkbox
            @check-change="checkChange"
            :default-expanded-keys="[]"
            :default-checked-keys="[11,21,41]"
            node-key="id"/>
      </div>
    </div>
    <Tdt_img_d/>
  </div>
</template>

<script lang="ts" setup>
import {reactive, toRefs} from "vue";
import {usemapStore} from "@/store/modules/cesiumMap.ts";
// Component
import Tdt_img_d from "@/views/cesium/component/controlPanel/layerManagement/basicMap/tdt_img_d.vue"

const mapStore = usemapStore()
const model = reactive({
  treeData: []
})
const {treeData} = toRefs(model)

const drwaModel = (type) => {
  switch (type){

  }
}

const checkChange = () => {

}

const draw2dArr = ['线', '虚线', '面', '矩形', '圆', '文字']
const draw3dArr = ['墙体', '动态墙', '箭头']

// 地图逻辑
const viewer = mapStore.getCesiumViewer()
</script>

<style lang="scss" scoped>
.sceneEdit-wrap {
  pointer-events: auto;

  .material-area {
    position: fixed;
    top: 100px;
    right: 20px;
    width: 330px;
    height: calc(100% - 130px);
    border-radius: 5px;
    background: rgba(0, 0, 0, 0.6);
    overflow: hidden;

    .setting-tabs {
      display: flex;
      width: 100%;
      height: 35px;
      margin-bottom: 5px;
      font-size: 20px;
      line-height: 35px;
      text-indent: 15px;
      font-family: YouSheBiaoTiHei;
      background: rgba(22, 161, 255, 1);
    }

    .operate-area {
      height: calc(100% - 85px);
      overflow-y: auto;
      padding: 0px 5px;
      box-sizing: border-box;

      .model-title {
        display: flex;
        align-items: center;
        text-indent: 8px;
        font-weight: 500;
        margin-bottom: 10px;

        span {
          width: 3px;
          height: 14px;
          background: rgba(22, 161, 255, 1);
        }
      }

      .model-item {
        display: grid;
        grid-template-columns: 1fr 1fr 1fr;
        grid-gap: 10px;
        padding-left: 3px;
        margin-bottom: 10px;

        .son-item {
          position: relative;
          cursor: pointer;

          div {
            position: absolute;
            bottom: 0;
            width: 100%;
            height: 20px;
            background: rgba(0, 0, 0, 0.4);
            text-align: center;
            line-height: 20px;
            font-size: 12px;
            color: #fff;
          }

          img {
            display: block;
            max-width: 100%;
          }
        }
      }

      .model-item-btn {
        display: grid;
        grid-template-columns: repeat(5, 1fr);
        grid-gap: 10px;
        padding-left: 5px;
        margin-bottom: 10px;

        button {
          width: 50px;
          margin-left: 0;
        }
      }
    }


    .operate {
      display: flex;
      justify-content: flex-end;
      position: absolute;
      left: 0;
      bottom: 7px;
      width: 100%;

      .el-button {
        width: 70px;
        margin: 0 7px 0 3px;
      }

    }
  }

  .render-area {
    position: fixed;
    top: 100px;
    left: 280px;
    padding: 10px;
    width: 220px;
    border-radius: 4px;
    background: rgba(0, 0, 0, 0.6);

  }
}
</style>
