<!--三维投影(透视)
  基础特性:离得越远显得越小
-->
<template>
  <div class="transform3dPerspective-wrap">
    <ul>
      <li v-for="str in typelist" :key="str" @click="itemClick(str)">
        <el-tag :type="activeValue===str?'success':'info'">{{ str }}</el-tag>
      </li>
    </ul>
    <el-form class="transform2d-form" :model="formData" :rules="rules" label-width="70">
      <el-form-item label="fudge:" prop="fudge">
        <el-slider style="width: 85%" v-model="formData.fudge" @change="updateChange" :show-tooltip="false"
                   :min="0" :max="2" :step="0.1"></el-slider>
        <span style="margin-left: 8px">{{ formData.fudge }}</span>
      </el-form-item>
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
      <el-form-item label="z:" prop="z">
        <el-slider style="width: 85%" v-model="formData.z" @change="updateChange" :show-tooltip="false" :min="0"
                   :max="gl.canvas.clientHeight"></el-slider>
        <span style="margin-left: 8px">{{ formData.z }}</span>
      </el-form-item>
      <el-form-item label="angleX:" prop="angleX">
        <el-slider style="width: 85%" v-model="formData.angleX" @change="updateChange" :show-tooltip="false" :min="0"
                   :max="360"></el-slider>
        <span style="margin-left: 8px">{{ formData.angleX }}</span>
      </el-form-item>
      <el-form-item label="angleY:" prop="angleY">
        <el-slider style="width: 85%" v-model="formData.angleY" @change="updateChange" :show-tooltip="false" :min="0"
                   :max="360"></el-slider>
        <span style="margin-left: 8px">{{ formData.angleY }}</span>
      </el-form-item>
      <el-form-item label="angleZ:" prop="angleZ">
        <el-slider style="width: 85%" v-model="formData.angleZ" @change="updateChange" :show-tooltip="false" :min="0"
                   :max="360"></el-slider>
        <span style="margin-left: 8px">{{ formData.angleZ }}</span>
      </el-form-item>
    </el-form>
  </div>
</template>

<script lang="ts" setup>
import {onMounted, onUnmounted, reactive, toRefs} from "vue";
import {usewebglGlStore} from "@/store/modules/webglGl";

const model = reactive({
  formData: {
    fudge: 1,
    x: 200,
    y: 150,
    z: 0,
    angleX: 40,
    angleY: 25,
    angleZ: 25,
    scaleX: 1,
    scaleY: 1,
    scaleZ: 1,
  },
  activeValue: ""
})
const {formData, activeValue} = toRefs(model)

onMounted(() => {
  clear()
})

onUnmounted(() => {
  gl.deleteProgram(program);
})

const updateChange = () => {
  clear()
  switch (model.activeValue) {
    case "fudge":
      drawFudge()
      break
  }
}

