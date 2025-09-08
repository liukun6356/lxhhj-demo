<template>
  <div class="primitive-wrap">
    <Tdt_img_d/>
  </div>
</template>

<script lang="ts" setup>
import {onMounted, onUnmounted} from "vue";
import GUI from "lil-gui";
import {usemapStore} from "@/store/modules/cesiumLastMap";
import * as Cesium from "cesium";
import png5 from "@/assets/images/legendShow/cy.png"
// Component
import Tdt_img_d from "@/views/cesiumLast/component/main/controlPanel/layerManagement/basicMap/tdt_img_d.vue"

const mapStore = usemapStore()
onMounted(() => {
  handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
  handler.setInputAction(onMouseClick, Cesium.ScreenSpaceEventType.LEFT_CLICK);
  initGui()
  viewer.scene.primitives.add(primitiveCollection);
  viewer.scene.primitives.add(billboardsCollection);
})
onUnmounted(() => {
  viewer.scene.primitives.remove(primitiveCollection);
  viewer.scene.primitives.remove(billboardsCollection);
  gui.destroy()
})

const addSingleGeometry = () => {
  reset()
  const circle = new Cesium.CircleGeometry({center: Cesium.Cartesian3.fromDegrees(114.347137, 30.541429, 100), radius: 200.0});
  const geometry = Cesium.CircleGeometry.createGeometry(circle);
  const instance = new Cesium.GeometryInstance({geometry: geometry,});
  primitiveCollection.add(new Cesium.Primitive({
    geometryInstances: instance,
    asynchronous: false, // 关闭异步
    appearance: new Cesium.MaterialAppearance({
      material: new Cesium.Material({
        fabric: {
          type: "Color",
          uniforms: {color: Cesium.Color.BLUE}
        }
      })
    })
  }));
  const boundingSphere = geometry.boundingSphere; // 获取几何体的包围球
  viewer.camera.flyToBoundingSphere(boundingSphere);
}

