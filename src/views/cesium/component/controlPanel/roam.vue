<!-- 飞行漫游 -->
<template>
  <div class="roam-wrap">
    <div class="head_title_arrow">漫游</div>
    <div class="card-content">
      <div class="topbar">
        <div class="item" :class="{ active: activeName === item.value }" v-for="(item, index) in topBarList"
             :key="index" @click="changeTopbar(item)">{{ item.label }}
        </div>
      </div>
      <div v-if="activeName === 'hasRoam'">
        <div class="roamingBtnsTree" v-if="isTreeRoaming">
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
        <el-tree :data="treeData" ref="treeRef" node-key="id" :check-on-click-node="false" :expand-on-click-node="false"
                 show-checkbox :default-expanded-keys="treeExpandData">
          <template #default="{ node, data }">
            <span class="custom-tree-node">
              <span>{{ node.label }}</span>
              <span>
                <el-tooltip class="item" effect="dark" content="播放漫游" placement="top" v-if="data.roam_remark">
                  <el-icon @click="playRoam(node)">
                    <Promotion/>
                  </el-icon>
                </el-tooltip>
                <el-tooltip class="item" effect="dark" content="删除漫游" placement="top" v-if="data.roam_remark">
                  <el-icon @click="removeRoam(node, data)">
                    <Delete/>
                  </el-icon>
                </el-tooltip>
                <el-icon v-if="!data.roam_remark" @click="LocationRoam(node, data)">
                    <Location/>
                </el-icon>
              </span>
            </span>
          </template>
        </el-tree>
      </div>
      <div v-else>
        <el-form v-model="formData" label-width="80px">
          <el-form-item label="漫游名称">
            <el-input v-model="formData.roamName" placeholder="请输入漫游名称" size="small" maxlength="10"/>
          </el-form-item>
          <div class="secondTitle">
            <b></b>添加节点
          </div>
          <div class="addRoamingBox">
            <el-form-item label="节点名称">
              <el-input v-model="formData.nodeName" placeholder="请输入节点名称" size="small" maxlength="10"/>
            </el-form-item>
            <el-form-item label="间隔时间">
              <el-input v-model="formData.time" placeholder="请输入间隔时间" size="small" maxlength="5"/>
            </el-form-item>
            <div class="roamBtns">
              <el-button type="warning" plain size="small" @click="addRoamingSpacelabel">添加节点</el-button>
              <el-button type="warning" plain size="small" @click="roamingPreview()">漫游预览</el-button>
            </div>
          </div>
        </el-form>
        <div class="secondTitle">
          <b></b>
          <span>节点列表</span>
          <div class="roamingBtns">
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
          <el-tree :data="treeNodeData" ref="treeNode" node-key="id" :default-expand-all="true"
                   :check-on-click-node="false" :expand-on-click-node="false" class="el-treeNodeData">
            <template #default="{ node, data }">
                <span class="custom-tree-node">
                  <span>{{ node.label }}</span>
                  <span>
                    <el-tooltip class="item" effect="dark" content="查看视角" placement="top">
                      <el-icon @click="viewPerspectiveNode(node)">
                        <Location/>
                      </el-icon>
                    </el-tooltip>
                    <el-tooltip class="item" effect="dark" content="删除视角" placement="top">
                      <el-icon @click="removeNode(node, data)">
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
import {onMounted, reactive, ref, toRaw, toRefs} from 'vue';
// import {addOrUpdateRoam, deleteRoamById, getRoamData} from "@/api/cesiumMap";
import {ElMessage, ElMessageBox} from 'element-plus';
import {usemapStore} from "@/store/modules/cesiumMap";
import {v4 as uuidv4} from 'uuid';
// Ref
const treeRef = ref();

const mapStore = usemapStore()

const model = reactive({
  isTreeRoaming: false,// 列表漫游进行中

})
const {isTreeRoaming} = toRefs(model)

const isNodeRoaming = ref(false);

