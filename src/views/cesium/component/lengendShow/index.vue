/**
* @author: liuk
* @date: 2024-11-13 16:40:51
* @describe:图例展示+点聚合(base64图标) ys
*/
<template>
  <div class="legendShow-wrap">
    <div class="legendBox">
      <div class="lengendBtn" @click='isFlat = !isFlat' :class="{select: isFlat === true}">
        <span>图例</span>
        <el-icon v-show="isFlat">
          <ArrowDown/>
        </el-icon>
        <el-icon v-show="!isFlat">
          <ArrowUp/>
        </el-icon>
      </div>
      <ul v-if="isFlat">
        <li v-for="item of legendImgList" :key='item.id' @click="updateProject(item)"
            :class="item.typeArr[0] === curId ? 'select':''">
          <div class="imgBox">
            <img :src="item.img" alt="">
          </div>
          <p>{{ item.typeArr[0] }}</p>
        </li>
      </ul>
    </div>
    <ul class="animation-list" ref="animationListRef"></ul>
    <!-- 默认加载天地图-->
    <Tdt_img_d/>
  </div>
</template>

<script lang="ts" setup>
// Component
import Tdt_img_d from "@/views/cesium/component/controlPanel/layerManagement/basicMap/tdt_img_d.vue"
import {onMounted, onUnmounted, reactive, toRefs, ref} from "vue";
import jsonData from "./data.json"
import {usemapStore} from "@/store/modules/cesiumMap";
// Refs
const animationListRef = ref(null)

const mapStore = usemapStore()
const model = reactive({
  isFlat: false,// 是否展开
  curId: '',//当前选中图例
})
const {isFlat, curId} = toRefs(model)

onMounted(() => {
  mapResetCamera()
  viewer.dataSources.add(lengendShowDatasource);
  viewer.scene.postRender.addEventListener(showPopupBox);
  lengendShowDatasource.clustering.clusterEvent.addEventListener(clusteredFn)
  addEntity()
})

onUnmounted(() => {
  lengendShowDatasource.clustering.clusterEvent.removeEventListener(clusteredFn)
  lengendShowDatasource?.entities?.removeAll()
  viewer.dataSources.remove(lengendShowDatasource);
  viewer.scene.postRender.removeEventListener(showPopupBox);
})


const updateProject = (row) => {
  if (model.curId === row.typeArr[0]) {
    lengendShowDatasource.entities.values.forEach(entity => entity.show = true)
    model.curId = ""
    return
  }
  lengendShowDatasource.entities.values.forEach(entity => {
    entity.show = row.typeArr.includes(entity.data.state)
  })
  model.curId = row.typeArr[0]
}

// 地图逻辑
const viewer = mapStore.getCesiumViewer()
const lengendShowDatasource = new Cesium.CustomDataSource("lengendShow");
lengendShowDatasource.clustering.pixelRange = 2; //多少像素矩形范围内聚合
lengendShowDatasource.clustering.minimumClusterSize = 3;
lengendShowDatasource.clustering.enabled = true;

const addEntity = () => {
  jsonData.forEach(item => {
    const {longitude, latitude, state, level} = item
    const legendData = legendImgList.find(x => x.typeArr.includes(state))
    lengendShowDatasource.entities.add({
      customType: "lengendShow",
      position: Cesium.Cartesian3.fromDegrees(longitude, latitude),
      data: item,
      billboard: {
        image: legendData.img,
        scale: 0.5,
        horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
        verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
        scaleByDistance: new Cesium.NearFarScalar(1.5e2, 1.0, 8.0e6, 0.2),
        disableDepthTestDistance: Number.POSITIVE_INFINITY, //解决遮挡问题
        heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
        // distanceDisplayCondition: new Cesium.DistanceDisplayCondition(0, 5 * 1e5),
      },
    })
    const li = document.createElement('li') // 后面加载dom，不在组件的scope里面
    li.longitude = longitude
    li.latitude = latitude
    li.typeArr = legendData.typeArr
    li.className = 'animation-point'
    li.style.color = getColor(level)
    animationListRef.value.appendChild(li)
  })
}

