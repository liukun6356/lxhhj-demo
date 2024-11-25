<!--场景编辑-->
<template>
  <div class="sceneEdit-wrap">
    <div class="material-area">
      <div class="setting-tabs">物料区</div>
      <ul class="operate-area">
        <li v-for="info in infos" :key="info.name">
          <div class="model-title">
            <span></span>
            {{ info.name }}
          </div>
          <div class="model-item" v-if="info.types[0]?.img">
            <div class="son-item" v-for="item in info.types" :key="item.label" @click="drawFn(info.name,item.label)">
              <img :src="item.img" alt=""/>
              <div>{{ item.label }}</div>
            </div>
          </div>
          <div class="model-item-btn" v-else>
            <el-button v-for="item in info.types" :key="item.label" @click="drawFn(info.name,item.label)" size="small">
              {{ item.label }}
            </el-button>
          </div>
        </li>
      </ul>
      <div class="operate">
        <el-button type="primary" plain @click="cutImg">截取封面</el-button>
        <el-button type="primary" plain @click="mapResetCamera">默认视角</el-button>
        <el-button type="primary" class="preserve" @click="saveConfig">保存</el-button>
      </div>
    </div>
    <div class="edit-area">
      <div class="head_title_arrow">编辑区</div>
      <div class="content">
        <el-tree ref="treeRef" :data="treeData" :default-expanded-keys="defaultKeys"
                 @check-change="checkChange" node-key="id">
          <template #default="{data}">
            <span>{{ data.label }}</span>
            <span>{{ data.children ? `&nbsp;(${data.children.length})` : '' }}</span>
            <el-icon style="margin-left: 5px" v-if="!data.children">
              <Promotion/>
            </el-icon>
            <el-icon style="margin-left: 5px" @click="removeNode(data.id)" v-if="!data.children">
              <Delete/>
            </el-icon>
          </template>
        </el-tree>
      </div>
    </div>
    <div class="property-editing-area" v-if="propertyEditingShow">
      <div class="top-area">
        <span class="head_title_arrow">属性配置区</span>
        <el-icon :size="16" @click="closeEdit">
          <Close/>
        </el-icon>
      </div>
      <div>
        <el-icon :size="18" style="margin-right: 6px" @click="flyToGraphic">
          <Promotion/>
        </el-icon>
        <el-icon :size="18" style="margin-right: 6px" @click="removeNode()">
          <Delete/>
        </el-icon>
        <el-icon :size="18" style="margin-right: 6px" @click="getGeoJson">
          <DocumentCopy/>
        </el-icon>
      </div>
      <el-form :model="formData" ref="formRef" label-width="100" label-position="right">
        <el-form-item v-for="(item,index) in curStyles" :key="index" :label="item.label" :prop="item.name">
          <component :is="components[item.type]" size="small" v-model="formData[item.name]"
                     :min="item.min || item.min === 0 ? item.min : -Infinity"
                     :max="item.max || item.max === 0 ? item.max : Infinity" :step="item.step || 0.1"
                     style="width: 100%" @change="styleChange(item.name,$event)" :disabled="item.disabled">
            <template v-if="item.type ==='combobox'">
              <el-option v-for="(x,index) in item.data" :key="index" :label="x.label" :value="x.value"/>
            </template>
          </component>
        </el-form-item>
      </el-form>
    </div>
    <Tdt_img_d/>
  </div>
</template>

<script lang="ts" setup>
import {reactive, toRefs, ref, onMounted, onUnmounted} from "vue";
import {usemapStore} from "@/store/modules/cesiumMap.ts";
import {generateUUID} from "@/utils/dictionary"
import * as mars3d from "mars3d";
import jsonData from "./data"
import styleConfig from "./styleConfig"
// Component
import Tdt_img_d from "@/views/cesium/component/controlPanel/layerManagement/basicMap/tdt_img_d.vue"