const addMultInstanceGeometry = () => {
  reset()
  const p = [114.347137, 30.541429];
  const instances = [];
  const positions = []; // 记录用于计算 boundingSphere
  let boxGeometry = Cesium.BoxGeometry.fromDimensions({dimensions: new Cesium.Cartesian3(100, 100, 100)})
  for (let i = 0; i < 100000; i++) {
    const position = Cesium.Cartesian3.fromDegrees(p[0] + Math.random(), p[1] + Math.random(), 200 + Math.random() * 100)
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

const addMultPoint = () => {
  reset()
  const color = () => new Cesium.Color(Math.random(), Math.random(), Math.random(), 1); // 随机颜色
  for (let longitude = -180; longitude < 180; longitude++) {
    for (let latitude = -90; latitude < 90; latitude++) {
      billboardsCollection.add({
        position: Cesium.Cartesian3.fromDegrees(longitude, latitude),
        image: png5, // 图标
        scale: 0.5, // 调整图标的大小
        color: color(), // 随机颜色
        id: 'billboard' + '-' + longitude + '-' + latitude
      })
    }
  }
}

const addMultLinePolygon = () => {
  reset()
  const instances1 = [];
  const instances2 = [];
  for (let i = 0; i < 10000; i++) {
    const longitude = Math.random() * 360 - 180;
    const latitude = Math.random() * 180 - 90;
    const positions = [longitude, latitude, longitude + Math.random(), latitude, longitude, latitude + Math.random()];
    const lineInstance = new Cesium.GeometryInstance({
      geometry: new Cesium.PolylineGeometry({
        positions: Cesium.Cartesian3.fromDegreesArray(positions),
        width: 3,
        vertexFormat: Cesium.PolylineColorAppearance.VERTEX_FORMAT
      }),
      attributes: {color: Cesium.ColorGeometryInstanceAttribute.fromColor(Cesium.Color.fromCssColorString(i % 2 == 0 ? 'green' : 'red').withAlpha(1))},
      id: 'line' + i
    });
    const faceInstance = new Cesium.GeometryInstance({
      geometry: new Cesium.PolygonGeometry({
        polygonHierarchy: new Cesium.PolygonHierarchy(Cesium.Cartesian3.fromDegreesArray(positions)),
        height: 0,
        vertexFormat: Cesium.PerInstanceColorAppearance.VERTEX_FORMAT
      }),
      attributes: {color: Cesium.ColorGeometryInstanceAttribute.fromColor(Cesium.Color.fromCssColorString(i % 2 == 0 ? 'red' : 'green').withAlpha(1))},
      id: 'face' + i
    })
    instances1.push(lineInstance);
    instances2.push(faceInstance);
  }
  primitiveCollection.add(new Cesium.Primitive({
    geometryInstances: instances1,
    appearance: new Cesium.PolylineColorAppearance()
  }));
  primitiveCollection.add(new Cesium.Primitive({
    geometryInstances: instances2,
    appearance: new Cesium.PerInstanceColorAppearance({closed: true})
  }));
}

const addMultCurve = () => {
  reset()
  const instances = [];
  const getColor = () => '#' + Math.floor(Math.random() * 0xffffff).toString(16).padEnd(6, '0')
  for (let i = 0; i < 300; i++) {
    const positions = Array.from({length: 10}, () => Math.random() * 360 - 180).reduce((acc, cur) => acc.concat(cur), [])
    const instance = new Cesium.GeometryInstance({
      geometry: new Cesium.PolylineGeometry({
        positions: generateCurvePoints(positions, 20),
        width: 2,
        vertexFormat: Cesium.PolylineColorAppearance.VERTEX_FORMAT
      }),
      attributes: {color: Cesium.ColorGeometryInstanceAttribute.fromColor(Cesium.Color.fromCssColorString(getColor()).withAlpha(0.6))},
      id: "curve" + i
    })
    instances.push(instance)
  }
  primitiveCollection.add(new Cesium.Primitive({
    geometryInstances: instances,
    appearance: new Cesium.PolylineColorAppearance()
  }));
}

const addMultRect = () => {
  reset()
  const instances = [];
  for (let i = 0; i < 10000; i++) {
    const longitude = Math.random() * 360 - 180;
    const latitude = Math.random() * 180 - 90;
    const position = Cesium.Cartesian3.fromDegrees(longitude, latitude, 0);
    const dimensions = new Cesium.Cartesian3(40000.0, 30000.0, 500000.0);
    const color = Cesium.Color.RED.withAlpha(0.2);
    instances.push(new Cesium.GeometryInstance({
      geometry: new Cesium.BoxGeometry.fromDimensions({
        vertexFormat: Cesium.PerInstanceColorAppearance.VERTEX_FORMAT,
        dimensions: dimensions
      }),
      modelMatrix: Cesium.Transforms.eastNorthUpToFixedFrame(position),
      attributes: {color: Cesium.ColorGeometryInstanceAttribute.fromColor(color)}
    }));
  }
  primitiveCollection.add(new Cesium.Primitive({
    geometryInstances: instances,
    appearance: new Cesium.PerInstanceColorAppearance()
  }));
}

const addBoxGeometry = () => {
  reset()
  const box = Cesium.BoxGeometry.fromDimensions({dimensions: new Cesium.Cartesian3(100, 100, 100)}) // 设置盒子的长宽高
  const geometry = Cesium.BoxGeometry.createGeometry(box);
  // 通过GeometryInstance中的modelMatrix 属性将其定位到地球的正确位置上
  const modelMatrix = Cesium.Transforms.eastNorthUpToFixedFrame(Cesium.Cartesian3.fromDegrees(114.347137, 30.541429, 100))
  const instance = new Cesium.GeometryInstance({
    geometry: geometry,
    modelMatrix,
  });
  primitiveCollection.add(new Cesium.Primitive({
    geometryInstances: instance,
    asynchronous: false, // 关闭异步
    appearance: new Cesium.MaterialAppearance({
      material: new Cesium.Material({
        fabric: {
          type: "Color",
          uniforms: {color: Cesium.Color.RED}
        }
      })
    })
  }));
  // 获取局部的boundingSphere,  简称 ENU,局部坐标系
  const localBoundingSphere = geometry.boundingSphere;
  // 转化到世界坐标    将 4x4 仿射变换矩阵应用于边界球体
  const worldBoundingSphere = Cesium.BoundingSphere.transform(localBoundingSphere, modelMatrix, new Cesium.BoundingSphere());
  viewer.camera.flyToBoundingSphere(worldBoundingSphere);
}

const addCircleGeometry = () => {
  reset()
  const circle = new Cesium.CircleGeometry({
    center: Cesium.Cartesian3.fromDegrees(114.347137, 30.541429), // 圆几何的位置与中心点
    height: 5000,// 圆几何的高度
    radius: 200.0, // 圆几何的半径
    extrudedHeight: 1000 // 拉伸高度是指从当前圆几何的高度拉伸到那个高度
  });
  const geometry = Cesium.CircleGeometry.createGeometry(circle);
  const instance = new Cesium.GeometryInstance({geometry: geometry,});
  primitiveCollection.add(new Cesium.Primitive({
    geometryInstances: instance,
    asynchronous: false, // 关闭异步
    appearance: new Cesium.MaterialAppearance({
      material: new Cesium.Material({
        fabric: {
          type: "Color",
          uniforms: {color: Cesium.Color.RED}
        }
      })
    })
  }));
  viewer.camera.flyToBoundingSphere(geometry.boundingSphere);
}

const addCorridorGeometry = () => {
  reset()
  const circle = new Cesium.CorridorGeometry({
    positions: Cesium.Cartesian3.fromDegreesArray([114.347137, 30.541429, 114.357137, 30.541429, 114.447137, 30.542429]), //  走廊的位置
    height: 1000, //  走廊几何的高度
    width: 1500, // 走廊几何的宽度
    extrudedHeight: 500,// 拉伸高度
    cornerType: Cesium.CornerType.BEVELED,// 转角样式  ROUNDED 圆角,MITERED 直角,BEVELED 裁剪角
  })
  const geometry = Cesium.CorridorGeometry.createGeometry(circle)
  const instance = new Cesium.GeometryInstance({geometry: geometry})
  primitiveCollection.add(new Cesium.Primitive({
    geometryInstances: instance,
    asynchronous: false, // 关闭异步
    appearance: new Cesium.MaterialAppearance({
      material: new Cesium.Material({
        fabric: {
          type: 'Color',
          uniforms: {color: Cesium.Color.RED}
        }
      })
    })
  }))
  viewer.camera.flyToBoundingSphere(geometry.boundingSphere);
}

const addCylinderGeometry = () => {
  reset()
  const circle = new Cesium.CylinderGeometry({
    length: 1000,// 锥体几何的高度
    topRadius: 500,// 锥体几何的顶部半径
    bottomRadius: 100,// 锥体几何的底部半径
    slices: 128 // 圆柱体周边的边数,几何体还支持分段，也就是分成几段再细分三角形，分段越多顶点和三角形越多，渲染越精细,顶点越多，性能也会变差
  })
  const geometry = Cesium.CylinderGeometry.createGeometry(circle)
  const modelMatrix = Cesium.Transforms.eastNorthUpToFixedFrame(Cesium.Cartesian3.fromDegrees(114.347137, 30.541429, 600))
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
          type: 'Color',
          uniforms: {color: Cesium.Color.RED}
        }
      })
    })
  }))
  const worldBoundingSphere = Cesium.BoundingSphere.transform(geometry.boundingSphere, modelMatrix, new Cesium.BoundingSphere());
  viewer.camera.flyToBoundingSphere(worldBoundingSphere);
}

