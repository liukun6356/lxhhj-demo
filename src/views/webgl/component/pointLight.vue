<!--三维点光源

-->
<template>
  <div class="directionLight-wrap">
    <ul>
      <li v-for="str in typelist" :key="str" @click="itemClick(str)">
        <el-tag :type="activeValue===str?'success':'info'">{{ str }}</el-tag>
      </li>
    </ul>
    <el-form class="transform2d-form" :model="formData" :rules="rules" label-width="70">
      <el-form-item label="rotation:" prop="fRotation">
        <el-slider style="width: 85%" v-model="formData.fRotation" @change="updateChange" :show-tooltip="false"
                   :min="-360" :max="360" :step="1"></el-slider>
        <span style="margin-left: 3px">{{ formData.fRotation }}</span>
      </el-form-item>
      <el-form-item label="shininess:" prop="shininess">
        <el-slider style="width: 85%" v-model="formData.shininess" @change="updateChange" :show-tooltip="false"
                   :min="1" :max="300" :step="1"></el-slider>
        <span style="margin-left: 3px">{{ formData.shininess }}</span>
      </el-form-item>
    </el-form>
  </div>
</template>

<script lang="ts" setup>
import {onMounted, onUnmounted, reactive, toRefs} from "vue";
import {usewebglGlStore} from "@/store/modules/webglGl";
import fData from "./fData.json"

const model = reactive({
  formData: {
    fRotation: 0,
    shininess: 150
  },
  activeValue: ""
})
const {formData, activeValue} = toRefs(model)

onMounted(async () => {
  clear()
  console.log(23456)
})

onUnmounted(() => {
  gl.deleteProgram(program);
})

const updateChange = () => {
  clear()
  switch (model.activeValue) {
    case "light":
      drawLight()
      break
    case "specular":
      drawSpecular()
      break
    case "shininess":
      drawShininess()
      break
    case "shininessColor":
      drawShininessColor()
      break
  }
}