const components = {
  number: "el-input-number",
  radio: "el-switch",
  slider: "el-slider",
  color: "el-color-picker",
  combobox: "el-select",
  textarea: "el-input",
  label: "el-input"
}
// Refs
const treeRef = ref()
const formRef = ref()

const mapStore = usemapStore()
const model = reactive({
  treeData: [],
  defaultKeys: [2],
  propertyEditingShow: false,
  curStyles: [],
  formData: {}
})
const {treeData, defaultKeys, propertyEditingShow, curStyles, formData} = toRefs(model)

onMounted(() => {
  model.treeData = jsonData
  viewer.addLayer(graphicLayer)
  graphicLayer.on([mars3d.EventType.drawCreated, mars3d.EventType.editStart, mars3d.EventType.editMovePoint, mars3d.EventType.editStyle, mars3d.EventType.editRemovePoint], EditorFn)
})
onUnmounted(() => {
  graphicLayer.off([mars3d.EventType.drawCreated, mars3d.EventType.editStart, mars3d.EventType.editMovePoint, mars3d.EventType.editStyle, mars3d.EventType.editRemovePoint], EditorFn)
  graphicLayer.clear()
  viewer.removeLayer(graphicLayer)
})

const drawFn = (type, label) => {
  switch (type) {
    case "三维模型":
      graphicLayer.startDraw({
        type: "label",
        style: {
          text: "火星科技三维地球",
          color: "#0081c2",
          font_size: 50,
          outline: true,
          outlineColor: "#ffffff",
          outlineWidth: 2,
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
        },
        attr: {label, customType: type,}
      })
      break
    case "二维标注":
      break
    case "二维标注":
      break
    case "场景特效":
      break
  }
}

const flyToGraphic = () => {
  curGraphic.flyTo({duration: 1})
}

const removeNode = (id) => {
  let graphic
  if (id) {
    graphic = graphicLayer.getGraphicsByAttr(id, "nodeId")[0]
  } else {
    graphic = curGraphic
    id = graphic.attr.nodeId
    model.propertyEditingShow = false
  }
  treeRef.value.remove(id)
  graphic && graphic.remove()
  reset()
}

const saveConfig = () => {

}

const checkChange = () => {

}

const closeEdit = () => {
  model.propertyEditingShow = false
}

const reset = () => {
  model.curStyles = []
  model.formData = {}
}


// 地图逻辑
const viewer = mapStore.getCesiumViewer()
let curGraphic
const graphicLayer = new mars3d.layer.GraphicLayer({
  hasEdit: true,// 开启编辑
  isAutoEditing: true // 绘制完成后是否自动激活编辑
})

const mapResetCamera = () => {
  viewer.camera.flyTo({
    destination: new Cesium.Cartesian3.fromDegrees(113.048936, 25.755645, 77805.77),
    orientation: {
      heading: Cesium.Math.toRadians(0),
      pitch: Cesium.Math.toRadians(-90),
      roll: Cesium.Math.toRadians(0),
    },
    duration: 2,
  })
}

const EditorFn = (e) => {
  curGraphic = e.graphic
  const {customType, label, nodeId} = curGraphic.attr
  model.propertyEditingShow = true
  model.curStyles = [
    {name: "name", label: "所属组类", type: "textarea", defval: label},
    {name: "customType", label: "所属组类", type: "textarea", defval: customType, disabled: true},
    {name: "editType", label: "样式类型", type: "textarea", defval: curGraphic.type, disabled: true},
    ...styleConfig[curGraphic.type]?.style,
  ]
  model.curStyles.forEach(({name, defval}) => model.formData[name] = curGraphic.style[name] || defval)
  if (nodeId) return
  const {id: parentNode, children} = model.treeData.find(item => item.label === customType)
  const count = children.filter(item => item.label.match(/[\u4e00-\u9fa5]+/g).join("") === label.match(/[\u4e00-\u9fa5]+/g).join("")).length
  const data = {id: generateUUID(), label: `${label}${count ? "_" + count : ""}`}
  treeRef.value.append(data, parentNode)
  model.defaultKeys = [parentNode]
  curGraphic.attr.nodeId = data.id
  curGraphic.attr.label = `${label}${count ? "_" + count : ""}`
}

