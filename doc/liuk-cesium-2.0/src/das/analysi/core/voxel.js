//体素对象,用于阴影分析
import * as Cesium from "cesium";
import { DasClass } from "../../core/DasClass";
export class voxel extends DasClass {
  constructor(options, oldparam) {
    super(options);
    if (!Cesium.defined(options.viewer)) {
      throw new Cesium.DeveloperError("options.viewer is required.");
    }
    if (!Cesium.defined(options.bound)) {
      throw new Cesium.DeveloperError("options.bound is required.");
    }
    if (!Cesium.defined(options.matrix)) {
      throw new Cesium.DeveloperError("options.matrix is required.");
    }
    this.options = options;
    this._positions = options.positions;
    this._viewer = options.viewer;
    this._bound = options.bound;
    this._matrix = options.matrix;
    this._type = Cesium.defaultValue(options.type, "point");
    this._radius = Cesium.defaultValue(options.radius, 10);
    this._show = Cesium.defaultValue(options.show, true);
    this._showAnimate = Cesium.defaultValue(options.showAnimate, true);
    this._width = Cesium.defaultValue(options.width, 2);
    this._depth = Cesium.defaultValue(options.depth, 2);
    this._height = Cesium.defaultValue(options.height, 2);
    this._extrudeHeight = Cesium.defaultValue(options.extrudeHeight, 20);
    this._spacing = Cesium.defaultValue(options.spacing, 0);
    this._widthNumber = Cesium.defaultValue(options.widthNumber, null);
    this._heightNumber = Cesium.defaultValue(options.heightNumber, null);
    this._depthNumber = Cesium.defaultValue(options.depthNumber, null);
    this._heightStep = Cesium.defaultValue(options.heightStep, 2);
    this._baseHeight = Cesium.defaultValue(options.baseHeight, 4);
    this._textureWidth = Cesium.defaultValue(options.textureWidth, 1024);
    this._textureHeight = Cesium.defaultValue(options.textureHidth, 1024);
    this._ijkHide = Cesium.defaultValue(options.ijkHide, []);
    this._ijk = Cesium.defaultValue(options.ijk, {
      i: new Cesium.Cartesian2(0, 1),
      j: new Cesium.Cartesian2(0, 1),
      k: new Cesium.Cartesian2(0, 1)
    });
    this._i = Cesium.defaultValue(this._ijk.i, new Cesium.Cartesian2(0, 1));
    this._j = Cesium.defaultValue(this._ijk.j, new Cesium.Cartesian2(0, 1));
    this._k = Cesium.defaultValue(this._ijk.k, new Cesium.Cartesian2(0, 1));
    this._customColor = Cesium.defaultValue(options.customColor, false);
    this._alpha = Cesium.defaultValue(options.alpha, false);
    this._filterValue = Cesium.defaultValue(options.filterValue, 0);
    this._plgfbo = Cesium.defaultValue(options.plgfbo, {});
    this._boundingSphere = Cesium.defaultValue(options.boundingSphere, new Cesium.Matrix4());
    this._alphaScale = Cesium.defaultValue(options.alphaScale, 1);
    this._export3DDataFile = Cesium.defaultValue(options.export3DDataFile, false);
    this.ppb2 = `uniform mat4  u_matrix;
                            uniform sampler2D u_image;
                            uniform vec4 u_max;
                            uniform bool u_show;
                            uniform float u_pointSize;
                            uniform vec3 u_IJK;
                            uniform bool u_fifterIJk;
                            uniform vec2 u_I;
                            uniform vec2 u_J;
                            uniform vec2 u_K;
                            attribute vec4 aPosition;
                            attribute vec4 a_color;
                            attribute vec4 a_range;
                            attribute vec3 a_normal;
                            attribute vec2 a_coord;
                            varying vec4 v_color;
                            varying vec4 v_positionEC;
                            varying vec4 v_range;
                            varying vec3 v_normalEC;
                            varying vec2 v_st;
                            uniform sampler2D u_polygon;
                            void main() 
                            {
                                if(u_show){
                                    vec2 st;
                                    st.x = (a_range.x/u_max.x);
                                    st.y = (a_range.y/u_max.y);
                                    vec2 vTexcoord = a_coord.xy;
                                    vec4 ijkshow = a_range;
                                    v_normalEC = czm_normal * a_normal;
                                    v_color = a_color;
                                    v_range = ijkshow;
                                    v_st = vTexcoord;
                                    //ijkshow.w != 1.0; //单个的默认不显示        
                                    if(u_fifterIJk){
                                        bool isVisible = true;
                                        if(u_I.x != -1.0 && u_I.y != -1.0){
                                            if(ijkshow.x < u_I.x || ijkshow.x > u_I.y){
                                                isVisible = false;
                                            }
                                        }
                                        if(u_J.x != -1.0 && u_J.y != -1.0){
                                            if(ijkshow.y < u_J.x || ijkshow.y > u_J.y){
                                                isVisible = false;
                                            }
                                        }
                                        if(u_K.x != -1.0 && u_K.y != -1.0){
                                            if(ijkshow.z < u_K.x || ijkshow.z > u_K.y){
                                                isVisible = false;
                                            }
                                        }
                                        // if(ijkshow.x != u_IJK.x && ijkshow.y != u_IJK.y && ijkshow.z != u_IJK.z){
                                        if(isVisible){
                                            gl_Position =  u_matrix *  aPosition;
                                            v_positionEC =   u_matrix *  aPosition;
                                        }
                                    }else{
                                        gl_Position =  u_matrix *  aPosition;
                                        v_positionEC =   u_matrix *  aPosition;
                                        // gl_Position = czm_depthClampFarPlane(czm_modelViewProjection * u_matrix * aPosition) ;
                                        // v_positionEC = (czm_modelView * u_matrix * aPosition);
                                    }
                                    #ifdef EXTRUDED_POINT 
                                        gl_PointSize = u_pointSize;//切换cube 和point 的时候需要注意
                                    #endif
                                }
                            } `;
    this.gpb2 = `#ifdef GL_EXT_frag_depth
                        #extension GL_EXT_frag_depth:enable
                        #endif
                        #ifdef GL_OES_standard_derivatives
                        #extension GL_OES_standard_derivatives:enable
                        #endif
                        uniform vec3 u_originalPosition;
                        uniform vec4 u_cellConfig;
                        varying vec4 v_color;
                        varying vec4 v_positionEC;
                        varying vec4 v_range;
                        varying vec2 v_st;
                        varying vec3 v_normalEC;
                        uniform bool u_customColor;
                        uniform sampler2D shadowMap_texture;
                        uniform sampler2D u_image;
                        uniform bool u_alphaState;
                        uniform float u_filterValue;
                        uniform float u_alphaScale;

                        float unpackDepth(const in vec4 rgba_depth) {
                            const vec4 bitShifts = vec4(1.0, 1.0 / 255.0, 1.0 / (255.0 * 255.0), 1.0 / (255.0 * 255.0 * 255.0));
                            float depth = dot(rgba_depth, bitShifts);
                            return depth;
                        }
                        void main()
                        {
                            float dist = distance(gl_PointCoord,vec2(0.5,0.5));
                            float shadowRate = unpackDepth(texture2D(shadowMap_texture,v_st));
                            vec4 color = v_color;
                            if(!u_customColor){
                                color = texture2D(u_image, vec2(clamp(shadowRate,0.0,1.0),0.5)); 
                            }
                            // #ifdef EXTRUDED_DATATEXTURE 
                            // color = texture2D(u_image, vec2(clamp(shadowRate,0.01,0.99),0.5)); 
                            // #endif
                            #ifdef EXTRUDED_POINT 
                            if(dist < 0.5 ){//此处需要处理
                            #endif  
                                vec3 positionToEyeEC = v_positionEC.xyz;
                                vec3 normalEC = normalize(-v_normalEC);
                            #ifdef FACE_FORWARD
                                normalEC = faceforward(normalEC, vec3(0.0, 0.0, 1.0), -normalEC);
                            #endif
                                czm_materialInput materialInput;
                                materialInput.normalEC = normalEC;
                                materialInput.positionToEyeEC = positionToEyeEC;
                                czm_material material = czm_getDefaultMaterial(materialInput);
                                material.diffuse = color.rgb;
                            #ifdef FLAT
                                gl_FragColor = vec4(material.diffuse + material.emission, material.alpha);
                                #else
                                gl_FragColor = czm_phong(normalize(positionToEyeEC), material, czm_lightDirectionEC);
                                #endif
                                if(u_alphaState){//是否开启alpha
                                    gl_FragColor.a = 1.0 - clamp(shadowRate,0.0,1.0);
                                    gl_FragColor.a *= u_alphaScale;
                                    gl_FragColor.a = clamp(gl_FragColor.a,0.0,1.0);
                                    if(gl_FragColor.a < u_filterValue){
                                        discard;
                                    }
                                    if(u_filterValue == 1.0){
                                        discard;
                                    }
                                }else{
                                    float filterValue = 1.0 - clamp(shadowRate,0.0,1.0);
                                    if( filterValue < u_filterValue){
                                        discard;
                                    }
                                    if( u_filterValue == 1.0){
                                        discard;
                                    }
                                }
                            #ifdef EXTRUDED_POINT
                            }else{
                                discard;
                            }
                            #endif   
 
                        }`;
    this.initParams();
  }