const activeName = ref('hasRoam');
let changeTopbar = (data: any) => {
  activeName.value = data.value;
  formData.value = {
    roamName: '',
    nodeName: '',
    time: '',
  }
};
const treeExpandData = ref<any[]>([]);
const treeData = ref<any[]>([]);
const treeNodeData = ref<any[]>([]);
let roamingSpacelabelTreeNum = ref(1);
let formData: any = ref({
  roamName: '',
  nodeName: '',
  time: '',
});
let roamingArr_i: any = null;
let roamingArr: any = null;


const stopRoaming = () => {
  pauseFly();
  model.isTreeRoaming = false;
  isNodeRoaming.value = false;
};
const pauseFly = () => {
  flyToCamerastate(getCamerastate(), undefined, 1, function () {
  });
};
const flyToCamerastate = (
    camerastate: any,
    flyOverLongitude: any,
    time: any,
    callback: any
) => {
  //飞行视角
  viewer.camera.flyTo({
    destination: camerastate.position,
    duration: time ? time * 1 : 5,
    easingFunction: Cesium.EasingFunction.LINEAR_NONE,
    flyOverLongitude: flyOverLongitude,
    orientation: {
      direction: camerastate.direction,
      up: camerastate.up,
    },
    complete: function () {
      if (callback && typeof callback === 'function') {
        callback();
      }
    },
  });
};
//获取当前相机状态
const getCamerastate = () => {
  let camerastate = {
    position: viewer.camera.positionWC.clone(),
    direction: viewer.camera.directionWC.clone(),
    up: viewer.camera.upWC.clone(),
  };
  return camerastate;
};
// 播放漫游
const playRoam = (node: any) => {
  let checkedNodes = treeRef.value!.getCheckedNodes();
  let roamingArr = [];
  for (let index = 0; index < checkedNodes.length; index++) {
    const element = checkedNodes[index];
    if (element.roamId == node.key) {
      roamingArr.push(element);
    }
  }
  if (roamingArr.length > 0) {
    if (roamingArr.length > 1) {
      model.isTreeRoaming = true;
    }
    roamingPlay(roamingArr);
  } else {
    ElMessage({
      message: '请选择需要漫游的节点',
      type: 'warning',
    });
  }
};
//漫游播放  -  点击树节点播放按钮调用
const roamingPlay = (roamingArr: any) => {
  let nodeArr = roamingArr;
  //把当前视角直接设置第一个视角
  if (nodeArr && nodeArr.length && nodeArr.length > 0) {
    let camerastate = nodeArr[0].cameraState;
    setCameraView(camerastate);
  }
  if (nodeArr.length > 1) {
    setTimeout(() => {
      //开始漫游  --  第一个节点直接setView了不需要飞行
      flyRecursion(1, nodeArr, function () {
        model.isTreeRoaming = false;
        isNodeRoaming.value = false;
      });
    }, 500);
  }
};
let setCameraView = (camerastate: any) => {
  if (camerastate) {
    flyToCamerastate(camerastate, undefined, 0.01, function () {
    });
  }
};
const flyRecursion = (i: any, Arr: any, callback: any) => {
  let camerastate = Arr[i].cameraState;
  let time = Arr[i].time;
  //记录当前飞行数据
  roamingArr_i = i;
  roamingArr = Arr;
  flyToCamerastate(camerastate, undefined, time, function () {
    i++;
    if (i < Arr.length) {
      flyRecursion(i, Arr, callback);
    } else {
      if (callback && typeof callback === 'function') {
        callback();
      }
    }
  });
};

