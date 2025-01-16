<!--拖拽排序-->
<template>
  <div class="dragSort-wrap">
    <el-tag v-for="(item,index) in list" class="account-item" :draggable="true" @dragenter="dragenter(index)"
            @dragend="dragend(item,index)" style="width: 80px;margin: 0 5px 5px 0" closable @click="editFn(item,index)"
            @close="delFn(index)">
      <el-input size="small" v-if="editIndex === index" v-model.number="editVal" @change="editValChang($event,index)"/>
      <span v-else>{{ item }}</span>
    </el-tag>
    <el-tag type="success" style="width: 80px;margin: 0 5px 5px 0" @click="addFn"> +</el-tag>
  </div>
</template>

<script lang="ts" setup>
import {reactive, toRefs} from "vue"
import {ElMessage} from "element-plus";

const model = reactive({
  list: [1, 2, 3, 4, 5, 6, 7, 8],
  moveIndex: 0,
  editVal: "",
  editIndex: ""
})
const {list, editVal, editIndex} = toRefs(model)

const dragenter = (index) => {
  model.editVal = ""
  model.editIndex = ""
  model.moveIndex = index
}

const dragend = (val, index) => {
  model.list.splice(index, 1)
  model.list.splice(model.moveIndex, 0, val)
}

const editFn = (val, index) => {
  model.editVal = val
  model.editIndex = index
}

const editValChang = (val, index) => {
  if(!+val){
    ElMessage.warning("请填写有效数据")
    return
  }
  model.list[index] = val
  model.editVal = ""
  model.editIndex = ""
}

const delFn = (index) => {
  model.list.splice(index, 1)
}

const addFn = () =>{
  model.list.push(0)
}

</script>

<style lang="scss" scoped>
.dragSort-wrap {
  display: flex;
  justify-content: center;
  align-items: center;
  flex-wrap: wrap;
  width: 500px;
  height: max-content;
  :deep(.el-input){
    --el-fill-color-blank:transparent;
    --el-border-color:transparent;
  }
}
</style>