  initParams() {
    var that = this;
    this.lookatDirect = "leftFront";
    this.indexarray = new Uint16Array([
      0,
      1,
      2,
      0,
      2,
      3,
      4,
      5,
      6,
      4,
      6,
      7,
      8,
      9,
      10,
      8,
      10,
      11,
      12,
      13,
      14,
      12,
      14,
      15,
      16,
      17,
      18,
      16,
      18,
      19,
      20,
      21,
      22,
      20,
      22,
      23
    ]);
    this._modelMatrix = Cesium.Matrix4.clone(Cesium.Matrix4.IDENTITY);
    this.modelMatrix = new Cesium.Matrix4();
    this._height = this._depth = this._width;
    this._scene = this._viewer.scene;
    this.options.ijk ? (this._fifterIJk = true) : (this._fifterIJk = false);
    this.dataTexture = {};
    this._image = Cesium.buildModuleUrl("Assets/Images/colors1.png");
    this._coordPositions = [];
    this.getColor();
    this._scratchBS = new Cesium.BoundingSphere();
    this.originalPosition = this._positions[0];
    this.showIJK = new Cesium.Cartesian4(1, 1, 2, 1);
    this.boundX = this._bound.x;
    this.boundY = this._bound.y;
    this.boundW = this._bound.width;
    this.boundH = this._bound.height;
    var t = [1, 0, 0];
    var n = [-1, 0, 0];
    var i = [0, 1, 0];
    var r = [0, -1, 0];
    var o = [0, 0, 1];
    var a = [0, 0, -1];
    this.normals = [].concat(
      a,
      a,
      a,
      a,
      r,
      r,
      r,
      r,
      i,
      i,
      i,
      i,
      n,
      n,
      n,
      n,
      t,
      t,
      t,
      t,
      o,
      o,
      o,
      o
    );
    this.attributeLocations = {
      aPosition: 0,
      aColor: 1,
      a_range: 2,
      a_normal: 3,
      a_coord: 4,
      a_positionCenter: 5
    };
    this._isUpdate = false;
    this._computePositionFinish = false;
    this._hideArray = [];
    if (this._ijkHide.length > 0) {
      this._hideArray = this._ijkHide.map(function (t) {
        return t[0] + t[1] * that._widthStep + t[2] * (that._widthStep * that._depthStep);
      });
    }
    this._polygonTextureW = 256;
    this._polygonTextureH = 256;
    var timer = setInterval(function () {
      if (that._plgfbo._colorTexture) {
        clearInterval(timer);
        that._polygonPixel = that._viewer.scene.context.readPixels({
          x: 0,
          y: 0,
          width: that._polygonTextureW,
          height: that._polygonTextureH,
          framebuffer: that._plgfbo.framebuffer
        });
        if (that._type == "point") {
          that.computePointPositions();
        }
        if (that._type == "cube") {
          that.computeVoxelPositions();
        }
      }
    }, 30);
  }
  setTextureWidthHeight() {
    var e = 0;
    if (this._type == "point") {
      e = this._depthStep * this._widthStep * this._heightStep;
    } else {
      e = this._depthStep * this._widthStep * this._heightStep * 36;
    }
    for (var t = 1; e / Math.pow(256 * t, 2) > 1;) {
      t++;
    }
    this._textureWidth = 256 * t;
    this._textureHeight = 256 * t;
  }
  isPolygon(e) {
    var point = new Cesium.Cartesian2();
    point.x = (e.x - this.boundX) / this.boundW;
    point.y = (e.y - this.boundY) / this.boundH;
    var n = false;
    var i =
      parseInt(point.x * this._polygonTextureW) +
      parseInt(point.y * this._polygonTextureH) * this._polygonTextureW;
    return point.x >= 0 &&
      point.x <= 1 &&
      point.y >= 0 &&
      point.y <= 1 &&
      this._polygonPixel[4 * i + 4] > 0 &&
      (n = !0),
      this._export3DDataFile && (n = !0),
      n

  }
  computeVoxelPositions() {
    this._widthStep = Cesium.defaultValue(
      this._widthNumber,
      parseInt(this._bound.width / (this._width + this._spacing))
    );
    this._depthStep = Cesium.defaultValue(
      this._depthNumber,
      parseInt(this._bound.height / (this._depth + this._spacing))
    );
    this._heightStep = parseInt(this._extrudeHeight / (this._height + this._spacing));
    var _spacing = this._spacing;
    this.setTextureWidthHeight();
    var aPositionTypedArrayCube = null,
      aPositionCenterTypedArrayCube = null,
      aColorTypedArrayCube = null,
      rangeTypedArrayCube = null,
      indexTypedArrayCube = null,
      a_coordTypedArrayCube = null,
      aNormaltypedArrayCube = null;
    var Step = this._depthStep * this._widthStep * this._heightStep * 24;
    aPositionTypedArrayCube = Cesium.ComponentDatatype.createTypedArray(
      Cesium.ComponentDatatype.FLOAT,
      4 * Step
    );
    aPositionCenterTypedArrayCube = Cesium.ComponentDatatype.createTypedArray(
      Cesium.ComponentDatatype.FLOAT,
      4 * Step
    );
    aColorTypedArrayCube = Cesium.ComponentDatatype.createTypedArray(
      Cesium.ComponentDatatype.FLOAT,
      4 * Step
    );
    rangeTypedArrayCube = Cesium.ComponentDatatype.createTypedArray(
      Cesium.ComponentDatatype.FLOAT,
      4 * Step
    );
    aNormaltypedArrayCube = Cesium.ComponentDatatype.createTypedArray(
      Cesium.ComponentDatatype.FLOAT,
      3 * this.normals.length * this._depthStep * this._widthStep * this._heightStep
    );
    a_coordTypedArrayCube = Cesium.ComponentDatatype.createTypedArray(
      Cesium.ComponentDatatype.FLOAT,
      2 * Step
    );
    var StepSoc = 36 * this._depthStep * this._widthStep * this._heightStep;
    if (StepSoc >= Cesium.Math.SIXTY_FOUR_KILOBYTES) {
      indexTypedArrayCube = Cesium.ComponentDatatype.createTypedArray(
        Cesium.ComponentDatatype.UNSIGNED_INT,
        StepSoc
      );
    } else {
      indexTypedArrayCube = Cesium.ComponentDatatype.createTypedArray(
        Cesium.ComponentDatatype.UNSIGNED_SHORT,
        StepSoc
      );
    }

    // indexTypedArrayCube = StepSoc >= Cesium.Math.SIXTY_FOUR_KILOBYTES ? Cesium.ComponentDatatype.createTypedArray(Cesium.ComponentDatatype.UNSIGNED_INT, StepSoc) : Cesium.ComponentDatatype.createTypedArray(Cesium.ComponentDatatype.UNSIGNED_SHORT, StepSoc);
    var StepCartesian = new Cesium.Cartesian4(this._widthStep, this._depthStep, this._heightStep);
    var itemIndex = 0;
    this.maxDistance = this._width + _spacing;
    for (var heightStepIndex = 0; heightStepIndex < this._heightStep; heightStepIndex++)
      for (var heightSh = (this._height + _spacing) * heightStepIndex, depthStepIndex = 0; depthStepIndex < this._depthStep; depthStepIndex++)
        for (var depthSh = (this._depth + _spacing) * depthStepIndex, widthStepIndex = 0; widthStepIndex < this._widthStep; widthStepIndex++) {
          var Swidth = (this._width + _spacing) * widthStepIndex,
            y = this._hideArray.indexOf(itemIndex) < 0 ? 1 : 0,
            basePosition = new Cesium.Cartesian4(widthStepIndex, depthStepIndex, heightStepIndex, y),
            positionList = [];
          positionList[0] = new Cesium.Cartesian3(Swidth + this._width, depthSh, heightSh + this._height),
            positionList[1] = new Cesium.Cartesian3(Swidth, depthSh, heightSh + this._height),
            positionList[2] = new Cesium.Cartesian3(Swidth, depthSh, heightSh),
            positionList[3] = new Cesium.Cartesian3(Swidth + this._width, depthSh, heightSh),
            positionList[4] = new Cesium.Cartesian3(Swidth + this._width, depthSh + this._depth, heightSh),
            positionList[5] = new Cesium.Cartesian3(Swidth + this._width, depthSh + this._depth, heightSh + this._height),
            positionList[6] = new Cesium.Cartesian3(Swidth, depthSh + this._depth, heightSh + this._height),
            positionList[7] = new Cesium.Cartesian3(Swidth, depthSh + this._depth, heightSh);
          var w = Cesium.Cartesian3.midpoint(positionList[2], positionList[5], new Cesium.Cartesian3);
          if (this.isPolygon(w)) {
            for (var b = [positionList[7], positionList[4], positionList[3], positionList[2], positionList[2], positionList[3], positionList[0], positionList[1], positionList[4], positionList[7], positionList[6], positionList[5], positionList[7], positionList[2], positionList[1], positionList[6], positionList[3], positionList[4], positionList[5], positionList[0], positionList[1], positionList[0], positionList[5], positionList[6]], C = 0; C < b.length; C++) {
              var M = 4 * (itemIndex * b.length + C)
                , S = b[C]
                , T = S;
              aPositionTypedArrayCube[M] = T.x;
              aPositionTypedArrayCube[M + 1] = T.y;
              aPositionTypedArrayCube[M + 2] = T.z;
              aPositionTypedArrayCube[M + 3] = 1;
              aPositionCenterTypedArrayCube[M] = w.x;
              aPositionCenterTypedArrayCube[M + 1] = w.y;
              aPositionCenterTypedArrayCube[M + 2] = w.z;
              aPositionCenterTypedArrayCube[M + 3] = 1;
              rangeTypedArrayCube[M] = basePosition.x;
              rangeTypedArrayCube[M + 1] = basePosition.y;
              rangeTypedArrayCube[M + 2] = basePosition.z;
              rangeTypedArrayCube[M + 3] = basePosition.w;
              aColorTypedArrayCube[M] = basePosition.x / StepCartesian.x;
              aColorTypedArrayCube[M + 1] = basePosition.y / StepCartesian.y;
              aColorTypedArrayCube[M + 2] = 0;
              aColorTypedArrayCube[M + 3] = basePosition.x / StepCartesian.x;
              var E = 2 * (itemIndex * b.length + C);
              a_coordTypedArrayCube[E] =
                (itemIndex % this._textureWidth) / this._textureWidth +
                (1 / this._textureWidth) * 0.5;
              a_coordTypedArrayCube[E + 1] =
                parseInt(itemIndex / this._textureWidth) / this._textureHeight +
                (1 / this._textureWidth) * 0.5;
            }
            this._coordPositions[itemIndex] = w;
            for (var A = 0; A < this.indexarray.length; A++) {
              var itemA = itemIndex * this.indexarray.length + A;
              indexTypedArrayCube[itemA] = this.indexarray[A] + itemIndex * b.length;
            }
            for (var L = 0; L < this.normals.length; L++) {
              var itemL = itemIndex * this.normals.length + L;
              aNormaltypedArrayCube[itemL] = this.normals[L];
            }
            itemIndex++;
          }
        }
    this.aColorTypedArrayCube = aColorTypedArrayCube,
      this.aPositionTypedArrayCube = aPositionTypedArrayCube,
      this.aPositionCenterTypedArrayCube = aPositionCenterTypedArrayCube,
      this.rangeTypedArrayCube = rangeTypedArrayCube,
      this.indexTypedArrayCube = indexTypedArrayCube,
      this.aNormaltypedArrayCube = aNormaltypedArrayCube,
      this.a_coordTypedArrayCube = a_coordTypedArrayCube,
      this.updateCommand = true,
      this.cubesVao();
  }
  computePointPositions() {
    var spacing = this._spacing <= 0.1 ? 0.1 : this._spacing;
    this._widthStep = Cesium.defaultValue(this._widthNumber, parseInt(this._bound.width / spacing)),
      this._depthStep = Cesium.defaultValue(this._depthNumber, parseInt(this._bound.height / spacing)),
      this._heightStep = parseInt(this._extrudeHeight / spacing),
      this.maxDistance = spacing / 2,
      console.log(this._widthStep + ",this._widthStep", this._depthStep + ",this._depthStep", this._heightStep + ",this._heightStep"),
      this.setTextureWidthHeight();
    var t = null
      , n = null
      , i = null
      , r = null
      , o = null
      , a = null
      , s = null
      , l = this._depthStep * this._widthStep * this._heightStep;
    t = Cesium.ComponentDatatype.createTypedArray(Cesium.ComponentDatatype.FLOAT, 4 * l),
      n = Cesium.ComponentDatatype.createTypedArray(Cesium.ComponentDatatype.FLOAT, 4 * l),
      i = Cesium.ComponentDatatype.createTypedArray(Cesium.ComponentDatatype.FLOAT, 4 * l),
      r = Cesium.ComponentDatatype.createTypedArray(Cesium.ComponentDatatype.FLOAT, 4 * l),
      s = Cesium.ComponentDatatype.createTypedArray(Cesium.ComponentDatatype.FLOAT, 3 * l),
      a = Cesium.ComponentDatatype.createTypedArray(Cesium.ComponentDatatype.FLOAT, 2 * l);
    var u = this._depthStep * this._widthStep * this._heightStep;
    o = u >= Cesium.Math.SIXTY_FOUR_KILOBYTES ? Cesium.ComponentDatatype.createTypedArray(Cesium.ComponentDatatype.UNSIGNED_INT, u) : Cesium.ComponentDatatype.createTypedArray(Cesium.ComponentDatatype.UNSIGNED_SHORT, u);
    for (var h = new Cesium.Cartesian4(this._widthStep, this._depthStep, this._heightStep), c = 0, f = !0, p = 0; p < this._heightStep; p++)
      for (var m = 0; m < this._depthStep; m++)
        for (var g = 0; g < this._widthStep; g++) {
          var v = this._hideArray.indexOf(c) < 0 ? 1 : 0
            , y = new Cesium.Cartesian4(g, m, p, v)
            , _ = new Cesium.Cartesian3(spacing * g, spacing * m, spacing * p);
          if (this.isPolygon(_)) {
            f && (f = !1),
              a[2 * c] = (0,
                Math.fround)(c % this._textureWidth / this._textureWidth + 1 / this._textureWidth * .5),
              a[2 * c + 1] = (0,
                Math.fround)(parseInt(c / this._textureWidth) / this._textureHeight + 1 / this._textureHeight * .5);
            var x = 4 * c;
            t[x] = (0,
              Math.fround)(_.x),
              t[x + 1] = (0,
                Math.fround)(_.y),
              t[x + 2] = (0,
                Math.fround)(_.z),
              t[x + 3] = 1,
              n[x] = (0,
                Math.fround)(_.x),
              n[x + 1] = (0,
                Math.fround)(_.y),
              n[x + 2] = (0,
                Math.fround)(_.z),
              n[x + 3] = 1,
              this._coordPositions[c] = _,
              r[x] = y.x,
              r[x + 1] = y.y,
              r[x + 2] = y.z,
              r[x + 3] = y.w,
              i[x] = y.x / h.x,
              i[x + 1] = y.y / h.y,
              i[x + 2] = 0,
              i[x + 3] = y.x / h.x,
              o[c] = c,
              s[c] = this.normals[0],
              c++
          }
        }
    this.aColorTypedArrayPoint = i;
    this.aPositionTypedArrayPoint = t;
    this.aPositionCenterTypedArrayPoint = n;
    this.rangeTypedArrayPoint = r;
    this.indexTypedArrayPoint = o;
    this.aNormaltypedArrayPoint = s;
    this.a_coordTypedArrayPoint = a;
    this.updateCommand = true;
    this.pointsVao();


  }
  transparentSort() {
    var e, t, n, i;
    this.currentLookatDirect = null;
    var r = new Cesium.Cartesian3(this.boundX + this.boundW / 2, this.boundY + this.boundH / 2, 0)
      , n = new Cesium.Cartesian3(this.boundX, this.boundY + this.boundH / 2, 0)
      , e = new Cesium.Cartesian3(this.boundX + this.boundW, this.boundY + this.boundH / 2, 0)
      , i = new Cesium.Cartesian3(this.boundX + this.boundW / 2, this.boundY, 0)
      , t = new Cesium.Cartesian3(this.boundX + this.boundW / 2, this.boundY + this.boundH, 0)
      , o = Cesium.Cartesian3.subtract(e, n, new Cesium.Cartesian3());
    o = Cesium.Cartesian3.normalize(o, new Cesium.Cartesian3());
    var a = Cesium.Cartesian3.subtract(t, i, new Cesium.Cartesian3());
    a = Cesium.Cartesian3.normalize(a, new Cesium.Cartesian3());
    var s = Cesium.Matrix4.inverse(this._matrix, new Cesium.Matrix4())
      , l = Cesium.Matrix4.multiplyByPoint(s, this._viewer.scene.camera.position, new Cesium.Cartesian3())
      , u = Cesium.Cartesian3.subtract(l, r, new Cesium.Cartesian3());
    u = Cesium.Cartesian3.normalize(u, new Cesium.Cartesian3());
    var h = Cesium.Cartesian3.dot(o, u)
      , c = Cesium.Cartesian3.dot(a, u);
    return h < 0 && c < 0 && (this.currentLookatDirect = "leftFront"),
      h > 0 && c < 0 && (this.currentLookatDirect = "rightFront"),
      h > 0 && c > 0 && (this.currentLookatDirect = "rightBack"),
      h < 0 && c > 0 && (this.currentLookatDirect = "leftBack"),
      c < 0 && Math.abs(h) < 0.25 && (this.currentLookatDirect = "front"),
      c > 0 && Math.abs(h) < 0.25 && (this.currentLookatDirect = "back"),
      h < 0 && Math.abs(c) < 0.09 && (this.currentLookatDirect = "left"),
      h > 0 && Math.abs(c) < 0.09 && (this.currentLookatDirect = "right"),
      this.currentLookatDirect;
  }
  initindexBuffer() {
    var e = this._depthStep * this._widthStep * this._heightStep;
    "cube" == this._type && (e *= 36);
    var t,
      n,
      i,
      r,
      o,
      a,
      s,
      l,
      u = null,
      c = null;
    if (!this.indexBuffer) {
      e >= Cesium.Math.SIXTY_FOUR_KILOBYTES ? (c = Cesium.ComponentDatatype.UNSIGNED_INT,
        u = Cesium.IndexDatatype.UNSIGNED_INT) : (c = Cesium.ComponentDatatype.UNSIGNED_SHORT,
          u = Cesium.IndexDatatype.UNSIGNED_SHORT),
        t = Cesium.ComponentDatatype.createTypedArray(c, e),
        n = Cesium.ComponentDatatype.createTypedArray(c, e),
        i = Cesium.ComponentDatatype.createTypedArray(c, e),
        r = Cesium.ComponentDatatype.createTypedArray(c, e),
        o = Cesium.ComponentDatatype.createTypedArray(c, e),
        a = Cesium.ComponentDatatype.createTypedArray(c, e),
        s = Cesium.ComponentDatatype.createTypedArray(c, e),
        l = Cesium.ComponentDatatype.createTypedArray(c, e);
      for (var dddpb2 = 0, f = 0; f < this._heightStep; f++)
        for (var p = this._depthStep - 1, m = 0; m < this._depthStep; m++) {
          for (var g = this._widthStep - 1, v = 0; v < this._widthStep; v++) {
            var y = f * this._depthStep * this._widthStep + p * this._widthStep + g
              , _ = f * this._depthStep * this._widthStep + p * this._widthStep + v
              , x = f * this._depthStep * this._widthStep + m * this._widthStep + g
              , w = f * this._depthStep * this._widthStep + m * this._widthStep + v
              , b = 0
              , C = 0
              , M = 0
              , S = 0
              , T = parseInt(this._widthStep / 2)
              , E = parseInt(this._depthStep / 2);
            if (v < T)
              b = _,
                C = w;
            else {
              var A = this._widthStep - 1 - (v - T);
              b = f * this._depthStep * this._widthStep + p * this._widthStep + A,
                C = f * this._depthStep * this._widthStep + m * this._widthStep + A
            }
            if (m < E)
              M = x,
                S = w;
            else {
              var P = this._depthStep - 1 - (m - E);
              M = f * this._depthStep * this._widthStep + P * this._widthStep + g,
                S = f * this._depthStep * this._widthStep + P * this._widthStep + v
            }
            if ("cube" == this._type)
              for (var L = 0; L < this.indexarray.length; L++) {
                var D = dddpb2 * this.indexarray.length + L;
                t[D] = this.indexarray[L] + 24 * y,
                  n[D] = this.indexarray[L] + 24 * _,
                  i[D] = this.indexarray[L] + 24 * x,
                  r[D] = this.indexarray[L] + 24 * w,
                  o[D] = this.indexarray[L] + 24 * b,
                  a[D] = this.indexarray[L] + 24 * C,
                  s[D] = this.indexarray[L] + 24 * M,
                  l[D] = this.indexarray[L] + 24 * S
              }
            else {
              var I = dddpb2;
              t[I] = y,
                n[I] = _,
                i[I] = x,
                r[I] = w,
                o[I] = b,
                a[I] = C,
                s[I] = M,
                l[I] = S
            }
            dddpb2++,
              g--;
          }
          p--;
        }
      var R = this._scene.context;
      this.indexBuffer = Cesium.Buffer.createIndexBuffer({
        context: R,
        typedArray: t,
        usage: Cesium.BufferUsage.STATIC_DRAW,
        indexDatatype: u
      });
      this.indexBuffer1 = Cesium.Buffer.createIndexBuffer({
        context: R,
        typedArray: n,
        usage: Cesium.BufferUsage.STATIC_DRAW,
        indexDatatype: u
      });
      this.indexBuffer2 = Cesium.Buffer.createIndexBuffer({
        context: R,
        typedArray: i,
        usage: Cesium.BufferUsage.STATIC_DRAW,
        indexDatatype: u
      });
      this.indexBuffer3 = Cesium.Buffer.createIndexBuffer({
        context: R,
        typedArray: r,
        usage: Cesium.BufferUsage.STATIC_DRAW,
        indexDatatype: u
      });
      this.indexBuffer4 = Cesium.Buffer.createIndexBuffer({
        context: R,
        typedArray: o,
        usage: Cesium.BufferUsage.STATIC_DRAW,
        indexDatatype: u
      });
      this.indexBuffer5 = Cesium.Buffer.createIndexBuffer({
        context: R,
        typedArray: a,
        usage: Cesium.BufferUsage.STATIC_DRAW,
        indexDatatype: u
      });
      this.indexBuffer6 = Cesium.Buffer.createIndexBuffer({
        context: R,
        typedArray: s,
        usage: Cesium.BufferUsage.STATIC_DRAW,
        indexDatatype: u
      });
      this.indexBuffer7 = Cesium.Buffer.createIndexBuffer({
        context: R,
        typedArray: l,
        usage: Cesium.BufferUsage.STATIC_DRAW,
        indexDatatype: u
      });
      this.VertexArray = new Cesium.VertexArray({
        context: R,
        attributes: this._drawVoxelCommand.vertexArray._attributes,
        indexBuffer: this.indexBuffer
      });
      this.VertexArray1 = new Cesium.VertexArray({
        context: R,
        attributes: this._drawVoxelCommand.vertexArray._attributes,
        indexBuffer: this.indexBuffer1
      });
      this.VertexArray2 = new Cesium.VertexArray({
        context: R,
        attributes: this._drawVoxelCommand.vertexArray._attributes,
        indexBuffer: this.indexBuffer2
      });
      this.VertexArray3 = new Cesium.VertexArray({
        context: R,
        attributes: this._drawVoxelCommand.vertexArray._attributes,
        indexBuffer: this.indexBuffer3
      });
      this.VertexArray4 = new Cesium.VertexArray({
        context: R,
        attributes: this._drawVoxelCommand.vertexArray._attributes,
        indexBuffer: this.indexBuffer4
      });
      this.VertexArray5 = new Cesium.VertexArray({
        context: R,
        attributes: this._drawVoxelCommand.vertexArray._attributes,
        indexBuffer: this.indexBuffer5
      });
      this.VertexArray6 = new Cesium.VertexArray({
        context: R,
        attributes: this._drawVoxelCommand.vertexArray._attributes,
        indexBuffer: this.indexBuffer6
      });
      this.VertexArray7 = new Cesium.VertexArray({
        context: R,
        attributes: this._drawVoxelCommand.vertexArray._attributes,
        indexBuffer: this.indexBuffer7
      });
    }
    var N = null;
    "leftFront" == this.lookatDirect && (N = this.VertexArray),
      "rightFront" == this.lookatDirect && (N = this.VertexArray1),
      "leftBack" == this.lookatDirect && (N = this.VertexArray2),
      "rightBack" == this.lookatDirect && (N = this.VertexArray3),
      "front" == this.lookatDirect && (N = this.VertexArray4),
      "back" == this.lookatDirect && (N = this.VertexArray5),
      "left" == this.lookatDirect && (N = this.VertexArray6),
      "right" == this.lookatDirect && (N = this.VertexArray7),
      "cube" == this._type ? (this.lineVertexArrayCube = N,
        this._drawVoxelCommand.vertexArray = this.lineVertexArrayCube) : (this.lineVertexArrayPoint = N,
          this._drawVoxelCommand.vertexArray = this.lineVertexArrayPoint)
  }
  pointsVao() {
    var sceneContext = this._scene.context;
    var t = new Cesium.ShaderSource({
      defines: ["EXTRUDED_POINT"],
      sources: [this.ppb2]
    });
    var n = new Cesium.ShaderSource({
      defines: ["EXTRUDED_POINT"],
      sources: [this.gpb2]
    });
    this.shaderProgramPoint = Cesium.ShaderProgram.fromCache({
      context: sceneContext,
      vertexShaderSource: t,
      fragmentShaderSource: n,
      attributeLocations: this.attributeLocations
    });
    var i,
      r = Cesium.Buffer.createVertexBuffer({
        context: sceneContext,
        typedArray: this.aPositionTypedArrayPoint,
        usage: Cesium.BufferUsage.STATIC_DRAW
      }),
      o = Cesium.Buffer.createVertexBuffer({
        context: sceneContext,
        typedArray: this.aPositionCenterTypedArrayPoint,
        usage: Cesium.BufferUsage.STATIC_DRAW
      }),
      a = Cesium.Buffer.createVertexBuffer({
        context: sceneContext,
        typedArray: this.aColorTypedArrayPoint,
        usage: Cesium.BufferUsage.STATIC_DRAW
      }),
      s = Cesium.Buffer.createVertexBuffer({
        context: sceneContext,
        typedArray: this.rangeTypedArrayPoint,
        usage: Cesium.BufferUsage.STATIC_DRAW
      }),
      l = Cesium.Buffer.createVertexBuffer({
        context: sceneContext,
        typedArray: this.aNormaltypedArrayPoint,
        usage: Cesium.BufferUsage.STATIC_DRAW
      }),
      u = Cesium.Buffer.createVertexBuffer({
        context: sceneContext,
        typedArray: this.a_coordTypedArrayPoint,
        usage: Cesium.BufferUsage.STATIC_DRAW
      });
    i = this.indexTypedArrayPoint.length >= Cesium.Math.SIXTY_FOUR_KILOBYTES ? Cesium.Buffer.createIndexBuffer({
      context: sceneContext,
      typedArray: this.indexTypedArrayPoint,
      usage: Cesium.BufferUsage.STATIC_DRAW,
      indexDatatype: Cesium.IndexDatatype.UNSIGNED_INT
    }) : Cesium.Buffer.createIndexBuffer({
      context: sceneContext,
      typedArray: this.indexTypedArrayPoint,
      usage: Cesium.BufferUsage.STATIC_DRAW,
      indexDatatype: Cesium.IndexDatatype.UNSIGNED_SHORT
    }),
      this.lineVertexArrayPoint = new Cesium.VertexArray({
        context: sceneContext,
        attributes: [{
          index: 0,
          vertexBuffer: r,
          componentsPerAttribute: 4,
          componentDatatype: Cesium.ComponentDatatype.FLOAT
        }, {
          index: 1,
          vertexBuffer: a,
          componentsPerAttribute: 4,
          componentDatatype: Cesium.ComponentDatatype.FLOAT
        }, {
          index: 2,
          vertexBuffer: s,
          componentsPerAttribute: 4,
          componentDatatype: Cesium.ComponentDatatype.FLOAT
        }, {
          index: 3,
          vertexBuffer: l,
          componentsPerAttribute: 3,
          componentDatatype: Cesium.ComponentDatatype.FLOAT
        }, {
          index: 4,
          vertexBuffer: u,
          componentsPerAttribute: 2,
          componentDatatype: Cesium.ComponentDatatype.FLOAT
        }, {
          index: 5,
          vertexBuffer: o,
          componentsPerAttribute: 4,
          componentDatatype: Cesium.ComponentDatatype.FLOAT
        }],
        indexBuffer: i
      }),
      this._computePositionFinish = true;
  }
  cubesVao() {
    var e = this._scene.context;
    this.shaderProgramCube = Cesium.ShaderProgram.replaceCache({
      context: e,
      vertexShaderSource: new Cesium.ShaderSource({
        defines: [""],
        sources: [this.ppb2]
      }),
      fragmentShaderSource: new Cesium.ShaderSource({
        defines: [""],
        sources: [this.gpb2]
      }),
      attributeLocations: this.attributeLocations
    });
    var t, n = Cesium.Buffer.createVertexBuffer({
      context: e,
      typedArray: this.aPositionTypedArrayCube,
      usage: Cesium.BufferUsage.STATIC_DRAW
    }), i = Cesium.Buffer.createVertexBuffer({
      context: e,
      typedArray: this.aPositionCenterTypedArrayCube,
      usage: Cesium.BufferUsage.STATIC_DRAW
    }), r = Cesium.Buffer.createVertexBuffer({
      context: e,
      typedArray: this.aColorTypedArrayCube,
      usage: Cesium.BufferUsage.STATIC_DRAW
    }), o = Cesium.Buffer.createVertexBuffer({
      context: e,
      typedArray: this.rangeTypedArrayCube,
      usage: Cesium.BufferUsage.STATIC_DRAW
    }), a = Cesium.Buffer.createVertexBuffer({
      context: e,
      typedArray: this.aNormaltypedArrayCube,
      usage: Cesium.BufferUsage.STATIC_DRAW
    }), s = Cesium.Buffer.createVertexBuffer({
      context: e,
      typedArray: this.a_coordTypedArrayCube,
      usage: Cesium.BufferUsage.STATIC_DRAW
    });
    t = this.indexTypedArrayCube.length >= Cesium.Math.SIXTY_FOUR_KILOBYTES ? Cesium.Buffer.createIndexBuffer({
      context: e,
      typedArray: this.indexTypedArrayCube,
      usage: Cesium.BufferUsage.STATIC_DRAW,
      indexDatatype: Cesium.IndexDatatype.UNSIGNED_INT
    }) : Cesium.Buffer.createIndexBuffer({
      context: e,
      typedArray: this.indexTypedArrayCube,
      usage: Cesium.BufferUsage.STATIC_DRAW,
      indexDatatype: Cesium.IndexDatatype.UNSIGNED_SHORT
    }),
      this.lineVertexArrayCube = new Cesium.VertexArray({
        context: e,
        attributes: [{
          index: 0,
          vertexBuffer: n,
          componentsPerAttribute: 4,
          componentDatatype: Cesium.ComponentDatatype.FLOAT
        }, {
          index: 1,
          vertexBuffer: r,
          componentsPerAttribute: 4,
          componentDatatype: Cesium.ComponentDatatype.FLOAT
        }, {
          index: 2,
          vertexBuffer: o,
          componentsPerAttribute: 4,
          componentDatatype: Cesium.ComponentDatatype.FLOAT
        }, {
          index: 3,
          vertexBuffer: a,
          componentsPerAttribute: 3,
          componentDatatype: Cesium.ComponentDatatype.FLOAT
        }, {
          index: 4,
          vertexBuffer: s,
          componentsPerAttribute: 2,
          componentDatatype: Cesium.ComponentDatatype.FLOAT
        }, {
          index: 5,
          vertexBuffer: i,
          componentsPerAttribute: 4,
          componentDatatype: Cesium.ComponentDatatype.FLOAT
        }],
        indexBuffer: t
      }),
      this._initBoundingSphere = Cesium.BoundingSphere.fromVertices(this.aPositionTypedArray),
      this._computePositionFinish = true;
  }
  updateAlpha() {
    this._alpha ? (this.renderState = this.renderState2,
      this.pass = Cesium.Pass.TRANSLUCENT) : (this.renderState = this.renderState,
        this.pass = Cesium.Pass.OPAQUE),
      this._drawVoxelCommand.renderState = this.renderState,
      this._drawVoxelCommand.pass = this.pass;
  }
  createVoxelCommand(e) {
    var t = this
      , n = this._scene.context
      , i = n.uniformState;
    this.renderState = Cesium.RenderState.fromCache({
      cull: {
        enabled: !0
      },
      depthTest: {
        enabled: !0
      },
      depthMask: !0
    }),
      this.renderState2 = Cesium.RenderState.fromCache({
        cull: {
          enabled: !0
        },
        depthTest: {
          enabled: !0
        },
        blending: Cesium.BlendingState.ALPHA_BLEND
      }),
      this._alpha ? (this.renderState = this.renderState2,
        this.pass = Cesium.Pass.TRANSLUCENT) : (this.renderState = this.renderState,
          this.pass = Cesium.Pass.OPAQUE);
    var r, o, a, s = {
      u_IJK: function () {
        return t._ijk
      },
      u_alphaScale: function () {
        return t._alphaScale
      },
      u_I: function () {
        return t._ijk.i
      },
      u_J: function () {
        return t._ijk.j
      },
      u_K: function () {
        return t._ijk.k
      },
      u_image: function () {
        return t._texture
      },
      u_max: function () {
        return new Cesium.Cartesian3(t._widthStep, t._depthStep, t._heightStep)
      },
      shadowMap_texture: function () {
        return t.dataTexture._colorTexture || t._scene.context.defaultTexture
      },
      u_matrix: function () {
        return Cesium.Matrix4.multiply(i.viewProjection, t._matrix, new Cesium.Matrix4)
      },
      u_show: function () {
        return t._show
      },
      u_pointSize: function () {
        return t._radius
      },
      u_customColor: function () {
        return t._customColor
      },
      u_alphaState: function () {
        return t._alpha
      },
      u_filterValue: function () {
        return t._filterValue
      },
      u_fifterIJk: function () {
        return t._fifterIJk
      }
    };
    e.mapProjection.ellipsoid;
    "point" == this._type ? (r = this.lineVertexArrayPoint,
      o = Cesium.PrimitiveType.POINTS,
      a = this.shaderProgramPoint) : (r = this.lineVertexArrayCube,
        o = Cesium.PrimitiveType.TRIANGLES,
        a = this.shaderProgramCube),
      this._drawVoxelCommand = new Cesium.DrawCommand({
        vertexArray: r,
        primitiveType: o,
        renderState: this.renderState,
        shaderProgram: a,
        uniformMap: s,
        owner: this,
        pass: this.pass,
        modelMatrix: new Cesium.Matrix4,
        boundingVolume: this._boundingSphere
      }),
      this._export3DDataFile && this.createConfigFile()
  }
  changeType() {
    "point" == this._type && this._drawVoxelCommand && (this.lineVertexArrayPoint || (this.updateCommand = !1,
      this.computePointPositions()),
      this._drawVoxelCommand.vertexArray = this.lineVertexArrayPoint,
      this._drawVoxelCommand.shaderProgram = this.shaderProgramPoint,
      this._drawVoxelCommand.primitiveType = Cesium.PrimitiveType.POINTS,
      this._changeState = !0),
      "cube" == this._type && this._drawVoxelCommand && (this.lineVertexArrayCube || (this.updateCommand = !1,
        this.computeVoxelPositions()),
        this._drawVoxelCommand.vertexArray = this.lineVertexArrayCube,
        this._drawVoxelCommand.shaderProgram = this.shaderProgramCube,
        this._drawVoxelCommand.primitiveType = Cesium.PrimitiveType.TRIANGLES,
        this._changeState = !0)
  }
  getIJKRange() {
    var e, t, n, i = new Cesium.Cartesian3(this._bound.x, this._bound.y, this._baseHeight), r = this._bound.x + (this._width + this._spacing) * this._widthStep, o = this._bound.y + (this._depth + this._spacing) * this._depthStep, a = this._heightStep * (this._height + this._spacing) + this._baseHeight, s = new Cesium.Cartesian3(r, o, a), u = Cesium.Matrix4.multiplyByPoint(this._matrix, i, new Cesium.Cartesian3), h = new Cesium.Cartographic.fromCartesian(u), c = Cesium.Matrix4.multiplyByPoint(this._matrix, s, new Cesium.Cartesian3), d = new Cesium.Cartographic.fromCartesian(c);
    return {
      i: (e = {
        name: "lon",
        0: h.longitude
      },
        (0,
          l.default)(e, this._widthStep - 1, d.longitude),
        (0,
          l.default)(e, "length", this._widthStep),
        e),
      j: (t = {
        name: "lat",
        0: h.latitude
      },
        (0,
          l.default)(t, this._depthStep - 1, d.latitude),
        (0,
          l.default)(t, "length", this._depthStep),
        t),
      k: (n = {
        name: "height",
        0: this._baseHeight
      },
        (0,
          l.default)(n, this._heightStep - 1, a),
        (0,
          l.default)(n, "length", this._heightStep),
        n)
    }
  }

