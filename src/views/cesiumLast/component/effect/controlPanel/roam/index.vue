/**
* @author: liuk
* @date: 2024-11-20
* @describe:漫游飞行
*/
<template>
  <div class="roam-wrap">
    <div class="head_title_arrow">漫游</div>
    <div class="card-content">
      <div class="topbar">
        <div class="item" :class="{ active: activeValue === str }" v-for="(str, index) in types"
             :key="index" @click="activeValue=str">{{ str }}
        </div>
      </div>
      <div v-if="activeValue === '漫游列表'">
        <div class="roamingBtnsTree" v-if="isRoaming">
          <p>当前节点：{{ curFlynode.label }}</p>
          <div class="operate-area">
            <el-tooltip class="item" effect="dark" content="播放" placement="bottom">
              <el-icon @click="reStartRoaming" size="18">
                <video-play/>
              </el-icon>
            </el-tooltip>
            <el-tooltip class="item" effect="dark" content="暂停" placement="bottom">
              <el-icon @click="pauseRoaming" size="18">
                <video-pause/>
              </el-icon>
            </el-tooltip>
            <el-tooltip class="item" effect="dark" content="停止" placement="bottom">
              <el-icon @click="stopRoaming" size="18">
                <close/>
              </el-icon>
            </el-tooltip>
          </div>
        </div>
        <el-tree :data="treeData" ref="treeRef" node-key="id" :check-on-click-node="false" :expand-on-click-node="false"
                 show-checkbox :default-expanded-keys="[]">
          <template #default="{ node, data }">
            <span class="custom-tree-node">
              <span>{{ data.name || data.label }}</span>
              <span>
                <el-tooltip class="item" effect="dark" content="播放漫游" placement="top" v-if="!data.cameraState">
                  <el-icon @click="playRoam">
                    <Promotion/>
                  </el-icon>
                </el-tooltip>
                <el-tooltip class="item" effect="dark" content="删除漫游" placement="top" v-if="!data.cameraState">
                  <el-icon @click="removeRoam(data)">
                    <Delete/>
                  </el-icon>
                </el-tooltip>
                <el-icon v-if="data.cameraState" @click="flyToCamera({...data.cameraState,duration:0})">
                    <Location/>
                </el-icon>
              </span>
            </span>
          </template>
        </el-tree>
      </div>
      <div v-else>
        <el-form ref="formRef" :model="formData" label-width="80px" :rules="rules">
          <el-form-item label="漫游名称" prop="name">
            <el-input v-model="formData.name" placeholder="请输入漫游名称" size="small" maxlength="10"/>
          </el-form-item>
          <div class="secondTitle">
            <b></b>添加节点
          </div>
          <div class="addRoamingBox">
            <el-form-item label="节点名称" prop="label">
              <el-input v-model="formData.label" placeholder="请输入节点名称" size="small" maxlength="10"/>
            </el-form-item>
            <el-form-item label="间隔时间" prop="duration">
              <el-input v-model="formData.duration" placeholder="请输入间隔时间" size="small" maxlength="5"/>
            </el-form-item>
            <div class="roamBtns">
              <el-button type="warning" plain size="small" @click="addNode">添加节点</el-button>
              <el-button type="warning" plain size="small" @click="roamPreview">漫游预览</el-button>
            </div>
          </div>
        </el-form>
        <div class="secondTitle">
          <b></b>
          <span>节点列表</span>
          <div class="roamingBtns" v-if="isRoaming">
            <el-tooltip class="item" effect="dark" content="播放" placement="bottom">
              <el-icon @click="reStartRoaming" size="18">
                <video-play/>
              </el-icon>
            </el-tooltip>
            <el-tooltip class="item" effect="dark" content="暂停" placement="bottom">
              <el-icon @click="pauseRoaming" size="18">
                <video-pause/>
              </el-icon>
            </el-tooltip>
            <el-tooltip class="item" effect="dark" content="停止" placement="bottom">
              <el-icon @click="stopRoaming" size="18">
                <Close/>
              </el-icon>
            </el-tooltip>
          </div>
        </div>
        <div class="nodeTreeBox">
          <el-tree :data="curAddNodes" node-key="id" :default-expand-all="true" :check-on-click-node="false"
                   :expand-on-click-node="false">
            <template #default="{ node, data }">
                <span class="custom-tree-node">
                  <span>{{ node.label }}</span>
                  <span>
                    <el-tooltip class="item" effect="dark" content="查看视角" placement="top">
                      <el-icon @click="flyToCamera({...data.cameraState,duration:0})">
                        <Location/>
                      </el-icon>
                    </el-tooltip>
                    <el-tooltip class="item" effect="dark" content="删除视角" placement="top">
                      <el-icon @click="removeNode(data)">
                        <Delete/>
                      </el-icon>
                    </el-tooltip>
                  </span>
                </span>
            </template>
          </el-tree>
        </div>
        <div class="addBtn">
          <el-button type="danger" size="small" plain @click="deleteRoaming">删除</el-button>
          <el-button type="primary" size="small" @click="addRoaming">保存</el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import {computed, onMounted, onUnmounted, reactive, ref, toRefs} from 'vue';
