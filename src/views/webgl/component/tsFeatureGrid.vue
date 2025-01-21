<!-- grid网格 -->
<template>
  <div class="tsFeatureGrid-wrap">
    <ul>
      <li v-for="str in typelist" :key="str" @click="itemClick(str)">
        <el-tag :type="activeValue===str?'success':'info'">{{ str }}</el-tag>
      </li>
    </ul>
  </div>
</template>

<script lang="ts" setup>
import {usewebglGlStore} from "@/store/modules/webglGl"
import {onMounted, reactive, toRefs} from "vue"
import {vec4, mat3} from "gl-matrix";


const model = reactive({
  typelist: ["网格"],
  activeValue: ""
})
const {typelist, activeValue} = toRefs(model)

onMounted(() => {
  clear()
})

const itemClick = (row) => {
  clear()
  model.activeValue = row
  switch (row) {
    case "网格":
      const canvas = document.createElement("canvas");
      canvas.width = 256;
      canvas.height = 256;
      ctx = canvas.getContext("2d");
      ctx.fillStyle = "skyblue";
      ctx.shadowColor = "white";
      ctx.strokeStyle = "white";
      ctx.lineWidth = 1;
      ctx.shadowBlur = 0;
      ctx.font = "20px sans-serif";

      program = createProgram(vsGLSL, fsGLSL);

      // positionLocation = gl.getAttribLocation(program, "a_position");
      gl.bindAttribLocation(program, positionLocation, "a_Position");
      rectLocation = gl.getUniformLocation(program, "u_Rect");
      modelTransformLocation = gl.getUniformLocation(program, "u_ModelTransform");
      nDCTransformLocation = gl.getUniformLocation(program, "u_NDCTransform");
      textureLocation = gl.getUniformLocation(program, "u_Texture");
      vertexBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Uint8Array([0, 0, 1, 0, 1, 1, 0, 1]), gl.STATIC_DRAW);
      indexBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
      gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array([0, 1, 2, 0, 2, 3]), gl.STATIC_DRAW);
      drawGrid()
      break

  }
}
// webgl逻辑
const webglGlStore = usewebglGlStore()
const gl = webglGlStore.getWebglGl()
let ctx,
    program,
    positionLocation = 0,
    rectLocation,
    modelTransformLocation,
    nDCTransformLocation,
    textureLocation,
    vertexBuffer,
    indexBuffer,
    a_Position,
    textures = new Map();

const drawGrid = () => {
  for (let i = 0; i < 40; ++i) {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)
    ctx.fillText([1, 2, 3, 4].join("/"), 10, 24)
    ctx.strokeRect(0, 0, ctx.canvas.width, ctx.canvas.height)
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 0);//可能其他程序会修改, 强制指定
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, ctx.canvas);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    textures.set(i, texture);
  }

  gl.enable(gl.BLEND);
  gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
  gl.enableVertexAttribArray(positionLocation);
  gl.useProgram(program);
  const ndcTransMatrix = mat3.projection(new Float32Array(9), gl.canvas.width, gl.canvas.height)
  const modelMatrix = mat3.identity(new Float32Array(9))

  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
  gl.vertexAttribPointer(positionLocation, 2, gl.UNSIGNED_BYTE, false, 2, 0);
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
  gl.uniformMatrix3fv(nDCTransformLocation, false, ndcTransMatrix);
  gl.uniformMatrix3fv(modelTransformLocation, false, modelMatrix);

  const rect = vec4.create();
  for (let i = 0; i < 40; i++) {
    const texture = textures.get(i)
    rect[0] = i * 12;
    rect[1] = i * 10;
    rect[2] = 256;
    rect[3] = 256;
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.uniform4fv(rectLocation, rect);
    gl.uniform1i(textureLocation, 0);
    gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);
  }
}

const clear = () => {
  // 设置背景颜色 -> https://developer.mozilla.org/zh-CN/docs/Web/API/WebGLRenderingContext/clearColor
  gl.clearColor(0, 0, 0, .2);
  // 清空canvas -> https://developer.mozilla.org/zh-CN/docs/Web/API/WebGLRenderingContext/clear
  gl.clear(gl.COLOR_BUFFER_BIT); // gl.COLOR_BUFFER_BIT 清除颜色缓存区
}

const m3 = { // 当前用的 array，项目中需要使用 typeArray
  identity: () => [
    1, 0, 0,
    0, 1, 0,
    0, 0, 1,
  ],
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

const vsGLSL = `
  precision highp float;
  attribute vec2 a_Position;
  uniform vec4 u_Rect;
  uniform mat3 u_ModelTransform;
  uniform mat3 u_NDCTransform;
  varying vec2 v_TexCoord;
  void main(void) {
    vec3 transformed = u_NDCTransform * u_ModelTransform * vec3(u_Rect.xy + u_Rect.zw * a_Position, 1.0);
    transformed /= transformed.z;
    gl_Position = vec4(transformed.xy, 0.0, 1.0);
    v_TexCoord = a_Position;
  }
`
const fsGLSL = `
  precision highp float;
  varying vec2 v_TexCoord;
  uniform sampler2D u_Texture;
  void main(void) {
    gl_FragColor = texture2D(u_Texture, v_TexCoord);
  }
`
</script>

<style lang="scss" scoped>
.tsFeatureGrid-wrap {
  pointer-events: auto;

  ul {
    position: fixed;
    top: 100px;
    left: 270px;
    display: flex;
    cursor: pointer;

    li {
      margin-right: 5px;
    }
  }
}
</style>
