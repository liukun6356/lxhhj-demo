<!--主页面-->
<template>
  <section class="app-main">
    <router-view v-slot="{ Component, route }">
      <transition name="router-fade" mode="out-in">
        <keep-alive :include="[]">
          <component :is="Component" :key="route.fullPath"/>
        </keep-alive>
      </transition>
    </router-view>
  </section>
</template>

<style lang="scss" scoped>
.app-main {
  position: absolute;
  top: 100px;
  height: calc(100% - 100px);
  width: 100%;
  overflow: hidden;
  background: transparent;
  z-index: 8;
  pointer-events: none;
}
</style>

