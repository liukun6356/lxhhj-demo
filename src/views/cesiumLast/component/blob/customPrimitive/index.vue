<template>
  <div class="customPrimitive-wrap">
    <Tdt_img_d/>
  </div>
</template>

<script lang="ts" setup>
import {onMounted, onUnmounted} from "vue";
import GUI from "lil-gui";
import * as Cesium from "cesium";
import {usemapStore} from "@/store/modules/cesiumLastMap";
import img1 from "./backGroundImg.jpg"
import img2 from "./img2.png"
import img3 from "./gugong.jpg"
import img4 from "./img4.png"
// Component
import Tdt_img_d from "@/views/cesiumLast/component/effect/controlPanel/layerManagement/basicMap/tdt_img_d.vue"

const mapStore = usemapStore()
onMounted(() => {
  initGui()
  handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
  handler.setInputAction(onMouseClick, Cesium.ScreenSpaceEventType.LEFT_CLICK);
  viewer.scene.primitives.add(primitiveCollection);
})

onUnmounted(() => {
  viewer.scene.primitives.remove(primitiveCollection);
  gui.destroy()
})

const addTrianglePrimitive = () => {
  reset()
  const vertices = new Float64Array([
    0, 0, 0,
    100, 0, 0,
    0, 100, 0,
    0, 0, 10,
    0, 0, 100,
    100, 0, 10
  ])
  const modelMatrix = Cesium.Transforms.eastNorthUpToFixedFrame(Cesium.Cartesian3.fromDegrees(114.347137, 30.541429, 10))
  const geometry = new Cesium.Geometry({
    attributes: {
      position: new Cesium.GeometryAttribute({
        componentDatatype: Cesium.ComponentDatatype.DOUBLE, // 双面可见
        componentsPerAttribute: 3,
        values: vertices
      }),
    },
    primitiveType: Cesium.PrimitiveType.TRIANGLES,
    boundingSphere: Cesium.BoundingSphere.fromVertices(vertices)
  })
  const instance = new Cesium.GeometryInstance({
    geometry: geometry,
    modelMatrix,
    attributes: {color: Cesium.ColorGeometryInstanceAttribute.fromColor(Cesium.Color.RED)}
  })
  primitiveCollection.add(new Cesium.Primitive({
    geometryInstances: instance,
    asynchronous: false, // 关闭异步
    appearance: new Cesium.PerInstanceColorAppearance({
      flat: true,          // 不计算光照
      translucent: false   // 是否透明
    })
  }))
  const worldBoundingSphere = Cesium.BoundingSphere.transform(geometry.boundingSphere, modelMatrix, new Cesium.BoundingSphere());
  viewer.camera.flyToBoundingSphere(worldBoundingSphere);
}

const addVertexPrimitive = () => {
  reset()
  const vertices = new Float64Array([
    0, 0, 0,
    100, 0, 0,
    0, 100, 0,
    0, 100, 0,
    100, 0, 0,
    100, 100, 0
  ])
  const modelMatrix = Cesium.Transforms.eastNorthUpToFixedFrame(Cesium.Cartesian3.fromDegrees(114.347137, 30.541429, 10))
  const geometry = new Cesium.Geometry({
    attributes: {
      position: new Cesium.GeometryAttribute({
        componentDatatype: Cesium.ComponentDatatype.DOUBLE, // 双面可见
        componentsPerAttribute: 3,
        values: vertices
      }),
    },
    primitiveType: Cesium.PrimitiveType.TRIANGLES,
    boundingSphere: Cesium.BoundingSphere.fromVertices(vertices)
  })
  const instance = new Cesium.GeometryInstance({
    geometry: geometry,
    modelMatrix,
    attributes: {color: Cesium.ColorGeometryInstanceAttribute.fromColor(Cesium.Color.RED)}
  })
  primitiveCollection.add(new Cesium.Primitive({
    geometryInstances: instance,
    asynchronous: false, // 关闭异步
    appearance: new Cesium.PerInstanceColorAppearance({
      flat: true,          // 不计算光照
      translucent: false   // 是否透明
    })
  }))
  const worldBoundingSphere = Cesium.BoundingSphere.transform(geometry.boundingSphere, modelMatrix, new Cesium.BoundingSphere());
  viewer.camera.flyToBoundingSphere(worldBoundingSphere);
}