const addEllipseGeometry = () => {
  reset()
  const circle = new Cesium.EllipseGeometry({
    center: Cesium.Cartesian3.fromDegrees(114.347137, 30.541429), // 椭圆几何的位置与中心点。
    semiMajorAxis: 1500, // 椭圆几何的长半径
    semiMinorAxis: 500, // 椭圆几何的短半径
    height: 100,// 椭圆几何的高度
    extrudedHeight: 50,// 拉伸高度
  })
  const geometry = Cesium.EllipseGeometry.createGeometry(circle)
  const instance = new Cesium.GeometryInstance({geometry: geometry})
  primitiveCollection.add(new Cesium.Primitive({
    geometryInstances: instance,
    asynchronous: false, // 关闭异步
    appearance: new Cesium.MaterialAppearance({
      material: new Cesium.Material({
        fabric: {
          type: 'Color',
          uniforms: {color: Cesium.Color.RED}
        }
      })
    })
  }))
  viewer.camera.flyToBoundingSphere(geometry.boundingSphere);
}

const addEllipsoidGeometry = () => {
  reset()
  const circle = new Cesium.EllipsoidGeometry({
    radii: new Cesium.Cartesian3(5000, 2000, 1000) // 椭球体在 x、y 和 z 方向上的半径
  })
  const geometry = Cesium.EllipsoidGeometry.createGeometry(circle)
  const modelMatrix = Cesium.Transforms.eastNorthUpToFixedFrame(Cesium.Cartesian3.fromDegrees(114.347137, 30.541429, 5000))
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
          type: 'Color',
          uniforms: {color: Cesium.Color.RED}
        }
      })
    })
  }))
  const worldBoundingSphere = Cesium.BoundingSphere.transform(geometry.boundingSphere, modelMatrix, new Cesium.BoundingSphere());
  viewer.camera.flyToBoundingSphere(worldBoundingSphere);
}

