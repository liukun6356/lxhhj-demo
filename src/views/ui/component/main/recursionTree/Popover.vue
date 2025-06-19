<!--/**
 * @author: liuk
 * @date: 2022/12/28
 * @describe: 菜单选项弹出框
*/-->
<template>
  <el-popover placement="right" :width="100" trigger="click" :teleported="false" :show-arrow="false">
    <template #reference>
      <slot></slot>
    </template>
    <el-menu
        class="el-menu-demo"
        mode="vertical"
        :collapse="true"
        @select="handleSelect"
        style="width:100px;min-width: 100px"
    >
      <el-menu-item index="preview">查看详情</el-menu-item>
      <el-menu-item index="edit">编辑信息</el-menu-item>
      <el-popover placement="right" :offset="3" :width="100" trigger="hover" :teleported="false":show-arrow="false">
        <template #reference>
          <el-menu-item>添加成员 &gt;</el-menu-item>
        </template>
        <el-menu-item v-for="item of popoverList" :key="item.value" :index="String(item.value)">
          {{item.name}}
        </el-menu-item>
      </el-popover>
      <el-menu-item index="del" >删除</el-menu-item>
    </el-menu>
  </el-popover>
</template>

<script lang="ts" setup>
const popoverList = [
  {value: 1, name: '配偶'},
  {value: 2, name: '父亲'},
  {value: 3, name: '母亲'},
  {value: 4, name: '姐姐'},
  {value: 5, name: '妹妹'},
  {value: 6, name: '兄长'},
  {value: 7, name: '弟弟'},
  {value: 8, name: '儿子'},
  {value: 9, name: '女儿'},
]
const handleSelect = (val: string) => {
  console.log(val, "=> 菜单点击事件",typeof val)
}
</script>