const showPopupBox = () => {
  const cameraPosition = viewer.camera.positionWC; // 相机世界坐标
  ;[...animationListRef.value.children].forEach(dom => {
    const {longitude, latitude, typeArr} = dom
    const curPosition = Cesium.Cartesian3.fromDegrees(longitude, latitude, 0);
    const {x, y} = viewer.scene.cartesianToCanvasCoordinates(curPosition)
    dom.style.left = x + "px"
    dom.style.top = y + "px"
    const distance = Cesium.Cartesian3.distance(cameraPosition, curPosition);
    if ((model.curId && !typeArr.includes(model.curId)) || distance < 0 || distance > 1e6) {
      dom.style.display = "none"
    } else {
      dom.style.display = "block"
    }
  })
}

const clusteredFn = (clusteredEntities, cluster) => {
  cluster.label.show = false;
  cluster.billboard.show = true;
  cluster.billboard.scale = 0.5; // 解决数字文本锯齿
  cluster.billboard.image = getCircleImage(clusteredEntities.length);
  cluster.billboard.disableDepthTestDistance = Number.POSITIVE_INFINITY //解决遮挡问题
}

import png1 from "@/assets/images/legendShow/lx.png"
import png2 from "@/assets/images/legendShow/sg.png"
import png3 from "@/assets/images/legendShow/fh.png"
import png4 from "@/assets/images/legendShow/zj.png"
import png5 from "@/assets/images/legendShow/cy.png"
import png6 from "@/assets/images/legendShow/zy.png"
import png7 from "@/assets/images/legendShow/rk.png"
import png8 from "@/assets/images/legendShow/gh.png"

const legendImgList = [// 图例数据
  {img: png1, typeArr: ["立项"]},
  {img: png2, typeArr: ["施工"]},
  {img: png3, typeArr: ["复核"]},
  {img: png4, typeArr: ["自验", "未自验", "已自验", "初验驳回", "自验"],},
  {img: png5, typeArr: ["初验", "待初验", "初验通过", "终验驳回", "市级同意终验驳回"]},
  {img: png6, typeArr: ["终验", "申请终验中", "申请发起核验", "申请开展验收", "申请终验驳回", "市级同意核验", "市级同意终验", "核验中", "核验完成", "终验通过",],},
  {img: png7, typeArr: ["入库", "申请入库中", "县级核定完成"]},
  {img: png8, typeArr: ["管护", "市级同意入库", "管护"]},
]

const getColor = (level) => {
  switch (level) {
    case 1:
      return "#eaff56";
    case 2:
      return "#ff461f";
    case 3:
      return "#f20c00";
  }
}
// 生产圆形图标 base64格式
const getCircleImage = (count, option = {}) => {
  let {clr, clr2, font, fontColor} = option
  const options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
  const circleImageRadius = 28;
  const circleImageRadius2 = 28 - 5
  if (!options.color) {
    if (count < 10) {
      clr = "rgba(181, 226, 140, 0.6)";
      clr2 = "rgba(110, 204, 57, 0.5)";
    } else if (count < 100) {
      clr = "rgba(241, 211, 87, 0.6)";
      clr2 = "rgba(240, 194, 12, 0.5)";
    } else {
      clr = "rgba(253, 156, 115, 0.6)";
      clr2 = "rgba(241, 128, 23, 0.5)";
    }
  }

  const thisSize = circleImageRadius * 2;

  const circleCanvas = document.createElement("canvas");
  circleCanvas.width = thisSize;
  circleCanvas.height = thisSize;
  const circleCtx = circleCanvas.getContext("2d");

  circleCtx.fillStyle = "#ffffff00";
  circleCtx.globalAlpha = 0.0;
  circleCtx.fillRect(0, 0, thisSize, thisSize);

  //圆形底色 (外圈)
  if (clr) {
    circleCtx.globalAlpha = 1.0;
    circleCtx.beginPath();
    circleCtx.arc(circleImageRadius, circleImageRadius, circleImageRadius, 0, Math.PI * 2, true);
    circleCtx.closePath();
    circleCtx.fillStyle = clr;
    circleCtx.fill();
  }

  //圆形底色(内圈)
  if (clr2) {
    circleCtx.globalAlpha = 1.0;
    circleCtx.beginPath();
    circleCtx.arc(circleImageRadius, circleImageRadius, circleImageRadius2, 0, Math.PI * 2, true);
    circleCtx.closePath();
    circleCtx.fillStyle = clr2;
    circleCtx.fill();
  }

  //数字文字
  circleCtx.font = font || circleImageRadius2 * 0.9 + "px bold normal";
  circleCtx.fillStyle = fontColor || "#ffffff";
  circleCtx.textAlign = "center";
  circleCtx.textBaseline = "middle";
  circleCtx.fillText(count, circleImageRadius, circleImageRadius);

  return circleCanvas.toDataURL();
};