const addCustomIndexPrimitive = () => {
  reset()
  const vertices = new Float64Array([
    0, 0, 0,
    100, 0, 0,
    0, 100, 0,
    // 0, 100, 0,
    // 100, 0, 0,
    100, 100, 0
  ])
  const modelMatrix = Cesium.Transforms.eastNorthUpToFixedFrame(Cesium.Cartesian3.fromDegrees(114.347137, 30.541429, 10))
  const indices = new Uint16Array([0, 1, 2, 2, 1, 3])// //存储一份顶点索引
  const geometry = new Cesium.Geometry({
    attributes: {
      position: new Cesium.GeometryAttribute({
        componentDatatype: Cesium.ComponentDatatype.DOUBLE, // 双面可见
        componentsPerAttribute: 3,
        values: vertices
      }),
    },
    indices,
    primitiveType: Cesium.PrimitiveType.TRIANGLES,
    boundingSphere: Cesium.BoundingSphere.fromVertices(vertices)
  })
  const instance = new Cesium.GeometryInstance({
    geometry: geometry,
    modelMatrix,
    attributes: {color: Cesium.ColorGeometryInstanceAttribute.fromColor(Cesium.Color.RED)}
  })
  primitiveCollection.add(new Cesium.Primitive({
    geometryInstances: instance,
    asynchronous: false, // 关闭异步
    appearance: new Cesium.PerInstanceColorAppearance({
      flat: true,          // 不计算光照
      translucent: false   // 是否透明
    })
  }))
  const worldBoundingSphere = Cesium.BoundingSphere.transform(geometry.boundingSphere, modelMatrix, new Cesium.BoundingSphere());
  viewer.camera.flyToBoundingSphere(worldBoundingSphere);
}

const addCustomCylinderPrimitive = () => {
  reset()
  const vertices = new Float64Array([
    100, -100, 100, // 0
    -100, -100, 100,  //1
    -100, 100, 100,  //2
    100, 100, 100, //3
    0, 0, -100  //4
  ])
  const indices = new Uint16Array([
    4, 0, 1,  // ABE面
    4, 1, 2,//BCE面
    4, 2, 3, //CDE面
    4, 3, 0, // DAE面
    0, 1, 2,  //平面拆分的三角形 ABC
    0, 3, 1//平面拆分的三角形 ABD
  ])

  const boundingSphere = Cesium.BoundingSphere.fromVertices(vertices);
  const modelMatrix = Cesium.Transforms.eastNorthUpToFixedFrame(Cesium.Cartesian3.fromDegrees(114.347137, 30.541429, 200))

  const geometry = new Cesium.Geometry({
    attributes: {
      position: new Cesium.GeometryAttribute({
        componentDatatype: Cesium.ComponentDatatype.DOUBLE,
        componentsPerAttribute: 3,
        values: vertices
      })
    },
    indices: indices,
    primitiveType: Cesium.PrimitiveType.TRIANGLES,
    boundingSphere: boundingSphere
  })
  const instance = new Cesium.GeometryInstance({
    geometry: geometry,
    modelMatrix,
    attributes: {color: Cesium.ColorGeometryInstanceAttribute.fromColor(Cesium.Color.RED)}
  })
  primitiveCollection.add(new Cesium.Primitive({
    geometryInstances: instance,
    asynchronous: false, // 关闭异步
    appearance: new Cesium.PerInstanceColorAppearance({
      flat: true,          // 不计算光照
      translucent: false   // 是否透明
    })
  }))
  const worldBoundingSphere = Cesium.BoundingSphere.transform(geometry.boundingSphere, modelMatrix, new Cesium.BoundingSphere());
  viewer.camera.flyToBoundingSphere(worldBoundingSphere);
}