const addRectangleGeometry = () => {
  reset()

  const positions = [[114.347137, 30.541429, 100], [114.347137, 30.551429, 100], [114.367137, 30.541429, 100]]
  const circle = new Cesium.RectangleGeometry({
    // [].concat.apply([], positions) 相当于 positions.flat()
    // 从一个点集中获取一个数据的外包矩形
    rectangle: Cesium.Rectangle.fromCartesianArray(Cesium.Cartesian3.fromDegreesArrayHeights([].concat.apply([], positions))),
    height: 100,// 高度
    extrudedHeight: 80// 拉伸高度
  })
  const geometry = Cesium.RectangleGeometry.createGeometry(circle)
  const instance = new Cesium.GeometryInstance({geometry: geometry})
  primitiveCollection.add(new Cesium.Primitive({
    geometryInstances: instance,
    asynchronous: false, // 关闭异步
    appearance: new Cesium.MaterialAppearance({
      material: new Cesium.Material({
        fabric: {
          type: 'Color',
          uniforms: {color: Cesium.Color.RED}
        }
      })
    })
  }))
  viewer.camera.flyToBoundingSphere(geometry.boundingSphere);
}

const addPolygonGeometry = () => {
  reset()
  let positions =[[114.347137, 30.541429, 100], [114.347137, 30.52429, 100], [114.357137, 30.541429, 100], [114.447137, 30.542429, 100],]
  positions = Cesium.Cartesian3.fromDegreesArrayHeights(positions.flat())
  const polygon = new Cesium.PolygonGeometry({
    polygonHierarchy: new Cesium.PolygonHierarchy(positions),
    perPositionHeight: true,//启用顶点数组中的高度值
    extrudedHeight: 500,
    // height:5000
  })
  const geometry = Cesium.PolygonGeometry.createGeometry(polygon)
  const instance = new Cesium.GeometryInstance({geometry})
  primitiveCollection.add(new Cesium.Primitive({
    geometryInstances: instance,
    asynchronous: false, // 关闭异步
    appearance: new Cesium.MaterialAppearance({
      material: new Cesium.Material({
        fabric: {
          type: 'Color',
          uniforms: {color: Cesium.Color.RED}
        }
      })
    })
  }))
  viewer.camera.flyToBoundingSphere(geometry.boundingSphere);
}