const itemClick = (row) => {
  clear()
  gl.deleteProgram(program);
  gl.deleteBuffer(positionBuffer);
  model.activeValue = row
  let positions, matrix
  switch (row) {
    case "light":
      program = createProgram(vsGLSL1, fsGLSL1);
      positionLocation = gl.getAttribLocation(program, "a_position");
      positionBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
      positions = new Float32Array(fData.positions);
      matrix = m4.xRotation(Math.PI);
      matrix = m4.translate(matrix, -50, -75, -15);
      for (let ii = 0; ii < positions.length; ii += 3) {
        const vector = m4.transformPoint(matrix, [positions[ii + 0], positions[ii + 1], positions[ii + 2], 1]);
        positions[ii + 0] = vector[0];
        positions[ii + 1] = vector[1];
        positions[ii + 2] = vector[2];
      }
      gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);

      normalLocation = gl.getAttribLocation(program, "a_normal");
      normalBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(fData.normals), gl.STATIC_DRAW);

      worldViewProjectionLocation = gl.getUniformLocation(program, "u_worldViewProjection");
      worldInverseTransposeLocation = gl.getUniformLocation(program, "u_worldInverseTranspose");
      colorLocation = gl.getUniformLocation(program, "u_color");
      lightWorldPositionLocation = gl.getUniformLocation(program, "u_lightWorldPosition");
      worldLocation = gl.getUniformLocation(program, "u_world");
      drawLight()
      break
    case "specular":
      program = createProgram(vsGLSL2, fsGLSL2);
      positionLocation = gl.getAttribLocation(program, "a_position");
      positionBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
      positions = new Float32Array(fData.positions);
      matrix = m4.xRotation(Math.PI);
      matrix = m4.translate(matrix, -50, -75, -15);
      for (let ii = 0; ii < positions.length; ii += 3) {
        const vector = m4.transformPoint(matrix, [positions[ii + 0], positions[ii + 1], positions[ii + 2], 1]);
        positions[ii + 0] = vector[0];
        positions[ii + 1] = vector[1];
        positions[ii + 2] = vector[2];
      }
      gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);

      normalLocation = gl.getAttribLocation(program, "a_normal");
      normalBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(fData.normals), gl.STATIC_DRAW);

      worldViewProjectionLocation = gl.getUniformLocation(program, "u_worldViewProjection");
      worldInverseTransposeLocation = gl.getUniformLocation(program, "u_worldInverseTranspose");
      colorLocation = gl.getUniformLocation(program, "u_color");
      lightWorldPositionLocation = gl.getUniformLocation(program, "u_lightWorldPosition");
      viewWorldPositionLocation = gl.getUniformLocation(program, "u_viewWorldPosition");
      worldLocation = gl.getUniformLocation(program, "u_world");
      drawSpecular()
      break
    case "shininess":
      program = createProgram(vsGLSL2, fsGLSL3);
      positionLocation = gl.getAttribLocation(program, "a_position");
      positionBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
      positions = new Float32Array(fData.positions);
      matrix = m4.xRotation(Math.PI);
      matrix = m4.translate(matrix, -50, -75, -15);
      for (let ii = 0; ii < positions.length; ii += 3) {
        const vector = m4.transformPoint(matrix, [positions[ii + 0], positions[ii + 1], positions[ii + 2], 1]);
        positions[ii + 0] = vector[0];
        positions[ii + 1] = vector[1];
        positions[ii + 2] = vector[2];
      }
      gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);

      normalLocation = gl.getAttribLocation(program, "a_normal");
      normalBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(fData.normals), gl.STATIC_DRAW);

      worldViewProjectionLocation = gl.getUniformLocation(program, "u_worldViewProjection");
      worldInverseTransposeLocation = gl.getUniformLocation(program, "u_worldInverseTranspose");
      colorLocation = gl.getUniformLocation(program, "u_color");
      shininessLocation = gl.getUniformLocation(program, "u_shininess");
      lightWorldPositionLocation = gl.getUniformLocation(program, "u_lightWorldPosition");
      viewWorldPositionLocation = gl.getUniformLocation(program, "u_viewWorldPosition");
      worldLocation = gl.getUniformLocation(program, "u_world");
      drawShininess()
      break
    case "shininessColor":
      program = createProgram(vsGLSL2, fsGLSL4);
      positionLocation = gl.getAttribLocation(program, "a_position");
      positionBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
      positions = new Float32Array(fData.positions);
      matrix = m4.xRotation(Math.PI);
      matrix = m4.translate(matrix, -50, -75, -15);
      for (let ii = 0; ii < positions.length; ii += 3) {
        const vector = m4.transformPoint(matrix, [positions[ii + 0], positions[ii + 1], positions[ii + 2], 1]);
        positions[ii + 0] = vector[0];
        positions[ii + 1] = vector[1];
        positions[ii + 2] = vector[2];
      }
      gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);

      normalLocation = gl.getAttribLocation(program, "a_normal");
      normalBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(fData.normals), gl.STATIC_DRAW);

      worldViewProjectionLocation = gl.getUniformLocation(program, "u_worldViewProjection");
      worldInverseTransposeLocation = gl.getUniformLocation(program, "u_worldInverseTranspose");
      colorLocation = gl.getUniformLocation(program, "u_color");
      shininessLocation = gl.getUniformLocation(program, "u_shininess");
      lightColorLocation = gl.getUniformLocation(program, "u_lightColor");
      specularColorLocation = gl.getUniformLocation(program, "u_specularColor");
      lightWorldPositionLocation = gl.getUniformLocation(program, "u_lightWorldPosition");
      viewWorldPositionLocation = gl.getUniformLocation(program, "u_viewWorldPosition");
      worldLocation = gl.getUniformLocation(program, "u_world");
      drawShininessColor()
      break
  }
}

const rules = {}