  update(e) {
    !Cesium.defined(this._drawVoxelCommand) && this.textureState && this.updateCommand && this.createVoxelCommand(e),
      Cesium.defined(this._drawVoxelCommand) && this.updateCommand && (Cesium.defined(this._drawVoxelCommand) && (Cesium.Matrix4.equals(this.modelMatrix, this._modelMatrix) || (Cesium.Matrix4.clone(this.modelMatrix, this._modelMatrix),
        this._drawVoxelCommand.modelMatrix = Cesium.Matrix4.IDENTITY),
        this._drawVoxelCommand && e.commandList.push(this._drawVoxelCommand),
        this._changeState && (this._changeState = !1)),
        this.lookatDirect !== this.transparentSort() && (this.lookatDirect = this.currentLookatDirect,
          this.initindexBuffer()))
  }
  getColor() {
    var that = this;
    this._colorImage = this._image,
      Cesium.Resource.fetchImage(this._colorImage).then(function (t) {
        var n = t.width
          , i = t.height;
        that._texture = new Cesium.Texture({
          context: that._scene.context,
          width: n,
          height: i,
          source: t
        }),
          that.frameBuffer = new Cesium.Framebuffer({
            context: that._scene.context,
            colorTextures: [that._texture],
            destroyAttachments: !1
          }),
          that.textureState = !0
      }).otherwise(function (e) {
        console.log(e)
      })
  }
  createConfigFilefunction(fileName) {
    new Cesium.Cartographic.fromCartesian(this._boundingSphere.center).height = 0,
      this.content = (0,
        a.default)({
          textureWidth: this._widthStep,
          textureHeight: this._depthStep,
          textureDepth: this._heightStep,
          volumeWidth: this._bound.width,
          volumeHeight: this._extrudeHeight,
          volumeDepth: this._bound.height,
          center: this._boundingSphere.center
        }, null, 2),
      this.fileName = fileName || "shadowRateAnlilesConfig";
    var tempHref = document.createElement("a");
    tempHref.download = this.fileName;
    var n = new Blob([this.content], {
      type: "application/json"
    });
    tempHref.href = URL.createObjectURL(n);
    document.body.appendChild(tempHref);
    tempHref.click();
    document.body.removeChild(tempHref);
  }
  destroy() {
    return this.VertexArray = this.VertexArray && !this.VertexArray.isDestroyed() && this.VertexArray.destroy(),
      this.VertexArray1 = this.VertexArray1 && !this.VertexArray1.isDestroyed() && this.VertexArray1.destroy(),
      this.VertexArray2 = this.VertexArray2 && !this.VertexArray2.isDestroyed() && this.VertexArray2.destroy(),
      this.VertexArray3 = this.VertexArray3 && !this.VertexArray3.isDestroyed() && this.VertexArray3.destroy(),
      this.VertexArray4 = this.VertexArray4 && !this.VertexArray4.isDestroyed() && this.VertexArray4.destroy(),
      this.VertexArray5 = this.VertexArray5 && !this.VertexArray5.isDestroyed() && this.VertexArray5.destroy(),
      this.VertexArray6 = this.VertexArray6 && !this.VertexArray6.isDestroyed() && this.VertexArray6.destroy(),
      this.VertexArray7 = this.VertexArray7 && !this.VertexArray7.isDestroyed() && this.VertexArray7.destroy(),
      this.lineVertexArrayCube = this.lineVertexArrayCube && !this.lineVertexArrayCube.isDestroyed() && this.lineVertexArrayCube.destroy(),
      this.lineVertexArrayPoint = this.lineVertexArrayPoint && !this.lineVertexArrayPoint.isDestroyed() && this.lineVertexArrayPoint.destroy(),
      this.dataTexture._colorTexture = this.dataTexture._colorTexture && !this.dataTexture._colorTexture.isDestroyed() && this.dataTexture._colorTexture.destroy(),
      Cesium.destroyObject(this);
  }
  //========== 对外属性 ==========
  //scene
  get scene() {
    return this._viewer;
  }
  set scene(val) {
    if (val) {
      this._scene = val;
    }
  }