const addPolylineGeometry = () => {
  reset()
  let positions =[[114.347137, 30.541429, 100], [114.347137, 30.52429, 100], [114.357137, 30.541429, 100], [114.447137, 30.542429, 100],]
  const colors = [Cesium.Color.RED, Cesium.Color.GREEN, Cesium.Color.BLUE, Cesium.Color.YELLOW, Cesium.Color.WHITE]
  positions = Cesium.Cartesian3.fromDegreesArrayHeights(positions.flat())
  const polygon = new Cesium.PolylineGeometry({
    positions: positions,
    width: 10,
    colors: colors,
    colorsPerVertex: true
  })
  const geometry = Cesium.PolylineGeometry.createGeometry(polygon)
  const instance = new Cesium.GeometryInstance({geometry: geometry})
  primitiveCollection.add(new Cesium.Primitive({
    geometryInstances: instance,
    asynchronous: false, // 关闭异步
    // appearance: new Cesium.PolylineMaterialAppearance({ // 需要使用专门的PolylineMaterialAppearance外观
    //   material: new Cesium.Material({
    //     fabric: {
    //       type: 'Color',
    //       uniforms: {color: Cesium.Color.RED}
    //     }
    //   })
    // })
    appearance: new Cesium.PolylineColorAppearance(),//具有颜色属性的实例外观
  }))
  viewer.camera.flyToBoundingSphere(geometry.boundingSphere);
}

const addPolylineVolumeGeometry = () => {
  reset()
  let positions =[[114.347137, 30.541429, 100], [114.347137, 30.52429, 100], [114.357137, 30.541429, 100], [114.447137, 30.542429, 100],]
  positions = Cesium.Cartesian3.fromDegreesArrayHeights(positions.flat())

  function computeCircle(radius) {
    let position1 = []
    for (let i = 0; i < 360; i++) {
      // 创建一个圆形的切面形状
      const radians = Cesium.Math.toRadians(i)
      position1.push(new Cesium.Cartesian2(radius * Math.cos(radians), radius * Math.sin(radians)))
    }
    return position1
  }

  const geometry = new Cesium.PolylineVolumeGeometry({
    polylinePositions: positions,
    shapePositions: computeCircle(20),
  })
  const instance = new Cesium.GeometryInstance({geometry})
  primitiveCollection.add(new Cesium.Primitive({
    geometryInstances: instance,
    asynchronous: false, // 关闭异步
    appearance: new Cesium.MaterialAppearance({
      material: new Cesium.Material({
        fabric: {
          type: 'Color',
          uniforms: {color: Cesium.Color.RED}
        }
      })
    })
  }))
  const boundingSphere = Cesium.BoundingSphere.fromPoints(positions);
  viewer.camera.flyToBoundingSphere(boundingSphere);
}

const addSphereGeometry = () => {
  reset()
  let sphere = new Cesium.SphereGeometry({radius: 100.0})
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
          type: 'Color',
          uniforms: {color: Cesium.Color.RED}
        }
      })
    })
  }))
  const worldBoundingSphere = Cesium.BoundingSphere.transform(geometry.boundingSphere, modelMatrix, new Cesium.BoundingSphere());
  viewer.camera.flyToBoundingSphere(worldBoundingSphere);
}

const addWallGeometry = () => {
  reset()
  let positions = [[114.347137, 30.541429, 100], [114.347137, 30.52429, 100], [114.357137, 30.541429, 100], [114.447137, 30.542429, 100],]
  positions = Cesium.Cartesian3.fromDegreesArrayHeights(positions.flat())
  const wall = new Cesium.WallGeometry({positions: positions})
  const geometry = Cesium.WallGeometry.createGeometry(wall)
  const instance = new Cesium.GeometryInstance({geometry: geometry})
  primitiveCollection.add(new Cesium.Primitive({
    geometryInstances: instance,
    asynchronous: false, // 关闭异步
    appearance: new Cesium.MaterialAppearance({
      material: new Cesium.Material({
        fabric: {
          type: 'Color',
          uniforms: {color: Cesium.Color.RED}
        }
      })
    })
  }))
  viewer.camera.flyToBoundingSphere(geometry.boundingSphere);
}

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