const typelist = ["light", "specular", "shininess", "shininessColor"]
// webgl逻辑
const webglGlStore = usewebglGlStore()
const gl = webglGlStore.getWebglGl()
let program,
    positionLocation, positionBuffer,
    normalLocation, normalBuffer,
    colorLocation,
    shininessLocation,
    lightColorLocation,
    specularColorLocation,
    worldViewProjectionLocation,
    worldInverseTransposeLocation,
    lightWorldPositionLocation,
    viewWorldPositionLocation,
    worldLocation

const drawLight = () => {
  clear()
  gl.enable(gl.CULL_FACE);
  gl.enable(gl.DEPTH_TEST);

  gl.useProgram(program);

  gl.enableVertexAttribArray(positionLocation);
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.vertexAttribPointer(positionLocation, 3, gl.FLOAT, false, 0, 0);

  gl.enableVertexAttribArray(normalLocation);
  gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
  gl.vertexAttribPointer(normalLocation, 3, gl.FLOAT, false, 0, 0);

  // 计算投影矩阵
  const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
  const projectionMatrix = m4.perspective(degToRad(60), aspect, 1, 2000);
  // 计算相机的矩阵
  const camera = [100, 150, 200];
  const target = [0, 35, 0];
  const up = [0, 1, 0];
  const cameraMatrix = m4.lookAt(camera, target, up);

  // 通过相机矩阵计算视图矩阵
  const viewMatrix = m4.inverse(cameraMatrix); // 计算逆矩阵
  const viewProjectionMatrix = m4.multiply(projectionMatrix, viewMatrix);
  const worldMatrix = m4.yRotation(degToRad(model.formData.fRotation));

  const worldViewProjectionMatrix = m4.multiply(viewProjectionMatrix, worldMatrix);
  const worldInverseMatrix = m4.inverse(worldMatrix); // 计算逆矩阵
  const worldInverseTransposeMatrix = m4.transpose(worldInverseMatrix);

  gl.uniformMatrix4fv(worldViewProjectionLocation, false, worldViewProjectionMatrix);
  gl.uniformMatrix4fv(worldInverseTransposeLocation, false, worldInverseTransposeMatrix);
  gl.uniformMatrix4fv(worldLocation, false, worldMatrix);

  gl.uniform4fv(colorLocation, [0.2, 1, 0.2, 1]); // green
  gl.uniform3fv(lightWorldPositionLocation, [20, 30, 60]);

  gl.drawArrays(gl.TRIANGLES, 0, 16 * 6);
}

const drawSpecular = () => {
  clear()
  gl.enable(gl.CULL_FACE);
  gl.enable(gl.DEPTH_TEST);

  gl.useProgram(program);

  gl.enableVertexAttribArray(positionLocation);
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.vertexAttribPointer(positionLocation, 3, gl.FLOAT, false, 0, 0);

  gl.enableVertexAttribArray(normalLocation);
  gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
  gl.vertexAttribPointer(normalLocation, 3, gl.FLOAT, false, 0, 0);

  // 计算投影矩阵
  const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
  const projectionMatrix = m4.perspective(degToRad(60), aspect, 1, 2000);
  // 计算相机的矩阵
  const camera = [100, 150, 200];
  const target = [0, 35, 0];
  const up = [0, 1, 0];
  const cameraMatrix = m4.lookAt(camera, target, up);

  // 通过相机矩阵计算视图矩阵
  const viewMatrix = m4.inverse(cameraMatrix); // 计算逆矩阵
  const viewProjectionMatrix = m4.multiply(projectionMatrix, viewMatrix);
  const worldMatrix = m4.yRotation(degToRad(model.formData.fRotation));

  const worldViewProjectionMatrix = m4.multiply(viewProjectionMatrix, worldMatrix);
  const worldInverseMatrix = m4.inverse(worldMatrix); // 计算逆矩阵
  const worldInverseTransposeMatrix = m4.transpose(worldInverseMatrix);

  gl.uniformMatrix4fv(worldViewProjectionLocation, false, worldViewProjectionMatrix);
  gl.uniformMatrix4fv(worldInverseTransposeLocation, false, worldInverseTransposeMatrix);
  gl.uniformMatrix4fv(worldLocation, false, worldMatrix);

  gl.uniform4fv(colorLocation, [0.2, 1, 0.2, 1]); // green
  gl.uniform3fv(lightWorldPositionLocation, [20, 30, 60]);

  // 设置相机位置
  gl.uniform3fv(viewWorldPositionLocation, camera);

  gl.drawArrays(gl.TRIANGLES, 0, 16 * 6);
}

