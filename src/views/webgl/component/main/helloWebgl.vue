<!--点，线，三角
  webgl 是强数据类型
  着色器获取数据的4种方法
    Attributes  属性
    Uniforms    全局变量
    Textures    纹理
    Varyings    可变量(片段着色器运行中获取不同的插值)

  变量命名约定
    a_ 代表属性
    u_ 代表全局变量
    v_ 代表可变量
-->
<template>
  <div class="helloWebgl-wrap">
    <ul>
      <li v-for="str in typelist" :key="str" @click="itemClick(str)">
        <el-tag :type="activeValue===str?'success':'info'">{{ str }}</el-tag>
      </li>
    </ul>
  </div>
</template>

<script lang="ts" setup>
import {usewebglGlStore} from "@/store/modules/webglGl"
import {onMounted, reactive, toRefs} from "vue";

const model = reactive({
  typelist: ["点", "线条", "闭合线圈", "线段", "三角带", "三角扇", "三角形",],
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
    case "点":
      drawPoint()
      break
    case "线条":
      drawLineStrip()
      break
    case "闭合线圈":
      drawLineLoop()
      break
    case "线段":
      drawLine()
      break
    case "三角带":
      drawTriangleStrip()
      break
    case "三角扇":
      drawTriangleFan()
      break
    case "三角形":
      drawTriangle()
      break
  }
}
// webgl逻辑
const webglGlStore = usewebglGlStore()
const gl = webglGlStore.getWebglGl()

const clear = () => {
  // 设置背景颜色 -> https://developer.mozilla.org/zh-CN/docs/Web/API/WebGLRenderingContext/clearColor
  gl.clearColor(0, 0, 0, .2);
  // 清空canvas -> https://developer.mozilla.org/zh-CN/docs/Web/API/WebGLRenderingContext/clear
  gl.clear(gl.COLOR_BUFFER_BIT); // gl.COLOR_BUFFER_BIT 清除颜色缓存区
}

const drawPoint = () => {
  // 顶点着色器 GLSL ES语言
  const VSHADER_SOURCE =
      `void main() {
          gl_Position = vec4(0.0, 0.5, 0.0, 1.0); // 顶点位置
          gl_PointSize = 10.0;                   // 点的尺寸(像素数)
        }`;
  // 片元着色器 GLSL ES语言
  const FSHADER_SOURCE =
      `void main() {
         gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);  // Set the point color
        }`;
  // 建立和初始化着色器
  const program = createProgram(VSHADER_SOURCE, FSHADER_SOURCE);
  gl.useProgram(program);
  gl.program = program;

  // 绘制一个点  -> https://developer.mozilla.org/zh-CN/docs/Web/API/WebGLRenderingContext/drawArrays
  // gl.POINTS 绘制一系列点
  // gl.LINE_STRIP 绘制一个线条
  //   ---绘制顶点之间的线段，不会自动闭合图形
  // gl.LINE_LOOP 绘制一个闭合线圈
  //   ---会自动连接起始和结束的点，形成一个闭合的线圈
  // gl.LINES  绘制一系列单独线段
  // gl.TRIANGLE_STRIP 绘制一个三角带
  //   ---顶点列表来创建一个连续的三角形带，它每添加一个新的顶点时，就自动连接前两个顶点来形成新的三角形
  // gl.TRIANGLE_FAN 绘制一个三角扇
  //   ---默认第一个点是中心点，从中心点开始绘制多个三角形，连接每个新的顶点与中心点来形成三角形
  // gl.TRIANGLES 绘制一系列三角形
  gl.drawArrays(gl.POINTS, 1, 1);
}

const drawLineStrip = () => {
  const VSHADER_SOURCE = `
  attribute vec4 a_Position;
  void main() {
    gl_Position = a_Position;  // 直接使用传入的顶点位置
  }
  `;
  const FSHADER_SOURCE = `
  void main() {
    gl_FragColor = vec4(1.0, 1.0,0.0, 1.0);  // 设置边框颜色为红色
  }
  `;
  const program = createProgram(VSHADER_SOURCE, FSHADER_SOURCE);
  gl.useProgram(program);
  gl.program = program;

  // 创建顶点数据 (二个三角形)
  const vertices = new Float32Array([
    0.0, 0.5,   // 顶点 1 (顶部)
    -0.5, -0.5,   // 顶点 2 (左下角)
    0.5, -0.5,   // 顶点 3 (右下角)
    0.0, 0.5,   // 顶点 1 (顶部)
  ]);

  const vertexBuffer = gl.createBuffer(); // 初始化一个用于储存顶点数据或着色数据的WebGLBuffer对象
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer); // 给定的 WebGLBuffer 绑定到目标
  gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW); // 初始化了 Buffer 对象的数据存储区
  const a_Position = gl.getAttribLocation(program, 'a_Position'); //给定WebGLProgram对象中某属性的下标指向位置
  gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, 0, 0);  // 指定顶点数据格式
  gl.enableVertexAttribArray(a_Position); // 启用顶点属性数组

  gl.drawArrays(gl.LINE_STRIP, 0, 4);  // 绘制 3 个顶点的三角形
}

