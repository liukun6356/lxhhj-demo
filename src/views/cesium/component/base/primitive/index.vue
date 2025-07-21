<template>
  <div class="primitive-wrap">
    <Tdt_img_d/>
  </div>
</template>

<script lang="ts" setup>
import {onMounted, onUnmounted} from "vue";
import GUI from "lil-gui";
import {usemapStore} from "@/store/modules/cesiumMap";
// Component
import Tdt_img_d from "@/views/cesium/component/main/controlPanel/layerManagement/basicMap/tdt_img_d.vue"


const mapStore = usemapStore()
onMounted(() => {
  handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
  handler.setInputAction(onMouseClick, Cesium.ScreenSpaceEventType.LEFT_CLICK);
  initGui()
  viewer.scene.primitives.add(primitiveCollection);
})
onUnmounted(() => {
  viewer.scene.primitives.remove(primitiveCollection);
})

const addSingleGeometry = () => {
  reset()
  const circle = new Cesium.CircleGeometry({center: Cesium.Cartesian3.fromDegrees(110.0, 30.0, 500), radius: 200.0});
  const geometry = Cesium.CircleGeometry.createGeometry(circle);
  const instance = new Cesium.GeometryInstance({geometry: geometry,});
  primitiveCollection.add(new Cesium.Primitive({
    geometryInstances: instance,
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

const addMultGeometry = () => {
  reset()
  const p = [110.0, 30.0];
  const instances = [];
  const geometries = []; // 记录用于计算 boundingSphere
  for (let i = 0; i < 10; i++) {
    const geometry = new Cesium.EllipseGeometry({
      center: Cesium.Cartesian3.fromDegrees(p[0], p[1]),
      semiMinorAxis: 2000.0,
      semiMajorAxis: 2000.0,
      height: 1000 * i
    });
    geometries.push(geometry);
    const instance = new Cesium.GeometryInstance({geometry});
    instances.push(instance);
  }
  primitiveCollection.add(new Cesium.Primitive({
    geometryInstances: instances,
    appearance: new Cesium.EllipsoidSurfaceAppearance({material: Cesium.Material.fromType('Color')})
  }));
  // 获取椭圆再椭圆体上得几何标识,包括其顶点,索引,边界球体
  const boundingSpheres = geometries.map(g => Cesium.EllipseGeometry.createGeometry(g).boundingSphere);
  // union 计算包含左右边界球的边界球。
  let unionBoundingSphere = Cesium.BoundingSphere.union(boundingSpheres[0], boundingSpheres[1], new Cesium.BoundingSphere());
  for (let i = 2; i < boundingSpheres.length; i++) {
    unionBoundingSphere = Cesium.BoundingSphere.union(unionBoundingSphere, boundingSpheres[i], new Cesium.BoundingSphere());
  }
  viewer.camera.flyToBoundingSphere(unionBoundingSphere);
}

const addMultInstanceGeometry = () => {
  reset()
  const p = [110.0, 30.0];
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

const addBoxGeometry = () => {
  reset()
  const box = Cesium.BoxGeometry.fromDimensions({dimensions: new Cesium.Cartesian3(100, 100, 100)}) // 设置盒子的长宽高
  const geometry = Cesium.BoxGeometry.createGeometry(box);
  // 通过GeometryInstance中的modelMatrix 属性将其定位到地球的正确位置上
  const modelMatrix = Cesium.Transforms.eastNorthUpToFixedFrame(Cesium.Cartesian3.fromDegrees(120.0, 30.0, 5000))
  const instance = new Cesium.GeometryInstance({
    geometry: geometry,
    modelMatrix,
  });
  primitiveCollection.add(new Cesium.Primitive({
    geometryInstances: instance,
    appearance: new Cesium.MaterialAppearance({
      material: new Cesium.Material({
        fabric: {
          type: "Color",
          uniforms: {color: Cesium.Color.RED}
        }
      })
    })
  }));
  // 获取局部的boundingSphere
  const localBoundingSphere = geometry.boundingSphere;
  // 转化到世界坐标    将 4x4 仿射变换矩阵应用于边界球体
  const worldBoundingSphere = Cesium.BoundingSphere.transform(localBoundingSphere, modelMatrix, new Cesium.BoundingSphere());
  viewer.camera.flyToBoundingSphere(worldBoundingSphere);
}

const addCircleGeometry = () => {
  reset()
  const circle = new Cesium.CircleGeometry({
    center: Cesium.Cartesian3.fromDegrees(120.0, 30.0), // 圆几何的位置与中心点
    height: 5000,// 圆几何的高度
    radius: 200.0, // 圆几何的半径
    extrudedHeight: 1000 // 拉伸高度是指从当前圆几何的高度拉伸到那个高度
  });
  const geometry = Cesium.CircleGeometry.createGeometry(circle);
  const instance = new Cesium.GeometryInstance({geometry: geometry,});
  primitiveCollection.add(new Cesium.Primitive({
    geometryInstances: instance,
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
    positions: Cesium.Cartesian3.fromDegreesArray([120.0, 30.0, 120.1, 30.0, 120.1, 30.1]), //  走廊的位置
    height: 1000, //  走廊几何的高度
    width: 1500, // 走廊几何的宽度
    extrudedHeight: 500,// 拉伸高度
    cornerType: Cesium.CornerType.BEVELED,// 转角样式  ROUNDED 圆角,MITERED 直角,BEVELED 裁剪角
  })
  const geometry = Cesium.CorridorGeometry.createGeometry(circle)
  const instance = new Cesium.GeometryInstance({geometry: geometry})
  primitiveCollection.add(new Cesium.Primitive({
    geometryInstances: instance,
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
    center: Cesium.Cartesian3.fromDegrees(120.0, 30.0), // 椭圆几何的位置与中心点。
    semiMajorAxis: 500, // 椭圆几何的长半径
    semiMinorAxis: 1500, // 椭圆几何的短半径
    height: 300,// 椭圆几何的高度
    extrudedHeight: 100,// 拉伸高度
  })
  const geometry = Cesium.EllipseGeometry.createGeometry(circle)
  const instance = new Cesium.GeometryInstance({geometry: geometry})
  primitiveCollection.add(new Cesium.Primitive({
    geometryInstances: instance,
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
  const positions = [[120.1111, 30.1111, 500], [120.1111, 30.2222, 500], [120.3333, 30.1111, 500]]
  const circle = new Cesium.RectangleGeometry({
    // [].concat.apply([], positions) 相当于 positions.flat()
    // 从一个点集中获取一个数据的外包矩形
    rectangle: Cesium.Rectangle.fromCartesianArray(Cesium.Cartesian3.fromDegreesArrayHeights([].concat.apply([], positions))),
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
  let positions = [[120.1111, 30.1111, 1000], [120.1111, 30.2222, 2000], [120.3333, 30.1111, 3000], [120.3333, 30.2222, 4000], [120.4444, 30.2222, 5000]]
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
  let positions = [[120.1111, 30.1111, 1000], [120.1111, 30.2222, 2000], [120.3333, 30.1111, 3000], [120.3333, 30.2222, 4000], [120.4444, 30.2222, 5000]]
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
  let positions = [[120.1111, 30.1111, 1000], [120.1111, 30.2222, 2000], [120.3333, 30.1111, 3000], [120.3333, 30.2222, 4000], [120.4444, 30.2222, 5000]]
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
  let positions = [[120.1111, 30.1111, 1000], [120.1111, 30.2222, 2000], [120.3333, 30.1111, 3000], [120.3333, 30.2222, 4000], [120.4444, 30.2222, 5000]]
  positions = Cesium.Cartesian3.fromDegreesArrayHeights(positions.flat())
  const wall = new Cesium.WallGeometry({positions: positions})
  const geometry = Cesium.WallGeometry.createGeometry(wall)
  const instance = new Cesium.GeometryInstance({geometry: geometry})
  primitiveCollection.add(new Cesium.Primitive({
    geometryInstances: instance,
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
  const modelMatrix = Cesium.Transforms.eastNorthUpToFixedFrame(Cesium.Cartesian3.fromDegrees(120.0, 30.0, 10))
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
    modelMatrix
  })
  primitiveCollection.add(new Cesium.Primitive({
    geometryInstances: instance,
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
  const modelMatrix = Cesium.Transforms.eastNorthUpToFixedFrame(Cesium.Cartesian3.fromDegrees(120.0, 30.0, 10))
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
    modelMatrix
  })
  primitiveCollection.add(new Cesium.Primitive({
    geometryInstances: instance,
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
  const modelMatrix = Cesium.Transforms.eastNorthUpToFixedFrame(Cesium.Cartesian3.fromDegrees(120.0, 30.0, 100))

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
    attributes: {
      color: Cesium.ColorGeometryInstanceAttribute.fromColor(
          Cesium.Color.RED
      )
    }
  })
  primitiveCollection.add(new Cesium.Primitive({
    geometryInstances: instance,
    appearance: new Cesium.PerInstanceColorAppearance({
      translucent: true
    })
  }))
  const worldBoundingSphere = Cesium.BoundingSphere.transform(geometry.boundingSphere, modelMatrix, new Cesium.BoundingSphere());
  viewer.camera.flyToBoundingSphere(worldBoundingSphere);
}

const addCustomNormalCylinderPrimitive = () =>{
  reset()
  const vertices = new Float64Array([
    // 前
    0, 0, - 100, // E点
     100, - 100,  100, //A点
    - 100, - 100,  100, //B点
    // 后
    0, 0, - 100, // E点
    - 100,  100,  100, //C点
     100,  100,  100, //D点
    // 左
    0, 0, - 100, // E点
    - 100, - 100,  100, //B点
    - 100,  100,  100, //C点
    // 右
    0, 0, - 100, // E点
     100,  100,  100, //D点
     100, - 100,  100, //A点
    // 上
     100, - 100,  100, //A点
    - 100, - 100,  100, //B点
     100,  100,  100, //D点      // 上
    - 100, - 100,  100,//B点
     100,  100,  100, //D点
    - 100,  100,  100, //C点
  ])
  let normals = []
  let c_0 = new Cesium.Cartesian3(0, 0, - 100)
  let c_1 = new Cesium.Cartesian3( 100, - 100,  100)
  let c_2 = new Cesium.Cartesian3(- 100, - 100,  100)
  let d1 = Cesium.Cartesian3.subtract(c_1, c_0, new Cesium.Cartesian3())
  let d2 = Cesium.Cartesian3.subtract(c_2, c_0, new Cesium.Cartesian3())
  let normal = Cesium.Cartesian3.cross(d1, d2, new Cesium.Cartesian3())
  normal = Cesium.Cartesian3.normalize(normal, new Cesium.Cartesian3())
  normals.push(normal.x, normal.y, normal.z, normal.x, normal.y, normal.z, normal.x, normal.y, normal.z)
  c_1 = new Cesium.Cartesian3( 100, - 100,  100)
  c_2 = new Cesium.Cartesian3( 100,  100,  100)
  d1 = Cesium.Cartesian3.subtract(c_1, c_0, new Cesium.Cartesian3())
  d2 = Cesium.Cartesian3.subtract(c_2, c_0, new Cesium.Cartesian3())
  normal = Cesium.Cartesian3.cross(d1, d2, new Cesium.Cartesian3())
  normal = Cesium.Cartesian3.normalize(normal, new Cesium.Cartesian3())
  normals.push(normal.x, normal.y, normal.z, normal.x, normal.y, normal.z, normal.x, normal.y, normal.z)
  c_1 = new Cesium.Cartesian3( 100,  100,  100)
  c_2 = new Cesium.Cartesian3(- 100,  100,  100)
  d1 = Cesium.Cartesian3.subtract(c_1, c_0, new Cesium.Cartesian3())
  d2 = Cesium.Cartesian3.subtract(c_2, c_0, new Cesium.Cartesian3())
  normal = Cesium.Cartesian3.cross(d1, d2, new Cesium.Cartesian3())
  normal = Cesium.Cartesian3.normalize(normal, new Cesium.Cartesian3())
  normals.push(normal.x, normal.y, normal.z, normal.x, normal.y, normal.z, normal.x, normal.y, normal.z)
  c_1 = new Cesium.Cartesian3(- 100,  100,  100)
  c_2 = new Cesium.Cartesian3(- 100, - 100,  100)
  d1 = Cesium.Cartesian3.subtract(c_1, c_0, new Cesium.Cartesian3())
  d2 = Cesium.Cartesian3.subtract(c_2, c_0, new Cesium.Cartesian3())
  normal = Cesium.Cartesian3.cross(d1, d2, new Cesium.Cartesian3())
  normal = Cesium.Cartesian3.normalize(normal, new Cesium.Cartesian3())
  normals.push(normal.x, normal.y, normal.z, normal.x, normal.y, normal.z, normal.x, normal.y, normal.z)

  const boundingSphere = Cesium.BoundingSphere.fromVertices(vertices);
  const modelMatrix = Cesium.Transforms.eastNorthUpToFixedFrame(Cesium.Cartesian3.fromDegrees(120.0, 30.0, 100))
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
    attributes: {
      color: Cesium.ColorGeometryInstanceAttribute.fromColor(
          Cesium.Color.RED
      )
    }
  })
  primitiveCollection.add(new Cesium.Primitive({
    geometryInstances: instance,
    appearance: new Cesium.PerInstanceColorAppearance({
      translucent: false // 关闭透明
    })
  }))
  const worldBoundingSphere = Cesium.BoundingSphere.transform(geometry.boundingSphere, modelMatrix, new Cesium.BoundingSphere());
  viewer.camera.flyToBoundingSphere(worldBoundingSphere);
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
let gui, geometryFolder, typeFolder, customFolder
const formData = {
  addSingleGeometry,
  addMultGeometry,
  addMultInstanceGeometry,
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
  geometryFolder.add(formData, "addMultGeometry").name("添加多几何实例")
  geometryFolder.add(formData, "addMultInstanceGeometry").name("添加多几何不同外观实例")
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