const drawShininess = () => {
  clear()
  gl.enable(gl.CULL_FACE);
  gl.enable(gl.DEPTH_TEST);

  gl.useProgram(program);

  gl.enableVertexAttribArray(positionLocation);
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.vertexAttribPointer(positionLocation, 3, gl.FLOAT, false, 0, 0);

  gl.enableVertexAttribArray(normalLocation);
  gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
  gl.vertexAttribPointer(normalLocation, 3, gl.FLOAT, false, 0, 0);

  // 计算投影矩阵
  const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
  const projectionMatrix = m4.perspective(degToRad(60), aspect, 1, 2000);
  // 计算相机的矩阵
  const camera = [100, 150, 200];
  const target = [0, 35, 0];
  const up = [0, 1, 0];
  const cameraMatrix = m4.lookAt(camera, target, up);

  // 通过相机矩阵计算视图矩阵
  const viewMatrix = m4.inverse(cameraMatrix); // 计算逆矩阵
  const viewProjectionMatrix = m4.multiply(projectionMatrix, viewMatrix);
  const worldMatrix = m4.yRotation(degToRad(model.formData.fRotation));

  const worldViewProjectionMatrix = m4.multiply(viewProjectionMatrix, worldMatrix);
  const worldInverseMatrix = m4.inverse(worldMatrix); // 计算逆矩阵
  const worldInverseTransposeMatrix = m4.transpose(worldInverseMatrix);

  gl.uniformMatrix4fv(worldViewProjectionLocation, false, worldViewProjectionMatrix);
  gl.uniformMatrix4fv(worldInverseTransposeLocation, false, worldInverseTransposeMatrix);
  gl.uniformMatrix4fv(worldLocation, false, worldMatrix);

  gl.uniform4fv(colorLocation, [0.2, 1, 0.2, 1]); // green
  gl.uniform3fv(lightWorldPositionLocation, [20, 30, 60]);

  // 设置相机位置
  gl.uniform3fv(viewWorldPositionLocation, camera);
  // 设置亮度
  gl.uniform1f(shininessLocation, model.formData.shininess);

  gl.drawArrays(gl.TRIANGLES, 0, 16 * 6);
}

