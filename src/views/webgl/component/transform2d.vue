<!--二维平移-->
<template>
  <div class="transform2d-wrap">
    <ul>
      <li v-for="str in typelist" :key="str" @click="itemClick(str)">
        <el-tag :type="activeValue===str?'success':'info'">{{ str }}</el-tag>
      </li>
    </ul>
    <el-form class="transform2d-form" :model="formData" :rules="rules" label-width="60">
      <el-form-item label="x:" prop="x">
        <el-slider style="width: 85%" v-model="formData.x" @change="updateChange" :show-tooltip="false" :min="0"
                   :max="gl.canvas.width"></el-slider>
        <span style="margin-left: 8px">{{ formData.x }}</span>
      </el-form-item>
      <el-form-item label="y:" prop="y">
        <el-slider style="width: 85%" v-model="formData.y" @change="updateChange" :show-tooltip="false" :min="0"
                   :max="gl.canvas.height"></el-slider>
        <span style="margin-left: 8px">{{ formData.y }}</span>
      </el-form-item>
      <el-form-item label="angle:" prop="angle">
        <el-slider style="width: 85%" v-model="formData.angle" @change="updateChange" :show-tooltip="false" :min="0"
                   :max="360"></el-slider>
        <span style="margin-left: 8px">{{ formData.angle }}</span>
      </el-form-item>
      <el-form-item label="scaleX:" prop="scaleX">
        <el-slider style="width: 85%" v-model="formData.scaleX" @change="updateChange" :show-tooltip="false" :step="0.1"
                   :min="-5"
                   :max="5"></el-slider>
        <span style="margin-left: 8px">{{ formData.scaleX }}</span>
      </el-form-item>
      <el-form-item label="scaleY:" prop="scaleY">
        <el-slider style="width: 85%" v-model="formData.scaleY" @change="updateChange" :show-tooltip="false" :step="0.1"
                   :min="-5"
                   :max="5"></el-slider>
        <span style="margin-left: 8px">{{ formData.scaleY }}</span>
      </el-form-item>
    </el-form>
  </div>
</template>

<script lang="ts" setup>
import {onMounted, onUnmounted, reactive, toRefs} from "vue"
import {usewebglGlStore} from "@/store/modules/webglGl";

const model = reactive({
  formData: {
    x: 200,
    y: 150,
    angle: 0,
    scaleX:1,
    scaleY:1
  },
  typelist: ["矩形", "F"],
  activeValue: ""
})

const {formData, typelist, activeValue} = toRefs(model)

onMounted(() => {
  clear()
})

onUnmounted(() => {
  gl.deleteProgram(program);
})

const updateChange = () => {
  clear()
  switch (model.activeValue) {
    case "矩形":
      drawRect()
      break
    case "F":
      drawF()
      break
  }
}

const itemClick = (row) => {
  clear()
  gl.deleteProgram(program);
  gl.deleteBuffer(positionBuffer);
  model.activeValue = row
  switch (row) {
    case "矩形":
      program = createProgram(vsGLSL1, fsGLSL);
      positionLocation = gl.getAttribLocation(program, "a_position");
      resolutionLocation = gl.getUniformLocation(program, "u_resolution");
      colorLocation = gl.getUniformLocation(program, "u_color");
      positionBuffer = gl.createBuffer();
      drawRect()
      break
    case "F":
      program = createProgram(vsGLSL2, fsGLSL);
      positionLocation = gl.getAttribLocation(program, "a_position");
      resolutionLocation = gl.getUniformLocation(program, "u_resolution");
      colorLocation = gl.getUniformLocation(program, "u_color");
      translationLocation = gl.getUniformLocation(program, "u_translation");
      rotationLocation = gl.getUniformLocation(program, "u_rotation");
      scaleLocation = gl.getUniformLocation(program, "u_scale");
      positionBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
      gl.bufferData(
          gl.ARRAY_BUFFER,
          new Float32Array([
            0, 0, 30, 0, 0, 150, 0, 150, 30, 0, 30, 150,// 左竖
            30, 0, 100, 0, 30, 30, 30, 30, 100, 0, 100, 30,// 上横
            30, 60, 67, 60, 30, 90, 30, 90, 67, 60, 67, 90,// 中横
          ]),
          gl.STATIC_DRAW);
      drawF()
      break
  }
}

const rules = {}

// webgl逻辑
const webglGlStore = usewebglGlStore()
const gl = webglGlStore.getWebglGl()
let program,
    positionLocation, positionBuffer,
    resolutionLocation,
    colorLocation,
    translationLocation,
    rotationLocation,
    scaleLocation

const drawF = () => {
  gl.useProgram(program);
  gl.enableVertexAttribArray(positionLocation);
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);
  gl.uniform2f(resolutionLocation, gl.canvas.width, gl.canvas.height);
  gl.uniform4fv(colorLocation, [0.5, 0.3, 0.1, 1]);
  gl.uniform2fv(translationLocation, [model.formData.x, model.formData.y]);
  const angleInDegrees = 360 - model.formData.angle;
  const angleInRadians = angleInDegrees * Math.PI / 180;
  gl.uniform2fv(rotationLocation, [Math.sin(angleInRadians),Math.cos(angleInRadians)]);
  gl.uniform2fv(scaleLocation, [model.formData.scaleX,model.formData.scaleY]);
  gl.drawArrays(gl.TRIANGLES, 0, 18);
}