const addCustomPrimitive = () => {
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

const generateCurvePoints = (flattenedPoints, multiplier = 30) => {
  const numOfPoints = flattenedPoints.length / 2 * multiplier
  const points = [];
  for (let i = 0; i < flattenedPoints.length; i += 2) points.push([flattenedPoints[i], flattenedPoints[i + 1]])
  const times = points.map((_, index) => index / (points.length - 1))
  const cartesianPoints = points.map(point => Cesium.Cartesian3.fromDegrees(point[0], point[1]))
  const spline = new Cesium.CatmullRomSpline({times: times, points: cartesianPoints});
  const curvePoints = [];
  for (let i = 0; i < numOfPoints; i++) curvePoints.push(spline.evaluate(i / (numOfPoints - 1)))
  return curvePoints;
}

const reset = () => {
  console.log(primitiveCollection)
  primitiveCollection.removeAll()
  billboardsCollection.removeAll()
}

// 地图逻辑
const viewer = mapStore.getCesiumViewer();
let handler
const primitiveCollection = new Cesium.PrimitiveCollection()
const billboardsCollection = new Cesium.BillboardCollection()

const onMouseClick = (movement) => {
  const pickedObject = viewer.scene.pick(movement.position);
  console.log(pickedObject, 123)
}


// lil-gui逻辑
let gui, geometryFolder, typeFolder, customFolder
const formData = {
  addSingleGeometry,
  addMultInstanceGeometry,
  addMultPoint,
  addMultLinePolygon,
  addMultCurve,
  addMultRect,
  addBoxGeometry,
  addCircleGeometry,
  addCorridorGeometry,
  addCylinderGeometry,
  addEllipseGeometry,
  addEllipsoidGeometry,
  addRectangleGeometry,
  addPolygonGeometry,
  addPolylineGeometry,
  addPolylineVolumeGeometry,
  addSphereGeometry,
  addWallGeometry,
  addTrianglePrimitive,
  addCustomPrimitive,
  addCustomIndexPrimitive,
  addCustomCylinderPrimitive,
  addCustomNormalCylinderPrimitive,
  reset
}

const initGui = () => {
  gui = new GUI({title: "controls"});
  geometryFolder = gui.addFolder("primitive构成")
  geometryFolder.add(formData, "addSingleGeometry").name("添加单个实例")
  geometryFolder.add(formData, "addMultInstanceGeometry").name("添加多几何不同外观实例")
  geometryFolder.add(formData, "addMultPoint").name("添加大量点")
  geometryFolder.add(formData, "addMultLinePolygon").name("添加大量线面")
  geometryFolder.add(formData, "addMultCurve").name("添加大量曲线")
  geometryFolder.add(formData, "addMultRect").name("添加大量立方体")
  typeFolder = gui.addFolder("primitive几何类型")
  typeFolder.add(formData, "addBoxGeometry").name("盒子几何")
  typeFolder.add(formData, "addCircleGeometry").name("圆几何")
  typeFolder.add(formData, "addCorridorGeometry").name("走廊")
  typeFolder.add(formData, "addCylinderGeometry").name("锥体几何")
  typeFolder.add(formData, "addEllipseGeometry").name("椭圆几何")
  typeFolder.add(formData, "addEllipsoidGeometry").name("椭球体")
  typeFolder.add(formData, "addRectangleGeometry").name("矩形几何")
  typeFolder.add(formData, "addPolygonGeometry").name("多边形几何")
  typeFolder.add(formData, "addPolylineGeometry").name("线几何")
  typeFolder.add(formData, "addPolylineVolumeGeometry").name("管道")
  typeFolder.add(formData, "addSphereGeometry").name("球体几何")
  typeFolder.add(formData, "addWallGeometry").name("墙体几何")
  customFolder = gui.addFolder("自定义Primitive")
  customFolder.add(formData, "addTrianglePrimitive").name("两个三角形")
  customFolder.add(formData, "addCustomPrimitive").name("顶点正方形")
  customFolder.add(formData, "addCustomIndexPrimitive").name("顶点索引优化正方形")
  customFolder.add(formData, "addCustomCylinderPrimitive").name("顶点索引锥体")
  customFolder.add(formData, "addCustomNormalCylinderPrimitive").name("顶点法线锥体")

  gui.add(formData, "reset")
}
</script>

<style lang="scss" scoped>
.primitive-wrap {

}
</style>
