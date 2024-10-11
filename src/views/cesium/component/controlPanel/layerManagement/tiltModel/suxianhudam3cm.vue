<!--苏仙湖闸坝3cm 倾斜模型-->
<template></template>

<script lang="ts" setup>
import {usemapStore} from "@/store/modules/cesiumMap.ts";
import {onMounted, onUnmounted} from "vue";
import * as mars3d from "mars3d";

const mapStore = usemapStore()

onMounted(() => {
  const viewer = mapStore.getCesiumViewer();
  const tileset = new mars3d.layer.TilesetLayer({
    name: "suxianhudam3cm",
    url: import.meta.env.VITE_APP_DTILES_URL + '/DT/SXH/3dt/tileset.json', //数据地址
     maximumScreenSpaceError: 25,
    maximumMemoryUsage: 1024,
    enableCollision:true,
    // maximumScreenSpaceError: 16, // 【重要】数值加大，能让最终成像变模糊
    // cacheBytes: 1073741824, // 1024MB = 1024*1024*1024 【重要】额定显存大小(以字节为单位)，允许在这个值上下波动。
    // maximumCacheOverflowBytes: 2147483648, // 2048MB = 2048*1024*1024 【重要】最大显存大小(以字节为单位)。
    // maximumMemoryUsage: 1024, //【cesium 1.107+弃用】内存建议显存大小的50%左右，内存分配变小有利于倾斜摄影数据回收，提升性能体验
    //
    // skipLevelOfDetail: true, //是Cesium在1.5x 引入的一个优化参数，这个参数在金字塔数据加载中，可以跳过一些级别，这样整体的效率会高一些，数据占用也会小一些。但是带来的异常是：1） 加载过程中闪烁，看起来像是透过去了，数据载入完成后正常。2，有些异常的面片，这个还是因为两级LOD之间数据差异较大，导致的。当这个参数设置false，两级之间的变化更平滑，不会跳跃穿透，但是清晰的数据需要更长，而且还有个致命问题，一旦某一个tile数据无法请求到或者失败，导致一直不清晰。所以我们建议：对于网络条件好，并且数据总量较小的情况下，可以设置false，提升数据显示质量。
    // loadSiblings: true, // 如果为true则不会在已加载完模型后，自动从中心开始超清化模型
    // cullRequestsWhileMoving: true,
    // cullRequestsWhileMovingMultiplier: 10, //【重要】 值越小能够更快的剔除
    // preferLeaves: true, //【重要】这个参数默认是false，同等条件下，叶子节点会优先加载。但是Cesium的tile加载优先级有很多考虑条件，这个只是其中之一，如果skipLevelOfDetail=false，这个参数几乎无意义。所以要配合skipLevelOfDetail=true来使用，此时设置preferLeaves=true。这样我们就能最快的看见符合当前视觉精度的块，对于提升大数据以及网络环境不好的前提下有一点点改善意义。
    // progressiveResolutionHeightFraction: 0.5, //【重要】 数值偏于0能够让初始加载变得模糊
    // dynamicScreenSpaceError: true, // true时会在真正的全屏加载完之后才清晰化模型
    // preloadWhenHidden: true, //tileset.show是false时，也去预加载数据
    flyTo: mapStore.curSelectTool === "模拟" ? false : true,
    position:{
      alt:153.46
    }
  })
  viewer.addLayer(tileset)
})

onUnmounted(() => {
  const viewer = mapStore.getCesiumViewer();
  const primitive = viewer.scene.primitives._primitives.find(primitive => primitive.name === 'suxianhudam3cm')
  viewer.scene.primitives.remove(primitive)
})
</script>