const addCustomNormalCylinderPrimitive = () => {
  reset()
  const vertices = new Float64Array([
    // 前
    0, 0, -100, // E点
    100, -100, 100, //A点
    -100, -100, 100, //B点
    // 后
    0, 0, -100, // E点
    -100, 100, 100, //C点
    100, 100, 100, //D点
    // 左
    0, 0, -100, // E点
    -100, -100, 100, //B点
    -100, 100, 100, //C点
    // 右
    0, 0, -100, // E点
    100, 100, 100, //D点
    100, -100, 100, //A点
    // 上
    100, -100, 100, //A点
    -100, -100, 100, //B点
    100, 100, 100, //D点
    -100, -100, 100,//B点
    100, 100, 100, //D点
    -100, 100, 100, //C点
  ])

  const triangles = [
    // 每个面由 3 个点组成
    [new Cesium.Cartesian3(0, 0, -100), new Cesium.Cartesian3(100, -100, 100), new Cesium.Cartesian3(-100, -100, 100)], // 前
    [new Cesium.Cartesian3(0, 0, -100), new Cesium.Cartesian3(-100, 100, 100), new Cesium.Cartesian3(100, 100, 100)],   // 后
    [new Cesium.Cartesian3(0, 0, -100), new Cesium.Cartesian3(-100, -100, 100), new Cesium.Cartesian3(-100, 100, 100)], // 左
    [new Cesium.Cartesian3(0, 0, -100), new Cesium.Cartesian3(100, 100, 100), new Cesium.Cartesian3(100, -100, 100)],   // 右
    [new Cesium.Cartesian3(100, -100, 100), new Cesium.Cartesian3(-100, -100, 100), new Cesium.Cartesian3(100, 100, 100)], // 上1
    [new Cesium.Cartesian3(-100, -100, 100), new Cesium.Cartesian3(100, 100, 100), new Cesium.Cartesian3(-100, 100, 100)], // 上2
  ]

  const computeNormal = (p0, p1, p2) => { // 三角形法线计算
    const d1 = Cesium.Cartesian3.subtract(p1, p0, new Cesium.Cartesian3())
    const d2 = Cesium.Cartesian3.subtract(p2, p0, new Cesium.Cartesian3())
    const normal = Cesium.Cartesian3.cross(d1, d2, new Cesium.Cartesian3())
    return Cesium.Cartesian3.normalize(normal, new Cesium.Cartesian3())
  }
  let normals = []
  for (const [p0, p1, p2] of triangles) {    // 每个三角形 3 个顶点的法线相同
    const normal = computeNormal(p0, p1, p2)
    normals.push(normal.x, normal.y, normal.z, normal.x, normal.y, normal.z, normal.x, normal.y, normal.z)
  }

  const boundingSphere = Cesium.BoundingSphere.fromVertices(vertices);
  const modelMatrix = Cesium.Transforms.eastNorthUpToFixedFrame(Cesium.Cartesian3.fromDegrees(114.347137, 30.541429, 200))
  const geometry = new Cesium.Geometry({
    attributes: {
      position: new Cesium.GeometryAttribute({
        componentDatatype: Cesium.ComponentDatatype.DOUBLE,
        componentsPerAttribute: 3,
        values: vertices
      }),
      normal: new Cesium.GeometryAttribute({
        componentDatatype: Cesium.ComponentDatatype.FLOAT,
        componentsPerAttribute: 3,
        values: new Float64Array(normals)
      })
    },
    primitiveType: Cesium.PrimitiveType.TRIANGLES,
    boundingSphere
  })
  const instance = new Cesium.GeometryInstance({
    geometry: geometry,
    modelMatrix,
    attributes: {color: Cesium.ColorGeometryInstanceAttribute.fromColor(Cesium.Color.RED)}
  })
  primitiveCollection.add(new Cesium.Primitive({
    geometryInstances: instance,
    asynchronous: false, // 关闭异步
    appearance: new Cesium.PerInstanceColorAppearance({
      translucent: false   // 是否透明
    })
  }))
  const worldBoundingSphere = Cesium.BoundingSphere.transform(geometry.boundingSphere, modelMatrix, new Cesium.BoundingSphere());
  viewer.camera.flyToBoundingSphere(worldBoundingSphere);
}

