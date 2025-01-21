<template>
  <div class="cameraAngle-wrap">

  </div>
</template>

<script lang="ts" setup>
import {onMounted, onUnmounted} from "vue";
import {usewebglGlStore} from "@/store/modules/webglGl";

console.log("cameraAngle-wrap")

onMounted(()=>{
  clear()
})

onUnmounted(()=>{

})

// webgl逻辑
const webglGlStore = usewebglGlStore()
const gl = webglGlStore.getWebglGl()
const clear = () => {
  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
  // 设置背景颜色 -> https://developer.mozilla.org/zh-CN/docs/Web/API/WebGLRenderingContext/clearColor
  gl.clearColor(0, 0, 0, .2);
  // 清空canvas -> https://developer.mozilla.org/zh-CN/docs/Web/API/WebGLRenderingContext/clear
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT); // gl.COLOR_BUFFER_BIT 清除颜色缓存区
}

</script>

<style lang="scss" scoped>
.cameraAngle-wrap {

}
</style>
