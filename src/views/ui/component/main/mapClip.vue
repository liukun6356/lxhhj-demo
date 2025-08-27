<template>
  <div class="mapClip-wrap" ref="mapClipRef">
    <div class="image-box image-left" :style="{ clip: `rect(0px, ${leftPos}px, 570px, 0px)`}">
      <img src="@/assets/images/ui/sun-left.jpg"/>
      <p>水效:关闭</p>
    </div>
    <div class="image-box image-right">
      <img src="@/assets/images/ui/sun-right.jpg"/>
      <p>水效:打开</p>
    </div>
    <div class="control-handle" :style="{left:leftPos + 'px'}"
         @mousedown="mousedownFn">
      <el-icon size="18">
        <ArrowLeftBold class="icon left"/>
      </el-icon>
      <el-icon size="18">
        <ArrowRightBold class="icon right"/>
      </el-icon>
      <div data-v-64761556="" class="line"></div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import {reactive, ref, toRefs} from "vue";
// Ref
const mapClipRef = ref(null)

const model = reactive({
  draggingType: "",
  leftPos: 100,
})
const {leftPos} = toRefs(model)

const mousedownFn = () => {
  model.draggingType = '1'
  document.addEventListener('mousemove', mousemoveFn)
  document.addEventListener('mouseup', mouseupFn)
}

const mousemoveFn = (e) => {
  if (!model.draggingType) return
  const {left, width} = mapClipRef.value.getBoundingClientRect()
  switch (true) {
    case e.clientX - left < 0:
      model.leftPos = 0
      break
    case e.clientX - left > width :
      model.leftPos = width
      break
    default:
      model.leftPos = e.clientX - left
      break
  }
}

const mouseupFn = () => {
  model.draggingType = ""
  document.removeEventListener('mousemove', mousemoveFn)
  document.removeEventListener('mouseup', mouseupFn)
}

</script>

<style lang="scss" scoped>
.mapClip-wrap {
  display: flex;
  justify-content: center;
  align-items: center;
  flex-wrap: wrap;
  position: relative;
  width: 1290px;
  height: 570px;
  user-select: none;


  .image-box {
    position: absolute;
    width: 1290px;
    max-width: 1916px;
    height: 570px;
    z-index: 20;

    &.image-right {
      z-index: 10;

      p {
        left: auto;
        right: 0;
      }
    }

    img {
      display: block;
      width: 100%;
      height: 100%;
      -webkit-user-drag: none;
    }

    p {
      display: flex;
      justify-content: center;
      align-items: center;
      position: absolute;
      left: 0;
      bottom: 0;
      width: 120px;
      height: 42px;
      background: rgba(46, 47, 51, 0.5);
      color: white;
      margin: 0;

    }
  }

  .control-handle {
    position: absolute;
    top: 50%;
    height: 38px;
    width: 38px;
    transform: translate(-50%, -50%);
    border: 2px solid #fff;
    border-radius: 1000px;
    box-shadow: 0 0 12px rgba(51, 51, 51, 0.5);
    z-index: 40;
    cursor: pointer !important;

    &::before {
      width: 2px;
      position: absolute;
      height: 264px;
      content: " ";
      background-color: white;
      bottom: 40px;
      left: 18px;
    }

    &::after {
      width: 2px;
      position: absolute;
      height: 264px;
      content: " ";
      background-color: white;
      top: 40px;
      left: 18px;
    }

    .icon {
      color: white;
      position: absolute;
      top: 10px;

      &.fs-zuoyoujiantou::before {
        content: "\e730";
      }

      &.fs-zuoyoujiantou1::before {
        content: "\e650";
      }
    }

  }
}
</style>