  //type
  get type() {
    return this._type;
  }
  set type(val) {
    if (val) {
      if (this._type !== val) {
        this._type = val;
        this.changeType();
      }
    }
  }

  //height
  get height() {
    return this._height;
  }
  set height(val) {
    if (val) {
      this._scene = Number(val);
    }
  }

  //show
  get show() {
    return this._show;
  }
  set show(val) {
    this._show = Boolean(val);
  }

  //image
  get image() {
    return this._image;
  }
  set image(val) {
    if (val) {
      this._image = val;
    }
  }

  //ijkHide
  get ijkHide() {
    return this._ijkHide;
  }
  set ijkHide(val) {
    if (val) {
      this._ijkHide = val;
    }
  }

  //ijk
  get ijk() {
    return this._ijk;
  }
  set ijk(val) {
    if (val) {
      this._ijk = val;
      this._fifterIJk = 10;
    }
  }

  //alpha
  get alpha() {
    return this._alpha;
  }
  set alpha(val) {
    if (val) {
      this._alpha = Boolean(val);
      this.updateAlpha();
    }
  }

  //filterValue
  get filterValue() {
    return this._filterValue;
  }
  set filterValue(val) {
    if (val) {
      this._filterValue = Number(val);
    }
  }

  //heightStep
  get heightStep() {
    return this._heightStep;
  }
  set heightStep(val) {
    this._heightStep = val;
  }

  //widthtStep
  get widthtStep() {
    return this._widthtStep;
  }
  set widthtStep(val) {
    this._widthtStep = val;
  }

  //depthStep
  get depthStep() {
    return this._depthStep;
  }
  set depthStep(val) {
    this._depthStep = val;
  }

  //extrudeHeight
  get extrudeHeight() {
    return this._extrudeHeight;
  }
  set extrudeHeight(val) {
    this._extrudeHeight = Number(val);
  }

  //alphaScale
  get alphaScale() {
    return this._alphaScale;
  }
  set alphaScale(val) {
    this._alphaScale = Number(val);
  }
  //export3DDataFile
  get export3DDataFile() {
    return this._export3DDataFile;
  }
  set export3DDataFile(val) {
    this._alpha = Boolean(val);
  }

}