const addBoxPrimitive = () => {
  reset()
  //立方体位置
  const position = Cesium.Cartesian3.fromDegrees(114.347137, 30.541429, 50);
  //地方矩阵
  const modelMatrix = Cesium.Transforms.eastNorthUpToFixedFrame(position);
  // 1 定义位置数组
  const v0 = [0.5, -0.5, 0.5];
  const v1 = [-0.5, -0.5, 0.5];
  const v2 = [-0.5, -0.5, -0.5];
  const v3 = [0.5, -0.5, -0.5];
  const v4 = [0.5, 0.5, -0.5];
  const v5 = [0.5, 0.5, 0.5];
  const v6 = [-0.5, 0.5, 0.5];
  const v7 = [-0.5, 0.5, -0.5];
  const rawVertex = [
    ...v2, ...v3, ...v4, ...v7,// 下 -z
    ...v2, ...v3, ...v0, ...v1,// 前 -y
    ...v4, ...v7, ...v6, ...v5,// 后 +y
    ...v7, ...v2, ...v1, ...v6,// 左 -x
    ...v3, ...v4, ...v5, ...v0,  // 右 +x
    ...v1, ...v0, ...v5, ...v6,// 上 +z
  ];
  // 乘上box的长度
  const boxVertex = rawVertex.map(v => 100 * v);
  const positions = new Float64Array(boxVertex);
  // 2 定义法向数组
  const npx = [1, 0, 0];
  const nnx = [-1, 0, 0];
  const npy = [0, 1, 0];
  const nny = [0, -1, 0];
  const npz = [0, 0, 1];
  const nnz = [0, 0, -1];
  const normals = new Float32Array([
    ...nnz, ...nnz, ...nnz, ...nnz,// 下 -z
    ...nny, ...nny, ...nny, ...nny,// 前 -y
    ...npy, ...npy, ...npy, ...npy,// 后 +y
    ...nnx, ...nnx, ...nnx, ...nnx,// 左 -x
    ...npx, ...npx, ...npx, ...npx,// 右 +x
    ...npz, ...npz, ...npz, ...npz,// 上 +z
  ]);
  // 3 定义纹理数组
  const sts = new Float32Array([
    0, 0, 1, 0, 1, 1, 0, 1,
    0, 0, 1, 0, 1, 1, 0, 1,
    0, 0, 1, 0, 1, 1, 0, 1,
    0, 0, 1, 0, 1, 1, 0, 1,
    0, 0, 1, 0, 1, 1, 0, 1,
    0, 0, 1, 0, 1, 1, 0, 1,
  ]);
  // 4 定义索引
  const indices = new Uint16Array([
    0, 1, 2, 0, 2, 3,
    4, 5, 6, 4, 6, 7,
    8, 9, 10, 8, 10, 11,
    12, 13, 14, 12, 14, 15,
    16, 17, 18, 16, 18, 19,
    20, 21, 22, 20, 22, 23,
  ]);

  primitive = primitiveCollection.add(new Cesium.Primitive({
    geometryInstances: new Cesium.GeometryInstance({
      geometry: new Cesium.Geometry({
        attributes: {
          position: new Cesium.GeometryAttribute({
            componentDatatype: Cesium.ComponentDatatype.DOUBLE,
            componentsPerAttribute: 3,
            values: positions
          }),
          normal: new Cesium.GeometryAttribute({
            componentDatatype: Cesium.ComponentDatatype.FLOAT,
            componentsPerAttribute: 3,
            values: normals
          }),
          st: new Cesium.GeometryAttribute({
            componentDatatype: Cesium.ComponentDatatype.FLOAT,
            componentsPerAttribute: 2,
            values: sts
          }),
        },
        indices: indices,
        primitiveType: Cesium.PrimitiveType.TRIANGLES,
        boundingSphere: Cesium.BoundingSphere.fromVertices(positions)
      }),
    }),
    appearance: new Cesium.MaterialAppearance({
      material: Cesium.Material.fromType('Image', {
        image: img1
      }),
      closed: true // 是否为封闭体，实际上执行的是是否进行背面裁剪
    }),
    modelMatrix: modelMatrix,
    asynchronous: false
  }));
  const worldBoundingSphere = Cesium.BoundingSphere.transform(primitive.geometryInstances.geometry.boundingSphere, modelMatrix, new Cesium.BoundingSphere());
  viewer.camera.flyToBoundingSphere(worldBoundingSphere);
}

const addCustomAppearance = async () => {
  reset()
  class CustomAppearance extends Cesium.Appearance {
    constructor(options) {
      super(options);
      options = Cesium.defaultValue(options, Cesium.defaultValue.EMPTY_OBJECT);
      const translucent = this.translucent;
      const closed = this.closed;
      const defaultVertexShader = `
          #version 300 es
          precision highp float;

          //  使用double类型的position进行计算
          in vec3 position3DHigh;
          in vec3 position3DLow;
          in vec3 normal;
          in vec2 st;
          in float batchId;
          out vec3 v_positionEC;
          out vec3 v_normalEC;
          out vec2 v_st;

          void main()
          {
              //  使用double类型的position进行计算
              vec4 p = czm_translateRelativeToEye(position3DHigh, position3DLow);
              v_positionEC = (czm_modelViewRelativeToEye * p).xyz;      // position in eye coordinates
              v_normalEC = czm_normal * normal;                         // normal in eye coordinates
              v_st = st;
              gl_Position = czm_modelViewProjectionRelativeToEye * p;
          }
      `;
      const defaultFragmentShader = `
          #version 300 es
          precision highp float;

          in vec3 v_positionEC;
          in vec3 v_normalEC;
          in vec2 v_st;
          uniform sampler2D myImage;
          void main()
          {
              vec3 positionToEyeEC = -v_positionEC;
              vec3 normalEC = normalize(v_normalEC);
          #ifdef FACE_FORWARD
              normalEC = faceforward(normalEC, vec3(0.0, 0.0, 1.0), -normalEC);
          #endif
              czm_materialInput materialInput;
              materialInput.normalEC = normalEC;
              materialInput.positionToEyeEC = positionToEyeEC;
              materialInput.st = v_st;
              czm_material material = czm_getDefaultMaterial(materialInput);
              material.diffuse = texture(myImage, materialInput.st).rgb; // WebGL2 用 texture() 代替 texture2D()
              czm_phong(normalize(positionToEyeEC), material, czm_lightDirectionEC);
          }
      `;

      this._vertexShaderSource = Cesium.defaultValue(options.vertexShaderSource, defaultVertexShader);
      this._fragmentShaderSource = Cesium.defaultValue(options.fragmentShaderSource, defaultFragmentShader);
      this._renderState = Cesium.Appearance.getDefaultRenderState(translucent, closed, options.renderState);
      this.uniforms = Cesium.defaultValue(options.uniforms, {});
    }
  }

  const image = await Cesium.Resource.createIfNeeded(img3).fetchImage()
  let texture;
  if (Cesium.defined(image.internalFormat)) {
    texture = new Cesium.Texture({
      context: viewer.scene.context,
      pixelFormat: image.internalFormat,
      width: image.width,
      height: image.height,
      source: {
        arrayBufferView: image.bufferView
      }
    });
  } else {
    texture = new Cesium.Texture({
      context: viewer.scene.context,
      source: image
    });
  }
  const myAppearance = new CustomAppearance({
    closed: true,
    translucent: true,
    uniforms: {myImage: viewer.scene.context.defaultTexture}
  })
  myAppearance.uniforms.myImage = texture;
}

