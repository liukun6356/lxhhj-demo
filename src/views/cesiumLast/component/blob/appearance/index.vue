<template>
  <div class="appearance-wrap">
    <Tdt_img_d/>
  </div>
</template>

<script lang="ts" setup>
import {onMounted, onUnmounted} from "vue";
import GUI from "lil-gui";
import * as Cesium from "cesium";
import {usemapStore} from "@/store/modules/cesiumLastMap";
import rgbaPng from "./rgba.png"
import hdtJpg from "./hdt.png"
import img1 from "./img1.png"
import img2 from "./img2.png"
import waterNormalsJpg from "@/assets/images/cesiumMap/waterNormals.jpg";
// Component
import Tdt_img_d from "@/views/cesiumLast/component/main/controlPanel/layerManagement/basicMap/tdt_img_d.vue"

const mapStore = usemapStore()

onMounted(() => {
  // viewer.scene.light = new Cesium.DirectionalLight({
  //   direction: new Cesium.Cartesian3(0.0, 0.0, -1.0),
  //   color: Cesium.Color.fromCssColorString("#fff").withAlpha(0.5),
  //   intensity: 2
  // });
  // viewer.scene.globe.enableLighting = true;  // 启用光照
  // viewer.shadows = true;
  // viewer.scene.globe.shadows = Cesium.ShadowMode.ENABLED;
  // viewer.scene.shadowMap.enabled = true;
  // viewer.scene.shadowMap.softShadows = true;  // 柔和阴影，看起来更自然
  // viewer.scene.shadowMap.size = 2048;         // 分辨率，越大越清晰

  initGui()
  handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
  handler.setInputAction(onMouseClick, Cesium.ScreenSpaceEventType.LEFT_CLICK);
  viewer.scene.primitives.add(primitiveCollection);
})

onUnmounted(() => {
  // viewer.scene.globe.enableLighting = false;
  // viewer.shadows = false;
  viewer.scene.primitives.remove(primitiveCollection);
  gui.destroy()
})

const addAppearance = () => {
  const position = Cesium.Cartesian3.fromDegrees(114.347137, 30.541429, 0.5 * 1000);
  //地方矩阵
  const modelMatrix = Cesium.Transforms.eastNorthUpToFixedFrame(position);
  const v0 = [0.5, -0.5, 0.5];
  const v1 = [-0.5, -0.5, 0.5];
  const v2 = [-0.5, -0.5, -0.5];
  const v3 = [0.5, -0.5, -0.5];
  const v4 = [0.5, 0.5, -0.5];
  const v5 = [0.5, 0.5, 0.5];
  const v6 = [-0.5, 0.5, 0.5];
  const v7 = [-0.5, 0.5, -0.5];
  const rawVertex = [
    // 下 -z
    ...v2, ...v3, ...v4, ...v7,
    // 前 -y
    ...v2, ...v3, ...v0, ...v1,
    // 后 +y
    ...v4, ...v7, ...v6, ...v5,
    // 左 -x
    ...v7, ...v2, ...v1, ...v6,
    // 右 +x
    ...v3, ...v4, ...v5, ...v0,
    // 上 +z
    ...v1, ...v0, ...v5, ...v6,
  ];
  const positions = new Float64Array(rawVertex.map(v => v * 1000));// 定义位置数组,乘上box的长度
  const npx = [1, 0, 0];
  const nnx = [-1, 0, 0];
  const npy = [0, 1, 0];
  const nny = [0, -1, 0];
  const npz = [0, 0, 1];
  const nnz = [0, 0, -1];
  const normals = new Float32Array([//  定义法向数组
    // 下 -z
    ...nnz, ...nnz, ...nnz, ...nnz,
    // 前 -y
    ...nny, ...nny, ...nny, ...nny,
    // 后 +y
    ...npy, ...npy, ...npy, ...npy,
    // 左 -x
    ...nnx, ...nnx, ...nnx, ...nnx,
    // 右 +x
    ...npx, ...npx, ...npx, ...npx,
    // 上 +z
    ...npz, ...npz, ...npz, ...npz,
  ]);
  const sts = new Float32Array([ // 定义纹理数组
    0, 0, 1, 0, 1, 1, 0, 1,
    0, 0, 1, 0, 1, 1, 0, 1,
    0, 0, 1, 0, 1, 1, 0, 1,
    0, 0, 1, 0, 1, 1, 0, 1,
    0, 0, 1, 0, 1, 1, 0, 1,
    0, 0, 1, 0, 1, 1, 0, 1,
  ]);

  const indices = new Uint16Array([ // 定义索引
    0, 1, 2, 0, 2, 3,
    4, 5, 6, 4, 6, 7,
    8, 9, 10, 8, 10, 11,
    12, 13, 14, 12, 14, 15,
    16, 17, 18, 16, 18, 19,
    20, 21, 22, 20, 22, 23,
  ]);
  primitiveCollection.add(new Cesium.Primitive({
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
  }))
}