const mapResetCamera = () => {
  viewer.camera.flyTo({
    destination: Cesium.Cartesian3.fromDegrees(106.487115, 21.464166, 290064.99),
    orientation: {
      heading: Cesium.Math.toRadians(360.0),
      pitch: Cesium.Math.toRadians(-48.9),
      roll: 0.0
    }
  });
}
</script>

<style lang="scss" scoped>
.legendShow-wrap {
  .legendBox {
    position: fixed;
    left: 70px;
    bottom: 35px;
    width: 115px;
    border-radius: 4px;
    background: rgba(29, 40, 57, 0.6);
    backdrop-filter: blur(4px);
    pointer-events: auto;

    .lengendBtn {
      width: calc(100% - 10px);
      height: 35px;
      margin: 5px auto 5px;
      line-height: 35px;
      text-align: center;
      border: 1px solid #7588aab0;
      border-radius: 4px;
      color: rgba(255, 255, 255, 0.8);
      background: rgba(23, 40, 53, 0.4);
      backdrop-filter: blur(4px);
      box-shadow: rgb(7 98 255 / 30%) 0px 0px 2px 1px;
      cursor: pointer;

      &:hover {
        border-color: #4086ffb0;
        color: rgb(255, 255, 255);
        text-shadow: rgb(7 98 255 / 50%) 0px 0px 8px;
      }

      &.select {
        border: 1px solid #4086ffb0;
        color: rgb(255, 255, 255);
        background: rgba(25, 56, 111, 0.6);
        text-shadow: rgb(7 98 255 / 50%) 0px 0px 8px;
      }

      i {
        margin-left: 5px;
      }
    }

    ul {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: center;
      width: 100%;
      height: 100%;
      color: rgba(255, 255, 255, 0.856);
      transition: all 3s linear 1s; //过渡为什么没用


      li {
        display: flex;
        justify-content: center;
        width: 100%;
        margin: 3px 10px;
        opacity: 0.8;
        cursor: pointer;

        &:hover {
          opacity: 1;
        }

        &.select {
          opacity: 1;
          color: #4086ffb0;
          font-weight: 600;
        }

        .imgBox {
          width: 20px;
          margin-right: 15px;

          img {
            width: 100%;
            height: 100%;
          }
        }
      }
    }
  }
}
</style>
<style lang="scss">
.animation-point {
  position: fixed;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  border: 1px solid hsla(0, 0%, 100%, .5);
  cursor: pointer;
  color: #0ff;
  background: currentColor;
  transform: translate(-50%, 50%);
  box-shadow: 0 0 2em currentColor, 0 0 .5em currentColor;

  &::after, &::before {
    content: "";
    position: absolute;
    width: 0;
    height: 0;
    left: 50%;
    top: 50%;
    border: 1px solid;
    border-radius: 50%;
    transform: translate(-50%, -50%);
    animation: mapAni 1s ease infinite
  }
}

@keyframes mapAni {
  0% {
    width: 0;
    height: 0;
    opacity: 1;
    filter: alpha(opacity=1)
  }
  25% {
    width: 12px;
    height: 12px;
    opacity: .7;
    filter: alpha(opacity=70)
  }
  50% {
    width: 20px;
    height: 20px;
    opacity: .5;
    filter: alpha(opacity=50)
  }
  75% {
    width: 30px;
    height: 30px;
    opacity: .2;
    filter: alpha(opacity=20)
  }
  to {
    width: 40px;
    height: 40px;
    opacity: 0;
    filter: alpha(opacity=0)
  }
}

</style>
