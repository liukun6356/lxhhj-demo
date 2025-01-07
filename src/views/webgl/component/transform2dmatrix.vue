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
                   :max="gl.canvas.clientWidth "></el-slider>
        <span style="margin-left: 8px">{{ formData.x }}</span>
      </el-form-item>
      <el-form-item label="y:" prop="y">
        <el-slider style="width: 85%" v-model="formData.y" @change="updateChange" :show-tooltip="false" :min="0"
                   :max="gl.canvas.clientHeight"></el-slider>
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
    x: 60,
    y: 40,
    angle: 0,
    scaleX: 1,
    scaleY: 1
  },
  typelist: ["F", "5F", "proj5F"],
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
    case "F":
      drawF()
      break
    case "5F":
      draw5F()
      break
    case "proj5F":
      drawProj5F()
      break
  }
}

const itemClick = (row) => {
  clear()
  gl.deleteProgram(program);
  gl.deleteBuffer(positionBuffer);
  model.activeValue = row
  switch (row) {
    case "F":
      program = createProgram(vsGLSL1, fsGLSL);
      positionLocation = gl.getAttribLocation(program, "a_position");
      resolutionLocation = gl.getUniformLocation(program, "u_resolution");
      colorLocation = gl.getUniformLocation(program, "u_color");
      matrixLocation = gl.getUniformLocation(program, "u_matrix");
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
    case "5F":
      program = createProgram(vsGLSL1, fsGLSL);
      positionLocation = gl.getAttribLocation(program, "a_position");
      resolutionLocation = gl.getUniformLocation(program, "u_resolution");
      colorLocation = gl.getUniformLocation(program, "u_color");
      matrixLocation = gl.getUniformLocation(program, "u_matrix");
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
      draw5F()
      break
    case "proj5F":
      program = createProgram(vsGLSL2, fsGLSL);
      positionLocation = gl.getAttribLocation(program, "a_position");
      resolutionLocation = gl.getUniformLocation(program, "u_resolution");
      colorLocation = gl.getUniformLocation(program, "u_color");
      matrixLocation = gl.getUniformLocation(program, "u_matrix");
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
      drawProj5F()
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
    matrixLocation

const drawF = () => {
  gl.useProgram(program);
  gl.enableVertexAttribArray(positionLocation);
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);
  gl.uniform2f(resolutionLocation, gl.canvas.clientWidth , gl.canvas.clientHeight);
  gl.uniform4fv(colorLocation, [0.5, 0.3, 0.1, 1]);

  const translationMatrix = m3.translation(model.formData.x, model.formData.y);
  const angleInDegrees = 360 - model.formData.angle;
  const angleInRadians = angleInDegrees * Math.PI / 180;
  const rotationMatrix = m3.rotation(angleInRadians);
  const scaleMatrix = m3.scaling(model.formData.scaleX, model.formData.scaleY);
  let matrix = m3.multiply(translationMatrix, rotationMatrix);
  matrix = m3.multiply(matrix, scaleMatrix)
  gl.uniformMatrix3fv(matrixLocation, false, matrix) // 三阶方阵 9个浮点数的数组
  gl.drawArrays(gl.TRIANGLES, 0, 18);
}

const draw5F = () => {
  gl.useProgram(program);
  gl.enableVertexAttribArray(positionLocation);
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);
  gl.uniform2f(resolutionLocation, gl.canvas.clientWidth , gl.canvas.clientHeight);// 赋值
  gl.uniform4fv(colorLocation, [0.5, 0.3, 0.1, 1]);

  const translationMatrix = m3.translation(model.formData.x, model.formData.y);
  const angleInDegrees = 360 - model.formData.angle;
  const angleInRadians = angleInDegrees * Math.PI / 180;
  const rotationMatrix = m3.rotation(angleInRadians);
  const scaleMatrix = m3.scaling(model.formData.scaleX, model.formData.scaleY);
  let matrix = m3.identity();
  for (let i = 0; i < 5; ++i) {
    matrix = m3.multiply(matrix, translationMatrix);
    matrix = m3.multiply(matrix, rotationMatrix);
    matrix = m3.multiply(matrix, scaleMatrix);
    gl.uniformMatrix3fv(matrixLocation, false, matrix);
    gl.drawArrays(gl.TRIANGLES, 0, 18);
  }
}

