<template>
  <div class="appearance-wrap">
    <Tdt_img_d/>
  </div>
</template>

<script lang="ts" setup>
import {onMounted, onUnmounted} from "vue";
import GUI from "lil-gui";
import {usemapStore} from "@/store/modules/cesiumMap";
import heartPng from "@/assets/images/three/heart.png"
import rgbaPng from "./rgba.png"
import waterNormalsJpg from "@/assets/images/cesiumMap/waterNormals.jpg";
// Component
import Tdt_img_d from "@/views/cesium/component/main/controlPanel/layerManagement/basicMap/tdt_img_d.vue"

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

const addMaterialAppearanceColor = () => {
  reset()
  let positions = [[120.1111, 30.1111, 1000], [120.1111, 30.2222, 2000], [120.3333, 30.1111, 3000], [120.3333, 30.2222, 4000], [120.4444, 30.2222, 5000]]
  positions = Cesium.Cartesian3.fromDegreesArrayHeights(positions.flat())
  const wall = new Cesium.WallGeometry({positions: positions})
  const geometry = Cesium.WallGeometry.createGeometry(wall)
  const instance = new Cesium.GeometryInstance({geometry: geometry})
  primitiveCollection.add(new Cesium.Primitive({
    geometryInstances: instance,
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
  const modelMatrix = Cesium.Transforms.eastNorthUpToFixedFrame(Cesium.Cartesian3.fromDegrees(120.0, 30.0, 5000))
  const instance = new Cesium.GeometryInstance({
    geometry: geometry,
    modelMatrix
  })
  primitiveCollection.add(new Cesium.Primitive({
    geometryInstances: instance,
    appearance: new Cesium.MaterialAppearance({
      material: new Cesium.Material({
        fabric: {
          type: 'Image',
          uniforms: {
            image: heartPng, // 图像的路径
            repeat: new Cesium.Cartesian2(10, 10) // 可调整重复次数
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
  const modelMatrix = Cesium.Transforms.eastNorthUpToFixedFrame(Cesium.Cartesian3.fromDegrees(120.0, 30.0, 5000))
  const instance = new Cesium.GeometryInstance({
    geometry: geometry,
    modelMatrix
  })
  primitiveCollection.add(new Cesium.Primitive({
    geometryInstances: instance,
    // 用于颜色显示
    appearance: new Cesium.MaterialAppearance({
      material: new Cesium.Material({
        fabric: {
          type: 'DiffuseMap',
          uniforms: {
            image: heartPng, // 图像的路径
            repeat: new Cesium.Cartesian2(10, 10), // 可调整重复次数
            channels: 'rrr' // 图像通道,需三个字符串,包含 r、g、b 和 a 的任意组合
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
  const modelMatrix = Cesium.Transforms.eastNorthUpToFixedFrame(Cesium.Cartesian3.fromDegrees(120.0, 30.0, 5000))
  const instance = new Cesium.GeometryInstance({
    geometry: geometry,
    modelMatrix
  })
  primitiveCollection.add(new Cesium.Primitive({
    geometryInstances: instance,
    // 	不显示颜色,仅使用纹理 灰度值（或单通道值）作为透明度值
    appearance: new Cesium.MaterialAppearance({
      material: new Cesium.Material({
        fabric: {
          type: 'AlphaMap',
          uniforms: {
            image: rgbaPng, // 图像的路径
            repeat: new Cesium.Cartesian2(10, 10), // 可调整重复次数
            channel: 'b',// 一个包含 r、g、b 或 a 的字符串，用于选择所需的图像通道
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
  const modelMatrix = Cesium.Transforms.eastNorthUpToFixedFrame(Cesium.Cartesian3.fromDegrees(120.0, 30.0, 5000))
  const instance = new Cesium.GeometryInstance({
    geometry: geometry,
    modelMatrix
  })
  primitiveCollection.add(new Cesium.Primitive({
    geometryInstances: instance,
    // 	不显示颜色,仅使用纹理 灰度值（或单通道值）作为透明度值
    appearance: new Cesium.MaterialAppearance({
      material: new Cesium.Material({
        fabric: {
          type: 'SpecularMap',
          uniforms: {
            image: rgbaPng, // 图像的路径
            repeat: new Cesium.Cartesian2(10, 10), // 可调整重复次数
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
  const modelMatrix = Cesium.Transforms.eastNorthUpToFixedFrame(Cesium.Cartesian3.fromDegrees(120.0, 30.0, 5000))
  const instance = new Cesium.GeometryInstance({
    geometry: geometry,
    modelMatrix
  })
  primitiveCollection.add(new Cesium.Primitive({
    geometryInstances: instance,
    // 	不显示颜色,仅使用纹理 灰度值（或单通道值）作为透明度值
    appearance: new Cesium.MaterialAppearance({
      material: new Cesium.Material({
        fabric: {
          type: 'EmissionMap',
          uniforms: {
            image: rgbaPng, // 图像的路径
            repeat: new Cesium.Cartesian2(10, 10), // 可调整重复次数
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
  const sphere = new Cesium.SphereGeometry({radius: 100.0})
  const geometry = Cesium.SphereGeometry.createGeometry(sphere)
  const modelMatrix = Cesium.Transforms.eastNorthUpToFixedFrame(Cesium.Cartesian3.fromDegrees(120.0, 30.0, 5000))
  const instance = new Cesium.GeometryInstance({
    geometry: geometry,
    modelMatrix
  })
  primitiveCollection.add(new Cesium.Primitive({
    geometryInstances: instance,
    // 	不显示颜色,仅使用纹理 灰度值（或单通道值）作为透明度值
    appearance: new Cesium.MaterialAppearance({
      material: new Cesium.Material({
        fabric: {
          type: 'BumpMap',
          uniforms: {
            image: heartPng, // 图像的路径
            repeat: new Cesium.Cartesian2(10, 10), // 可调整重复次数
            channel: 'r',
            // strength: 1
          },
        }
      })
    })
  }))
  const worldBoundingSphere = Cesium.BoundingSphere.transform(geometry.boundingSphere, modelMatrix, new Cesium.BoundingSphere());
  viewer.camera.flyToBoundingSphere(worldBoundingSphere);
}

const addMaterialAppearanceNormalMap = () => {
  reset()
  const sphere = new Cesium.SphereGeometry({radius: 100.0})
  const geometry = Cesium.SphereGeometry.createGeometry(sphere)
  const modelMatrix = Cesium.Transforms.eastNorthUpToFixedFrame(Cesium.Cartesian3.fromDegrees(120.0, 30.0, 5000))
  const instance = new Cesium.GeometryInstance({
    geometry: geometry,
    modelMatrix
  })
  primitiveCollection.add(new Cesium.Primitive({
    geometryInstances: instance,
    // 	不显示颜色,仅使用纹理 灰度值（或单通道值）作为透明度值
    appearance: new Cesium.MaterialAppearance({
      material: new Cesium.Material({
        fabric: {
          type: 'NormalMap',
          uniforms: {
            image: rgbaPng, // 图像的路径
            repeat: new Cesium.Cartesian2(10, 10), // 可调整重复次数
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
  const positions = [[120.1111, 30.1111, 500], [120.1111, 30.2222, 500], [120.3333, 30.1111, 500]]
  const circle = new Cesium.RectangleGeometry({
    rectangle: Cesium.Rectangle.fromCartesianArray(Cesium.Cartesian3.fromDegreesArrayHeights(positions.flat())),
    height: 1000,// 高度
    // extrudedHeight: 500// 拉伸高度
  })
  const geometry = Cesium.RectangleGeometry.createGeometry(circle)
  const instance = new Cesium.GeometryInstance({geometry: geometry})
  primitiveCollection.add(new Cesium.Primitive({
    geometryInstances: instance,
    appearance: new Cesium.MaterialAppearance({
      material: new Cesium.Material({
        fabric: {
          type: 'Grid',
          uniforms: {
            color: Cesium.Color.BLACK, // 材质的 rgba 颜色对象
            cellAlpha: 0.1,// 网格线之间的单元格的 Alpha 值
            lineCount: new Cesium.Cartesian2(10, 10),// 具有 x 和 y 值的对象，分别指定列数和行数
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
  const positions = [[120.1111, 30.1111, 500], [120.1111, 30.2222, 500], [120.3333, 30.1111, 500]]
  const circle = new Cesium.RectangleGeometry({
    rectangle: Cesium.Rectangle.fromCartesianArray(Cesium.Cartesian3.fromDegreesArrayHeights(positions.flat())),
    height: 1000,// 高度
    // extrudedHeight: 500// 拉伸高度
  })
  const geometry = Cesium.RectangleGeometry.createGeometry(circle)
  const instance = new Cesium.GeometryInstance({geometry: geometry})
  primitiveCollection.add(new Cesium.Primitive({
    geometryInstances: instance,
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
  const positions = [[120.1111, 30.1111, 500], [120.1111, 30.2222, 500], [120.3333, 30.1111, 500]]
  const circle = new Cesium.RectangleGeometry({
    rectangle: Cesium.Rectangle.fromCartesianArray(Cesium.Cartesian3.fromDegreesArrayHeights(positions.flat())),
    height: 1000,// 高度
    // extrudedHeight: 500// 拉伸高度
  })
  const geometry = Cesium.RectangleGeometry.createGeometry(circle)
  const instance = new Cesium.GeometryInstance({geometry: geometry})
  primitiveCollection.add(new Cesium.Primitive({
    geometryInstances: instance,
    appearance: new Cesium.MaterialAppearance({
      material: new Cesium.Material({
        fabric: {
          type: 'Checkerboard',
          uniforms: {
            lightColor: Cesium.Color.WHITE.withAlpha(0.5), //  用于棋盘的光交替颜色的 rgba 颜色对象
            darkColor: Cesium.Color.BLACK.withAlpha(0.5),//用于棋盘的深色交替颜色的 rgba 颜色对象
            repeat: new Cesium.Cartesian2(10, 10),// 具有 x 和 y 值的对象，分别指定列数和行数
          }
        }
      })
    })
  }))
  viewer.camera.flyToBoundingSphere(geometry.boundingSphere);
}

const addMaterialAppearanceDot = () => {
  reset()
  const positions = [[120.1111, 30.1111, 500], [120.1111, 30.2222, 500], [120.3333, 30.1111, 500]]
  const circle = new Cesium.RectangleGeometry({
    rectangle: Cesium.Rectangle.fromCartesianArray(Cesium.Cartesian3.fromDegreesArrayHeights(positions.flat())),
    height: 1000,// 高度
    // extrudedHeight: 500// 拉伸高度
  })
  const geometry = Cesium.RectangleGeometry.createGeometry(circle)
  const instance = new Cesium.GeometryInstance({geometry: geometry})
  primitiveCollection.add(new Cesium.Primitive({
    geometryInstances: instance,
    appearance: new Cesium.MaterialAppearance({
      material: new Cesium.Material({
        fabric: {
          type: 'Dot',
          uniforms: {
            lightColor: Cesium.Color.WHITE.withAlpha(0.5), //  用于棋盘的光交替颜色的 rgba 颜色对象
            darkColor: Cesium.Color.BLACK.withAlpha(0.5),//用于棋盘的深色交替颜色的 rgba 颜色对象
            repeat: new Cesium.Cartesian2(10, 10),// 具有 x 和 y 值的对象，分别指定列数和行数
          }
        }
      })
    })
  }))
  viewer.camera.flyToBoundingSphere(geometry.boundingSphere);
}

const addMaterialAppearanceWater = () => {
  reset()
  const positions = [[120.1111, 30.1111, 500], [120.1111, 30.2222, 500], [120.3333, 30.1111, 500]]
  const circle = new Cesium.RectangleGeometry({
    rectangle: Cesium.Rectangle.fromCartesianArray(Cesium.Cartesian3.fromDegreesArrayHeights(positions.flat())),
    height: 1000,// 高度
    // extrudedHeight: 500// 拉伸高度
  })
  const geometry = Cesium.RectangleGeometry.createGeometry(circle)
  const instance = new Cesium.GeometryInstance({geometry: geometry})
  primitiveCollection.add(new Cesium.Primitive({
    geometryInstances: instance,
    appearance: new Cesium.MaterialAppearance({
      material: new Cesium.Material({
        fabric: {
          type: 'Water',
          uniforms: {
            baseWaterColor: new Cesium.Color.fromCssColorString('#ffeb6a').withAlpha(0.9),// 水的基色。
            blendColor: new Cesium.Color.fromCssColorString('#b65d5d').withAlpha(0.9),//从水混合到非水区域时使用的 rgba 颜色对象
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

const addMaterialAppearancRimLighting = () => {
  reset()
  const positions = [[120.1111, 30.1111, 500], [120.1111, 30.2222, 500], [120.3333, 30.1111, 500]]
  const circle = new Cesium.RectangleGeometry({
    rectangle: Cesium.Rectangle.fromCartesianArray(Cesium.Cartesian3.fromDegreesArrayHeights(positions.flat())),
    height: 1000,// 高度
    extrudedHeight: 500// 拉伸高度
  })
  const geometry = Cesium.RectangleGeometry.createGeometry(circle)
  const instance = new Cesium.GeometryInstance({geometry: geometry})
  primitiveCollection.add(new Cesium.Primitive({
    geometryInstances: instance,
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
  const positions = [[120.1111, 30.1111, 500], [120.1111, 30.2222, 500], [120.3333, 30.1111, 500]]
  const circle = new Cesium.RectangleGeometry({
    rectangle: Cesium.Rectangle.fromCartesianArray(Cesium.Cartesian3.fromDegreesArrayHeights(positions.flat())),
    height: 1000,// 高度
    // extrudedHeight: 500// 拉伸高度
  })
  const geometry = Cesium.RectangleGeometry.createGeometry(circle)
  const instance = new Cesium.GeometryInstance({geometry: geometry})
  primitiveCollection.add(new Cesium.Primitive({
    geometryInstances: instance,
    appearance: new Cesium.MaterialAppearance({
      // material: new Cesium.Material({
      //   fabric: {
      //     type: 'Fade',
      //     uniforms: {
      //       fadeInColor: Cesium.Color.RED.withAlpha(1.0),
      //       fadeOutColor: Cesium.Color.BLUE.withAlpha(0.0),
      //       maximumDistance:0.5,
      //       time: 0.0
      //     }
      //   }
      // })
    })
  }))
  viewer.camera.flyToBoundingSphere(geometry.boundingSphere);
}

const addMaterialAppearancPolylineArrow = () => {
  reset()
  let positions = [[120.1111, 30.1111, 1000], [120.1111, 30.2222, 2000], [120.3333, 30.1111, 3000], [120.3333, 30.2222, 4000], [120.4444, 30.2222, 5000]]
  positions = Cesium.Cartesian3.fromDegreesArrayHeights(positions.flat())
  const polygon = new Cesium.PolylineGeometry({
    positions: positions,
    width: 10,
  })
  const geometry = Cesium.PolylineGeometry.createGeometry(polygon)
  const instance = new Cesium.GeometryInstance({geometry: geometry})
  primitiveCollection.add(new Cesium.Primitive({
    geometryInstances: instance,
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

const addMaterialAppearancPolylineDash = () => {
  reset()
  let positions = [[120.1111, 30.1111, 1000], [120.1111, 30.2222, 2000], [120.3333, 30.1111, 3000], [120.3333, 30.2222, 4000], [120.4444, 30.2222, 5000]]
  positions = Cesium.Cartesian3.fromDegreesArrayHeights(positions.flat())
  const polygon = new Cesium.PolylineGeometry({
    positions: positions,
    width: 10,
  })
  const geometry = Cesium.PolylineGeometry.createGeometry(polygon)
  const instance = new Cesium.GeometryInstance({geometry: geometry})
  primitiveCollection.add(new Cesium.Primitive({
    geometryInstances: instance,
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

const addMaterialAppearancPolylineGlow = () => {
  reset()
  let positions = [[120.1111, 30.1111, 1000], [120.1111, 30.2222, 2000], [120.3333, 30.1111, 3000], [120.3333, 30.2222, 4000], [120.4444, 30.2222, 5000]]
  positions = Cesium.Cartesian3.fromDegreesArrayHeights(positions.flat())
  const polygon = new Cesium.PolylineGeometry({
    positions: positions,
    width: 10,
  })
  const geometry = Cesium.PolylineGeometry.createGeometry(polygon)
  const instance = new Cesium.GeometryInstance({geometry: geometry})
  primitiveCollection.add(new Cesium.Primitive({
    geometryInstances: instance,
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

const addMaterialAppearancPolylineOutline = () => {
  reset()
  let positions = [[120.1111, 30.1111, 1000], [120.1111, 30.2222, 2000], [120.3333, 30.1111, 3000], [120.3333, 30.2222, 4000], [120.4444, 30.2222, 5000]]
  positions = Cesium.Cartesian3.fromDegreesArrayHeights(positions.flat())
  const polygon = new Cesium.PolylineGeometry({
    positions: positions,
    width: 10,
  })
  const geometry = Cesium.PolylineGeometry.createGeometry(polygon)
  const instance = new Cesium.GeometryInstance({geometry: geometry})
  primitiveCollection.add(new Cesium.Primitive({
    geometryInstances: instance,
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
 let  contourUniforms = material.uniforms;
  // 线宽2.0px
  contourUniforms.width = 2.0;
  // 高度间隔为150米
  contourUniforms.spacing = 150;
  contourUniforms.color = Cesium.Color.RED;
  globe.material =material
  // const positions = [[120.1111, 30.1111, 500], [120.1111, 30.2222, 500], [120.3333, 30.1111, 500]]
  // const circle = new Cesium.RectangleGeometry({
  //   rectangle: Cesium.Rectangle.fromCartesianArray(Cesium.Cartesian3.fromDegreesArrayHeights(positions.flat())),
  //   height: 0,// 高度
  //   extrudedHeight: 500,// 拉伸高度
  //   vertexFormat: Cesium.MaterialAppearance.VERTEX_FORMAT
  // })
  // const geometry = Cesium.RectangleGeometry.createGeometry(circle)
  // const instance = new Cesium.GeometryInstance({geometry: geometry})
  // primitiveCollection.add(new Cesium.Primitive({
  //   geometryInstances: instance,
  //   appearance: new Cesium.MaterialAppearance({
  //     material: new Cesium.Material({
  //       fabric: {
  //         type: 'ElevationContour',
  //         uniforms: {
  //           color: Cesium.Color.RED,
  //           spacing: 100.0,           // 每隔100米绘制一条等高线
  //           width: 2.0,               // 线宽
  //         }
  //       }
  //     })
  //   })
  // }))
  // viewer.camera.flyToBoundingSphere(geometry.boundingSphere);
}

const reset = () => {
  primitiveCollection.removeAll()
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
let gui, materialAppearanceFolder
const formData = {
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
  addMaterialAppearanceWater,
  addMaterialAppearancRimLighting,
  addMaterialAppearancFade,
  addMaterialAppearancPolylineArrow,
  addMaterialAppearancPolylineDash,
  addMaterialAppearancPolylineGlow,
  addMaterialAppearancPolylineOutline,
  addMaterialAppearanceElevationContour,
  reset
}
const initGui = () => {
  gui = new GUI({title: "appearance外观"});
  materialAppearanceFolder = gui.addFolder("材质外观 MaterialAppearance")
  materialAppearanceFolder.add(formData, "addMaterialAppearanceColor").name("颜色")
  materialAppearanceFolder.add(formData, "addMaterialAppearanceImage").name("图片")
  materialAppearanceFolder.add(formData, "addMaterialAppearanceDiffuseMap").name("漫反射贴图")
  materialAppearanceFolder.add(formData, "addMaterialAppearanceAlphaMap").name("阿尔法贴图")
  materialAppearanceFolder.add(formData, "addMaterialAppearanceSpecularMap").name("高光贴图")
  materialAppearanceFolder.add(formData, "addMaterialAppearanceEmissionMap").name("排放贴图")
  materialAppearanceFolder.add(formData, "addMaterialAppearanceBumpMap").name("凹凸贴图")
  materialAppearanceFolder.add(formData, "addMaterialAppearanceNormalMap").name("法线贴图")
  materialAppearanceFolder.add(formData, "addMaterialAppearanceGrid").name("网格")
  materialAppearanceFolder.add(formData, "addMaterialAppearanceStripe").name("条纹")
  materialAppearanceFolder.add(formData, "addMaterialAppearanceCheckerboard").name("棋盘")
  materialAppearanceFolder.add(formData, "addMaterialAppearanceDot").name("点")
  materialAppearanceFolder.add(formData, "addMaterialAppearanceWater").name("水")
  materialAppearanceFolder.add(formData, "addMaterialAppearancRimLighting").name("边缘照明")
  materialAppearanceFolder.add(formData, "addMaterialAppearancFade").name("褪色.")
  materialAppearanceFolder.add(formData, "addMaterialAppearancPolylineArrow").name("折线箭头")
  materialAppearanceFolder.add(formData, "addMaterialAppearancPolylineDash").name("折线虚线")
  materialAppearanceFolder.add(formData, "addMaterialAppearancPolylineGlow").name("折线发光")
  materialAppearanceFolder.add(formData, "addMaterialAppearancPolylineOutline").name("折线轮廓")
  materialAppearanceFolder.add(formData, "addMaterialAppearanceElevationContour").name("等高线.")

  gui.add(formData, "reset")
}
</script>

<style lang="scss" scoped>
.appearance-wrap {

}
</style>