const addCustomMaterial = () => {
  reset()
  const box = Cesium.BoxGeometry.fromDimensions({dimensions: new Cesium.Cartesian3(100, 100, 100)}) // 设置盒子的长宽高
  const geometry = Cesium.BoxGeometry.createGeometry(box);
  // 通过GeometryInstance中的modelMatrix 属性将其定位到地球的正确位置上
  const modelMatrix = Cesium.Transforms.eastNorthUpToFixedFrame(Cesium.Cartesian3.fromDegrees(114.347137, 30.541429, 50))
  primitiveCollection.add(new Cesium.Primitive({
    geometryInstances: new Cesium.GeometryInstance({
      geometry: geometry,
      modelMatrix,
    }),
    asynchronous: false, // 关闭异步
    appearance: new Cesium.MaterialAppearance({
      material: new Cesium.Material({
        fabric: {
          type: 'MyCustomShader1',
          uniforms: {
            image: img4,
            color: new Cesium.Color(1.0, 1.0, 0.0, 1.0),
            cellAlpha: 0.3
          },
          source: `
              uniform vec4 color;
              uniform float cellAlpha;
              czm_material czm_getMaterial(czm_materialInput materialInput)
              {
                  czm_material material = czm_getDefaultMaterial(materialInput);
                  vec2 st = materialInput.st;
                  float aa = st.s * st.t;
                  vec3 halfColor = color.rgb * aa + texture(image, materialInput.st).rgb * (1.0 - aa);
                  halfColor *= 0.5;
                  material.diffuse = halfColor;
                  material.emission = halfColor;
                  // material.alpha = color.a * aa;
                  material.alpha = 1.0;
                  return material;
              }
          `
        },
        translucent: false
      }),
      closed: true // 是否为封闭体，实际上执行的是是否进行背面裁剪
    }),
  }))
  const worldBoundingSphere = Cesium.BoundingSphere.transform(geometry.boundingSphere, modelMatrix, new Cesium.BoundingSphere());
  viewer.camera.flyToBoundingSphere(worldBoundingSphere);
}