const addCustomAppearance = () => {
  const position = Cesium.Cartesian3.fromDegrees(114.347137, 30.541429, 0.5 * 1000);
  //地方矩阵
  const modelMatrix = Cesium.Transforms.eastNorthUpToFixedFrame(position);
  const v0 = [0.5, -0.5, 0.5];
  const v1 = [-0.5, -0.5, 0.5];
  const v2 = [-0.5, -0.5, -0.5];
  const v3 = [0.5, -0.5, -0.5];
  const v4 = [0.5, 0.5, -0.5];
  const v5 = [0.5, 0.5, 0.5];
  const v6 = [-0.5, 0.5, 0.5];
  const v7 = [-0.5, 0.5, -0.5];
  const rawVertex = [
    // 下 -z
    ...v2, ...v3, ...v4, ...v7,
    // 前 -y
    ...v2, ...v3, ...v0, ...v1,
    // 后 +y
    ...v4, ...v7, ...v6, ...v5,
    // 左 -x
    ...v7, ...v2, ...v1, ...v6,
    // 右 +x
    ...v3, ...v4, ...v5, ...v0,
    // 上 +z
    ...v1, ...v0, ...v5, ...v6,
  ];
  const positions = new Float64Array(rawVertex.map(v => v * 1000));// 定义位置数组,乘上box的长度
  const npx = [1, 0, 0];
  const nnx = [-1, 0, 0];
  const npy = [0, 1, 0];
  const nny = [0, -1, 0];
  const npz = [0, 0, 1];
  const nnz = [0, 0, -1];
  const normals = new Float32Array([//  定义法向数组
    // 下 -z
    ...nnz, ...nnz, ...nnz, ...nnz,
    // 前 -y
    ...nny, ...nny, ...nny, ...nny,
    // 后 +y
    ...npy, ...npy, ...npy, ...npy,
    // 左 -x
    ...nnx, ...nnx, ...nnx, ...nnx,
    // 右 +x
    ...npx, ...npx, ...npx, ...npx,
    // 上 +z
    ...npz, ...npz, ...npz, ...npz,
  ]);
  const sts = new Float32Array([ // 定义纹理数组
    0, 0, 1, 0, 1, 1, 0, 1,
    0, 0, 1, 0, 1, 1, 0, 1,
    0, 0, 1, 0, 1, 1, 0, 1,
    0, 0, 1, 0, 1, 1, 0, 1,
    0, 0, 1, 0, 1, 1, 0, 1,
    0, 0, 1, 0, 1, 1, 0, 1,
  ]);

  const indices = new Uint16Array([ // 定义索引
    0, 1, 2, 0, 2, 3,
    4, 5, 6, 4, 6, 7,
    8, 9, 10, 8, 10, 11,
    12, 13, 14, 12, 14, 15,
    16, 17, 18, 16, 18, 19,
    20, 21, 22, 20, 22, 23,
  ]);
  const myBox = primitiveCollection.add(new Cesium.Primitive({
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
  }))
  myBox.appearance.material = new Cesium.Material({
    fabric: {
      type: 'MyCustomShader1',
      uniforms: {
        image: img2,
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
    }
  })
}

  const addMaterialAppearanceColor = () => {
    reset()
    let positions = [[114.347137, 30.541429, 50], [114.347137, 30.551429, 100], [114.367137, 30.541429, 100], [114.367137, 30.551429, 100], [114.377137, 30.551429, 100]]

    positions = Cesium.Cartesian3.fromDegreesArrayHeights(positions.flat())
    const wall = new Cesium.WallGeometry({positions: positions})
    const geometry = Cesium.WallGeometry.createGeometry(wall)
    const instance = new Cesium.GeometryInstance({geometry: geometry})
    primitiveCollection.add(new Cesium.Primitive({
      geometryInstances: instance,
      asynchronous: false, // 关闭异步
      // 对于所有的几何对象都适用，cesium的材质包括颜色，图片，法线贴图，凹凸贴图，网格贴图，棋盘贴图
      appearance: new Cesium.MaterialAppearance({
        material: new Cesium.Material({
          fabric: {
            type: 'Color',
            uniforms: {
              // color: Cesium.Color.RED // rgba 颜色对象
              color: Cesium.Color.fromCssColorString('#2AE018').withAlpha(1)
            }
          }
        })
      })
    }))
    viewer.camera.flyToBoundingSphere(geometry.boundingSphere);
  }

  const addMaterialAppearanceImage = () => {
    reset()
    const sphere = new Cesium.SphereGeometry({radius: 100.0})
    const geometry = Cesium.SphereGeometry.createGeometry(sphere)
    const modelMatrix = Cesium.Transforms.eastNorthUpToFixedFrame(Cesium.Cartesian3.fromDegrees(114.347137, 30.541429, 100))
    const instance = new Cesium.GeometryInstance({
      geometry: geometry,
      modelMatrix
    })
    primitiveCollection.add(new Cesium.Primitive({
      geometryInstances: instance,
      asynchronous: false, // 关闭异步
      appearance: new Cesium.MaterialAppearance({
        material: new Cesium.Material({
          fabric: {
            type: 'Image',
            uniforms: {
              image: rgbaPng, // 图像的路径
              repeat: new Cesium.Cartesian2(2, 1) // 可调整重复次数
            }
          }
        })
      })
    }))
    const worldBoundingSphere = Cesium.BoundingSphere.transform(geometry.boundingSphere, modelMatrix, new Cesium.BoundingSphere());
    viewer.camera.flyToBoundingSphere(worldBoundingSphere);
  }

  const addMaterialAppearanceDiffuseMap = () => {
    reset()
    const sphere = new Cesium.SphereGeometry({radius: 100.0})
    const geometry = Cesium.SphereGeometry.createGeometry(sphere)
    const modelMatrix = Cesium.Transforms.eastNorthUpToFixedFrame(Cesium.Cartesian3.fromDegrees(114.347137, 30.541429, 100))
    const instance = new Cesium.GeometryInstance({
      geometry: geometry,
      modelMatrix
    })
    primitiveCollection.add(new Cesium.Primitive({
      geometryInstances: instance,
      asynchronous: false, // 关闭异步
      // 用于颜色显示
      appearance: new Cesium.MaterialAppearance({
        material: new Cesium.Material({
          fabric: {
            type: 'DiffuseMap',
            uniforms: {
              image: rgbaPng, // 图像的路径
              repeat: new Cesium.Cartesian2(2, 1), // 可调整重复次数
              channels: 'rgb' // 图像通道,需三个字符串,包含 r、g、b 和 a 的任意组合
              // rgb 显示完整彩色图像，忽略 Alpha
              // rrr 将红色通道同时用作 R、G、B，实现单通道可视化
              // aaa 使用透明度通道制作灰度图可视化
            }
          }
        })
      })
    }))
    const worldBoundingSphere = Cesium.BoundingSphere.transform(geometry.boundingSphere, modelMatrix, new Cesium.BoundingSphere());
    viewer.camera.flyToBoundingSphere(worldBoundingSphere);
  }

  const addMaterialAppearanceAlphaMap = () => {
    reset()
    const sphere = new Cesium.SphereGeometry({radius: 100.0})
    const geometry = Cesium.SphereGeometry.createGeometry(sphere)
    const modelMatrix = Cesium.Transforms.eastNorthUpToFixedFrame(Cesium.Cartesian3.fromDegrees(114.347137, 30.541429, 100))
    const instance = new Cesium.GeometryInstance({
      geometry: geometry,
      modelMatrix
    })
    primitiveCollection.add(new Cesium.Primitive({
      geometryInstances: instance,
      asynchronous: false, // 关闭异步
      // 	不显示颜色,仅使用纹理 灰度值（或单通道值）作为透明度值
      appearance: new Cesium.MaterialAppearance({
        material: new Cesium.Material({
          fabric: {
            type: 'AlphaMap',
            uniforms: {
              image: rgbaPng, // 图像的路径
              repeat: new Cesium.Cartesian2(2, 1), // 可调整重复次数
              channel: 'r',// 一个包含 r、g、b 或 a 的字符串，用于选择所需的图像通道
            }
          }
        })
      })
    }))
    const worldBoundingSphere = Cesium.BoundingSphere.transform(geometry.boundingSphere, modelMatrix, new Cesium.BoundingSphere());
    viewer.camera.flyToBoundingSphere(worldBoundingSphere);
  }

  const addMaterialAppearanceSpecularMap = () => {
    reset()
    const sphere = new Cesium.SphereGeometry({radius: 100.0})
    const geometry = Cesium.SphereGeometry.createGeometry(sphere)
    const modelMatrix = Cesium.Transforms.eastNorthUpToFixedFrame(Cesium.Cartesian3.fromDegrees(114.347137, 30.541429, 100))
    const instance = new Cesium.GeometryInstance({
      geometry: geometry,
      modelMatrix
    })
    primitiveCollection.add(new Cesium.Primitive({
      geometryInstances: instance,
      asynchronous: false, // 关闭异步
      // 	不显示颜色,仅使用纹理 灰度值（或单通道值）作为透明度值
      appearance: new Cesium.MaterialAppearance({
        material: new Cesium.Material({
          fabric: {
            type: 'SpecularMap',
            uniforms: {
              image: rgbaPng, // 图像的路径
              repeat: new Cesium.Cartesian2(2, 1), // 可调整重复次数
              channel: 'b',// 一个包含 r、g、b 或 a 的字符串，用于选择所需的图像通道
            }
          }
        })
      })
    }))
    const worldBoundingSphere = Cesium.BoundingSphere.transform(geometry.boundingSphere, modelMatrix, new Cesium.BoundingSphere());
    viewer.camera.flyToBoundingSphere(worldBoundingSphere);
  }

  const addMaterialAppearanceEmissionMap = () => {
    reset()
    const sphere = new Cesium.SphereGeometry({radius: 100.0})
    const geometry = Cesium.SphereGeometry.createGeometry(sphere)
    const modelMatrix = Cesium.Transforms.eastNorthUpToFixedFrame(Cesium.Cartesian3.fromDegrees(114.347137, 30.541429, 100))
    const instance = new Cesium.GeometryInstance({
      geometry: geometry,
      modelMatrix
    })
    primitiveCollection.add(new Cesium.Primitive({
      geometryInstances: instance,
      asynchronous: false, // 关闭异步
      // 	不显示颜色,仅使用纹理 灰度值（或单通道值）作为透明度值
      appearance: new Cesium.MaterialAppearance({
        material: new Cesium.Material({
          fabric: {
            type: 'EmissionMap',
            uniforms: {
              image: rgbaPng, // 图像的路径
              repeat: new Cesium.Cartesian2(2, 1), // 可调整重复次数
              channels: 'rgb',// 图像通道,需三个字符串,包含 r、g、b 和 a 的任意组合
            }
          }
        })
      })
    }))
    const worldBoundingSphere = Cesium.BoundingSphere.transform(geometry.boundingSphere, modelMatrix, new Cesium.BoundingSphere());
    viewer.camera.flyToBoundingSphere(worldBoundingSphere);
  }

  const addMaterialAppearanceBumpMap = () => {
    reset()
    const globe = viewer.scene.globe
    let material = Cesium.Material.fromType("NormalMap");
    let contourUniforms = material.uniforms;
    contourUniforms.image = rgbaPng
    contourUniforms.repeat = new Cesium.Cartesian2(1, 1);
    contourUniforms.channel = 'rgb';
    contourUniforms.strength = 0.5;
    globe.material = material

    const sphere = new Cesium.SphereGeometry({radius: 100.0})
    const geometry = Cesium.SphereGeometry.createGeometry(sphere)
    const modelMatrix = Cesium.Transforms.eastNorthUpToFixedFrame(Cesium.Cartesian3.fromDegrees(114.347137, 30.541429, 100))
    const instance = new Cesium.GeometryInstance({
      geometry: geometry,
      modelMatrix
    })
    primitiveCollection.add(new Cesium.Primitive({
      geometryInstances: instance,
      asynchronous: false, // 关闭异步
      // 	不显示颜色,仅使用纹理 灰度值（或单通道值）作为透明度值
      appearance: new Cesium.MaterialAppearance({
        material: new Cesium.Material({
          fabric: {
            type: 'BumpMap',
            uniforms: {
              image: hdtJpg, // 图像的路径
              repeat: new Cesium.Cartesian2(1, 1), // 可调整重复次数
              channel: 'a',
              strength: 0.5
            },
          }
        }),
        faceForward: true
      })
    }))
    const worldBoundingSphere = Cesium.BoundingSphere.transform(geometry.boundingSphere, modelMatrix, new Cesium.BoundingSphere());
    viewer.camera.flyToBoundingSphere(worldBoundingSphere);
  }

  const addMaterialAppearanceNormalMap = () => {
    reset()
    const sphere = new Cesium.SphereGeometry({radius: 100.0})
    const geometry = Cesium.SphereGeometry.createGeometry(sphere)
    const modelMatrix = Cesium.Transforms.eastNorthUpToFixedFrame(Cesium.Cartesian3.fromDegrees(114.347137, 30.541429, 100))
    const instance = new Cesium.GeometryInstance({geometry, modelMatrix})
    primitiveCollection.add(new Cesium.Primitive({
      geometryInstances: instance,
      asynchronous: false, // 关闭异步
      // 	不显示颜色,仅使用纹理 灰度值（或单通道值）作为透明度值
      appearance: new Cesium.MaterialAppearance({
        material: new Cesium.Material({
          fabric: {
            type: 'NormalMap',
            uniforms: {
              image: hdtJpg, // 图像的路径
              repeat: new Cesium.Cartesian2(2, 1), // 可调整重复次数
              channels: 'rgb',
              strength: 1
            },
          }
        })
      })
    }))
    const worldBoundingSphere = Cesium.BoundingSphere.transform(geometry.boundingSphere, modelMatrix, new Cesium.BoundingSphere());
    viewer.camera.flyToBoundingSphere(worldBoundingSphere);
  }

  const addMaterialAppearanceGrid = () => {
    reset()
    const positions = [[114.347137, 30.541429, 50], [114.347137, 30.551429, 50], [114.367137, 30.541429, 50]]
    const circle = new Cesium.RectangleGeometry({
      rectangle: Cesium.Rectangle.fromCartesianArray(Cesium.Cartesian3.fromDegreesArrayHeights(positions.flat())),
      height: 1000,// 高度
      // extrudedHeight: 500// 拉伸高度
    })
    const geometry = Cesium.RectangleGeometry.createGeometry(circle)
    const instance = new Cesium.GeometryInstance({geometry: geometry})
    primitiveCollection.add(new Cesium.Primitive({
      geometryInstances: instance,
      asynchronous: false, // 关闭异步
      appearance: new Cesium.MaterialAppearance({
        material: new Cesium.Material({
          fabric: {
            type: 'Grid',
            uniforms: {
              color: Cesium.Color.BLACK, // 材质的 rgba 颜色对象
              cellAlpha: 0.1,// 网格线之间的单元格的 Alpha 值
              lineCount: new Cesium.Cartesian2(2, 1),// 具有 x 和 y 值的对象，分别指定列数和行数
              lineThickness: new Cesium.Cartesian2(2.0, 2.0),//具有 x 和 y 值的对象，指定网格线的粗细
              lineOffset: new Cesium.Cartesian2(0, 1),// 具有 x 和 y 值的对象，指定网格线的偏移量
            }
          }
        })
      })
    }))
    viewer.camera.flyToBoundingSphere(geometry.boundingSphere);
  }

  const addMaterialAppearanceStripe = () => {
    reset()
    const positions = [[114.347137, 30.541429, 50], [114.347137, 30.551429, 50], [114.367137, 30.541429, 50]]
    const circle = new Cesium.RectangleGeometry({
      rectangle: Cesium.Rectangle.fromCartesianArray(Cesium.Cartesian3.fromDegreesArrayHeights(positions.flat())),
      height: 1000,// 高度
      // extrudedHeight: 500// 拉伸高度
    })
    const geometry = Cesium.RectangleGeometry.createGeometry(circle)
    const instance = new Cesium.GeometryInstance({geometry: geometry})
    primitiveCollection.add(new Cesium.Primitive({
      geometryInstances: instance,
      asynchronous: false, // 关闭异步
      appearance: new Cesium.MaterialAppearance({
        material: new Cesium.Material({
          fabric: {
            type: 'Stripe',
            uniforms: {
              horizontal: false,//确定条纹是水平还是垂直
              evenColor: Cesium.Color.WHITE.withAlpha(0.5), // 条纹第一种颜色的 rgba 颜色对象
              oddColor: Cesium.Color.BLACK.withAlpha(0.5),//条纹第二种颜色的 rgba 颜色对象
              offset: 0,// 控制在图案中的哪个点开始绘制的数字；其中 0.0 是偶数颜色的开始，1.0 是奇数颜色的开始，2.0 再次是偶数颜色
              repeat: 10,//控制条纹总数的数字，一半亮一半暗
            }
          }
        })
      })
    }))
    viewer.camera.flyToBoundingSphere(geometry.boundingSphere);
  }

  const addMaterialAppearanceCheckerboard = () => {
    reset()
    const positions = [[114.347137, 30.541429, 50], [114.347137, 30.551429, 50], [114.367137, 30.541429, 50]]
    const circle = new Cesium.RectangleGeometry({
      rectangle: Cesium.Rectangle.fromCartesianArray(Cesium.Cartesian3.fromDegreesArrayHeights(positions.flat())),
      height: 100,// 高度
      // extrudedHeight: 500// 拉伸高度
    })
    const geometry = Cesium.RectangleGeometry.createGeometry(circle)
    const instance = new Cesium.GeometryInstance({geometry: geometry})
    primitiveCollection.add(new Cesium.Primitive({
      geometryInstances: instance,
      asynchronous: false, // 关闭异步
      appearance: new Cesium.MaterialAppearance({
        material: new Cesium.Material({
          fabric: {
            type: 'Checkerboard',
            uniforms: {
              lightColor: Cesium.Color.WHITE.withAlpha(0.5), //  用于棋盘的光交替颜色的 rgba 颜色对象
              darkColor: Cesium.Color.BLACK.withAlpha(0.5),//用于棋盘的深色交替颜色的 rgba 颜色对象
              repeat: new Cesium.Cartesian2(3, 3),// 具有 x 和 y 值的对象，分别指定列数和行数
            }
          }
        })
      })
    }))
    viewer.camera.flyToBoundingSphere(geometry.boundingSphere);
  }

  const addMaterialAppearanceDot = () => {
    reset()
    const positions = [[114.347137, 30.541429, 50], [114.347137, 30.551429, 50], [114.367137, 30.541429, 50]]
    const circle = new Cesium.RectangleGeometry({
      rectangle: Cesium.Rectangle.fromCartesianArray(Cesium.Cartesian3.fromDegreesArrayHeights(positions.flat())),
      height: 100,// 高度
      // extrudedHeight: 500// 拉伸高度
    })
    const geometry = Cesium.RectangleGeometry.createGeometry(circle)
    const instance = new Cesium.GeometryInstance({geometry: geometry})
    primitiveCollection.add(new Cesium.Primitive({
      geometryInstances: instance,
      asynchronous: false, // 关闭异步
      appearance: new Cesium.MaterialAppearance({
        material: new Cesium.Material({
          fabric: {
            type: 'Dot',
            uniforms: {
              lightColor: Cesium.Color.WHITE.withAlpha(0.5), //  用于棋盘的光交替颜色的 rgba 颜色对象
              darkColor: Cesium.Color.BLACK.withAlpha(0.5),//用于棋盘的深色交替颜色的 rgba 颜色对象
              repeat: new Cesium.Cartesian2(2, 1),// 具有 x 和 y 值的对象，分别指定列数和行数
            }
          }
        })
      })
    }))
    viewer.camera.flyToBoundingSphere(geometry.boundingSphere);
  }

  const addEllipsoidSurfaceAppearanceWater = () => {
    reset()
    const positions = [[114.347137, 30.541429, 50], [114.347137, 30.551429, 50], [114.367137, 30.541429, 50]]
    const circle = new Cesium.RectangleGeometry({
      rectangle: Cesium.Rectangle.fromCartesianArray(Cesium.Cartesian3.fromDegreesArrayHeights(positions.flat())),
      height: 100,// 高度
      // extrudedHeight: 500// 拉伸高度
    })
    const geometry = Cesium.RectangleGeometry.createGeometry(circle)
    const instance = new Cesium.GeometryInstance({geometry: geometry})
    primitiveCollection.add(new Cesium.Primitive({
      geometryInstances: instance,
      asynchronous: false, // 关闭异步
      appearance: new Cesium.EllipsoidSurfaceAppearance({
        material: new Cesium.Material({
          fabric: {
            type: 'Water',
            uniforms: {
              baseWaterColor: new Cesium.Color.fromCssColorString('#7B8773').withAlpha(0.9),// 水的基色。
              blendColor: new Cesium.Color.fromCssColorString('#7B8773').withAlpha(0.9),//从水混合到非水区域时使用的 rgba 颜色对象
              // specularMap:"",//用于指示水域的单通道纹理
              normalMap: waterNormalsJpg,//水法线扰动的法线贴图
              frequency: 9000.0,// 控制波数
              animationSpeed: 0.03,//  控制水的动画速度
              amplitude: 5, // 控制水波振幅
              specularIntensity: 1,// 控制镜面反射强度
            }
          }
        })
      })
    }))
    viewer.camera.flyToBoundingSphere(geometry.boundingSphere);
  }

  const addMultInstanceGeometry = () => {
    reset()
    const instances = [];
    const positions = []; // 记录用于计算 boundingSphere
    let boxGeometry = Cesium.BoxGeometry.fromDimensions({dimensions: new Cesium.Cartesian3(100, 100, 100)})
    for (let i = 0; i < 100000; i++) {
      const position = Cesium.Cartesian3.fromDegrees(114.347137 + Math.random(), 30.541429 + Math.random(), 200 + Math.random() * 100)
      const instance = new Cesium.GeometryInstance({
        geometry: boxGeometry,
        modelMatrix: Cesium.Transforms.eastNorthUpToFixedFrame(position),//通过modelMatrix设置不同的位置
        id: "BoxGeometry" + i,
        // 每个实例几何颜色得值和类型信息
        attributes: {color: Cesium.ColorGeometryInstanceAttribute.fromColor(Cesium.Color.fromRandom({alpha: 1}))}
      });
      instances.push(instance);
      positions.push(position)
    }
    primitiveCollection.add(new Cesium.Primitive({
      geometryInstances: instances,
      // appearance: new Cesium.EllipsoidSurfaceAppearance({material: Cesium.Material.fromType('Color')}),
      appearance: new Cesium.PerInstanceColorAppearance({flat: true, translucent: false})// 具有颜色属性得geometryInstance实例的外观
    }));
    // 计算一个包含笛卡尔点坐标得紧合边界球
    const boundingSphere = Cesium.BoundingSphere.fromPoints(positions);
    viewer.camera.flyToBoundingSphere(boundingSphere);
  }

  const addMaterialAppearancRimLighting = () => {
    reset()
    const positions = [[114.347137, 30.541429, 50], [114.347137, 30.551429, 50], [114.367137, 30.541429, 50]]
    const circle = new Cesium.RectangleGeometry({
      rectangle: Cesium.Rectangle.fromCartesianArray(Cesium.Cartesian3.fromDegreesArrayHeights(positions.flat())),
      height: 200,// 高度
      extrudedHeight: 100// 拉伸高度
    })
    const geometry = Cesium.RectangleGeometry.createGeometry(circle)
    const instance = new Cesium.GeometryInstance({geometry: geometry})
    primitiveCollection.add(new Cesium.Primitive({
      geometryInstances: instance,
      asynchronous: false, // 关闭异步
      appearance: new Cesium.MaterialAppearance({
        material: new Cesium.Material({
          fabric: {
            type: 'RimLighting',
            uniforms: {
              color: new Cesium.Color.fromCssColorString('rgba(255,255,255,0.37)').withAlpha(0.2),
              rimWidth: 1,
              rimColor: new Cesium.Color.fromCssColorString('rgb(215,10,10)').withAlpha(1)
            }
          }
        })
      })
    }))
    viewer.camera.flyToBoundingSphere(geometry.boundingSphere);
  }

  const addMaterialAppearancFade = () => {
    reset()
    const positions = [[114.347137, 30.541429, 50], [114.347137, 30.551429, 50], [114.367137, 30.541429, 50]]
    const circle = new Cesium.RectangleGeometry({
      rectangle: Cesium.Rectangle.fromCartesianArray(Cesium.Cartesian3.fromDegreesArrayHeights(positions.flat())),
      height: 1000,// 高度
      // extrudedHeight: 500// 拉伸高度
    })
    const geometry = Cesium.RectangleGeometry.createGeometry(circle)
    const instance = new Cesium.GeometryInstance({geometry: geometry})
    primitiveCollection.add(new Cesium.Primitive({
      geometryInstances: instance,
      asynchronous: false, // 关闭异步
      appearance: new Cesium.MaterialAppearance({
        material: new Cesium.Material({
          fabric: {
            type: 'Fade',
            uniforms: {
              fadeInColor: Cesium.Color.RED.withAlpha(1.0),
              fadeOutColor: Cesium.Color.BLUE.withAlpha(1),
              maximumDistance: 0.5,
            }
          }
        })
      })
    }))
    viewer.camera.flyToBoundingSphere(geometry.boundingSphere);
  }

  const addPolylineMaterialAppearanceArrow = () => {
    reset()
    let positions = [[114.347137, 30.541429, 50], [114.347137, 30.551429, 100], [114.367137, 30.541429, 100], [114.367137, 30.551429, 100], [114.377137, 30.551429, 100]]
    positions = Cesium.Cartesian3.fromDegreesArrayHeights(positions.flat())
    const polygon = new Cesium.PolylineGeometry({
      positions: positions,
      width: 10,
    })
    const geometry = Cesium.PolylineGeometry.createGeometry(polygon)
    const instance = new Cesium.GeometryInstance({geometry: geometry})
    primitiveCollection.add(new Cesium.Primitive({
      geometryInstances: instance,
      asynchronous: false, // 关闭异步
      appearance: new Cesium.PolylineMaterialAppearance({ // 需要使用专门的PolylineMaterialAppearance外观
        material: new Cesium.Material({
          fabric: {
            type: 'PolylineArrow',
            uniforms: {color: Cesium.Color.RED}
          }
        })
      })
    }))
    viewer.camera.flyToBoundingSphere(geometry.boundingSphere);
  }

  const addPolylineMaterialAppearanceDash = () => {
    reset()
    let positions = [[114.347137, 30.541429, 50], [114.347137, 30.551429, 100], [114.367137, 30.541429, 100], [114.367137, 30.551429, 100], [114.377137, 30.551429, 100]]

    positions = Cesium.Cartesian3.fromDegreesArrayHeights(positions.flat())
    const polygon = new Cesium.PolylineGeometry({
      positions: positions,
      width: 10,
    })
    const geometry = Cesium.PolylineGeometry.createGeometry(polygon)
    const instance = new Cesium.GeometryInstance({geometry: geometry})
    primitiveCollection.add(new Cesium.Primitive({
      geometryInstances: instance,
      asynchronous: false, // 关闭异步
      appearance: new Cesium.PolylineMaterialAppearance({ // 需要使用专门的PolylineMaterialAppearance外观
        material: new Cesium.Material({
          fabric: {
            type: 'PolylineDash',
            uniforms: {
              color: new Cesium.Color.fromCssColorString('rgb(215,10,10)').withAlpha(1),
              gapColor: new Cesium.Color.fromCssColorString('rgb(63,78,129)').withAlpha(1),
              dashLength: 16,//以像素为单位的虚线长度
              // dashPattern:0xffffff,//线条的 16 位点画图案
            }
          }
        })
      })
    }))
    viewer.camera.flyToBoundingSphere(geometry.boundingSphere);
  }

  const addPolylineMaterialAppearanceGlow = () => {
    reset()
    let positions = [[114.347137, 30.541429, 50], [114.347137, 30.551429, 100], [114.367137, 30.541429, 100], [114.367137, 30.551429, 100], [114.377137, 30.551429, 100]]

    positions = Cesium.Cartesian3.fromDegreesArrayHeights(positions.flat())
    const polygon = new Cesium.PolylineGeometry({
      positions: positions,
      width: 10,
    })
    const geometry = Cesium.PolylineGeometry.createGeometry(polygon)
    const instance = new Cesium.GeometryInstance({geometry: geometry})
    primitiveCollection.add(new Cesium.Primitive({
      geometryInstances: instance,
      asynchronous: false, // 关闭异步
      appearance: new Cesium.PolylineMaterialAppearance({ // 需要使用专门的PolylineMaterialAppearance外观
        material: new Cesium.Material({
          fabric: {
            type: 'PolylineGlow',
            uniforms: {
              color: new Cesium.Color.fromCssColorString('rgb(215,10,10)').withAlpha(1),//线内部的漫反射颜色
              outlineColor: new Cesium.Color.fromCssColorString('rgb(63,78,129)').withAlpha(1),//轮廓的漫反射颜色
              outlineWidth: 16,//轮廓的宽度
            }
          }
        })
      })
    }))
    viewer.camera.flyToBoundingSphere(geometry.boundingSphere);
  }

  const addPolylineMaterialAppearanceOutline = () => {
    reset()
    let positions = [[114.347137, 30.541429, 50], [114.347137, 30.551429, 100], [114.367137, 30.541429, 100], [114.367137, 30.551429, 100], [114.377137, 30.551429, 100]]

    positions = Cesium.Cartesian3.fromDegreesArrayHeights(positions.flat())
    const polygon = new Cesium.PolylineGeometry({
      positions: positions,
      width: 10,
    })
    const geometry = Cesium.PolylineGeometry.createGeometry(polygon)
    const instance = new Cesium.GeometryInstance({geometry: geometry})
    primitiveCollection.add(new Cesium.Primitive({
      geometryInstances: instance,
      asynchronous: false, // 关闭异步
      appearance: new Cesium.PolylineMaterialAppearance({ // 需要使用专门的PolylineMaterialAppearance外观
        material: new Cesium.Material({
          fabric: {
            type: 'PolylineOutline',
            uniforms: {
              color: new Cesium.Color.fromCssColorString('rgb(215,10,10)').withAlpha(1),//线内部的漫反射颜色
              outlineColor: new Cesium.Color.fromCssColorString('rgb(63,78,129)').withAlpha(1),//轮廓的漫反射颜色
              outlineWidth: 30,//轮廓的宽度
            }
          }
        })
      })
    }))
    viewer.camera.flyToBoundingSphere(geometry.boundingSphere);
  }

  const addMaterialAppearanceElevationContour = () => {
    reset()
    const globe = viewer.scene.globe
    let material = Cesium.Material.fromType("ElevationContour");
    let contourUniforms = material.uniforms;
    contourUniforms.width = 12.0;
    contourUniforms.spacing = 100;
    contourUniforms.color = Cesium.Color.RED;
    globe.material = material
  }

  const addPolylineColorAppearanceOutline = () => {
    reset()
    let positions = [[114.347137, 30.541429, 50], [114.347137, 30.551429, 100], [114.367137, 30.541429, 100], [114.367137, 30.551429, 100], [114.377137, 30.551429, 100]]
    positions = Cesium.Cartesian3.fromDegreesArrayHeights(positions.flat())
    const polygon = new Cesium.PolylineGeometry({
      positions: positions,
      width: 2,
    })
    const geometry = Cesium.PolylineGeometry.createGeometry(polygon)
    const instance = new Cesium.GeometryInstance({
      geometry: geometry,
      attributes: {
        color: Cesium.ColorGeometryInstanceAttribute.fromColor(Cesium.Color.RED.withAlpha(0.8))
      }
    })
    primitiveCollection.add(new Cesium.Primitive({
      geometryInstances: instance,
      asynchronous: false, // 关闭异步
      appearance: new Cesium.PolylineColorAppearance({
        translucent: true
      })
    }))
    viewer.camera.flyToBoundingSphere(geometry.boundingSphere);
  }

  const reset = () => {
    primitiveCollection.removeAll()
    viewer.scene.globe.material = null
  }

// 地图逻辑
  const viewer = mapStore.getCesiumViewer();
  let handler
  const primitiveCollection = new Cesium.PrimitiveCollection()

  const onMouseClick = (movement) => {
    const pickedObject = viewer.scene.pick(movement.position);
    console.log(pickedObject, 123)
  }

// lil-gui逻辑
  let gui, appearanceFolder, materialAppearanceFolder,
      EllipsoidSurfaceAppearanceFolder, PerInstanceColorAppearanceFolder,
      PolylineMaterialAppearanceFolder, PolylineColorAppearanceFolder
  const formData = {
    addAppearance,
    addCustomAppearance,
    addMaterialAppearanceColor,
    addMaterialAppearanceImage,
    addMaterialAppearanceDiffuseMap,
    addMaterialAppearanceAlphaMap,
    addMaterialAppearanceSpecularMap,
    addMaterialAppearanceEmissionMap,
    addMaterialAppearanceBumpMap,
    addMaterialAppearanceNormalMap,
    addMaterialAppearanceGrid,
    addMaterialAppearanceStripe,
    addMaterialAppearanceCheckerboard,
    addMaterialAppearanceDot,
    addEllipsoidSurfaceAppearanceWater,
    addMultInstanceGeometry,
    addMaterialAppearancRimLighting,
    addMaterialAppearancFade,
    addPolylineMaterialAppearanceArrow,
    addPolylineMaterialAppearanceDash,
    addPolylineMaterialAppearanceGlow,
    addPolylineMaterialAppearanceOutline,
    addMaterialAppearanceElevationContour,
    addPolylineColorAppearanceOutline,
    reset
  }
  const initGui = () => {
    gui = new GUI({title: "appearance外观"});
    appearanceFolder = gui.addFolder("primitive构成")
    appearanceFolder.add(formData, "addAppearance").name("添加原生Appearance")
    appearanceFolder.add(formData, "addCustomAppearance").name("添加自定义Appearance")
    materialAppearanceFolder = gui.addFolder("材质外观 Material")
    materialAppearanceFolder.add(formData, "addMaterialAppearanceColor").name("颜色")
    materialAppearanceFolder.add(formData, "addMaterialAppearanceImage").name("图片")
    materialAppearanceFolder.add(formData, "addMaterialAppearanceDiffuseMap").name("漫反射贴图")
    materialAppearanceFolder.add(formData, "addMaterialAppearanceAlphaMap").name("阿尔法贴图")
    materialAppearanceFolder.add(formData, "addMaterialAppearanceSpecularMap").name("高光贴图")
    materialAppearanceFolder.add(formData, "addMaterialAppearanceEmissionMap").name("排放贴图")
    materialAppearanceFolder.add(formData, "addMaterialAppearanceBumpMap").name("凹凸贴图.")
    materialAppearanceFolder.add(formData, "addMaterialAppearanceNormalMap").name("法线贴图.")
    materialAppearanceFolder.add(formData, "addMaterialAppearanceGrid").name("网格")
    materialAppearanceFolder.add(formData, "addMaterialAppearanceStripe").name("条纹")
    materialAppearanceFolder.add(formData, "addMaterialAppearanceCheckerboard").name("棋盘")
    materialAppearanceFolder.add(formData, "addMaterialAppearanceDot").name("点")
    materialAppearanceFolder.add(formData, "addMaterialAppearancRimLighting").name("边缘照明")
    materialAppearanceFolder.add(formData, "addMaterialAppearancFade").name("褪色")
    materialAppearanceFolder.add(formData, "addMaterialAppearanceElevationContour").name("等高线")
    EllipsoidSurfaceAppearanceFolder = gui.addFolder("椭球体表面外观 EllipsoidSurface")
    EllipsoidSurfaceAppearanceFolder.add(formData, "addEllipsoidSurfaceAppearanceWater").name("水")
    PerInstanceColorAppearanceFolder = gui.addFolder("实例化材质外观 PerInstanceColor")
    PerInstanceColorAppearanceFolder.add(formData, "addMultInstanceGeometry").name("多几何不同外观实例")
    PolylineMaterialAppearanceFolder = gui.addFolder("线几何材质外观 PolylineMaterialAppearance")
    PolylineMaterialAppearanceFolder.add(formData, "addPolylineMaterialAppearanceArrow").name("折线箭头")
    PolylineMaterialAppearanceFolder.add(formData, "addPolylineMaterialAppearanceDash").name("折线虚线")
    PolylineMaterialAppearanceFolder.add(formData, "addPolylineMaterialAppearanceGlow").name("折线发光")
    PolylineMaterialAppearanceFolder.add(formData, "addPolylineMaterialAppearanceOutline").name("折线轮廓")
    PolylineColorAppearanceFolder = gui.addFolder("线几何颜色外观 PolylineColorAppearance")
    PolylineColorAppearanceFolder.add(formData, "addPolylineColorAppearanceOutline").name("折线")
    gui.add(formData, "reset")
  }
</script>

<style lang="scss" scoped>
.appearance-wrap {

}
</style>