const drawShininessColor = () => {
  clear()
  gl.enable(gl.CULL_FACE);
  gl.enable(gl.DEPTH_TEST);

  gl.useProgram(program);

  gl.enableVertexAttribArray(positionLocation);
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.vertexAttribPointer(positionLocation, 3, gl.FLOAT, false, 0, 0);

  gl.enableVertexAttribArray(normalLocation);
  gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
  gl.vertexAttribPointer(normalLocation, 3, gl.FLOAT, false, 0, 0);

  // 计算投影矩阵
  const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
  const projectionMatrix = m4.perspective(degToRad(60), aspect, 1, 2000);
  // 计算相机的矩阵
  const camera = [100, 150, 200];
  const target = [0, 35, 0];
  const up = [0, 1, 0];
  const cameraMatrix = m4.lookAt(camera, target, up);

  // 通过相机矩阵计算视图矩阵
  const viewMatrix = m4.inverse(cameraMatrix); // 计算逆矩阵
  const viewProjectionMatrix = m4.multiply(projectionMatrix, viewMatrix);
  const worldMatrix = m4.yRotation(degToRad(model.formData.fRotation));

  const worldViewProjectionMatrix = m4.multiply(viewProjectionMatrix, worldMatrix);
  const worldInverseMatrix = m4.inverse(worldMatrix); // 计算逆矩阵
  const worldInverseTransposeMatrix = m4.transpose(worldInverseMatrix);

  gl.uniformMatrix4fv(worldViewProjectionLocation, false, worldViewProjectionMatrix);
  gl.uniformMatrix4fv(worldInverseTransposeLocation, false, worldInverseTransposeMatrix);
  gl.uniformMatrix4fv(worldLocation, false, worldMatrix);

  gl.uniform4fv(colorLocation, [0.2, 1, 0.2, 1]); // green
  gl.uniform3fv(lightWorldPositionLocation, [20, 30, 60]);

  // 设置相机位置
  gl.uniform3fv(viewWorldPositionLocation, camera);
  // 设置亮度
  gl.uniform1f(shininessLocation, model.formData.shininess);
  // 设置光照颜色
  gl.uniform3fv(lightColorLocation, m4.normalize([1, 0.6, 0.6]));// 红光
  // 设置高光颜色
  gl.uniform3fv(specularColorLocation, m4.normalize([1, 0.2, 0.2]));// 红光

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

const degToRad = (d) => {
  return d * Math.PI / 180;
}

const vsGLSL1 = `
  attribute vec4 a_position;
  attribute vec3 a_normal;

  uniform vec3 u_lightWorldPosition;

  uniform mat4 u_world;
  uniform mat4 u_worldViewProjection;
  uniform mat4 u_worldInverseTranspose;

  varying vec3 v_normal;

  varying vec3 v_surfaceToLight;

  void main() {
    // 将位置和矩阵相乘
    gl_Position = u_worldViewProjection * a_position;

    // 重定向法向量并传递给片段着色器
    v_normal = mat3(u_worldInverseTranspose) * a_normal;

    // 计算表面的世界坐标
    vec3 surfaceWorldPosition = (u_world * a_position).xyz;

    // 计算表面到光源的方向
    // 传递给片段着色器
    v_surfaceToLight = u_lightWorldPosition - surfaceWorldPosition;
  }
`

const fsGLSL1 = `
  precision mediump float;

  // 从顶点着色器中传入的值
  varying vec3 v_normal;
  varying vec3 v_surfaceToLight;

  uniform vec4 u_color;

  void main() {
    // 由于 v_normal 是可变量，所以经过插值后不再是单位向量，
    // 单位化后会成为单位向量
    vec3 normal = normalize(v_normal);

    vec3 surfaceToLightDirection = normalize(v_surfaceToLight);

    float light = dot(normal, surfaceToLightDirection);

    gl_FragColor = u_color;

    // 只将颜色部分（不包含 alpha） 和光照相乘
    gl_FragColor.rgb *= light;
  }
`

const vsGLSL2 = `
  attribute vec4 a_position;
  attribute vec3 a_normal;

  uniform vec3 u_lightWorldPosition;
  uniform vec3 u_viewWorldPosition;

  uniform mat4 u_world;
  uniform mat4 u_worldViewProjection;
  uniform mat4 u_worldInverseTranspose;

  varying vec3 v_normal;

  varying vec3 v_surfaceToLight;
  varying vec3 v_surfaceToView;

  void main() {
    // 将位置和矩阵相乘
    gl_Position = u_worldViewProjection * a_position;

    // 重定向法向量并传递到片段着色器
    v_normal = mat3(u_worldInverseTranspose) * a_normal;

    // 计算表面的世界坐标
    vec3 surfaceWorldPosition = (u_world * a_position).xyz;

    // 计算表面到光源的方向
    // 然后传递到片段着色器
    v_surfaceToLight = u_lightWorldPosition - surfaceWorldPosition;

    // 计算表面到相机的方向
    // 然后传递到片段着色器
    v_surfaceToView = u_viewWorldPosition - surfaceWorldPosition;
  }
`

const fsGLSL2 = `
  precision mediump float;

  // 从顶点着色器中传入的值
  varying vec3 v_normal;
  varying vec3 v_surfaceToLight;
  varying vec3 v_surfaceToView;

  uniform vec4 u_color;

  void main() {
    // 由于 v_normal 是可变量，所以经过插值后不再是单位向量，
    // 单位化后会成为单位向量
    vec3 normal = normalize(v_normal);

    vec3 surfaceToLightDirection = normalize(v_surfaceToLight);
    vec3 surfaceToViewDirection = normalize(v_surfaceToView);
    vec3 halfVector = normalize(surfaceToLightDirection + surfaceToViewDirection);

    float light = dot(normal, surfaceToLightDirection);
    float specular = dot(normal, halfVector);

    gl_FragColor = u_color;

    // 只将颜色部分（不包含 alpha） 和光照相乘
    gl_FragColor.rgb *= light;

    // 直接加上高光
    gl_FragColor.rgb += specular;
  }
`

const fsGLSL3 = `
  precision mediump float;

  // 从顶点着色器中传入的值
  varying vec3 v_normal;
  varying vec3 v_surfaceToLight;
  varying vec3 v_surfaceToView;

  uniform vec4 u_color;
  uniform float u_shininess;

  void main() {
    // 由于 v_normal 是可变量，所以经过插值后不再是单位向量，
    // 单位化后会成为单位向量
    vec3 normal = normalize(v_normal);

    vec3 surfaceToLightDirection = normalize(v_surfaceToLight);
    vec3 surfaceToViewDirection = normalize(v_surfaceToView);
    vec3 halfVector = normalize(surfaceToLightDirection + surfaceToViewDirection);

    float light = dot(normal, surfaceToLightDirection);
    float specular = 0.0;
    if (light > 0.0) {
        specular = pow(dot(normal, halfVector), u_shininess);
    }

    gl_FragColor = u_color;

    // 只将颜色部分（不包含 alpha） 和光照相乘
    gl_FragColor.rgb *= light;

    // 直接加上高光
    gl_FragColor.rgb += specular;
  }
`

const fsGLSL4 = `
  precision mediump float;

  // 从顶点着色器中传入的值
  varying vec3 v_normal;
  varying vec3 v_surfaceToLight;
  varying vec3 v_surfaceToView;

  uniform vec4 u_color;
  uniform float u_shininess;
  uniform vec3 u_lightColor;
  uniform vec3 u_specularColor;

  void main() {
    // 由于 v_normal 是可变量，所以经过插值后不再是单位向量，
    // 单位化后会成为单位向量
    vec3 normal = normalize(v_normal);

    vec3 surfaceToLightDirection = normalize(v_surfaceToLight);
    vec3 surfaceToViewDirection = normalize(v_surfaceToView);
    vec3 halfVector = normalize(surfaceToLightDirection + surfaceToViewDirection);

    float light = dot(normal, surfaceToLightDirection);
    float specular = 0.0;
    if (light > 0.0) {
        specular = pow(dot(normal, halfVector), u_shininess);
    }

    gl_FragColor = u_color;

    // 只将颜色部分（不包含 alpha） 和光照相乘
    gl_FragColor.rgb *= light * u_lightColor;

    // 直接加上高光
    gl_FragColor.rgb += specular * u_specularColor;
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
  },
  transpose: (m) => {
    return [
      m[0], m[4], m[8], m[12],
      m[1], m[5], m[9], m[13],
      m[2], m[6], m[10], m[14],
      m[3], m[7], m[11], m[15],
    ];
  },
  vectorMultiply: (v, m) => {
    const dst = [];
    for (let i = 0; i < 4; ++i) {
      dst[i] = 0.0;
      for (let j = 0; j < 4; ++j) {
        dst[i] += v[j] * m[j * 4 + i];
      }
    }
    return dst;
  },
  transformPoint: (m, v, dst?: object) => {
    dst = dst || new Float32Array(3);
    const v0 = v[0];
    const v1 = v[1];
    const v2 = v[2];
    const d = v0 * m[0 * 4 + 3] + v1 * m[1 * 4 + 3] + v2 * m[2 * 4 + 3] + m[3 * 4 + 3];

    dst[0] = (v0 * m[0 * 4 + 0] + v1 * m[1 * 4 + 0] + v2 * m[2 * 4 + 0] + m[3 * 4 + 0]) / d;
    dst[1] = (v0 * m[0 * 4 + 1] + v1 * m[1 * 4 + 1] + v2 * m[2 * 4 + 1] + m[3 * 4 + 1]) / d;
    dst[2] = (v0 * m[0 * 4 + 2] + v1 * m[1 * 4 + 2] + v2 * m[2 * 4 + 2] + m[3 * 4 + 2]) / d;

    return dst;
  },
  inverse: (m) => {
    const m00 = m[0 * 4 + 0];
    const m01 = m[0 * 4 + 1];
    const m02 = m[0 * 4 + 2];
    const m03 = m[0 * 4 + 3];
    const m10 = m[1 * 4 + 0];
    const m11 = m[1 * 4 + 1];
    const m12 = m[1 * 4 + 2];
    const m13 = m[1 * 4 + 3];
    const m20 = m[2 * 4 + 0];
    const m21 = m[2 * 4 + 1];
    const m22 = m[2 * 4 + 2];
    const m23 = m[2 * 4 + 3];
    const m30 = m[3 * 4 + 0];
    const m31 = m[3 * 4 + 1];
    const m32 = m[3 * 4 + 2];
    const m33 = m[3 * 4 + 3];
    const tmp_0 = m22 * m33;
    const tmp_1 = m32 * m23;
    const tmp_2 = m12 * m33;
    const tmp_3 = m32 * m13;
    const tmp_4 = m12 * m23;
    const tmp_5 = m22 * m13;
    const tmp_6 = m02 * m33;
    const tmp_7 = m32 * m03;
    const tmp_8 = m02 * m23;
    const tmp_9 = m22 * m03;
    const tmp_10 = m02 * m13;
    const tmp_11 = m12 * m03;
    const tmp_12 = m20 * m31;
    const tmp_13 = m30 * m21;
    const tmp_14 = m10 * m31;
    const tmp_15 = m30 * m11;
    const tmp_16 = m10 * m21;
    const tmp_17 = m20 * m11;
    const tmp_18 = m00 * m31;
    const tmp_19 = m30 * m01;
    const tmp_20 = m00 * m21;
    const tmp_21 = m20 * m01;
    const tmp_22 = m00 * m11;
    const tmp_23 = m10 * m01;

    const t0 = (tmp_0 * m11 + tmp_3 * m21 + tmp_4 * m31) - (tmp_1 * m11 + tmp_2 * m21 + tmp_5 * m31);
    const t1 = (tmp_1 * m01 + tmp_6 * m21 + tmp_9 * m31) - (tmp_0 * m01 + tmp_7 * m21 + tmp_8 * m31);
    const t2 = (tmp_2 * m01 + tmp_7 * m11 + tmp_10 * m31) - (tmp_3 * m01 + tmp_6 * m11 + tmp_11 * m31);
    const t3 = (tmp_5 * m01 + tmp_8 * m11 + tmp_11 * m21) - (tmp_4 * m01 + tmp_9 * m11 + tmp_10 * m21);

    const d = 1.0 / (m00 * t0 + m10 * t1 + m20 * t2 + m30 * t3);

    return [
      d * t0,
      d * t1,
      d * t2,
      d * t3,
      d * ((tmp_1 * m10 + tmp_2 * m20 + tmp_5 * m30) -
          (tmp_0 * m10 + tmp_3 * m20 + tmp_4 * m30)),
      d * ((tmp_0 * m00 + tmp_7 * m20 + tmp_8 * m30) -
          (tmp_1 * m00 + tmp_6 * m20 + tmp_9 * m30)),
      d * ((tmp_3 * m00 + tmp_6 * m10 + tmp_11 * m30) -
          (tmp_2 * m00 + tmp_7 * m10 + tmp_10 * m30)),
      d * ((tmp_4 * m00 + tmp_9 * m10 + tmp_10 * m20) -
          (tmp_5 * m00 + tmp_8 * m10 + tmp_11 * m20)),
      d * ((tmp_12 * m13 + tmp_15 * m23 + tmp_16 * m33) -
          (tmp_13 * m13 + tmp_14 * m23 + tmp_17 * m33)),
      d * ((tmp_13 * m03 + tmp_18 * m23 + tmp_21 * m33) -
          (tmp_12 * m03 + tmp_19 * m23 + tmp_20 * m33)),
      d * ((tmp_14 * m03 + tmp_19 * m13 + tmp_22 * m33) -
          (tmp_15 * m03 + tmp_18 * m13 + tmp_23 * m33)),
      d * ((tmp_17 * m03 + tmp_20 * m13 + tmp_23 * m23) -
          (tmp_16 * m03 + tmp_21 * m13 + tmp_22 * m23)),
      d * ((tmp_14 * m22 + tmp_17 * m32 + tmp_13 * m12) -
          (tmp_16 * m32 + tmp_12 * m12 + tmp_15 * m22)),
      d * ((tmp_20 * m32 + tmp_12 * m02 + tmp_19 * m22) -
          (tmp_18 * m22 + tmp_21 * m32 + tmp_13 * m02)),
      d * ((tmp_18 * m12 + tmp_23 * m32 + tmp_15 * m02) -
          (tmp_22 * m32 + tmp_14 * m02 + tmp_19 * m12)),
      d * ((tmp_22 * m22 + tmp_16 * m02 + tmp_21 * m12) -
          (tmp_20 * m12 + tmp_23 * m22 + tmp_17 * m02))
    ];
  },
  cross: (a, b) => {
    return [a[1] * b[2] - a[2] * b[1],
      a[2] * b[0] - a[0] * b[2],
      a[0] * b[1] - a[1] * b[0]];
  },
  normalize: (v) => {
    const length = Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]);
    // 确定不会除以 0
    if (length > 0.00001) {
      return [v[0] / length, v[1] / length, v[2] / length];
    } else {
      return [0, 0, 0];
    }
  },
  subtractVectors: (a, b) => {
    return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
  },
  lookAt: (cameraPosition, target, up) => {
    const zAxis = m4.normalize(m4.subtractVectors(cameraPosition, target));
    const xAxis = m4.normalize(m4.cross(up, zAxis));
    const yAxis = m4.normalize(m4.cross(zAxis, xAxis));
    return [
      xAxis[0], xAxis[1], xAxis[2], 0,
      yAxis[0], yAxis[1], yAxis[2], 0,
      zAxis[0], zAxis[1], zAxis[2], 0,
      cameraPosition[0],
      cameraPosition[1],
      cameraPosition[2],
      1,
    ];
  },
  perspective: (fieldOfViewInRadians, aspect, near, far) => {
    const f = Math.tan(Math.PI * 0.5 - 0.5 * fieldOfViewInRadians);
    const rangeInv = 1.0 / (near - far);
    return [
      f / aspect, 0, 0, 0,
      0, f, 0, 0,
      0, 0, (near + far) * rangeInv, -1,
      0, 0, near * far * rangeInv * 2, 0
    ];
  },
};
</script>

<style lang="scss" scoped>
.directionLight-wrap {
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