const drawProj5F = () => {
  gl.useProgram(program);
  gl.enableVertexAttribArray(positionLocation);
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);
  gl.uniform2f(resolutionLocation, gl.canvas.clientWidth , gl.canvas.clientHeight);
  gl.uniform4fv(colorLocation, [0.5, 0.3, 0.1, 1]);

  let matrix = m3.projection(gl.canvas.clientWidth, gl.canvas.clientHeight);
  /*
  * 使用矩阵代替 着色器的运算
     vec2 zeroToOne = a_position / u_resolution;
     vec2 zeroToTwo = zeroToOne * 2.0;
     vec2 clipSpace = zeroToTwo - 1.0;
     gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1);
     使用
     [
        2 / width, 0          , 0,
        0        , -2 / height, 0,
        -1       , 1          , 1
     ]
     代替，简化着色器操作
  * */
  const angleInDegrees = 360 - model.formData.angle;
  const angleInRadians = angleInDegrees * Math.PI / 180;
  matrix = m3.translate(matrix, model.formData.x, model.formData.y);
  matrix = m3.rotate(matrix, angleInRadians);
  matrix = m3.scale(matrix, model.formData.scaleX, model.formData.scaleY);

  gl.uniformMatrix3fv(matrixLocation, false, matrix)
  gl.drawArrays(gl.TRIANGLES, 0, 18);
}

const clear = () => {
  gl.viewport(0, 0, gl.canvas.clientWidth , gl.canvas.clientHeight);
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
    const error = gl.getShaderInfoLog(shader);
    console.log('编译着色器失败: ' + error);
    gl.deleteShader(shader);
    return null;
  }
  return shader
}

const m3 = { // 当前用的 array，项目中需要使用 typeArray
  identity: () => [
    1, 0, 0,
    0, 1, 0,
    0, 0, 1,
  ],
  projection: (width, height) => [
    2 / width, 0, 0,
    0, -2 / height, 0,
    -1, 1, 1
  ],
  translate: (m, tx, ty) => m3.multiply(m, m3.translation(tx, ty)),
  translation: (tx, ty) => [
    1, 0, 0,
    0, 1, 0,
    tx, ty, 1,
  ], // 线性代数,删除和 0 相乘的部分， 和 1 相乘相当于没变 => newX = x + tx; newY = y + ty;
  rotate: (m, angleInRadians) => m3.multiply(m, m3.rotation(angleInRadians)),
  rotation: (angleInRadians) => {
    const c = Math.cos(angleInRadians);
    const s = Math.sin(angleInRadians);
    return [
      c, -s, 0,
      s, c, 0,
      0, 0, 1,
    ];// => newX = x *  c + y * s; newY = x * -s + y * c;
  },
  scale: (m, sx, sy) => m3.multiply(m, m3.scaling(sx, sy)),
  scaling: (sx, sy) => [
    sx, 0, 0,
    0, sy, 0,
    0, 0, 1,
  ],// => newX = x * sx; newY = y * sy;
  multiply: (a, b) => { // 矩阵相乘
    const a00 = a[0 * 3 + 0];
    const a01 = a[0 * 3 + 1];
    const a02 = a[0 * 3 + 2];
    const a10 = a[1 * 3 + 0];
    const a11 = a[1 * 3 + 1];
    const a12 = a[1 * 3 + 2];
    const a20 = a[2 * 3 + 0];
    const a21 = a[2 * 3 + 1];
    const a22 = a[2 * 3 + 2];
    const b00 = b[0 * 3 + 0];
    const b01 = b[0 * 3 + 1];
    const b02 = b[0 * 3 + 2];
    const b10 = b[1 * 3 + 0];
    const b11 = b[1 * 3 + 1];
    const b12 = b[1 * 3 + 2];
    const b20 = b[2 * 3 + 0];
    const b21 = b[2 * 3 + 1];
    const b22 = b[2 * 3 + 2];
    return [
      b00 * a00 + b01 * a10 + b02 * a20,
      b00 * a01 + b01 * a11 + b02 * a21,
      b00 * a02 + b01 * a12 + b02 * a22,
      b10 * a00 + b11 * a10 + b12 * a20,
      b10 * a01 + b11 * a11 + b12 * a21,
      b10 * a02 + b11 * a12 + b12 * a22,
      b20 * a00 + b21 * a10 + b22 * a20,
      b20 * a01 + b21 * a11 + b22 * a21,
      b20 * a02 + b21 * a12 + b22 * a22,
    ];
  },
};

const vsGLSL1 = `
  attribute vec2 a_position;

  uniform vec2 u_resolution;
  uniform mat3 u_matrix;

  void main() {
    // Multiply the position by the matrix.
    vec2 position = (u_matrix * vec3(a_position, 1)).xy;

    // 从像素坐标转换到 0.0 到 1.0
    vec2 zeroToOne = position / u_resolution;

    // 再把 0->1 转换 0->2
    vec2 zeroToTwo = zeroToOne * 2.0;

    // 把 0->2 转换到 -1->+1 (裁剪空间)
    vec2 clipSpace = zeroToTwo - 1.0;

    gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1);
  }
`

const vsGLSL2 = `
  attribute vec2 a_position;

  uniform mat3 u_matrix;

  void main() {
    // 使位置和矩阵相乘
    gl_Position = vec4((u_matrix * vec3(a_position, 1)).xy, 0, 1);
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