const addAnimationCustomMaterial = () =>{
  reset()
  const box = Cesium.BoxGeometry.fromDimensions({dimensions: new Cesium.Cartesian3(100, 100, 100)}) // 设置盒子的长宽高
  const geometry = Cesium.BoxGeometry.createGeometry(box);
  // 通过GeometryInstance中的modelMatrix 属性将其定位到地球的正确位置上
  const modelMatrix = Cesium.Transforms.eastNorthUpToFixedFrame(Cesium.Cartesian3.fromDegrees(114.347137, 30.541429, 50))
   primitive=primitiveCollection.add(new Cesium.Primitive({
    geometryInstances: new Cesium.GeometryInstance({
      geometry: geometry,
      modelMatrix,
    }),
    asynchronous: false, // 关闭异步
    appearance: new Cesium.MaterialAppearance({
      material: new Cesium.Material({
        fabric: {
          type: 'MyCustomShader2',
          uniforms: {
            iTime: 0.0,
            iResolution: new Cesium.Cartesian2(1024, 1024),
          },
          source: `
            uniform float iTime;
            uniform vec2 iResolution;
            void mainImage( out vec4 o, vec2 u )
            {
                vec2 v = iResolution.xy;
                u = .2*(u+u-v)/v.y;
                vec4 z = o = vec4(1,2,3,0);
                for (float a = .5, t = iTime, i; ++i < 19.;
                    o += (1. + cos(z+t))  / length((1.+i*dot(v,v)) * sin(1.5*u/(.5-dot(u,u)) - 9.*u.yx + t))
                    )
                    v = cos(++t - 7.*u*pow(a += .03, i)) - 5.*u,
                    u += tanh(40. * dot(u *= mat2(cos(i + .02*t - vec4(0,11,33,0))), u)
                    * cos(1e2*u.yx + t)) / 2e2 + .2 * a * u + cos(4./exp(dot(o,o)/1e2) + t) / 3e2;
                o = 25.6 / (min(o, 13.) + 164. / o) - dot(u, u) / 250.;
            }
            czm_material czm_getMaterial(czm_materialInput materialInput) {
                czm_material material = czm_getDefaultMaterial(materialInput);
                vec4 color = vec4(0.0, 0.0, 0.0, 1.0);
                mainImage(color, materialInput.st * iResolution);
                material.diffuse = color.rgb;
                material.alpha = 1.0;
                return material;
            }
          `
        },
        translucent: false
      }),
      closed: true
    }),
  }))
  viewer.scene.preRender.addEventListener(renderFn);
  const worldBoundingSphere = Cesium.BoundingSphere.transform(geometry.boundingSphere, modelMatrix, new Cesium.BoundingSphere());
  viewer.camera.flyToBoundingSphere(worldBoundingSphere);
}

