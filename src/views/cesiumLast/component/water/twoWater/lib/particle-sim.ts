const SCREEN_PX_PER_MPS = 0.4;
export class ParticleSim {
  gl: WebGL2RenderingContext;
  canvas: HTMLCanvasElement;
  W: number;
  H: number;
  fieldW = 0;
  fieldH = 0;
  domainX = 0; domainY = 0; domainW = 1; domainH = 1;
  posDim: number;
  count: number;
  notes: string[] = [];
  canFilterFloat: boolean;
  private fieldU0!: WebGLTexture;
  private fieldU1!: WebGLTexture;
  private fieldV0!: WebGLTexture;
  private fieldV1!: WebGLTexture;
  private posA!: WebGLTexture;
  private posB!: WebGLTexture;
  private posFBO!: WebGLFramebuffer;
  private posRead = 0;
  private seedTex!: WebGLTexture;
  private seedDim = 0;
  private seedUV: Float32Array = new Float32Array(0);
  private flowCells: Uint32Array = new Uint32Array(0);
  private fenceTris: Float32Array = new Float32Array(0);
  private fenceAreas: Float32Array = new Float32Array(0);
  fenceCount = 0;
  private triTexA!: WebGLTexture;   
  private triTexB!: WebGLTexture;   
  private triTexArea!: WebGLTexture; 
  private triW = 0;                 
  private fenceLoaded = false;
  culledCount = 0;
  culledTotal = 0;
  culledViewUV: Float32Array = new Float32Array(0);
  private quadVAO!: WebGLVertexArrayObject;
  private pointVAO!: WebGLVertexArrayObject;
  private progAdvect!: WebGLProgram;
  private progFade!: WebGLProgram;
  private progPoint!: WebGLProgram;
  blend = 0;
  speedMax = 1;
  minSpeed = 0.001;
  advect = 4.0;
  life = 6;
  dropRate = 0.02;
  jitterPx = 0.3;
  t = 0;
  cellsize = 5;
  fade = 0.985;
  brightness = 0.05;
  pointSize = 1.0;
  blendMode: "add" | "alpha" | "normal" = "normal";
  constructor(W: number, H: number, particleCount: number) {
    this.W = W;
    this.H = H;
    const canvas = document.createElement("canvas");
    canvas.width = W;
    canvas.height = H;
    this.canvas = canvas;
    const gl = canvas.getContext("webgl2", {
      preserveDrawingBuffer: true,
      alpha: true,
      premultipliedAlpha: false,
      antialias: false,
    });
    if (!gl) throw new Error("WebGL2 unavailable");
    this.gl = gl;
    if (!gl.getExtension("EXT_color_buffer_float")) throw new Error("缺少 EXT_color_buffer_float, 无法渲染到浮点纹理");
    this.canFilterFloat = !!gl.getExtension("OES_texture_float_linear");
    if (!this.canFilterFloat) this.notes.push("无 OES_texture_float_linear, 场采样降级为 NEAREST(可能轻微锯齿)");
    const d = Math.round(Math.sqrt(particleCount));
    this.posDim = d;
    this.count = d * d;
    this.seedDim = Math.max(1, d);
    this.init();
    this.setField(W, H, 0, 0, 1, 1);
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.posFBO);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.posA, 0);
    if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) throw new Error("浮点帧缓冲不完整");
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  }
  private compile(type: number, src: string): WebGLShader {
    const gl = this.gl;
    const s = gl.createShader(type)!;
    gl.shaderSource(s, "#version 300 es\nprecision highp float;\n" + src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error("shader: " + gl.getShaderInfoLog(s));
    return s;
  }
  private program(vs: string, fs: string): WebGLProgram {
    const gl = this.gl;
    const p = gl.createProgram()!;
    gl.attachShader(p, this.compile(gl.VERTEX_SHADER, vs));
    gl.attachShader(p, this.compile(gl.FRAGMENT_SHADER, fs));
    gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error("link: " + gl.getProgramInfoLog(p));
    return p;
  }
  private init() {
    const gl = this.gl;
    this.seedTex = gl.createTexture()!;
    gl.bindTexture(gl.TEXTURE_2D, this.seedTex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA32F, this.seedDim, this.seedDim, 0, gl.RGBA, gl.FLOAT, new Float32Array(this.seedDim * this.seedDim * 4));
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    const mkPos = (data?: Float32Array) => {
      const t = gl.createTexture()!;
      gl.bindTexture(gl.TEXTURE_2D, t);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA32F, this.posDim, this.posDim, 0, gl.RGBA, gl.FLOAT, data ?? null);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      return t;
    };
    this.posA = mkPos();
    this.posB = mkPos();
    this.posFBO = gl.createFramebuffer()!;
    this.quadVAO = gl.createVertexArray()!;
    gl.bindVertexArray(this.quadVAO);
    const qb = gl.createBuffer()!;
    gl.bindBuffer(gl.ARRAY_BUFFER, qb);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([0, 0, 1, 0, 0, 1, 1, 1]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    gl.bindVertexArray(null);
    this.pointVAO = gl.createVertexArray()!;
    this.progAdvect = this.program(
      `in vec2 a_uv; out vec2 v_uv; void main(){ v_uv=a_uv; gl_Position=vec4(a_uv*2.0-1.0,0.0,1.0); }`,
      `in vec2 v_uv; out vec4 outColor;
       uniform sampler2D u_pos, u_seed, u_u0,u_u1,u_v0,u_v1, u_triA, u_triB, u_triArea;
       uniform float u_blend,u_advPerFrame,u_life,u_dropRate,u_jitterPx,u_dt,u_t,u_useFence,u_triTotal;
       uniform int u_triCount;
       uniform vec2 u_domainXY, u_domainWH, u_canvasWH;
       float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453123); }
       // fence 区域重生: 面积加权二分前缀和定位三角形 → 三角形内均匀点(barycentric sqrt),
       // 顶点已在 CPU 侧裁剪成视口 UV → 直接产出视口 UV 重生点. 随 u_t 每帧变化 → 不同重生点.
       vec2 fenceReseed(vec2 sv){
         float r = hash(sv + vec2(u_t, 0.37)) * u_triTotal;
         int lo = 0, hi = u_triCount - 1;
         while(lo < hi){
           int mid = (lo + hi) >> 1;
           if(texelFetch(u_triArea, ivec2(mid, 0), 0).r >= r) hi = mid; else lo = mid + 1;
         }
         vec2 A = texelFetch(u_triA, ivec2(lo, 0), 0).xy;
         vec2 B = texelFetch(u_triA, ivec2(lo, 0), 0).zw;
         vec2 C = texelFetch(u_triB, ivec2(lo, 0), 0).xy;
         float s = sqrt(hash(sv + vec2(u_t, 0.71)));
         float tt = hash(sv + vec2(0.83, u_t));
         return (1.0 - s) * A + s * (1.0 - tt) * B + s * tt * C;
       }
       void main(){
         vec4 cur = texture(u_pos, v_uv); vec2 pos = cur.xy; float age = cur.z;
         vec2 fuv = u_domainXY + pos * u_domainWH;   // 视口 UV -> 全场 UV 采样流场
         float u = mix(texture(u_u0,fuv).r, texture(u_u1,fuv).r, u_blend);
         float v = mix(texture(u_v0,fuv).r, texture(u_v1,fuv).r, u_blend);
         float speed = length(vec2(u,v));
         // 屏幕速度恒定: 位移 = 流场(m/s) × 每帧像素数 ×(dt/1/60 归一) / 画布尺寸 →
         // 屏幕 px/秒 与缩放、帧率无关. 加 ±u_jitterPx/帧 小抖动(随 u_t 每帧变化),
         // 防粒子停在 0 流速/干涸单元死锁(参考实现).
         vec2 jit = (vec2(hash(v_uv + vec2(u_t,0.0)), hash(v_uv + vec2(0.0,u_t))) - 0.5) * u_jitterPx;
         pos += ((vec2(u, v) * u_advPerFrame) + jit) / u_canvasWH * (u_dt * 60.0);
         age += u_dt;
         // droprate: 流速低于 per-particle 阈值(0.5~1.5×u_dropRate)即回收重生 → 慢速/边缘粒子不卡住.
         // 阈值随粒子随机数 w 抖动, 避免整齐的"减速墙"; w 在重生时用 texel 哈希重roll(稳定 per-particle).
         float thr = u_dropRate * (0.5 + cur.w);
         if(pos.x<0.0||pos.x>1.0||pos.y<0.0||pos.y>1.0 || speed < thr || age > u_life){
           // 有 union fence(子集非空)→ GPU 采样三角形重生; 否则回退 u_seed 播种
           if(u_useFence > 0.5 && u_triCount > 0) pos = fenceReseed(v_uv);
           else pos = texture(u_seed, v_uv).xy;
           // 寿命偏移随机化: 每粒子寿命 = [0,u_life] 均匀随机(per-texel 稳定哈希).
           // 若归零, 所有重生粒子共用同一时钟 → 同一时刻全体越龄 → 整片同步变暗;
           // 带随机偏移后死亡时刻均匀铺开(稳态每帧 ≈ count/life), 不同步; 寿命兜底仍在 → 不丢粒子.
           age = hash(v_uv + vec2(0.5)) * u_life; cur.w = hash(v_uv + vec2(0.3));
         }
         outColor = vec4(pos, age, cur.w);
       }`
    );
    this.progFade = this.program(
      `in vec2 a_uv; out vec2 v_uv; void main(){ v_uv=a_uv; gl_Position=vec4(a_uv*2.0-1.0,0.0,1.0); }`,
      `out vec4 outColor; uniform float u_a; void main(){ outColor = vec4(0.0,0.0,0.0,u_a); }`
    );
    this.progPoint = this.program(
      `uniform sampler2D u_pos; uniform vec2 u_posDim; uniform sampler2D u_u0,u_u1,u_v0,u_v1;
       uniform float u_blend, u_pointSize, u_minSpeed; uniform vec2 u_domainXY, u_domainWH; out float v_speed;
       void main(){
         int idx = gl_VertexID;
         ivec2 tc = ivec2(idx % int(u_posDim.x), idx / int(u_posDim.x));
         vec4 cur = texelFetch(u_pos, tc, 0); vec2 pos = cur.xy;
         vec2 fuv = u_domainXY + pos * u_domainWH;
         float u = mix(texture(u_u0,fuv).r, texture(u_u1,fuv).r, u_blend);
         float v = mix(texture(u_v0,fuv).r, texture(u_v1,fuv).r, u_blend);
         v_speed = length(vec2(u,v));
         if (v_speed < u_minSpeed) v_speed = 0.0;  // <0.001 视为 0(幽灵消隐, 不渲染)
         gl_Position = vec4(pos.x*2.0-1.0, pos.y*2.0-1.0, 0.0, 1.0);
         gl_PointSize = u_pointSize;
       }`,
      `in float v_speed; out vec4 outColor; uniform float u_speedMax, u_brightness;
       vec3 cmap(float k){ vec3 c0=vec3(0.0,0.30,0.65),c1=vec3(0.0,0.70,0.90),c2=vec3(0.20,0.85,0.45),
         c3=vec3(0.95,0.85,0.20),c4=vec3(0.92,0.20,0.15); k=clamp(k,0.0,1.0);
         if(k<0.25) return mix(c0,c1,k/0.25); else if(k<0.5) return mix(c1,c2,(k-0.25)/0.25);
         else if(k<0.75) return mix(c2,c3,(k-0.5)/0.25); else return mix(c3,c4,(k-0.75)/0.25); }
       void main(){
         vec2 pc = gl_PointCoord-0.5; if(dot(pc,pc)>0.25) discard;
         float k = clamp(v_speed/max(u_speedMax,1e-3),0.0,1.0);
         // 慢速流动也要可见(1%→8% 之间线性显现)
         float a = smoothstep(0.01,0.08,k);
         // 覆盖式(参考实现): 点以完整颜色+速度软透明度盖写, 不累积亮度 →
         // 拖尾亮度只由 fade 衰减决定, 缩放不会让亮度总量摊薄变透明; u_brightness 是全局颜色缩放
         outColor = vec4(cmap(k) * a * u_brightness, a);
       }`
    );
  }
  setField(fw: number, fh: number, x0: number, y0: number, x1: number, y1: number) {
    const gl = this.gl;
    if (fw !== this.fieldW || fh !== this.fieldH) {
      const mkField = () => {
        const t = gl.createTexture()!;
        gl.bindTexture(gl.TEXTURE_2D, t);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.R32F, fw, fh, 0, gl.RED, gl.FLOAT, new Float32Array(fw * fh));
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, this.canFilterFloat ? gl.LINEAR : gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, this.canFilterFloat ? gl.LINEAR : gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        return t;
      };
      this.fieldU0 = mkField(); this.fieldU1 = mkField();
      this.fieldV0 = mkField(); this.fieldV1 = mkField();
      this.fieldW = fw; this.fieldH = fh;
    }
    this.domainX = x0; this.domainY = y0;
    this.domainW = Math.max(x1 - x0, 1e-4);
    this.domainH = Math.max(y1 - y0, 1e-4);
  }
  setFenceTriangles(tris: Float32Array) {
    const gl = this.gl;
    this.fenceTris = tris;
    this.fenceCount = tris.length / 6;
    this.fenceAreas = new Float32Array(this.fenceCount);
    for (let i = 0; i < this.fenceCount; i++) {
      const ax = tris[i * 6], ay = tris[i * 6 + 1], bx = tris[i * 6 + 2], by = tris[i * 6 + 3];
      const cx = tris[i * 6 + 4], cy = tris[i * 6 + 5];
      this.fenceAreas[i] = Math.abs((bx - ax) * (cy - ay) - (cx - ax) * (by - ay)) * 0.5;
    }
    this.triW = Math.max(1, Math.ceil(this.fenceCount / 4) * 4);
    const mk = (internal: number, fmt: number) => {
      const t = gl.createTexture()!;
      gl.bindTexture(gl.TEXTURE_2D, t);
      gl.texImage2D(gl.TEXTURE_2D, 0, internal, this.triW, 1, 0, fmt, gl.FLOAT, null);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      return t;
    };
    this.triTexA = mk(gl.RGBA32F, gl.RGBA);
    this.triTexB = mk(gl.RGBA32F, gl.RGBA);
    this.triTexArea = mk(gl.R32F, gl.RED);
    this.fenceLoaded = true;
    this.culledCount = 0;
    this.culledTotal = 0;
  }
  cullFence(): number {
    const gl = this.gl;
    if (!this.fenceLoaded) return 0;
    const dx = this.domainX, dy = this.domainY, dw = this.domainW, dh = this.domainH;
    const x0 = dx, x1 = dx + dw, y0 = dy, y1 = dy + dh;
    const tris = this.fenceTris, areas = this.fenceAreas, n = this.fenceCount;
    const keep: number[] = [];
    for (let i = 0; i < n; i++) {
      const ax = tris[i * 6], ay = tris[i * 6 + 1], bx = tris[i * 6 + 2], by = tris[i * 6 + 3];
      const cx = tris[i * 6 + 4], cy = tris[i * 6 + 5];
      const minx = Math.min(ax, bx, cx), maxx = Math.max(ax, bx, cx);
      const miny = Math.min(ay, by, cy), maxy = Math.max(ay, by, cy);
      if (minx <= x1 && maxx >= x0 && miny <= y1 && maxy >= y0) keep.push(i);
    }
    const k = keep.length;
    this.culledCount = k;
    this.culledTotal = 0;
    if (k === 0) { this.culledViewUV = new Float32Array(0); return 0; } 
    const va = new Float32Array(k * 4), vb = new Float32Array(k * 4), pref = new Float32Array(k);
    const cullUV = new Float32Array(k * 6);
    for (let j = 0; j < k; j++) {
      const i = keep[j];
      const u0 = (tris[i * 6] - dx) / dw, v0 = (tris[i * 6 + 1] - dy) / dh;
      const u1 = (tris[i * 6 + 2] - dx) / dw, v1 = (tris[i * 6 + 3] - dy) / dh;
      const u2 = (tris[i * 6 + 4] - dx) / dw, v2 = (tris[i * 6 + 5] - dy) / dh;
      va[j * 4 + 0] = u0; va[j * 4 + 1] = v0; va[j * 4 + 2] = u1; va[j * 4 + 3] = v1;
      vb[j * 4 + 0] = u2; vb[j * 4 + 1] = v2;
      cullUV[j * 6 + 0] = u0; cullUV[j * 6 + 1] = v0;
      cullUV[j * 6 + 2] = u1; cullUV[j * 6 + 3] = v1;
      cullUV[j * 6 + 4] = u2; cullUV[j * 6 + 5] = v2;
      this.culledTotal += areas[i];
      pref[j] = this.culledTotal;
    }
    this.culledViewUV = cullUV;
    gl.bindTexture(gl.TEXTURE_2D, this.triTexA);
    gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, k, 1, gl.RGBA, gl.FLOAT, va);
    gl.bindTexture(gl.TEXTURE_2D, this.triTexB);
    gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, k, 1, gl.RGBA, gl.FLOAT, vb);
    gl.bindTexture(gl.TEXTURE_2D, this.triTexArea);
    gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, k, 1, gl.RED, gl.FLOAT, pref);
    return k;
  }
  resize(w: number, h: number) {
    this.W = Math.max(1, Math.round(w));
    this.H = Math.max(1, Math.round(h));
    this.canvas.width = this.W;
    this.canvas.height = this.H;
  }
  uploadField(which: "u0" | "u1" | "v0" | "v1", data: Float32Array) {
    const gl = this.gl;
    const map = { u0: this.fieldU0, u1: this.fieldU1, v0: this.fieldV0, v1: this.fieldV1 } as const;
    gl.bindTexture(gl.TEXTURE_2D, map[which]);
    gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, this.fieldW, this.fieldH, gl.RED, gl.FLOAT, data);
  }
  setSeed(uv: Float32Array, reseedNow = true) {
    if (!uv.length) return;
    this.seedUV = uv;
    const gl = this.gl;
    const n = this.seedDim, pairs = uv.length / 2;
    const data = new Float32Array(n * n * 4);
    for (let i = 0; i < n * n; i++) {
      const k = (Math.random() * pairs) | 0;
      data[i * 4 + 0] = uv[k * 2];
      data[i * 4 + 1] = uv[k * 2 + 1];
      data[i * 4 + 2] = reseedNow ? Math.random() * this.life : Math.random();
      data[i * 4 + 3] = reseedNow ? Math.random() : 0;
    }
    gl.bindTexture(gl.TEXTURE_2D, this.seedTex);
    gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, n, n, gl.RGBA, gl.FLOAT, data);
    if (reseedNow) {
      gl.bindTexture(gl.TEXTURE_2D, this.posA);
      gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, this.posDim, this.posDim, gl.RGBA, gl.FLOAT, data);
      gl.bindTexture(gl.TEXTURE_2D, this.posB);
      gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, this.posDim, this.posDim, gl.RGBA, gl.FLOAT, data);
      this.posRead = 0;
    }
  }
  setFlowCells(cells: Uint32Array, reseedNow = true) {
    if (!cells.length) return;
    this.flowCells = cells;
    const W = this.fieldW, H = this.fieldH;
    const uv = new Float32Array(cells.length * 2);
    for (let i = 0; i < cells.length; i++) {
      const c = cells[i];
      uv[i * 2 + 0] = (c % W + Math.random()) / W;
      uv[i * 2 + 1] = (Math.floor(c / W) + Math.random()) / H;
    }
    this.setSeed(uv, reseedNow);
  }
  reseed() {
    if (!this.seedUV.length) return;
    const gl = this.gl;
    const data = new Float32Array(this.count * 4);
    const pairs = this.seedUV.length / 2;
    for (let i = 0; i < this.count; i++) {
      const k = (Math.random() * pairs) | 0;
      data[i * 4 + 0] = this.seedUV[k * 2];
      data[i * 4 + 1] = this.seedUV[k * 2 + 1];
      data[i * 4 + 2] = Math.random() * this.life;
      data[i * 4 + 3] = Math.random();
    }
    gl.bindTexture(gl.TEXTURE_2D, this.posA);
    gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, this.posDim, this.posDim, gl.RGBA, gl.FLOAT, data);
    gl.bindTexture(gl.TEXTURE_2D, this.posB);
    gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, this.posDim, this.posDim, gl.RGBA, gl.FLOAT, data);
    this.posRead = 0;
  }
  destroy() {
    this.gl.getExtension("WEBGL_lose_context")?.loseContext();
    this.canvas.remove();
  }
  step(dt = 1 / 60) {
    const gl = this.gl;
    this.t = (this.t + dt) % 1000.0;
    const read = this.posRead === 0 ? this.posA : this.posB;
    const write = this.posRead === 0 ? this.posB : this.posA;
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.posFBO);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, write, 0);
    gl.viewport(0, 0, this.posDim, this.posDim);
    gl.disable(gl.BLEND);
    gl.useProgram(this.progAdvect);
    gl.bindVertexArray(this.quadVAO);
    this.bindTex(this.progAdvect, "u_pos", read, 0);
    this.bindTex(this.progAdvect, "u_seed", this.seedTex, 1);
    this.bindTex(this.progAdvect, "u_u0", this.fieldU0, 2);
    this.bindTex(this.progAdvect, "u_u1", this.fieldU1, 3);
    this.bindTex(this.progAdvect, "u_v0", this.fieldV0, 4);
    this.bindTex(this.progAdvect, "u_v1", this.fieldV1, 5);
    if (this.fenceLoaded) {
      this.bindTex(this.progAdvect, "u_triA", this.triTexA, 6);
      this.bindTex(this.progAdvect, "u_triB", this.triTexB, 7);
      this.bindTex(this.progAdvect, "u_triArea", this.triTexArea, 8);
      this.uf(this.progAdvect, "u_useFence", 1);
      this.ui(this.progAdvect, "u_triCount", this.culledCount);
      this.uf(this.progAdvect, "u_triTotal", this.culledTotal);
    } else {
      this.uf(this.progAdvect, "u_useFence", 0);
      this.ui(this.progAdvect, "u_triCount", 0);
      this.uf(this.progAdvect, "u_triTotal", 0);
    }
    this.uf(this.progAdvect, "u_blend", this.blend);
    this.uf(this.progAdvect, "u_advPerFrame", this.advect * SCREEN_PX_PER_MPS);
    this.uf(this.progAdvect, "u_life", this.life);
    this.uf(this.progAdvect, "u_dropRate", this.dropRate);
    this.uf(this.progAdvect, "u_jitterPx", this.jitterPx);
    this.uf(this.progAdvect, "u_dt", dt);
    this.uf(this.progAdvect, "u_t", this.t);
    this.uv2(this.progAdvect, "u_domainXY", this.domainX, this.domainY);
    this.uv2(this.progAdvect, "u_domainWH", this.domainW, this.domainH);
    this.uv2(this.progAdvect, "u_canvasWH", this.W, this.H);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    this.posRead = 1 - this.posRead;
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, this.W, this.H);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.useProgram(this.progFade);
    gl.bindVertexArray(this.quadVAO);
    this.uf(this.progFade, "u_a", 1.0 - this.fade);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    const latest = this.posRead === 0 ? this.posA : this.posB;
    switch (this.blendMode) {
      case "add": gl.blendFunc(gl.ONE, gl.ONE); break;
      case "alpha": gl.blendFunc(gl.SRC_ALPHA, gl.ONE); break;
      case "normal": gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA); break;
    }
    gl.useProgram(this.progPoint);
    gl.bindVertexArray(this.pointVAO);
    this.bindTex(this.progPoint, "u_pos", latest, 0);
    this.bindTex(this.progPoint, "u_u0", this.fieldU0, 1);
    this.bindTex(this.progPoint, "u_u1", this.fieldU1, 2);
    this.bindTex(this.progPoint, "u_v0", this.fieldV0, 3);
    this.bindTex(this.progPoint, "u_v1", this.fieldV1, 4);
    this.uv2(this.progPoint, "u_posDim", this.posDim, this.posDim);
    this.uf(this.progPoint, "u_blend", this.blend);
    this.uf(this.progPoint, "u_minSpeed", this.minSpeed);
    this.uf(this.progPoint, "u_speedMax", this.speedMax);
    this.uf(this.progPoint, "u_pointSize", this.pointSize);
    this.uf(this.progPoint, "u_brightness", this.brightness);
    this.uv2(this.progPoint, "u_domainXY", this.domainX, this.domainY);
    this.uv2(this.progPoint, "u_domainWH", this.domainW, this.domainH);
    gl.drawArrays(gl.POINTS, 0, this.count);
    gl.disable(gl.BLEND);
    gl.bindVertexArray(null);
  }
  fadeOnly() {
    const gl = this.gl;
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, this.W, this.H);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.useProgram(this.progFade);
    gl.bindVertexArray(this.quadVAO);
    this.uf(this.progFade, "u_a", 1.0 - this.fade);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    gl.disable(gl.BLEND);
    gl.bindVertexArray(null);
  }
  private loc(p: WebGLProgram, n: string) { return this.gl.getUniformLocation(p, n); }
  private uf(p: WebGLProgram, n: string, v: number) { const l = this.loc(p, n); if (l) this.gl.uniform1f(l, v); }
  private ui(p: WebGLProgram, n: string, v: number) { const l = this.loc(p, n); if (l) this.gl.uniform1i(l, v); }
  private uv2(p: WebGLProgram, n: string, x: number, y: number) { const l = this.loc(p, n); if (l) this.gl.uniform2f(l, x, y); }
  private bindTex(p: WebGLProgram, name: string, tex: WebGLTexture, unit: number) {
    const gl = this.gl;
    gl.activeTexture(gl.TEXTURE0 + unit);
    gl.bindTexture(gl.TEXTURE_2D, tex);
    const l = gl.getUniformLocation(p, name);
    if (l) gl.uniform1i(l, unit);
  }
}
