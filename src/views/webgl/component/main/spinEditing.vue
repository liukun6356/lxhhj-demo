<!--旋转编辑-->
<template>
  <div class="spinEditing-wrap"></div>
</template>

<script lang="ts" setup>
import { onMounted, onUnmounted} from "vue";
import {usewebglGlStore} from "@/store/modules/webglGl";
import m3 from "@/views/webgl/lib/m3.js"
import GUI from "lil-gui";

onMounted(() => {
  init()
  initGui()
  drawScence()
})

onUnmounted(() => {
  gui.destroy()
})

const updateChange = () => {
  drawScence()
}
const rules = {}


// lil-gui逻辑
const formData = {
  x: 200,
  y: 150,
  angle: 0,
  scaleX: 1,
  scaleY: 1,
}

let gui
const initGui = () => {
  gui = new GUI({title: "controls"});
  gui.add(formData, "x",0,500,1).onChange(()=>drawScence())
  gui.add(formData, "y",0,500,1).onChange(()=>drawScence())
  gui.add(formData, "angle",0,360,1).onChange(()=>drawScence())
  gui.add(formData, "scaleX",-5,5,0.1).onChange(()=>drawScence())
  gui.add(formData, "scaleY",-5,5,0.1).onChange(()=>drawScence())
}

// webgl逻辑
const webglGlStore = usewebglGlStore()
const gl = webglGlStore.getWebglGl()
let program, positionLocation, positionBuffer, colorLocation, colorBuffer, matrixLocation
const init = () => {
  program = createProgram(VSHADER_SOURCE, FSHADER_SOURCE);
  colorBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
  gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array(
          [
            Math.random(), Math.random(), Math.random(), 1,
            Math.random(), Math.random(), Math.random(), 1,
            Math.random(), Math.random(), Math.random(), 1,
            Math.random(), Math.random(), Math.random(), 1,
            Math.random(), Math.random(), Math.random(), 1,
            Math.random(), Math.random(), Math.random(), 1
          ]),
      gl.STATIC_DRAW);
}

const clear = () => {
  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
  gl.clearColor(0, 0, 0, .2);
  gl.clear(gl.COLOR_BUFFER_BIT); // gl.COLOR_BUFFER_BIT 清除颜色缓存区
}

const drawScence = () => {
  clear()

  gl.useProgram(program);
  gl.program = program;

  positionLocation = gl.getAttribLocation(program, "a_position");
  positionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-150, -100, 150, -100, -150, 100, 150, -100, -150, 100, 150, 100]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(positionLocation);
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

  colorLocation = gl.getAttribLocation(program, "a_color");
  gl.enableVertexAttribArray(colorLocation);
  gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
  gl.vertexAttribPointer(colorLocation, 4, gl.FLOAT, false, 0, 0);

  matrixLocation = gl.getUniformLocation(program, "u_matrix");
  let matrix = m3.projection(gl.canvas.clientWidth, gl.canvas.clientHeight);
  matrix = m3.translate(matrix, formData.x, formData.y);
  const angleInDegrees = 360 - formData.angle
  const angleInRadians = angleInDegrees * Math.PI / 180;
  matrix = m3.rotate(matrix, angleInRadians);
  matrix = m3.scale(matrix, formData.scaleX, formData.scaleY);
  gl.uniformMatrix3fv(matrixLocation, false, matrix);

  gl.drawArrays(gl.TRIANGLES, 0, 6);
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
    var error = gl.getProgramInfoLog(program);
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

const VSHADER_SOURCE = `
    attribute vec2 a_position;
    attribute vec4 a_color;

    uniform mat3 u_matrix;

    varying vec4 v_color;

    void main() {
      // Multiply the position by the matrix.
      gl_Position = vec4((u_matrix * vec3(a_position, 1)).xy, 0, 1);

      // Copy the color from the attribute to the varying.
      v_color = a_color;
      // v_color = gl_Position * 0.5 + 0.5;
    }
  `;
const FSHADER_SOURCE = `
    precision mediump float;

    varying vec4 v_color;

    void main() {
      gl_FragColor = v_color;
    }
  `;
</script>

<style lang="scss" scoped>
.spinEditing-wrap {
  pointer-events: auto;
}
</style>