const addCustomPrimitive = async () => {
  reset()
  class CustomPrimitive {
    constructor() {
      // 1.0 立方体顶点位置标号，以及坐标系示意图
      // 1.1 定义位置数组
      const v0 = [0.5, -0.5, 0.5];
      const v1 = [-0.5, -0.5, 0.5];
      const v2 = [-0.5, -0.5, -0.5];
      const v3 = [0.5, -0.5, -0.5];
      const v4 = [0.5, 0.5, -0.5];
      const v5 = [0.5, 0.5, 0.5];
      const v6 = [-0.5, 0.5, 0.5];
      const v7 = [-0.5, 0.5, -0.5];
      const rawVertex = [
        ...v2, ...v3, ...v4, ...v7,// 下 -z
        ...v2, ...v3, ...v0, ...v1,// 前 -y
        ...v4, ...v7, ...v6, ...v5,// 后 +y
        ...v7, ...v2, ...v1, ...v6,// 左 -x
        ...v3, ...v4, ...v5, ...v0,  // 右 +x
        ...v1, ...v0, ...v5, ...v6,// 上 +z
      ];
      const positions = new Float32Array(rawVertex);
      // 1.2 定义法向数组
      const npx = [1, 0, 0];
      const nnx = [-1, 0, 0];
      const npy = [0, 1, 0];
      const nny = [0, -1, 0];
      const npz = [0, 0, 1];
      const nnz = [0, 0, -1];
      const normals = new Float32Array([
        ...nnz, ...nnz, ...nnz, ...nnz,// 下 -z
        ...nny, ...nny, ...nny, ...nny,// 前 -y
        ...npy, ...npy, ...npy, ...npy,// 后 +y
        ...nnx, ...nnx, ...nnx, ...nnx,// 左 -x
        ...npx, ...npx, ...npx, ...npx,// 右 +x
        ...npz, ...npz, ...npz, ...npz,// 上 +z
      ]);
      // 1.3 定义纹理数组
      const sts = new Float32Array([
        0, 0, 1, 0, 1, 1, 0, 1,
        0, 0, 1, 0, 1, 1, 0, 1,
        0, 0, 1, 0, 1, 1, 0, 1,
        0, 0, 1, 0, 1, 1, 0, 1,
        0, 0, 1, 0, 1, 1, 0, 1,
        0, 0, 1, 0, 1, 1, 0, 1,
      ]);
      // 1.4 定义索引
      const indices = new Uint16Array([
        0, 1, 2, 0, 2, 3,
        4, 5, 6, 4, 6, 7,
        8, 9, 10, 8, 10, 11,
        12, 13, 14, 12, 14, 15,
        16, 17, 18, 16, 18, 19,
        20, 21, 22, 20, 22, 23,
      ]);
      // 1.5 定义纹理
      this._readyPromise = Cesium.Resource.createIfNeeded(img2).fetchImage().then((image) => {
        this.texture = Cesium.defined(image.internalFormat)
            ? new Cesium.Texture({
              context: viewer.scene.context,
              pixelFormat: image.internalFormat,
              width: image.width,
              height: image.height,
              source: {
                arrayBufferView: image.bufferView
              }
            }) : new Cesium.Texture({
              context: viewer.scene.context,
              source: image
            });
      });
      const attributeLocations = {
        position: 0,
        normal: 1,
        textureCoordinates: 2,
      };
      // 1.7 定义shader
      const vertexShader = `
          #version 300 es
          in vec3 position;
          in vec3 normal;
          in vec2 st;
          in float batchId;
          out vec3 v_positionEC;
          out vec3 v_normalEC;
          out vec2 v_st;

          void main()
          {
              v_positionEC = (czm_modelView * vec4(position, 1.0)).xyz;   // position in eye coordinates
              v_normalEC = czm_normal * normal;                           // normal in eye coordinates
              v_st = st;
              gl_Position = czm_modelViewProjection * vec4(position, 1.0);
          }
      `;
      const fragmentShader = `
          #version 300 es
          precision highp float;

          in vec3 v_positionEC;
          in vec3 v_normalEC;
          in vec2 v_st;
          uniform sampler2D myImage;
          out vec4 fragColor;
          void main()
          {
              vec3 positionToEyeEC = -v_positionEC;
              vec3 normalEC = normalize(v_normalEC);
          #ifdef FACE_FORWARD
              normalEC = faceforward(normalEC, vec3(0.0, 0.0, 1.0), -normalEC);
          #endif
              czm_materialInput materialInput;
              materialInput.normalEC = normalEC;
              materialInput.positionToEyeEC = positionToEyeEC;
              materialInput.st = v_st;
              czm_material material = czm_getDefaultMaterial(materialInput);
              material.diffuse = texture(myImage, materialInput.st).rgb; // WebGL2 用 texture() 代替 texture2D()
          #ifdef FLAT
              fragColor = vec4(material.diffuse + material.emission, material.alpha);
          #else
              fragColor = czm_phong(normalize(positionToEyeEC), material, czm_lightDirectionEC);
          #endif
          }
      `;

      // 1.9 创建command
      const createCommand = (context) => {
        // 创建vertexArray
        this.geometry = new Cesium.Geometry({
          attributes: {
            position: new Cesium.GeometryAttribute({
              //  使用double类型的position进行计算
              // componentDatatype : Cesium.ComponentDatatype.DOUBLE,
              componentDatatype: Cesium.ComponentDatatype.FLOAT,
              componentsPerAttribute: 3,
              values: positions
            }),
            normal: new Cesium.GeometryAttribute({
              componentDatatype: Cesium.ComponentDatatype.FLOAT,
              componentsPerAttribute: 3,
              values: normals
            }),
            textureCoordinates: new Cesium.GeometryAttribute({
              componentDatatype: Cesium.ComponentDatatype.FLOAT,
              componentsPerAttribute: 2,
              values: sts
            })
          },// Workaround Internet Explorer 11.0.8 lack of TRIANGLE_FAN
          indices: indices,
          primitiveType: Cesium.PrimitiveType.TRIANGLES,
          boundingSphere: Cesium.BoundingSphere.fromVertices(positions)
        })
        const vertexArray = Cesium.VertexArray.fromGeometry({
          context: context,
          geometry: this.geometry,
          attributeLocations: attributeLocations,
          bufferUsage: Cesium.BufferUsage.STATIC_DRAW,
          // interleave : true
        });

        const translucent = false;
        const closed = true;
        // 借用一下Appearance.getDefaultRenderState
        const rawRenderState = Cesium.Appearance.getDefaultRenderState(translucent, closed, undefined);
        const renderState = Cesium.RenderState.fromCache(rawRenderState);
        const vertexShaderSource = new Cesium.ShaderSource({sources: [vertexShader]});
        const fragmentShaderSource = new Cesium.ShaderSource({sources: [fragmentShader]});
        const uniformMap = {
          myImage: () => Cesium.defined(this.texture) ? this.texture : context.defaultTexture
        }
        const shaderProgram = Cesium.ShaderProgram.fromCache({
          context: context,
          vertexShaderSource: vertexShaderSource,
          fragmentShaderSource: fragmentShaderSource,
          attributeLocations: attributeLocations
        });
        //立方体位置
        const position = Cesium.Cartesian3.fromDegrees(114.347137, 30.541429, 50);
        //地方矩阵
        const enuMatrix = Cesium.Transforms.eastNorthUpToFixedFrame(position);
        // 缩放矩阵
        const scaleMatrix = Cesium.Matrix4.fromScale(new Cesium.Cartesian3(100, 100, 100));
        this.modelMatrix = Cesium.Matrix4.multiply(enuMatrix, scaleMatrix, new Cesium.Matrix4());

        return new Cesium.DrawCommand({
          vertexArray,
          primitiveType: Cesium.PrimitiveType.TRIANGLES,
          renderState: renderState,
          shaderProgram: shaderProgram,
          uniformMap: uniformMap,
          owner: this,
          pass: Cesium.Pass.OPAQUE,
          modelMatrix: this.modelMatrix,
        });
      }

      this.show = true;
      this.name = "lxhhjBox"
      this.modelMatrix = Cesium.Matrix4.IDENTITY;
      this._command = undefined;
      this._createCommand = createCommand;
      this._destroyed = false
    }

    update(frameState) {
      if (!this.show) return;
      if (this._destroyed) return;
      if (!Cesium.defined(this._command)) this._command = this._createCommand(frameState.context);
      if (Cesium.defined(this._command)) {
        frameState.commandList.push(this._command);
      }
    }

    isDestroyed() {
      return this._destroyed;
    }

    destroy() {
      if (this._destroyed) return
      this._destroyed = true;
      this.show = false;
      if (Cesium.defined(this._command)) {
        this._command.shaderProgram = this._command.shaderProgram && this._command.shaderProgram.destroy();
        this._command.vertexArray = this._command.vertexArray && this._command.vertexArray.destroy();
        this._command = undefined;
      }
      if (Cesium.defined(this.texture)) {
        this.texture = this.texture.destroy();
      }
      return Cesium.destroyObject(this);
    };
  }

  const primitive = primitiveCollection.add(new CustomPrimitive())
  await primitive._readyPromise
  const worldBoundingSphere = Cesium.BoundingSphere.transform(primitive.geometry.boundingSphere, primitive.modelMatrix, new Cesium.BoundingSphere());
  viewer.camera.flyToBoundingSphere(worldBoundingSphere);
}