const itemClick = (row) => {
  clear()
  gl.deleteProgram(program);
  gl.deleteBuffer(positionBuffer);
  gl.deleteBuffer(colorBuffer);
  model.activeValue = row
  switch (row) {
    case "fudge":
      program = createProgram(vsGLSL1, fsGLSL1);
      positionLocation = gl.getAttribLocation(program, "a_position");

      positionBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
        0, 0, 0, 0, 150, 0, 30, 0, 0, 0, 150, 0, 30, 150, 0, 30, 0, 0, // left column front
        30, 0, 0, 30, 30, 0, 100, 0, 0, 30, 30, 0, 100, 30, 0, 100, 0, 0,// top rung front
        30, 60, 0, 30, 90, 0, 67, 60, 0, 30, 90, 0, 67, 90, 0, 67, 60, 0,// middle rung front
        0, 0, 30, 30, 0, 30, 0, 150, 30, 0, 150, 30, 30, 0, 30, 30, 150, 30,// left column back
        30, 0, 30, 100, 0, 30, 30, 30, 30, 30, 30, 30, 100, 0, 30, 100, 30, 30,// top rung back
        30, 60, 30, 67, 60, 30, 30, 90, 30, 30, 90, 30, 67, 60, 30, 67, 90, 30,// middle rung back
        0, 0, 0, 100, 0, 0, 100, 0, 30, 0, 0, 0, 100, 0, 30, 0, 0, 30,// top
        100, 0, 0, 100, 30, 0, 100, 30, 30, 100, 0, 0, 100, 30, 30, 100, 0, 30,// top rung right
        30, 30, 0, 30, 30, 30, 100, 30, 30, 30, 30, 0, 100, 30, 30, 100, 30, 0,// under top rung
        30, 30, 0, 30, 60, 30, 30, 30, 30, 30, 30, 0, 30, 60, 0, 30, 60, 30,// between top rung and middle
        30, 60, 0, 67, 60, 30, 30, 60, 30, 30, 60, 0, 67, 60, 0, 67, 60, 30,// top of middle rung
        67, 60, 0, 67, 90, 30, 67, 60, 30, 67, 60, 0, 67, 90, 0, 67, 90, 30,// right of middle rung
        30, 90, 0, 30, 90, 30, 67, 90, 30, 30, 90, 0, 67, 90, 30, 67, 90, 0,// bottom of middle rung.
        30, 90, 0, 30, 150, 30, 30, 90, 30, 30, 90, 0, 30, 150, 0, 30, 150, 30,// right of bottom
        0, 150, 0, 0, 150, 30, 30, 150, 30, 0, 150, 0, 30, 150, 30, 30, 150, 0,// bottom
        0, 0, 0, 0, 0, 30, 0, 150, 30, 0, 0, 0, 0, 150, 30, 0, 150, 0,// left side
      ]), gl.STATIC_DRAW);

      colorLocation = gl.getAttribLocation(program, "a_color");
      colorBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Uint8Array([
        200, 70, 120, 200, 70, 120, 200, 70, 120, 200, 70, 120, 200, 70, 120, 200, 70, 120,// left column front
        200, 70, 120, 200, 70, 120, 200, 70, 120, 200, 70, 120, 200, 70, 120, 200, 70, 120,// top rung front
        200, 70, 120, 200, 70, 120, 200, 70, 120, 200, 70, 120, 200, 70, 120, 200, 70, 120,// middle rung front
        80, 70, 200, 80, 70, 200, 80, 70, 200, 80, 70, 200, 80, 70, 200, 80, 70, 200,// left column back
        80, 70, 200, 80, 70, 200, 80, 70, 200, 80, 70, 200, 80, 70, 200, 80, 70, 200,// top rung back
        80, 70, 200, 80, 70, 200, 80, 70, 200, 80, 70, 200, 80, 70, 200, 80, 70, 200,// middle rung back
        70, 200, 210, 70, 200, 210, 70, 200, 210, 70, 200, 210, 70, 200, 210, 70, 200, 210,// top
        200, 200, 70, 200, 200, 70, 200, 200, 70, 200, 200, 70, 200, 200, 70, 200, 200, 70,// top rung right
        210, 100, 70, 210, 100, 70, 210, 100, 70, 210, 100, 70, 210, 100, 70, 210, 100, 70,// under top rung
        210, 160, 70, 210, 160, 70, 210, 160, 70, 210, 160, 70, 210, 160, 70, 210, 160, 70,// between top rung and middle
        70, 180, 210, 70, 180, 210, 70, 180, 210, 70, 180, 210, 70, 180, 210, 70, 180, 210,// top of middle rung
        100, 70, 210, 100, 70, 210, 100, 70, 210, 100, 70, 210, 100, 70, 210, 100, 70, 210,// right of middle rung
        76, 210, 100, 76, 210, 100, 76, 210, 100, 76, 210, 100, 76, 210, 100, 76, 210, 100,// bottom of middle rung.
        140, 210, 80, 140, 210, 80, 140, 210, 80, 140, 210, 80, 140, 210, 80, 140, 210, 80,// right of bottom
        90, 130, 110, 90, 130, 110, 90, 130, 110, 90, 130, 110, 90, 130, 110, 90, 130, 110,// bottom
        160, 160, 220, 160, 160, 220, 160, 160, 220, 160, 160, 220, 160, 160, 220, 160, 160, 220// left side
      ]), gl.STATIC_DRAW);

      matrixLocation = gl.getUniformLocation(program, "u_matrix");
      fudgeLocation = gl.getUniformLocation(program, "u_fudgeFactor");
      drawFudge()
      break
  }
}

