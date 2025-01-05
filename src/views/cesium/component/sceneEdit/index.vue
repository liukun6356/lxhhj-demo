/**
* @author: liuk
* @date: 2024-11-26
* @describe: 场景编辑(物料区+编辑区+属性配置区)
*/
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
            <div class="son-item" v-for="item in info.types" :key="item.label" @click="drawFn(info.name,item)">
              <img :src="item.img" alt=""/>
              <div>{{ item.label }}</div>
            </div>
          </div>
          <div class="model-item-btn" v-else>
            <el-button v-for="item in info.types" :key="item.label" @click="drawFn(info.name,item)" size="small">
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
        <el-tree ref="treeRef" :data="treeData" :default-expanded-keys="defaultKeys" node-key="id">
          <template #default="{data}">
            <span>{{ data.label }}</span>
            <span>{{ data.children ? `&nbsp;(${data.children.length})` : '' }}</span>
            <el-icon style="margin-left: 5px" v-if="!data.children" @click="flyToGraphic(data.id)">
              <Promotion/>
            </el-icon>
            <el-icon style="margin-left: 5px" @click="removeNode(data.id)" v-if="!data.children">
              <Delete/>
            </el-icon>
          </template>
        </el-tree>
      </div>
    </div>
    <div class="property-editing-area" v-show="propertyEditingShow">
      <div class="top-area">
        <span class="head_title_arrow">属性配置区</span>
        <el-icon :size="16" @click="closeEdit">
          <Close/>
        </el-icon>
      </div>
      <div>
        <el-icon :size="18" style="margin-right: 6px" @click="flyToGraphic()">
          <Promotion/>
        </el-icon>
        <el-icon :size="18" style="margin-right: 6px" @click="removeNode()">
          <Delete/>
        </el-icon>
        <el-icon :size="18" style="margin-right: 6px" @click="getGeoJson">
          <DocumentCopy/>
        </el-icon>
      </div>
      <el-form :model="formData" ref="formRef" label-width="98" label-position="right">
        <el-form-item v-for="(item,index) in curStyles" :key="index" :label="item.label" :prop="item.name"
                      :name="item.name">
          <template #label>
            <span :title="item.name" @click="copyUrl(item.name)">{{ item.label }}</span>
          </template>
          <component :is="components[item.type]" size="small" v-model="formData[item.name]"
                     :min="item.min || item.min === 0 ? item.min : -Infinity"
                     :max="item.max || item.max === 0 ? item.max : Infinity" :step="item.step || 0.1"
                     :style="{width: item.type ==='slider'?'88%' :'100%'}" :disabled="item.disabled"
                     @change="styleChange(item.name,$event)">
            <template v-if="item.type ==='combobox'">
              <el-option v-for="(x,index) in item.data" :key="index" :label="x.label" :value="x.value"/>
            </template>
          </component>
        </el-form-item>
      </el-form>
    </div>
    <!-- 气泡-->
    <ul v-for="(item,index) in popupList" :key="index">
      <li :class="['surveyStation-popup',item.class]" :style="{ transform: `translate(${item.x }px, ${item.y}px)`}">
        {{ item.remark }}
        <img src="@/assets/images/no-select.png"/>
      </li>
    </ul>
    <Tdt_img_d/>
  </div>
</template>

<script lang="ts" setup>
import {reactive, toRefs, ref, onMounted, onUnmounted} from "vue";
import {usemapStore} from "@/store/modules/cesiumMap.ts";
import {ElMessage} from "element-plus";
import {generateUUID, downloadFile, copyUrl, cartesianToWgs84} from "@/utils/dictionary"
import * as mars3d from "mars3d";
import * as turf from '@turf/turf'
import defaultData from "./data"
import tempJSON from "./temp.json"
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
  popupModel.popupList = tempJSON.features.map(item => {
    const {nodeId, label, customType, remark, longitude, latitude, height} = item.properties
    const temp = defaultData.find(item => item.label === customType)
    temp.children.push({id: nodeId, label})
    return {id: nodeId, longitude, latitude, height, remark: remark || "暂无备注", class: `popup-box-${nodeId}`}
  })
  model.treeData = defaultData
  viewer.addLayer(graphicLayer)
  graphicLayer.loadGeoJSON(tempJSON)
  graphicLayer.on([mars3d.EventType.drawCreated, mars3d.EventType.editStart, mars3d.EventType.editMovePoint, mars3d.EventType.editStyle, mars3d.EventType.editRemovePoint], EditorFn)
  graphicLayer.on([mars3d.EventType.editStop, mars3d.EventType.removeGraphic], editStopFn)
  viewer.scene.postRender.addEventListener(showPopupBox);
})