const removeCustomPrimitive = () => {
  reset()
  const primitive = primitiveCollection._primitives.find(primitive => primitive.name === "lxhhjBox")
  if (primitive) primitive.destroy()
  console.log(primitive.isDestroyed())
  console.log(primitiveCollection._primitives)
}

let lastTime = Date.now();
const renderFn = () =>{
  const now = Date.now();
  primitive.appearance.material.uniforms.iTime += (now - lastTime) / 1000;
  lastTime = now;
}

const reset = () => {
  primitiveCollection.removeAll()
  viewer.scene.preRender.removeEventListener(renderFn);
}

// 地图逻辑
const viewer = mapStore.getCesiumViewer();
let handler, primitive
const primitiveCollection = new Cesium.PrimitiveCollection()

const onMouseClick = () => {

}

// lil-gui逻辑
let gui, nativeFolder, customFolder, nativeAppearanceFolder, customMaterialFolder
const formData = {
  addTrianglePrimitive,
  addVertexPrimitive,
  addCustomIndexPrimitive,
  addCustomCylinderPrimitive,
  addCustomNormalCylinderPrimitive,
  addBoxPrimitive,
  addCustomPrimitive,
  removeCustomPrimitive,
  addCustomAppearance,
  addCustomMaterial,
  addAnimationCustomMaterial,
  reset
}

const initGui = () => {
  gui = new GUI({title: "custom-primitive"});
  nativeFolder = gui.addFolder("原生Primitive")
  nativeFolder.add(formData, "addTrianglePrimitive").name("两个三角形")
  nativeFolder.add(formData, "addVertexPrimitive").name("顶点正方形")
  nativeFolder.add(formData, "addCustomIndexPrimitive").name("顶点索引优化正方形")
  nativeFolder.add(formData, "addCustomCylinderPrimitive").name("顶点索引锥体")
  nativeFolder.add(formData, "addCustomNormalCylinderPrimitive").name("顶点法线锥体")
  nativeFolder.add(formData, "addBoxPrimitive").name("正方体")
  nativeAppearanceFolder = gui.addFolder("自定义Appearance")
  nativeAppearanceFolder.add(formData, "addCustomAppearance").name("正方体")
  customMaterialFolder = gui.addFolder("自定义Material")
  customMaterialFolder.add(formData, "addCustomMaterial").name("正方体")
  customMaterialFolder.add(formData, "addAnimationCustomMaterial").name("动画正方体")
  customFolder = gui.addFolder("自定义Primitive")
  customFolder.add(formData, "addCustomPrimitive").name("正方体")
  customFolder.add(formData, "removeCustomPrimitive").name("销毁正方体")
  gui.add(formData, "reset")
}

</script>

<style lang="scss" scoped>
.customPrimitive-wrap {

}
</style>