const rules = {}

const typelist = ["fudge"]
// webgl逻辑
const webglGlStore = usewebglGlStore()
const gl = webglGlStore.getWebglGl()
let program,
    positionLocation, positionBuffer,
    colorLocation, colorBuffer,
    matrixLocation,
    fudgeLocation;

const drawFudge = () => {
  clear()
  gl.enable(gl.CULL_FACE);
  gl.enable(gl.DEPTH_TEST);
  gl.useProgram(program);

  gl.enableVertexAttribArray(positionLocation);
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.vertexAttribPointer(positionLocation, 3, gl.FLOAT, false, 0, 0);

  gl.enableVertexAttribArray(colorLocation);
  gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
  gl.vertexAttribPointer(colorLocation, 3, gl.UNSIGNED_BYTE, true, 0, 0);

  let matrix = m4.projection(gl.canvas.clientWidth, gl.canvas.clientHeight, 400);
  matrix = m4.translate(matrix, model.formData.x, model.formData.y, model.formData.z);
  matrix = m4.xRotate(matrix, getAngle(model.formData.angleX));
  matrix = m4.yRotate(matrix, getAngle(model.formData.angleY));
  matrix = m4.zRotate(matrix, getAngle(model.formData.angleZ));
  matrix = m4.scale(matrix, model.formData.scaleX, model.formData.scaleY, model.formData.scaleZ);

  gl.uniformMatrix4fv(matrixLocation, false, matrix)

  gl.uniform1f(fudgeLocation, model.formData.fudge);

  gl.drawArrays(gl.TRIANGLES, 0, 16 * 6);
}

const clear = () => {
  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
  // 设置背景颜色 -> https://developer.mozilla.org/zh-CN/docs/Web/API/WebGLRenderingContext/clearColor
  gl.clearColor(0, 0, 0, .2);
  // 清空canvas -> https://developer.mozilla.org/zh-CN/docs/Web/API/WebGLRenderingContext/clear
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT); // gl.COLOR_BUFFER_BIT 清除颜色缓存区
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

const getAngle = (angle) => {
  const angleInDegrees = 360 - angle;
  return angleInDegrees * Math.PI / 180;
}

const vsGLSL1 = `
  attribute vec4 a_position;
  attribute vec4 a_color;

  uniform mat4 u_matrix;
  uniform float u_fudgeFactor;

  varying vec4 v_color;

  void main() {
    // Multiply the position by the matrix.
    vec4 position = u_matrix * a_position;

    // Adjust the z to divide by
    float zToDivideBy = 1.0 + position.z * u_fudgeFactor;

    // Divide x and y by z.
    gl_Position = vec4(position.xy / zToDivideBy, position.zw);

    // Pass the color to the fragment shader.
    v_color = a_color;
  }
`

const fsGLSL1 = `
  precision mediump float;

  // Passed in from the vertex shader.
  varying vec4 v_color;

  void main() {
     gl_FragColor = v_color;
  }
`