onUnmounted(() => {
  model.treeData = []
  graphicLayer.off([mars3d.EventType.drawCreated, mars3d.EventType.editStart, mars3d.EventType.editMovePoint, mars3d.EventType.editStyle, mars3d.EventType.editRemovePoint], EditorFn)
  graphicLayer.off([mars3d.EventType.editStop, mars3d.EventType.removeGraphic], editStopFn)
  viewer.scene.postRender.removeEventListener(showPopupBox);
  graphicLayer.clear()
  viewer.removeLayer(graphicLayer)
})

const drawFn = (name, row) => {
  const {label, drawType: type, style} = row
  if (!type) {
    ElMessage.warning("开发中")
    return
  }
  graphicLayer.startDraw({type, style, attr: {label, customType: name}})
}

const editStopFn = () => {
  model.propertyEditingShow = false
}

const flyToGraphic = (id?: string) => {
  const graphic = id ? graphicLayer.getGraphicsByAttr(id, "nodeId")[0] : curGraphic
  graphic.flyTo({duration: 1})
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
  const index = popupModel.popupList.findIndex(item => item.id === id)
  index !== -1 && popupModel.popupList.splice(index, 1)
  graphic && graphic.remove()
  reset()
}

const saveConfig = () => {
  if (!graphicLayer.getGraphics().length) {
    ElMessage.warning("当前没有标注任何数据，无需保存！")
    return
  }
  const geojson = graphicLayer.toGeoJSON()
  const jsonString = JSON.stringify(geojson, null, 2);
  downloadFile(`temp.json`, jsonString)
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
  const {customType, label, nodeId, remark} = curGraphic.attr
  // 属性配置区
  formRef.value.scrollToField('name')
  model.propertyEditingShow = true
  model.curStyles = [
    {name: "name", label: "名称", type: "textarea", defval: label},
    {name: "remark", label: "备注", type: "textarea", defval: remark},
    {name: "customType", label: "所属组类", type: "textarea", defval: customType, disabled: true},
    {name: "editType", label: "样式类型", type: "textarea", defval: curGraphic.type, disabled: true},
    ...styleConfig[curGraphic.type]?.style,
  ]
  model.curStyles.forEach(({name, defval}) => model.formData[name] = curGraphic.style[name] || defval)
  // 气泡
  // const features = turf.points(curGraphic.coordinates)
  // const center = turf.center(features);
  const [longitude, latitude, height] = cartesianToWgs84(e.graphic.center)
  curGraphic.attr.longitude = longitude
  curGraphic.attr.latitude = latitude
  curGraphic.attr.height = height
  const index = popupModel.popupList.findIndex(item => item.id === nodeId)
  const obj = {id: nodeId, longitude, latitude, height, class: `popup-box-${nodeId}`, remark: remark || "暂无备注"}
  if (index !== -1) {
    popupModel.popupList[index] = obj
  } else {
    nodeId && popupModel.popupList.push(obj)
  }
  // 编辑区
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
  const {nodeId} = curGraphic.attr
  switch (name) {
    case "name":
      const node = treeRef.value.getNode(nodeId)
      node.data.label = val
      curGraphic.attr.label = val
      break
    case "remark":
      curGraphic.attr.remark = val
      const index = popupModel.popupList.findIndex(item => item.id === nodeId)
      popupModel.popupList[index].remark = val
      break
    default:
      curGraphic.setStyle({[name]: val})
  }
}

const getGeoJson = () => {
  const {customType, label} = curGraphic.attr
  const geojson = curGraphic.toGeoJSON() // 文件处理
  const jsonString = JSON.stringify(geojson, null, 2);
  downloadFile(`${customType}-${label}.json`, jsonString)
}

const cutImg = () => {
  viewer.expImage({type: "image/png"})
}

// 地图弹框逻辑
const popupModel = reactive({
  popupList: []
})
const {popupList} = toRefs(popupModel)