const drawLineLoop = () => {
  const VSHADER_SOURCE = `
  attribute vec4 a_Position;
  void main() {
    gl_Position = a_Position;  // 直接使用传入的顶点位置
  }
  `;
  const FSHADER_SOURCE = `
  void main() {
    gl_FragColor = vec4(1.0, 0.0,3.0, 1.0);  // 设置边框颜色为红色
  }
  `;
  const program = createProgram(VSHADER_SOURCE, FSHADER_SOURCE);
  gl.useProgram(program);
  gl.program = program;

  const vertices = new Float32Array([
    0.0, 0.5,   // 顶点 1 (顶部)
    -0.5, -0.5,   // 顶点 2 (左下角)
    0.5, -0.5    // 顶点 3 (右下角)
  ]);

  const vertexBuffer = gl.createBuffer(); // 初始化一个用于储存顶点数据或着色数据的WebGLBuffer对象
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer); // 给定的 WebGLBuffer 绑定到目标
  gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW); // 初始化了 Buffer 对象的数据存储区
  const a_Position = gl.getAttribLocation(program, 'a_Position'); //给定WebGLProgram对象中某属性的下标指向位置
  gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, 0, 0);  // 指定顶点数据格式
  gl.enableVertexAttribArray(a_Position); // 启用顶点属性数组

  gl.drawArrays(gl.LINE_LOOP, 0, 3);  // 绘制 3 个顶点的三角形
}

const drawLine = () => {
  const VSHADER_SOURCE = `
  attribute vec4 a_Position;
  void main() {
    gl_Position = a_Position;  // 直接使用传入的顶点位置
  }
  `;
  const FSHADER_SOURCE = `
  void main() {
    gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);  // 设置边框颜色为红色
  }
  `;
  const program = createProgram(VSHADER_SOURCE, FSHADER_SOURCE);
  gl.useProgram(program);
  gl.program = program;

  // 创建顶点数据 (二个三角形)
  const vertices = new Float32Array([
    0.0, 0.5,   // 顶点 1 (顶部)
    -0.5, -0.5,   // 顶点 2 (左下角)

    0.5, -0.5,   // 顶点 3 (右下角)
    0.0, 0.5,   // 顶点 5 (顶部)

    -0.5, -0.5,   // 顶点 2 (左下角)
    0.5, -0.5,   // 顶点 3 (右下角)
  ]);
  const vertexBuffer = gl.createBuffer(); // 初始化一个用于储存顶点数据或着色数据的WebGLBuffer对象
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer); // 给定的 WebGLBuffer 绑定到目标
  gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW); // 初始化了 Buffer 对象的数据存储区
  const a_Position = gl.getAttribLocation(program, 'a_Position'); //给定WebGLProgram对象中某属性的下标指向位置
  gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, 0, 0);  // 指定顶点数据格式
  gl.enableVertexAttribArray(a_Position); // 启用顶点属性数组
  gl.drawArrays(gl.LINES, 0, 6);  // 绘制 3 个顶点的三角形
}

