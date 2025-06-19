<!--/**
   * @author: liuk
   * @date: 2022/12/28
   * @describe: 递归族谱树
  */-->
<template>
  <table v-if="treeData.id">
    <tr>
      <td :colspan="Array.isArray(treeData.children) ? treeData.children.length * 2 : 1"
          :class="{parentLevel: Array.isArray(treeData.children) && treeData.children.length, extend: Array.isArray(treeData.children) && treeData.children.length && treeData.extend}"
          style="word-wrap:break-word;"
      >
        <div :class="{node: true, hasMate: treeData.mate?.length}">
          <popover>
            <div class="person"
                 :class="Array.isArray(treeData.class) ? treeData.class : []"
                 @click="$emit('click-node', treeData)"
            >
              <div class="avat">
                <img :src="treeData.headPortrait" alt="头像"/>
              </div>
              <div class="name">{{ treeData.name }}</div>
              <div class="relation">{{ treeData.callName || '昵称' }}</div>
            </div>
          </Popover>
          <template v-if="Array.isArray(treeData.mate) && treeData.mate.length">
            <popover>
              <div class="person" v-for="(mate, mateIndex) in treeData.mate" :key="treeData.name+mateIndex"
                   :class="Array.isArray(mate.class) ? mate.class : []"
                   @click="$emit('click-node', mate)"
              >
                <div class="avat">
                  <img :src="mate.headPortrait" alt="头像"/>
                </div>
                <div class="name">{{ mate.name }}</div>
                <div class="relation">{{ mate.callName || '昵称' }}</div>
              </div>
            </popover>
          </template>
        </div>
        <div class="extend_handle" v-if="Array.isArray(treeData.children) && treeData.children.length"
             @click="toggleExtend(treeData)"></div>
      </td>
    </tr>
    <tr v-if="Array.isArray(treeData.children) && treeData.children.length && treeData.extend">
      <td v-for="(children, index) in treeData.children" :key="index" colspan="2" class="childLevel">
        <TreeChart :json="children" @click-node="$emit('click-node', $event)"/>
      </td>
    </tr>
  </table>
</template>

<script lang="ts" setup>
import {ref, watch} from "vue";
import Popover from "./Popover.vue"
import {TreeData,Data} from "./data.ts"; // 这里ts数据

// Prop
const props = defineProps<{
  json: TreeData // 族谱书数据
}>();

// Emit
const emit = defineEmits<{
  (e: 'click-node', value: any): void
}>()

const treeData= ref({});
const toggleExtend = (node: any) => { // 折叠功能
  node.extend = !node.extend;
}
watch(
    () => props.json,
    (json) => {
      let extendKey = function (jsonData: TreeData) {
        jsonData.extend = (jsonData.extend === void 0 ? true : !!jsonData.extend); // viod 等价于  undefined
        if (Array.isArray(jsonData.children)) {
          jsonData.children.forEach((c: Data) => {
            extendKey(c)
          })
        }
        return jsonData;
      }
      if (json) {
        treeData.value = extendKey(json);
      }
    },
    {immediate: true}
)
</script>

<style lang="scss" scoped>
table {
  margin: auto;
  border-collapse: separate !important;
  border-spacing: 0 !important;
  user-select: none;

  td {
    position: relative;
    vertical-align: top;
    padding: 0 0 50px 0;
    text-align: center;

    &.extend {
      &::after {
        content: "";
        position: absolute;
        left: calc(50% - 1px);
        bottom: 15px;
        height: 15px;
        border-left: 2px solid #ccc;
      }

      .extend_handle:before {
        transform: rotate(-45deg);
      }
    }

    .node {
      position: relative;
      display: inline-block;
      margin: 0 1em;
      box-sizing: border-box;
      text-align: center;

      &.hasMate {
        width: 200px;

        &::after {
          content: "";
          position: absolute;
          left: 2em;
          right: 2em;
          top: 2em;
          border-top: 2px solid #ccc;
          z-index: 1;
        }
      }

      .person {
        position: relative;
        display: inline-block;
        z-index: 2;
        width: 6em;
        overflow: hidden;

        .avat {
          display: block;
          width: 4em;
          height: 4em;
          margin: auto;
          overflow: hidden;
          background: #fff;
          border: 1px solid #ccc;
          box-sizing: border-box;

          img {
            width: 100%;
            height: 100%;
          }
        }

        .name {
          height: 2em;
          line-height: 2em;
          overflow: hidden;
          width: 100%;
        }
      }
    }

    .extend_handle {
      position: absolute;
      left: calc(50% - 15px);
      bottom: 30px;
      width: 10px;
      height: 10px;
      padding: 10px;
      cursor: pointer;

      &::before {
        content: "";
        display: block;
        width: 100%;
        height: 100%;
        box-sizing: border-box;
        border: 4px solid;
        border-color: #ccc #ccc transparent transparent;
        transform: rotate(135deg);
        transform-origin: 50% 50% 0;
        transition: transform ease 300ms;
      }

      &:hover::before {
        border-color: #333 #333 transparent transparent;
      }
    }
  }

  .childLevel {
    &::before {
      content: "";
      position: absolute;
      left: calc(50% - 1px);
      bottom: 100%;
      height: 15px;
      border-left: 2px solid #ccc;
    }

    &::after {
      content: "";
      position: absolute;
      left: 0;
      right: 0;
      top: -15px;
      border-top: 2px solid #ccc;
    }

    &:first-child {
      &::before {
        display: none
      }

      &::after {
        left: calc(50% - 1px);
        height: 15px;
        border: 2px solid;
        border-color: #ccc transparent transparent #ccc;
        border-radius: 6px 0 0 0;
      }
    }

    &:last-child {
      &::before {
        display: none
      }

      &::after {
        right: calc(50% - 1px);
        height: 15px;
        border: 2px solid;
        border-color: #ccc #ccc transparent transparent;
        border-radius: 0 6px 0 0;
      }
    }
  }
}
/*菜单栏*/
:deep(.el-popover.el-popper) {
  min-width: 100px !important;
  padding: 0 !important;

  .el-menu--collapse {
    width: 100px;
  }
}
</style>