const m4 = {
  projection: (width, height, depth) => [
    2 / width, 0, 0, 0,
    0, -2 / height, 0, 0,
    0, 0, 2 / depth, 0,
    -1, 1, 0, 1,
  ],
  translate: (m, tx, ty, tz) => m4.multiply(m, m4.translation(tx, ty, tz)),
  translation: (tx, ty, tz) => [
    1, 0, 0, 0,
    0, 1, 0, 0,
    0, 0, 1, 0,
    tx, ty, tz, 1,
  ],// => newX = x + tx; newY = y + ty; newZ = z + tz;
  xRotate: (m, angleInRadians) => m4.multiply(m, m4.xRotation(angleInRadians)),
  xRotation: (angleInRadians) => {
    const c = Math.cos(angleInRadians);
    const s = Math.sin(angleInRadians);
    return [
      1, 0, 0, 0,
      0, c, s, 0,
      0, -s, c, 0,
      0, 0, 0, 1,
    ];// => newX = x; newY = cy - sz; newZ = sy + cz;
  },
  yRotate: (m, angleInRadians) => m4.multiply(m, m4.yRotation(angleInRadians)),
  yRotation: (angleInRadians) => {
    const c = Math.cos(angleInRadians);
    const s = Math.sin(angleInRadians);
    return [
      c, 0, -s, 0,
      0, 1, 0, 0,
      s, 0, c, 0,
      0, 0, 0, 1,
    ];// => newX = cx + sz; newY = y; newZ = -sx + zc;
  },
  zRotate: (m, angleInRadians) => m4.multiply(m, m4.zRotation(angleInRadians)),
  zRotation: (angleInRadians) => {
    const c = Math.cos(angleInRadians);
    const s = Math.sin(angleInRadians);

    return [
      c, s, 0, 0,
      -s, c, 0, 0,
      0, 0, 1, 0,
      0, 0, 0, 1,
    ];// => newX = cx - sy; newY = sx+cy; newZ = 0;
  },
  scale: (m, sx, sy, sz) => m4.multiply(m, m4.scaling(sx, sy, sz)),
  scaling: (sx, sy, sz) => [
    sx, 0, 0, 0,
    0, sy, 0, 0,
    0, 0, sz, 0,
    0, 0, 0, 1,
  ],
  multiply: (a, b) => {
    const a00 = a[0 * 4 + 0];
    const a01 = a[0 * 4 + 1];
    const a02 = a[0 * 4 + 2];
    const a03 = a[0 * 4 + 3];
    const a10 = a[1 * 4 + 0];
    const a11 = a[1 * 4 + 1];
    const a12 = a[1 * 4 + 2];
    const a13 = a[1 * 4 + 3];
    const a20 = a[2 * 4 + 0];
    const a21 = a[2 * 4 + 1];
    const a22 = a[2 * 4 + 2];
    const a23 = a[2 * 4 + 3];
    const a30 = a[3 * 4 + 0];
    const a31 = a[3 * 4 + 1];
    const a32 = a[3 * 4 + 2];
    const a33 = a[3 * 4 + 3];
    const b00 = b[0 * 4 + 0];
    const b01 = b[0 * 4 + 1];
    const b02 = b[0 * 4 + 2];
    const b03 = b[0 * 4 + 3];
    const b10 = b[1 * 4 + 0];
    const b11 = b[1 * 4 + 1];
    const b12 = b[1 * 4 + 2];
    const b13 = b[1 * 4 + 3];
    const b20 = b[2 * 4 + 0];
    const b21 = b[2 * 4 + 1];
    const b22 = b[2 * 4 + 2];
    const b23 = b[2 * 4 + 3];
    const b30 = b[3 * 4 + 0];
    const b31 = b[3 * 4 + 1];
    const b32 = b[3 * 4 + 2];
    const b33 = b[3 * 4 + 3];
    return [
      b00 * a00 + b01 * a10 + b02 * a20 + b03 * a30,
      b00 * a01 + b01 * a11 + b02 * a21 + b03 * a31,
      b00 * a02 + b01 * a12 + b02 * a22 + b03 * a32,
      b00 * a03 + b01 * a13 + b02 * a23 + b03 * a33,
      b10 * a00 + b11 * a10 + b12 * a20 + b13 * a30,
      b10 * a01 + b11 * a11 + b12 * a21 + b13 * a31,
      b10 * a02 + b11 * a12 + b12 * a22 + b13 * a32,
      b10 * a03 + b11 * a13 + b12 * a23 + b13 * a33,
      b20 * a00 + b21 * a10 + b22 * a20 + b23 * a30,
      b20 * a01 + b21 * a11 + b22 * a21 + b23 * a31,
      b20 * a02 + b21 * a12 + b22 * a22 + b23 * a32,
      b20 * a03 + b21 * a13 + b22 * a23 + b23 * a33,
      b30 * a00 + b31 * a10 + b32 * a20 + b33 * a30,
      b30 * a01 + b31 * a11 + b32 * a21 + b33 * a31,
      b30 * a02 + b31 * a12 + b32 * a22 + b33 * a32,
      b30 * a03 + b31 * a13 + b32 * a23 + b33 * a33,
    ];
  }
};
</script>

<style lang="scss" scoped>
.transform3dPerspective-wrap {
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