const drawTriangleStrip = () => {
  const VSHADER_SOURCE = `
  attribute vec4 a_Position;
  void main() {
    gl_Position = a_Position;  // 直接使用传入的顶点位置
  }
  `;
  const FSHADER_SOURCE = `
  void main() {
    gl_FragColor = vec4(0.0, 1.0, 3.0, 1.0);  // 设置片元颜色为绿色
  }
  `;
  const program = createProgram(VSHADER_SOURCE, FSHADER_SOURCE);
  gl.useProgram(program);
  gl.program = program;

  const vertices = new Float32Array([
    -0.5, -0.5,   // 顶点 2 (左下角)
    0.5, -0.5,   // 顶点 3 (右下角)
    0.0, 0.5,   // 顶点 1 (顶部)
    1.0, 0.5, // 连接最近的两个点
  ]);

  const vertexBuffer = gl.createBuffer(); // 初始化一个用于储存顶点数据或着色数据的WebGLBuffer对象
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer); // 给定的 WebGLBuffer 绑定到目标
  gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW); // 初始化了 Buffer 对象的数据存储区

  const a_Position = gl.getAttribLocation(program, 'a_Position'); //给定WebGLProgram对象中某属性的下标指向位置
  gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, 0, 0);  // 指定顶点数据格式
  gl.enableVertexAttribArray(a_Position); // 启用顶点属性数组
  gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);  // 绘制 3 个顶点的三角形
}

const drawTriangleFan = () => {
  const VSHADER_SOURCE = `
  attribute vec4 a_Position;
  void main() {
    gl_Position = a_Position;  // 直接使用传入的顶点位置
  }
  `;
  const FSHADER_SOURCE = `
  void main() {
    gl_FragColor = vec4(0.0, 1.0, 0.0, 1.0);  // 设置片元颜色为绿色
  }
  `;
  const program = createProgram(VSHADER_SOURCE, FSHADER_SOURCE);
  gl.useProgram(program);
  gl.program = program;

  // 创建顶点数据 (二个三角形)
  const vertices = new Float32Array([
    0.0, 0.5,   // 顶点 1 (顶部) - 中心点
    -0.5, -0.5,   // 顶点 2 (左下角)
    0.5, -0.5,   // 顶点 3 (右下角)
    1.0, 0.5, //  默认第一个点是中心点，从中心点开始绘制多个三角形，连接每个新的顶点与中心点来形成三角形
  ]);

  // 创建缓冲区并绑定数据
  const vertexBuffer = gl.createBuffer(); // 初始化一个用于储存顶点数据或着色数据的WebGLBuffer对象
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer); // 给定的 WebGLBuffer 绑定到目标
  gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW); // 初始化了 Buffer 对象的数据存储区

  // 获取顶点着色器中的属性位置
  const a_Position = gl.getAttribLocation(program, 'a_Position'); //给定WebGLProgram对象中某属性的下标指向位置
  gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, 0, 0);  // 指定顶点数据格式
  gl.enableVertexAttribArray(a_Position); // 启用顶点属性数组

  // 绘制三角形
  gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);  // 绘制 3 个顶点的三角形
}

const drawTriangle = () => {
  const VSHADER_SOURCE = `
  attribute vec4 a_Position;
  void main() {
    gl_Position = a_Position;  // 直接使用传入的顶点位置
  }
  `;
  const FSHADER_SOURCE = `
  void main() {
    gl_FragColor = vec4(0.0, 1.0, 0.0, 1.0);  // 设置片元颜色为绿色
  }
  `;
  const program = createProgram(VSHADER_SOURCE, FSHADER_SOURCE);
  gl.useProgram(program);
  gl.program = program;

  // 创建顶点数据 (二个三角形)
  const vertices = new Float32Array([
    0.0, 0.5,   // 顶点 1 (顶部)
    -0.5, -0.5,   // 顶点 2 (左下角)
    0.5, -0.5,    // 顶点 3 (右下角)

    1.0, 0.5,
    0.0, 0.5,
    0.5, -0.5,
  ]);

  // 创建缓冲区并绑定数据
  const vertexBuffer = gl.createBuffer(); // 初始化一个用于储存顶点数据或着色数据的WebGLBuffer对象
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer); // 给定的 WebGLBuffer 绑定到目标
  gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW); // 初始化了 Buffer 对象的数据存储区

  // 获取顶点着色器中的属性位置
  const a_Position = gl.getAttribLocation(program, 'a_Position'); //给定WebGLProgram对象中某属性的下标指向位置
  gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, 0, 0);  // 指定顶点数据格式
  gl.enableVertexAttribArray(a_Position); // 启用顶点属性数组

  // 绘制三角形
  gl.drawArrays(gl.TRIANGLES, 0, 6);  // 绘制 6 个顶点的三角形
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
  console.log(compiled)
  if (!compiled) {
    var error = gl.getShaderInfoLog(shader);
    console.log('编译着色器失败: ' + error);
    gl.deleteShader(shader);
    return null;
  }
  return shader
}

</script>


<style lang="scss" scoped>
.helloWebgl-wrap {
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
