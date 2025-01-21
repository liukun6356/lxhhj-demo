<!--图像处理-->
<template>
  <div class="imageProcessing-wrap">
    <ul>
      <li v-for="str in typelist" :key="str" @click="itemClick(str)">
        <el-tag :type="activeValue===str?'success':'info'">{{ str }}</el-tag>
      </li>
    </ul>
  </div>
</template>

<script lang="ts" setup>
import {onMounted, onUnmounted, reactive, toRefs} from "vue"
import {usewebglGlStore} from "@/store/modules/webglGl";
import imgSrc from "@/assets/images/webgl/leaves.jpg"

const model = reactive({
  typelist: ["图片"],
  activeValue: ""
})
const {typelist, activeValue} = toRefs(model)

onMounted(() => {
  clear()
  init()
})

onUnmounted(() => {
  gl.deleteProgram(program);
})

const itemClick = (row) => {
  clear()
  model.activeValue = row
  switch (row) {
    case "图片":
      drawImg()
      break
  }
}

// webgl逻辑
const webglGlStore = usewebglGlStore()
const gl = webglGlStore.getWebglGl()
let program
const image = new Image();
image.src = imgSrc;

const clear = () => {
  // 设置背景颜色 -> https://developer.mozilla.org/zh-CN/docs/Web/API/WebGLRenderingContext/clearColor
  gl.clearColor(0, 0, 0, .2);
  // 清空canvas -> https://developer.mozilla.org/zh-CN/docs/Web/API/WebGLRenderingContext/clear
  gl.clear(gl.COLOR_BUFFER_BIT); // gl.COLOR_BUFFER_BIT 清除颜色缓存区
}

const init = () => {
  program = createProgram(vsGLSL, fsGLSL);
}

const drawImg = () => {
  const positionLocation = gl.getAttribLocation(program, "a_position");
  const positionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer)
  const x1 = 0;
  const x2 = 0 + image.width;
  const y1 = 0;
  const y2 = 0 + image.height;
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
    x1, y1,
    x2, y1,
    x1, y2,
    x1, y2,
    x2, y1,
    x2, y2,
  ]), gl.STATIC_DRAW);
  // 找到纹理的地址
  const texcoordLocation = gl.getAttribLocation(program, "a_texCoord");
  const texcoordBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, texcoordBuffer);
  // 给矩形提供纹理坐标
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
    0.0, 0.0,
    1.0, 0.0,
    0.0, 1.0,
    0.0, 1.0,
    1.0, 0.0,
    1.0, 1.0,
  ]), gl.STATIC_DRAW);

  // 创建纹理
  const texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture); // 默认绑定纹理到单元
  // 设置参数，让我们可以绘制任何尺寸的图像
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

  // 将图像上传到纹理
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);

  const resolutionLocation = gl.getUniformLocation(program, "u_resolution");
  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
  clear()

  gl.useProgram(program);
  gl.enableVertexAttribArray(positionLocation);
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

  gl.enableVertexAttribArray(texcoordLocation)
  gl.bindBuffer(gl.ARRAY_BUFFER, texcoordBuffer)
  gl.vertexAttribPointer(texcoordLocation, 2, gl.FLOAT, false, 0, 0)

  gl.uniform2f(resolutionLocation, gl.canvas.width, gl.canvas.height)

  gl.drawArrays(gl.TRIANGLES, 0, 6)
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

const vsGLSL = `
  attribute vec2 a_position;
  attribute vec2 a_texCoord;

  uniform vec2 u_resolution;

  varying vec2 v_texCoord; // 可变量,可传递到片段着色器

  void main() {
     // 从像素坐标转换到 0.0 到 1.0
     vec2 zeroToOne = a_position / u_resolution;

     // 再把 0->1 转换 0->2
     vec2 zeroToTwo = zeroToOne * 2.0;

     // 把 0->2 转换到 -1->+1 (裁剪空间)
     vec2 clipSpace = zeroToTwo - 1.0;

     gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1);

     // 将纹理坐标传给片段着色器
     // GPU会在点之间进行插值
     v_texCoord = a_texCoord;
  }
`
/*
比如 画布 400*300
裁剪空间坐标  画布像素坐标
(0,0)       (200,150)
(0,0.5)     (200,225)

例如传入 （200，150）
vec2 zeroToOne = a_position / u_resolution; => [200,150]/[400,300]
vec2 zeroToTwo = zeroToOne * 2.0; => [0.5,0.5]*2
vec2 clipSpace = zeroToTwo - 1.0; => [0,0]
gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1); => [0,0,0,1]
例如传入 （0，0）
vec2 zeroToOne = a_position / u_resolution; => [0,0]/[400,300]
vec2 zeroToTwo = zeroToOne * 2.0; => [0,0]*2
vec2 clipSpace = zeroToTwo - 1.0; => [-1,-1]
gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1); => [-1,1,0,1]
*/

/*
glsl命名约定
a_  代表缓存，值从缓冲中提供
u_  代表全局变量，直接对着色器设置
v_  代表可变量，从顶点着色器的顶点中插值出来的
*/
const fsGLSL = `
  precision mediump float;

  // 纹理
  uniform sampler2D u_image;

  // 从顶点着色器传入的纹理坐标
  varying vec2 v_texCoord;

  void main() {
     // 在纹理上寻找对应颜色值
     gl_FragColor = texture2D(u_image, v_texCoord).rgba; // 默认rgba
     // 红色和蓝色调换位置
     // gl_FragColor = texture2D(u_image, v_texCoord).bgra
  }
`


</script>

<style lang="scss" scoped>
.imageProcessing-wrap {
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