const styleChange = (name, val) => {
  curGraphic.setStyle({[name]: val})
}

const getGeoJson = () => {
  const geojson = curGraphic.toGeoJSON() // 文件处理
  debugger
  geojson.properties._layer = curGraphic._layer.name
  viewer.downloadFile("标绘item.json", JSON.stringify(geojson))
}

const cutImg = () => {
  viewer.expImage({type: "image/png"})
}


import png1 from "@/assets/images/sceneEdit/sm@2x.jpg"
import png2 from "@/assets/images/sceneEdit/cd@2x.jpg"
import png3 from "@/assets/images/sceneEdit/jz@2x.jpg"
import png4 from "@/assets/images/sceneEdit/dl@2x.jpg"
import png5 from "@/assets/images/sceneEdit/hl@2x.jpg"
import png6 from "@/assets/images/sceneEdit/hb@2x.jpg"
import png7 from "@/assets/images/sceneEdit/js@2x.jpg"
import png8 from "@/assets/images/sceneEdit/dn@2x.jpg"
import png9 from "@/assets/images/sceneEdit/kz@2x.jpg"
import png11 from "@/assets/images/sceneEdit/h@2x.png"
import png22 from "@/assets/images/sceneEdit/y@2x.png"
import png33 from "@/assets/images/sceneEdit/dgy@2x.png"
import png44 from "@/assets/images/sceneEdit/jgy@2x.png"
import png55 from "@/assets/images/sceneEdit/s@2x.png"

const infos = [
  {
    name: "三维模型",
    types: [
      {label: "树木", img: png1},
      {label: "草地", img: png2},
      {label: "建筑", img: png3},
      {label: "道路", img: png4},
      {label: "河流", img: png5},
      {label: "湖泊", img: png6},
      {label: "教室", img: png7},
      {label: "电脑", img: png8},
      {label: "课桌", img: png9},
    ]
  },
  {
    name: "二维标注",
    types: [{label: '线'}, {label: '虚线'}, {label: '面'}, {label: '矩形'}, {label: '圆'}, {label: '文字'}]
  },
  {
    name: "二维标注",
    types: [{label: '墙体'}, {label: '动态墙'}, {label: '箭头'}]
  },
  {
    name: "场景特效",
    types: [
      {label: "火", img: png11},
      {label: "烟", img: png22},
      {label: "点光源", img: png33},
      {label: "聚光源", img: png44},
      {label: "水", img: png55},
    ]
  }
]

// 低代码平台 -- 物料区（组件区） 编辑区（工作区/画布区） 属性配置区（设置区）
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
      height: calc(100% - 90px);
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
      bottom: 8px;
      width: 100%;

      .el-button {
        width: 70px;
        margin: 0 7px 0 3px;
      }

    }
  }

  .edit-area {
    position: fixed;
    top: 450px;
    left: 20px;
    padding: 10px;
    width: 220px;
    max-height: 300px;
    border-radius: 4px;
    background: rgba(0, 0, 0, 0.6);
    overflow-y: auto;

    .head_title_arrow {
      font-family: YouSheBiaoTiHei;
      font-size: 16px;
    }
  }

  .property-editing-area {
    position: fixed;
    top: 100px;
    left: 280px;
    padding: 10px;
    width: 250px;
    height: 300px;
    border-radius: 4px;
    background: rgba(0, 0, 0, 0.6);
    overflow-y: auto;

    .top-area {
      display: flex;
      justify-content: space-between;
      align-items: center;

      .head_title_arrow {
        font-family: YouSheBiaoTiHei;
        font-size: 16px;
        margin-bottom: 5px;
      }
    }

  }
}

:deep(.el-form) {
  height: calc(100% - 50px);
  overflow-y: auto;

  .el-form-item--default {
    margin-bottom: 0;
  }

  .el-form-item {
    --el-form-label-font-size: 12px;
  }
}
</style>