import jsonData from "./data.json"
import {ElMessage, ElMessageBox} from 'element-plus';
import {v4 as uuidv4} from 'uuid';
import {usemapStore} from "@/store/modules/cesiumLastMap";
import * as Cesium from "cesium";
// Refs
const treeRef = ref();
const formRef = ref()

const mapStore = usemapStore()
const model = reactive({
  activeValue: "漫游列表",
  isRoaming: false,// 列表漫游进行中
  curFlynode: null,//当前飞行节点
  flyNodes: [],// 飞行节点
  treeData: [], // 漫游列表
  formData: {
    name: "",
    label: "",
    duration: "3"
  }, // 表单
  curAddNodes: [],// 当前新增漫游
})
const {activeValue, isRoaming, curFlynode, treeData, formData, curAddNodes} = toRefs(model)

onMounted(() => {
  getlist()
})

onUnmounted(() => {
  stopRoaming()
})

const getlist = () => {
  const data = getData()
  model.treeData = data
};

const addNode = async () => {
  await formRef.value.validate()
  const node = {
    id: uuidv4(),
    label: model.formData.label,
    index: model.curAddNodes.length,
    cameraState: {
      destination: viewer.camera.positionWC.clone(),
      direction: viewer.camera.directionWC.clone(),
      up: viewer.camera.upWC.clone(),
      duration: model.formData.duration
    }
  }
  model.curAddNodes.push(node)
  model.formData.duration = "3"
}

const removeNode = async (row) => {
  try {
    await ElMessageBox.confirm(`此操作将永久删除名字为 ${row.label} 的节点, 是否继续?`, '提示', {type: "warning"})
    model.curAddNodes = model.curAddNodes.filter(item => item.id !== row.id)
    ElMessage.success("删除成功")
  } catch (e) {
  }
}

const playRoam = () => {
  const checkedNodes = treeRef.value.getCheckedNodes()
  if (!checkedNodes.length) {
    ElMessage.warning("请先选中漫游轨迹！")
    return
  }
  model.flyNodes = checkedNodes.filter(item => item.cameraState)
  flyRecursion()
}

const removeRoam = async (row) => {
  try {
    await ElMessageBox.confirm(`此操作将永久删除名字为 ${row.name} 的漫游轨迹, 是否继续?`, '提示', {type: "warning"})
    removeData(row.id)
    setTimeout(() => {
      ElMessage.success("删除成功")
      getlist()
    }, 500)
  } catch (e) {
  }
}

const addRoaming = () => {
  const obj = {
    id: uuidv4(),
    name: model.formData.name,
    children: model.curAddNodes
  }
  addData(obj)
  setTimeout(() => {
    getlist()
    ElMessage.success("添加成功")
    model.activeValue = "漫游列表"
  }, 500)
}

const deleteRoaming = () => {
  model.curAddNodes = []
  model.activeValue = "漫游列表"
}

const types = ['漫游列表', '添加漫游'];

const rules = {
  name: [{required: true, trigger: "blur", message: "请输入漫游名称"}],
  label: [{required: true, trigger: "blur", message: "请输入节点名称"}],
  duration: [{required: true, trigger: "blur", message: "请输入间隔时间"}],
}
// 地图逻辑
const viewer = mapStore.getCesiumViewer()

const flyRecursion = (i = 0, callback?: Function) => {
  model.curFlynode = model.flyNodes[i]
  const {cameraState} = model.curFlynode
  model.isRoaming = true
  if (i === 0) cameraState.duration = 0
  flyToCamera(cameraState, () => {
    if (i < model.flyNodes.length - 1) {
      flyRecursion(i + 1, callback)
    } else {
      model.isRoaming = false
    }
  })
}

const flyToCamera = (cameraState, callBack?: Function) => {
  const {destination, direction, up, duration} = cameraState
  viewer.camera.flyTo({
    destination,
    duration,
    easingFunction: Cesium.EasingFunction.LINEAR_NONE,
    orientation: {direction, up},
    complete: callBack,
  });
}