//重新开始漫游  -- 播放控件调用
const reStartRoaming = () => {
  //开始上次暂停位置漫游
  flyRecursion(roamingArr_i, roamingArr, function () {
    model.isTreeRoaming = false;
    isNodeRoaming.value = false;
  });
};
//暂停漫游  -- 再播放时候从上个节点开始播放
const pauseRoaming = () => {
  pauseFly();
};
let LocationRoam = (node: any, data: any) => {
  const trueUserList = toRaw(node);
  if (trueUserList.checked) {
    setCameraView(trueUserList.data.cameraState);
  } else {
    ElMessage({
      message: '请勾选节点',
      type: 'warning',
    });
  }
}
// 删除漫游树漫游
let removeRoam = (node: any, data: any) => {
  ElMessageBox.confirm('此操作将永久删除该漫游, 是否继续?', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  })
      .then(() => {
        let parent = node.parent;
        let children = parent.data.children || parent.data;
        let index = children.findIndex((d: any) => d.id === data.id);
        children.splice(index, 1);
        deleteRoamByIdDB(node.data.id);
      })
      .catch(() => {
        ElMessage({
          type: 'info',
          message: '已取消删除',
        });
      });
};
let removeNode = (node: any, data: any) => {
  let parent = node.parent;
  let children = parent.data.children || parent.data;
  let index = children.findIndex((d: any) => d.id === data.id);
  children.splice(index, 1);
};
let deleteRoamByIdDB = (id: any) => {
  let params = {
    roam_id: id,
  };
  deleteRoamById(params).then((res) => {
    if (res.data != 0 && res.code == 200) {
      ElMessage({
        type: 'success',
        message: '删除成功!',
      });
      getRoamList();
    }
  });
};
let getRoamList = async () => {
  // let res = await getRoamData();
  const data = [
    {
      "roam_id": "e1b0ff8a1bd5a20bb5226704aad75d82",
      "roam_name": "00001",
      "roam_remark": "roam_remark",
      "space_label": "[{" +
          "\"spId\":\"4fa08fc1e496cb1586dc7d587018d849\",\"name\":\"1_9\",\"time\":\"3\",\"cameraState\":" +
          "{\"position\":{\"x\":-2249790.164100139,\"y\":5287949.548521426,\"z\":2758453.982842376},\"direction\":{\"x\":0.7597482541047171,\"y\":0.38468021850620515,\"z\":-0.5242172449231832},\"up\":{\"x\":-0.2224870381316451,\"y\":0.9113529045822716,\"z\":0.34631690858643477}},\"index\":10},{\"spId\":\"a513d4732ab39d6206ca988b7c394e69\",\"name\":\"1_7\",\"time\":\"3\",\"cameraState\":{\"position\":{\"x\":-2251147.5050724326,\"y\":5287991.112644504,\"z\":2757448.1569485525},\"direction\":{\"x\":0.9256932461212491,\"y\":-0.03224366559339922,\"z\":0.3768983418835982},\"up\":{\"x\":-0.180160382626499,\"y\":0.8385200162234523,\"z\":0.5142240940723167}},\"index\":8},{\"spId\":\"117515b81391d4d7a3f1bde21f6950e7\",\"name\":\"1_5\",\"time\":\"3\",\"cameraState\":{\"position\":{\"x\":-2251468.9262097054,\"y\":5288520.778430644,\"z\":2756177.473149312},\"direction\":{\"x\":0.768409626290265,\"y\":-0.2064718583247756,\"z\":0.6057359308678734},\"up\":{\"x\":-0.2181648047629801,\"y\":0.805309990161864,\"z\":0.551253061404859}},\"index\":6},{\"spId\":\"aec395241289b4703f825fd395fd2b94\",\"name\":\"1_3\",\"time\":\"3\",\"cameraState\":{\"position\":{\"x\":-2251019.6695155366,\"y\":5289875.291931063,\"z\":2753938.701405372},\"direction\":{\"x\":0.10531603323900236,\"y\":-0.5855598157630652,\"z\":0.80375881662743},\"up\":{\"x\":-0.3403679369231617,\"y\":0.738210558376613,\"z\":0.5824043604025988}},\"index\":4},{\"spId\":\"fd559ec749528ababe522fb902af91ec\",\"name\":\"1_1\",\"time\":\"3\",\"cameraState\":{\"position\":{\"x\":-2250629.99660382,\"y\":5290581.263538864,\"z\":2752875.2501836773},\"direction\":{\"x\":0.10518806347112591,\"y\":-0.5854369796901575,\"z\":0.8038650472028627},\"up\":{\"x\":-0.34032934748619087,\"y\":0.7383466030169796,\"z\":0.5822544366966304}},\"index\":2},{\"spId\":\"ff2ac5e50238bfa70dfcb5dfa1cd0861\",\"name\":\"1_2\",\"time\":\"3\",\"cameraState\":{\"position\":{\"x\":-2250149.795914267,\"y\":5290363.958063609,\"z\":2753821.33722156},\"direction\":{\"x\":-0.6005784279480394,\"y\":-0.7278826249203675,\"z\":0.33089641313029866},\"up\":{\"x\":-0.5192884657274728,\"y\":0.6697691339324198,\"z\":0.5308001475073495}},\"index\":3},{\"spId\":\"82f3417faa0df33cdcf4f827f4456b6e\",\"name\":\"1_4\",\"time\":\"3\",\"cameraState\":{\"position\":{\"x\":-2250459.159137702,\"y\":5289271.709799947,\"z\":2755555.6392114414},\"direction\":{\"x\":-0.46398936411623426,\"y\":-0.6953157819335429,\"z\":0.5488623082168773},\"up\":{\"x\":-0.44190744694002115,\"y\":0.7186744834739435,\"z\":0.5368657142548898}},\"index\":5},{\"spId\":\"a96004835f9a588e7cede048a0664174\",\"name\":\"1_6\",\"time\":\"3\",\"cameraState\":{\"position\":{\"x\":-2250473.2957018865,\"y\":5288640.18647551,\"z\":2756782.05881173},\"direction\":{\"x\":-0.037054434273259614,\"y\":-0.6314763156385761,\"z\":0.7745092844428776},\"up\":{\"x\":-0.3657137856489514,\"y\":0.729844907037041,\"z\":0.5775637096099495}},\"index\":7},{\"spId\":\"2ecaa70c0db5792dc11a431fbec56b03\",\"name\":\"1_8\",\"time\":\"3\",\"cameraState\":{\"position\":{\"x\":-2250058.31207574,\"y\":5288390.223524807,\"z\":2757551.8385849628},\"direction\":{\"x\":0.16974292899273302,\"y\":-0.5619201339429075,\"z\":0.8095882293651218},\"up\":{\"x\":-0.32870222429077756,\"y\":0.7421835724562469,\"z\":0.5840534158126107}},\"index\":9}]",
      "public_status": 0,
      "del_flag": 0,
      "user_id": null,
      "create_by": null,
      "create_time": null
    },
    {
      "roam_id": "51ff7698-31db-46cb-addd-9410a1650e7e",
      "roam_name": "漫游20240731",
      "roam_remark": "roam_remark",
      "space_label": "[{\"spId\":\"c5d59d34-a6db-4a5d-bf5e-a7c29b210373\",\"name\":\"456456_2\",\"time\":\"1\",\"cameraState\":{\"position\":{\"x\":-2269049.62408136,\"y\":5314345.974812036,\"z\":2750311.642438958},\"direction\":{\"x\":0.37151230171656285,\"y\":-0.8701197559837068,\"z\":0.32383671799244157},\"up\":{\"x\":-0.12716168830750588,\"y\":0.29782566200195215,\"z\":0.9461129848384303}},\"index\":3},{\"spId\":\"bfd5129f-acc9-460e-9362-22e83f4c5af0\",\"name\":\"456456_1\",\"time\":\"4\",\"cameraState\":{\"position\":{\"x\":-2274108.663908796,\"y\":5361022.976218503,\"z\":2728335.1156839933},\"direction\":{\"x\":0.368688519149167,\"y\":-0.8691526722515277,\"z\":0.32960947827030523},\"up\":{\"x\":-0.12871623320082304,\"y\":0.30343786757129365,\"z\":0.9441173612609703}},\"index\":2}]",
      "public_status": 0,
      "del_flag": 0,
      "user_id": null,
      "create_by": null,
      "create_time": null
    }
  ]
  setTreeDate(data);
};
let setTreeDate = (data: any) => {
  let treeDatas = [];
  for (let index = 0; index < data.length; index++) {
    let element = data[index];
    let childrenData = [];
    let spaceLabel = JSON.parse(element.space_label);
    spaceLabel.sort(function (a: any, b: any) {
      return a.index - b.index;
    })
    for (let index = 0; index < spaceLabel.length; index++) {
      let node = spaceLabel[index];
      childrenData.push({
        id: node.spId,
        label: node.name,
        time: node.time,
        cameraState: node.cameraState,
        roamId: element.roam_id,
      });
    }

    treeDatas.push({
      id: element.roam_id,
      label: element.roam_name,
      children: childrenData,
      roam_remark: element.roam_remark,
    });
  }
  treeData.value = treeDatas;
  treeExpandData.value.push(data[0].roam_id)
};
let deleteRoaming = () => {
  activeName.value = 'hasRoam';
  formData.value.roamName = '';
  formData.value.nodeName = '';
  formData.value.time = '';
  treeNodeData.value = [];
  roamingSpacelabelTreeNum.value = 1;
};
// 添加漫游
let addRoaming = () => {
  //获取漫游名称
  if (
      formData.value.roamName == '' ||
      formData.value.roamName == null ||
      formData.value.roamName == undefined
  ) {
    ElMessage({
      showClose: true,
      message: '请输入漫游名称',
      type: 'warning',
    });
    return;
  }
  //获取节点树所有节点信息
  if (treeNodeData.value && treeNodeData.value.length < 1) {
    ElMessage({
      showClose: true,
      message: '请添加节点',
      type: 'warning',
    });
  } else {
    // 漫游节点
    let roamNodes = [];
    if (treeNodeData.value) {
      for (let index = 0; index < treeNodeData.value.length; index++) {
        const element = treeNodeData.value[index];
        roamNodes.push({
          spId: element.id,
          name: element.label,
          time: element.time,
          cameraState: element.cameraState,
          index: element.index
        });
      }
    }
    let params = {
      roam_id: uuidv4(),
      roam_name: formData.value.roamName,
      roam_remark: 'roam_remark',
      space_label: JSON.stringify(roamNodes),
    };
    addRoamingDB(params);
  }
};
// 接口添加漫游
let addRoamingDB = (params: any) => {
  addOrUpdateRoam(params).then((res: any) => {
    if (res.code == 200 && res.data != 0) {
      getRoamList();
      activeName.value = 'hasRoam';
      formData.value.roamName = '';
      treeNodeData.value = [];
      roamingSpacelabelTreeNum.value = 1;
    }
  });
};
let roamingPreview = () => {
  let roamingArr = treeNodeData.value;
  roamingPlay(roamingArr);
  if (treeNodeData.value && treeNodeData.value.length > 1) {
    isNodeRoaming.value = true;
  }
};
let addRoamingSpacelabel = () => {
  //获取当前相机视角信息
  let roamingSpacelabelCameraState = getCamerastate();
  let roamingSpacelabelName =
      formData.value.nodeName + '_' + roamingSpacelabelTreeNum.value;
  roamingSpacelabelTreeNum.value++;
  treeNodeData.value?.push({
    id: uuidv4(),
    label: roamingSpacelabelName,
    time: formData.value.time,
    cameraState: roamingSpacelabelCameraState,
    index: roamingSpacelabelTreeNum.value,
  });
  treeNodeData.value.reverse();
};
let viewPerspectiveNode = (node: any) => {
  isNodeRoaming.value = true;
  flyToCamerastate(node.data.cameraState, undefined, node.data.time, () => {
    isNodeRoaming.value = false;
  });
};
onMounted(() => {
  getRoamList();
});

const topBarList = ref([
  {label: '漫游列表', value: 'hasRoam'},
  {label: '添加漫游', value: 'addRoam'},
]);
// 地图逻辑
const viewer = mapStore.getCesiumViewer()

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
      justify-content: flex-end;
      width: 100%;
      height: 20px;

      > i {
        margin-left: 13px;
      }
    }

  }
}


:deep(.el-form-item--default) {
  margin-bottom: 10px;
  --el-input-bg-color: rgba(46, 165, 255, 0.3);
  --el-input-border-color: #2ea5ff;
}

:deep(.el-input) {
  --el-input-bg-color: rgba(46, 165, 255, 0.3);
  --el-input-border-color: #2ea5ff;
}
</style>