const showPopupBox = () => {
  popupModel.popupList.forEach(item => {
    const {longitude, latitude, height: heigtZ} = item
    const dom = document.querySelector("." + item.class)
    if (!dom) return
    const width = parseInt(getComputedStyle(dom).width)
    const height = parseInt(getComputedStyle(dom).height)
    const curPosition = Cesium.Cartesian3.fromDegrees(longitude, latitude, heigtZ);
    try {
      const {x, y} = viewer.scene.cartesianToCanvasCoordinates(curPosition)
      item.x = x - (width / 2)
      item.y = y - height - 50
    } catch (e) {
    }
  })
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
      {label: "树木", img: png1, drawType: "model", style: {scale: 10, url: "/tree.glb"}},
      {label: "草地", img: png2, drawType: ""},
      {label: "建筑", img: png3, drawType: ""},
      {label: "道路", img: png4, drawType: ""},
      {label: "河流", img: png5, drawType: ""},
      {label: "湖泊", img: png6, drawType: ""},
      {label: "教室", img: png7, drawType: ""},
      {label: "电脑", img: png8, drawType: ""},
      {label: "课桌", img: png9, drawType: ""},
    ]
  },
  {
    name: "二维标注",
    types: [
      {label: '线', drawType: "polyline", style: {color: "#ffff00", width: 3, clampToGround: true}},
      {
        label: '图标点', drawType: "billboard", style: {
          image: "http://data.mars3d.cn/img/marker/mark-red.png",
          horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
          verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
        }
      },
      {
        label: '虚线',
        drawType: "polyline",
        style: {color: "#ffff00", width: 3, materialType: "PolylineDash", clampToGround: true}
      },
      {
        label: '面', drawType: "polygon",
        style: {color: "#ffff00", opacity: 0.6, outlineWidth: 2.0, clampToGround: true}
      },
      {
        label: '环型面', drawType: "gatheringPlace",
        style: {color: "#ffff00", opacity: 0.6, outlineWidth: 2.0, clampToGround: true}
      },
      {
        label: '矩形', drawType: "rectangle",
        style: {color: "#ffff00", opacity: 0.6, outlineWidth: 2.0, clampToGround: true}
      },
      {
        label: '圆', drawType: "circle",
        style: {color: "#ffff00", opacity: 0.6, outlineWidth: 2.0, clampToGround: true}
      },
      {
        label: '文字', drawType: "label",
        style: {text: "柳晓黑胡椒", color: "#0081c2", font_size: 50, outline: true, outlineColor: "#ffffff", outlineWidth: 2}
      }
    ]
  },
  {
    name: "三维标注",
    types: [
      {
        label: '墙体', drawType: "wall",
        style: {color: "#00ff00", opacity: 0.8, diffHeight: 400, closure: false}
      },
      {label: '动态墙', drawType: ""},
      {label: '箭头', drawType: ""}
    ]
  },
  {
    name: "场景特效",
    types: [
      {label: "火", img: png11, drawType: ""},
      {label: "烟", img: png22, drawType: ""},
      {label: "点光源", img: png33, drawType: ""},
      {label: "聚光源", img: png44, drawType: ""},
      {label: "水", img: png55, drawType: ""}
    ]
  },
  {
    name: "军事标绘",
    types: [
      {
        label: "钳击箭头", drawType: "doubleArrow",
        style: {color: "#ffff00", opacity: 0.6, outlineWidth: 2.0, clampToGround: true}
      },
      {
        label: "闭合曲面", drawType: "closeVurve",
        style: {color: "#ffff00", opacity: 0.6, outlineWidth: 2.0, clampToGround: true}
      },
      {
        label: "攻击箭头", drawType: "attackArrow",
        style: {color: "#ffff00", opacity: 0.6, outlineWidth: 2.0, clampToGround: true}
      },
      {
        label: "集结地", drawType: "gatheringPlace",
        style: {color: "#ffff00", opacity: 0.6, outlineWidth: 2.0, clampToGround: true}
      },
      {
        label: "粗直箭头", drawType: "straightArrow",
        style: {color: "#ffff00", opacity: 0.6, outlineWidth: 2.0, clampToGround: true}
      },
      {
        label: "燕尾直箭头", drawType: "fineArrowYW",
        style: {color: "#ffff00", opacity: 0.6, outlineWidth: 2.0, clampToGround: true}
      },
      {
        label: "粗单尖直箭头", drawType: "fineArrow",
        style: {color: "#ffff00", opacity: 0.6, outlineWidth: 2.0, clampToGround: true}
      },
      {
        label: "平尾攻击箭头", drawType: "attackArrowPW",
        style: {color: "#ffff00", opacity: 0.6, outlineWidth: 2.0, clampToGround: true}
      },
      {
        label: "燕尾攻击箭头", drawType: "attackArrowYW",
        style: {color: "#ffff00", opacity: 0.6, outlineWidth: 2.0, clampToGround: true}
      },
    ]
  }
]
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
        display: flex;
        flex-wrap: wrap;


        button {
          width: max-content;
          min-width: 55px;
          //margin-left: 10;
          margin: 3px;
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
    top: 470px;
    left: 20px;
    padding: 10px;
    width: 220px;
    height: 300px;
    border-radius: 4px;
    background: rgba(0, 0, 0, 0.6);
    overflow-y: auto;
    z-index: 2;

    .head_title_arrow {
      font-family: YouSheBiaoTiHei;
      font-size: 16px;
    }

    .content {
      height: calc(100% - 25px);
      overflow-y: auto;
    }
  }

  .property-editing-area {
    position: fixed;
    top: 100px;
    left: 280px;
    padding: 10px;
    width: 260px;
    height: 300px;
    border-radius: 4px;
    background: rgba(0, 0, 0, 0.6);
    overflow-y: auto;
    overflow-x: hidden;
    z-index: 2;

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