const drawRect = () => {
  gl.useProgram(program);
  gl.enableVertexAttribArray(positionLocation);
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  const x1 = model.formData.x;
  const x2 = model.formData.x + 100;
  const y1 = model.formData.y;
  const y2 = model.formData.y + 30;
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([x1, y1, x2, y1, x1, y2, x1, y2, x2, y1, x2, y2,]), gl.STATIC_DRAW);
  gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);
  gl.uniform2f(resolutionLocation, gl.canvas.width, gl.canvas.height)
  gl.uniform4fv(colorLocation, [0.2, 0.3, 0.1, 1]);
  gl.drawArrays(gl.TRIANGLES, 0, 6);
}

const clear = () => {
  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
  // 设置背景颜色 -> https://developer.mozilla.org/zh-CN/docs/Web/API/WebGLRenderingContext/clearColor
  gl.clearColor(0, 0, 0, .2);
  // 清空canvas -> https://developer.mozilla.org/zh-CN/docs/Web/API/WebGLRenderingContext/clear
  gl.clear(gl.COLOR_BUFFER_BIT); // gl.COLOR_BUFFER_BIT 清除颜色缓存区
}

const createProgram = (vshader, fshader) => {
  const vertexShader = loadShader(gl.VERTEX_SHADER, vshader);
  const fragmentShader = loadShader(gl.FRAGMENT_SHADER, fshader);
  const program = gl.createProgram(); // 初始话wegl程序对象
  gl.attachShader(program, vertexShader);// 往 WebGLProgram 添加一个顶点着色器
  gl.attachShader(program, fragmentShader);// 往 WebGLProgram 添加一个片段

  gl.linkProgram(program); // 准备 GPU 代码的过程
  const linked = gl.getProgramParameter(program, gl.LINK_STATUS);
  if (!linked) {
    const error = gl.getProgramInfoLog(program);
    console.log('链接程序失败： ' + error);
    gl.deleteProgram(program);
    gl.deleteShader(fragmentShader);
    gl.deleteShader(vertexShader);
    return null;
  }
  return program;
}

const loadShader = (type, source) => {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source); // 设置着色器GLSL代码
  gl.compileShader(shader); // 用于编译一个 GLSL 着色器，使其成为为二进制数据，然后就可以被WebGLProgram对象所使用
  const compiled = gl.getShaderParameter(shader, gl.COMPILE_STATUS);// 返回给定的着色器信息
  if (!compiled) {
    var error = gl.getShaderInfoLog(shader);
    console.log('编译着色器失败: ' + error);
    gl.deleteShader(shader);
    return null;
  }
  return shader
}

const vsGLSL1 = `
  attribute vec2 a_position;

  uniform vec2 u_resolution;

  void main() {
     // convert the rectangle points from pixels to 0.0 to 1.0
     vec2 zeroToOne = a_position / u_resolution;

     // convert from 0->1 to 0->2
     vec2 zeroToTwo = zeroToOne * 2.0;

     // convert from 0->2 to -1->+1 (clipspace)
     vec2 clipSpace = zeroToTwo - 1.0;

     gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1);
  }
`

const vsGLSL2 = `
  attribute vec2 a_position;

  uniform vec2 u_resolution;
  uniform vec2 u_translation;
  uniform vec2 u_rotation;
  uniform vec2 u_scale;

  void main() {
    vec2 scaledPosition = a_position * u_scale;

    // 旋转位置  详见 https://webglfundamentals.org/webgl/lessons/zh_cn/webgl-2d-rotation.html
    vec2 rotatedPosition = vec2(
       scaledPosition.x * u_rotation.y + scaledPosition.y * u_rotation.x,
       scaledPosition.y * u_rotation.y - scaledPosition.x * u_rotation.x);

    // Add in the translation.
    vec2 position = rotatedPosition + u_translation;

    // convert the position from pixels to 0.0 to 1.0
    vec2 zeroToOne = position / u_resolution;

    // convert from 0->1 to 0->2
    vec2 zeroToTwo = zeroToOne * 2.0;

    // convert from 0->2 to -1->+1 (clipspace)
    vec2 clipSpace = zeroToTwo - 1.0;

    gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1);
  }
`

const fsGLSL = `
  precision mediump float;

  uniform vec4 u_color;

  void main() {
     gl_FragColor = u_color;
  }
`

</script>

<style lang="scss" scoped>
.transform2d-wrap {
  pointer-events: auto;

  ul {
    position: fixed;
    top: 100px;
    left: 280px;
    display: flex;
    cursor: pointer;

    li {
      margin-right: 5px;
    }
  }

  .transform2d-form {
    position: fixed;
    top: 135px;
    left: 280px;
  }

  :deep(.el-form) {
    width: 300px;
    background: rgba(0, 0, 0, .6);
    border-radius: 4px;
  }
}
</style>