const reStartRoaming = () => {
  const index = model.flyNodes.findIndex(item => item.id === model.curFlynode.id)
  flyRecursion(index)
}

const pauseRoaming = () => {
  const cameraState = {
    destination: viewer.camera.positionWC,
    direction: viewer.camera.directionWC,
    up: viewer.camera.upWC,
    duration: 0
  }
  flyToCamera(cameraState)
}

const stopRoaming = () => {
  pauseRoaming()
  model.isRoaming = false
}

const roamPreview = () => {
  model.flyNodes = model.curAddNodes
  flyRecursion()
}

// 数据逻辑
const TokenKey = 'roam-data';
localStorage.getItem(TokenKey) || localStorage.setItem(TokenKey, JSON.stringify(jsonData));
const allData = computed({
  get() {
    return JSON.parse(localStorage.getItem(TokenKey));
  },
  set(val) {
    localStorage.setItem(TokenKey, JSON.stringify(val))
  }
})

const getData = () => {
  return allData.value
}

const addData = (obj) => {
  allData.value = [...allData.value, obj]
}

const removeData = (id) => {
  allData.value = allData.value.filter(item => item.id !== id)
}
</script>

<style lang="scss" scoped>
.roam-wrap {
  display: flex;
  flex-direction: column;
  position: absolute;
  top: 0;
  right: 65px;
  width: 310px;
  padding: 11px 13px;
  font-size: 12px;
  color: white;
  box-sizing: border-box;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
  overflow: auto;
  border-radius: 4px;
  pointer-events: auto;


  .card-content {
    margin-top: 15px;
    width: 100%;
    height: calc(100% - 45px);
    position: relative;

    .custom-tree-node {
      display: flex;

      .el-icon {
        margin-left: 7px;
      }
    }

    .topbar {
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 15px;

      .item {
        background: rgba(46, 165, 255, 0.3);
        border: 1px solid #2ea5ff;
        padding: 3px 20px;
        cursor: pointer;
        font-size: 14px;

        &.active {
          background: #2ea5ff;
          border: 1px solid #2ea5ff;
        }
      }
    }

    .secondTitle {
      font-size: 16px;
      font-weight: 400;
      color: rgba(255, 255, 255, 0.9);
      height: 30px;
      line-height: 30px;
      display: flex;
      align-items: center;
      margin-bottom: 5px;
      position: relative;

      b {
        display: inline-block;
        height: 50%;
        width: 2px;
        background-color: rgba(46, 165, 255, 1);
        margin-right: 10px;
      }

      .roamingBtns {
        width: 100px;
        display: flex;
        justify-content: space-around;
        position: absolute;
        right: 0;

        i {
          cursor: pointer;
          opacity: 0.8;

          &:hover {
            opacity: 1;
          }
        }
      }
    }

    .roamBtns {
      display: flex;
      justify-content: space-between;

      .el-button {
        width: 45%;
      }

      :deep(.el-button) {
        --el-button-border-color: rgba(46, 165, 255, 1);
        --el-button-text-color: #fff;
        --el-button-bg-color: rgba(46, 165, 255, 0.3);
      }
    }

    .nodeTreeBox {
      width: 100%;
      min-height: 70px;
      max-height: 250px;
      margin-bottom: 10px;
      box-sizing: border-box;
      overflow-y: auto;
      background: rgba(0, 0, 0, 0.2);
    }

    .addRoamingBox {
      width: 100%;
      margin-bottom: 12px;
      background: rgba(0, 0, 0, 0.2);
      box-sizing: border-box;
    }

    .addBtn {
      width: 100%;
      display: flex;
      justify-content: space-between;

      :deep(.el-button) {
        width: 60%;
      }

      .el-button--warning {
        border-color: rgba(46, 165, 255, 1);
        color: #fff;
        background-color: rgba(46, 165, 255, 1);
      }

    }

    .roamingBtnsTree {
      display: flex;
      justify-content: space-between;
      width: 100%;
      height: 20px;

      .operate-area {
        > i {
          margin-left: 13px;
        }
      }

    }

  }
}

:deep(.el-form-item--default) {
  --el-input-bg-color: rgba(46, 165, 255, 0.3);
  --el-input-border-color: #2ea5ff;
}

:deep(.el-input) {
  --el-input-text-color: #fff;
  --el-input-bg-color: rgba(46, 165, 255, 0.3);
  --el-input-border-color: #2ea5ff;
}
</style>
