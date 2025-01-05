<template>
  <canvas ref="canvasWebglRef" width="700" height="700"></canvas>
</template>


<script lang="ts" setup>
import {ref, onMounted, markRaw, onUnmounted} from "vue"
import {getWebGLContext, initShaders} from "../lib/cuon-utils"
import "../lib/cuon-matrix"
import {usewebglGlStore} from "@/store/modules/webglGl"

const canvasWebglRef = ref(null)
const webglGlStore = usewebglGlStore()
onMounted(() => {
  // const gl = getWebGLContext(canvasWebglRef.value)
  const gl = canvasWebglRef.value.getContext("webgl")
  const rawGl = markRaw(gl)
  webglGlStore.setWebglGl(rawGl)
  webglGlStore.setIsActiveGl(true)
})

onUnmounted(() => {
  webglGlStore.setWebglGl(null)
  webglGlStore.setIsActiveGl(false)
})

</script>

<style lang="scss" scoped>
canvas {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translateX(-50%)  translateY(-50%);
}
</style>
