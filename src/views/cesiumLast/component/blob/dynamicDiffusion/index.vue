<template>
  <div class="dynamicDiffusion-wrap">
    <Tdt_img_d/>
  </div>
</template>

<script lang="ts" setup>
import {onMounted, onUnmounted} from "vue";
import GUI from "lil-gui";
import {usemapStore} from "@/store/modules/cesiumLastMap";
import * as Cesium from "cesium";
import * as turf from '@turf/turf'
import moment from "moment"
// Component
import Tdt_img_d from "@/views/cesiumLast/component/main/controlPanel/layerManagement/basicMap/tdt_img_d.vue"

const mapStore = usemapStore()
onMounted(() => {
  initGui()
  viewer.scene.primitives.add(primitiveCollection);
  viewer.scene.globe.depthTestAgainstTerrain = true
})

onUnmounted(() => {
  gui.destroy()
  window.clearInterval(timer)
  viewer.scene.primitives.remove(primitiveCollection);
})

// 地图逻辑
const viewer = mapStore.getCesiumViewer()
const primitiveCollection = new Cesium.PrimitiveCollection()

const addPrimitive1 = () => {
  const primitive = new Cesium.GroundPrimitive({
    geometryInstances: new Cesium.GeometryInstance({
      geometry: new Cesium.EllipseGeometry({
        center: new Cesium.Cartesian3.fromDegrees(114.286207, 30.550013, 0),
        semiMinorAxis: 1000.0,
        semiMajorAxis: 1000.0,
      })
    }),
    appearance: new Cesium.PolylineMaterialAppearance({
      material: new Cesium.Material({
        fabric: {
          uniforms: {
            u_color: Cesium.Color.fromCssColorString('red').withAlpha(1),
            u_speed: 10, // 速度
            u_gradient: 0.1
          },
          source: `
            czm_material czm_getMaterial(czm_materialInput materialInput){
                czm_material material = czm_getDefaultMaterial(materialInput);
                material.diffuse = 1.5 * u_color.rgb;
                vec2 st = materialInput.st;

                float dis = distance(st, vec2(0.5, 0.5));
                float per = fract(u_speed * czm_frameNumber / 1000.0);

                if(dis > per * 0.5)discard;
                material.alpha = u_color.a  * dis / per / 2.0;

                return material;
            }
        `
        },
        translucent: false
      }),
    }),
    asynchronous: false
  });
  primitiveCollection.add(primitive);
}

const addPrimitive2 = () => {
  const primitive = new Cesium.GroundPrimitive({
    geometryInstances: new Cesium.GeometryInstance({
      geometry: new Cesium.EllipseGeometry({
        center: new Cesium.Cartesian3.fromDegrees(114.316207, 30.550013, 0),
        semiMinorAxis: 1000.0,
        semiMajorAxis: 1000.0,
      })
    }),
    appearance: new Cesium.PolylineMaterialAppearance({
      material: new Cesium.Material({
        fabric: {
          uniforms: {
            u_color: Cesium.Color.fromCssColorString('red').withAlpha(1),
            u_speed: 10, // 速度
            u_count: 2,
            u_gradient: 0.1
          },
          source: `
            czm_material czm_getMaterial(czm_materialInput materialInput){
                czm_material material = czm_getDefaultMaterial(materialInput);
                material.diffuse = 1.5 * u_color.rgb;
                vec2 st = materialInput.st;

                float dis = distance(st, vec2(0.5, 0.5));
                float per = fract(u_speed * czm_frameNumber / 1000.0);

                vec3 str = materialInput.str;
                if(abs(str.z) > 0.001)discard;
                if(dis > 0.5)discard;
                else {
                    float perDis = 0.5 / u_count;
                    float disNum;
                    float bl = 0.0;
                    for(int i = 0;i <= 999;i++){
                        if(float(i) > u_count)break;
                        disNum = perDis * float(i) - dis + per / u_count;
                        if(disNum > 0.0){
                            if(disNum < perDis) bl = 1.0 - disNum / perDis;
                            if(disNum - perDis<perDis)bl = 1.0 - abs(1.0 - disNum / perDis);
                            material.alpha = pow(bl,(1.0 + 10.0 * (1.0 - u_gradient)));
                        }
                    }
                }

                return material;
            }
        `
        },
        translucent: false
      }),
    }),
    asynchronous: false
  });
  primitiveCollection.add(primitive);
}

const addPrimitive3 = () => {
  const primitive = new Cesium.Primitive({
    geometryInstances: new Cesium.GeometryInstance({
      geometry: new Cesium.EllipseGeometry({
        center: new Cesium.Cartesian3.fromDegrees(114.346207, 30.550013, 0),
        semiMinorAxis: 1000.0,
        semiMajorAxis: 1000.0,
      })
    }),
    appearance: new Cesium.EllipsoidSurfaceAppearance({
      material: new Cesium.Material({
        fabric: {
          uniforms: {
            u_color: Cesium.Color.fromCssColorString('red').withAlpha(1),
            u_image: icons.img1,
            u_speed: 2,// 速度
          },
          source: `
            czm_material czm_getMaterial(czm_materialInput materialInput){
                czm_material material = czm_getDefaultMaterial(materialInput);
                vec2 st = materialInput.st;

                float angle = radians(mod(czm_frameNumber * u_speed, 360.0)); // u_time 作为角度（度数）
                mat2 rot = mat2(cos(angle), -sin(angle), sin(angle), cos(angle));
                st = (rot * (st - 0.5)) + 0.5;

                vec4 img = texture(u_image,st);
                material.diffuse = u_color.rgb;
                material.alpha = img.a;
                return material;
            }
        `
        },
        translucent: false
      }),
    }),
    asynchronous: false
  });
  primitiveCollection.add(primitive);
}

const addPrimitive4 = () => {
  const primitive = new Cesium.Primitive({
    geometryInstances: new Cesium.GeometryInstance({
      geometry: new Cesium.EllipseGeometry({
        center: new Cesium.Cartesian3.fromDegrees(114.376207, 30.550013, 0),
        semiMinorAxis: 1000.0,
        semiMajorAxis: 1000.0,
      })
    }),
    appearance: new Cesium.EllipsoidSurfaceAppearance({
      material: new Cesium.Material({
        fabric: {
          uniforms: {
            u_color: Cesium.Color.fromCssColorString('#5fc4ee').withAlpha(1),
            u_image: icons.img2,
            u_speed: 2,// 速度
          },
          source: `
            czm_material czm_getMaterial(czm_materialInput materialInput){
                czm_material material = czm_getDefaultMaterial(materialInput);
                vec2 st = materialInput.st;

                float angle = radians(mod(czm_frameNumber * u_speed, 360.0));
                mat2 rot = mat2(cos(angle), -sin(angle), sin(angle), cos(angle));
                st = (rot * (st - 0.5)) + 0.5;

                vec4 img = texture(u_image,st);
                material.diffuse = u_color.rgb;
                material.alpha = img.a;
                return material;
            }
        `
        },
        translucent: false
      }),
    }),
    asynchronous: false
  });
  primitiveCollection.add(primitive);
}

const addPrimitive5 = () => {
  const posArr = [[114.409154, 30.552564], [114.403259, 30.552564], [114.4020381, 30.550012], [114.406207, 30.546404], [114.409154, 30.547461], [114.410375, 30.550012]]
  const polygon = turf.polygon([[...posArr, posArr[0]]]);
  const temp = turf.centerOfMass(polygon);
  const center = new Cesium.Cartesian3.fromDegrees(temp.geometry.coordinates[0], temp.geometry.coordinates[1])
  const cps = Cesium.Cartesian3.fromDegreesArray(posArr.flat())
  const up = addPositionsHeight(cps, 1000) // 高度
  //计算位置
  let pos = []; //坐标
  let sts = []; //纹理
  let indices = []; //索引
  let normal = []; //法向量
  for (let i = 0, count = cps.length; i < count; i++) {
    let ni = (i + 1) % count;
    pos.push(...[cps[i].x, cps[i].y, cps[i].z]);
    pos.push(...[cps[ni].x, cps[ni].y, cps[ni].z]);
    pos.push(...[up[ni].x, up[ni].y, up[ni].z]);
    pos.push(...[up[i].x, up[i].y, up[i].z]);

    normal.push(...[0, 0, 1]);
    normal.push(...[0, 0, 1]);
    normal.push(...[0, 0, 1]);
    normal.push(...[0, 0, 1]);

    sts.push(...[0, 0, 1, 0, 1, 1, 0, 1]); //四个点的纹理一次存入

    let ii = i * 4;
    let i1 = ii + 1;
    let i2 = ii + 2;
    let i3 = ii + 3;
    indices.push(...[i2, i3, ii, ii, i1, i2]);
  }

  let positions = new Float64Array(pos);
  const primitive = new Cesium.Primitive({
    geometryInstances: new Cesium.GeometryInstance({
      geometry: new Cesium.Geometry({
        attributes: {
          position: new Cesium.GeometryAttribute({
            // 使用double类型的position进行计算
            componentDatatype: Cesium.ComponentDatatype.DOUBLE,
            //componentDatatype: Cesium.ComponentDatatype.FLOAT,
            componentsPerAttribute: 3,
            values: positions
          }),
          normal: new Cesium.GeometryAttribute({
            componentDatatype: Cesium.ComponentDatatype.FLOAT,
            componentsPerAttribute: 3,
            values: new Float32Array(normal)
          }),
          st: new Cesium.GeometryAttribute({
            componentDatatype: Cesium.ComponentDatatype.FLOAT,
            componentsPerAttribute: 2,
            values: new Float32Array(sts)
          })
        },
        indices: new Uint16Array(indices),
        primitiveType: Cesium.PrimitiveType.TRIANGLES,
        boundingSphere: Cesium.BoundingSphere.fromVertices(positions)
      })
    }),
    appearance: new Cesium.MaterialAppearance({
      material: new Cesium.Material({
        fabric: {
          uniforms: {
            u_color: Cesium.Color.fromCssColorString('#ff0000').withAlpha(1),
          },
          source: `
            uniform vec4 u_color;
            vec4 xh_getMaterial(vec2 st){
              float alpha = pow(1. - st.t, 4.0);
              vec4 color = vec4(u_color.rgb * u_color.a, alpha);
              return color;
            }
          `
        },
        translucent: false,
      }),
      vertexShaderSource: `
        #version 300 es
        precision highp float;

        in vec3 position3DHigh;
        in vec3 position3DLow;
        in vec3 normal;
        in vec2 st;
        in float batchId;
        out vec3 v_positionEC;
        out  vec2 v_st;
        out  vec3 v_normalEC;
        void main()
        {
            vec4 p = czm_translateRelativeToEye(position3DHigh,position3DLow);
            v_positionEC = (czm_modelViewRelativeToEye * p).xyz;
            v_normalEC = czm_normal * normal;
            v_st=st;
            gl_Position = czm_modelViewProjectionRelativeToEye * p;
        }
      `,
      fragmentShaderSource: `
        #version 300 es
        precision highp float;
        out vec4 fragColor;

        in vec3 v_positionEC;
        in vec3 v_normalEC;
        in vec2 v_st;
        void main(){
            fragColor  = xh_getMaterial(v_st);
        }
      `
    }),
    asynchronous: false
  })
  primitiveCollection.add(primitive)
  const mScale = Cesium.Matrix4.fromUniformScale(1.0);
  let num = 1
  timer = window.setInterval(() => {
    num = num + 10
    const time = num / 1000;
    let tt = time - Math.floor(time);
    tt = tt < 0.01 ? 0.01 : tt;
    mScale[0] = mScale[5] = tt * 2;
    mScale[10] = 1.1 - tt;
    primitive.modelMatrix = scaleXYZ(center, mScale);
  }, 10)

  function scaleXYZ(point, mScale) {
    let m = Cesium.Transforms.eastNorthUpToFixedFrame(point);
    let inverse = Cesium.Matrix4.inverse(m, new Cesium.Matrix4());

    let tt = Cesium.Matrix4.multiply(mScale, inverse, new Cesium.Matrix4());
    return Cesium.Matrix4.multiply(m, tt, new Cesium.Matrix4());
  }

  function addPositionsHeight(positions, height) {
    return positions.map(pos => {
      const car = Cesium.Cartographic.fromCartesian(pos);
      return Cesium.Cartesian3.fromRadians(car.longitude, car.latitude, car.height + height);
    })
  }
}

let timer
const addPrimitive6 = () => {
  const center = new Cesium.Cartesian3.fromDegrees(114.436207, 30.550013)
  const cps = getEllipseOuterPositions(center)
  const up = addPositionsHeight(cps, 1000) // 高度
  //计算位置
  let pos = []; //坐标
  let sts = []; //纹理
  let indices = []; //索引
  let normal = []; //法向量
  for (let i = 0, count = cps.length; i < count; i++) {
    let ni = (i + 1) % count;
    pos.push(...[cps[i].x, cps[i].y, cps[i].z]);
    pos.push(...[cps[ni].x, cps[ni].y, cps[ni].z]);
    pos.push(...[up[ni].x, up[ni].y, up[ni].z]);
    pos.push(...[up[i].x, up[i].y, up[i].z]);

    normal.push(...[0, 0, 1]);
    normal.push(...[0, 0, 1]);
    normal.push(...[0, 0, 1]);
    normal.push(...[0, 0, 1]);

    sts.push(...[0, 0, 1, 0, 1, 1, 0, 1]); //四个点的纹理一次存入

    let ii = i * 4;
    let i1 = ii + 1;
    let i2 = ii + 2;
    let i3 = ii + 3;
    indices.push(...[i2, i3, ii, ii, i1, i2]);
  }

  let positions = new Float64Array(pos);
  const primitive = new Cesium.Primitive({
    geometryInstances: new Cesium.GeometryInstance({
      geometry: new Cesium.Geometry({
        attributes: {
          position: new Cesium.GeometryAttribute({
            // 使用double类型的position进行计算
            componentDatatype: Cesium.ComponentDatatype.DOUBLE,
            //componentDatatype: Cesium.ComponentDatatype.FLOAT,
            componentsPerAttribute: 3,
            values: positions
          }),
          normal: new Cesium.GeometryAttribute({
            componentDatatype: Cesium.ComponentDatatype.FLOAT,
            componentsPerAttribute: 3,
            values: new Float32Array(normal)
          }),
          st: new Cesium.GeometryAttribute({
            componentDatatype: Cesium.ComponentDatatype.FLOAT,
            componentsPerAttribute: 2,
            values: new Float32Array(sts)
          })
        },
        indices: new Uint16Array(indices),
        primitiveType: Cesium.PrimitiveType.TRIANGLES,
        boundingSphere: Cesium.BoundingSphere.fromVertices(positions)
      })
    }),
    appearance: new Cesium.MaterialAppearance({
      material: new Cesium.Material({
        fabric: {
          uniforms: {
            u_color: Cesium.Color.fromCssColorString('#ff0000').withAlpha(1),
          },
          source: `
            uniform vec4 u_color;
            vec4 xh_getMaterial(vec2 st){
              float alpha = pow(1. - st.t, 4.0);
              vec4 color = vec4(u_color.rgb * u_color.a, alpha);
              return color;
            }
          `
        },
        translucent: false,
      }),
      vertexShaderSource: `
        #version 300 es
        precision highp float;

        in vec3 position3DHigh;
        in vec3 position3DLow;
        in vec3 normal;
        in vec2 st;
        in float batchId;
        out vec3 v_positionEC;
        out  vec2 v_st;
        out  vec3 v_normalEC;
        void main(){
            vec4 p = czm_translateRelativeToEye(position3DHigh,position3DLow);
            v_positionEC = (czm_modelViewRelativeToEye * p).xyz;
            v_normalEC = czm_normal * normal;
            v_st=st;
            gl_Position = czm_modelViewProjectionRelativeToEye * p;
        }
      `,
      fragmentShaderSource: `
        #version 300 es
        precision highp float;
        out vec4 fragColor;

        in vec3 v_positionEC;
        in vec3 v_normalEC;
        in vec2 v_st;
        void main(){
            fragColor  = xh_getMaterial(v_st);
        }
      `
    }),
    asynchronous: false
  })
  primitiveCollection.add(primitive)
  const mScale = Cesium.Matrix4.fromUniformScale(1.0);
  let num = 1
  timer = window.setInterval(() => {
    num = num + 10
    const time = num / 1000;
    let tt = time - Math.floor(time);
    tt = tt < 0.01 ? 0.01 : tt;
    mScale[0] = mScale[5] = tt * 2;
    mScale[10] = 1.1 - tt;
    primitive.modelMatrix = scaleXYZ(center, mScale);
  }, 10)

  function scaleXYZ(point, mScale) {
    let m = Cesium.Transforms.eastNorthUpToFixedFrame(point);
    let inverse = Cesium.Matrix4.inverse(m, new Cesium.Matrix4());

    let tt = Cesium.Matrix4.multiply(mScale, inverse, new Cesium.Matrix4());
    return Cesium.Matrix4.multiply(m, tt, new Cesium.Matrix4());
  }


  function getEllipseOuterPositions(center, radius = 400, count = 50) {
    const semiMajorAxis = radius
    const semiMinorAxis = radius
    const cep = Cesium.EllipseGeometryLibrary.computeEllipsePositions({
      center,
      semiMajorAxis,
      semiMinorAxis,
      rotation: 0,
      granularity: Math.PI / (16 * count)
    }, true, true);
    const arr = cep.outerPositions, positions = [];
    for (let i = 0, len = arr.length; i < len; i += 3) {
      //长半轴上的坐标点
      positions.push(new Cesium.Cartesian3(arr[i], arr[i + 1], arr[i + 2]));
    }
    const cartesianToWgs84 = (cartesian) => {
      const cartographic = Cesium.Cartographic.fromCartesian(cartesian);
      const longitude = Cesium.Math.toDegrees(cartographic.longitude);
      const latitude = Cesium.Math.toDegrees(cartographic.latitude);
      const height = cartographic.height;
      return [longitude, latitude, height]
    }
    return positions;
  }

  function addPositionsHeight(positions, height) {
    return positions.map(pos => {
      const car = Cesium.Cartographic.fromCartesian(pos);
      return Cesium.Cartesian3.fromRadians(car.longitude, car.latitude, car.height + height);
    })
  }
}

const addPrimitive7 = () => {
  const primitive = new Cesium.Primitive({
    geometryInstances: new Cesium.GeometryInstance({
      geometry: new Cesium.CircleGeometry({
        center: new Cesium.Cartesian3.fromDegrees(114.466207, 30.550013, 6.7),
        radius: 1000.0,
      }),
    }),
    appearance: new Cesium.EllipsoidSurfaceAppearance({
      material: new Cesium.Material({
        fabric: {
          uniforms: {
            u_color: Cesium.Color.fromCssColorString('#5fc4ee').withAlpha(1),
            u_speed: 10,// 速度
          },
          source: `
            float circle(vec2 uv, float r, float blur) {
                float d = length(uv) * 2.0;
                float c = smoothstep(r+blur, r, d);
                return c;
            }

            uniform vec4 u_color;
            czm_material czm_getMaterial(czm_materialInput materialInput){
                czm_material material = czm_getDefaultMaterial(materialInput);
                vec2 st = materialInput.st - .5;
                material.diffuse = u_color.rgb;
                material.emission = vec3(0);

                float t =fract(czm_frameNumber * u_speed / 1000.0);
                float s = 0.3;
                float radius1 = smoothstep(.0, s, t) * 0.5;
                float alpha1 = circle(st, radius1, 0.01) * circle(st, radius1, -0.01);
                float alpha2 = circle(st, radius1, 0.01 - radius1) * circle(st, radius1, 0.01);
                float radius2 = 0.5 + smoothstep(s, 1.0, t) * 0.5;
                float alpha3 = circle(st, radius1, radius2 + 0.01 - radius1) * circle(st, radius1, -0.01);

                material.alpha = smoothstep(1.0, s, t) * (alpha1 + alpha2*0.1 + alpha3*0.1);
                material.alpha *= u_color.a;

                return material;
            }
        `
        },
        translucent: false
      }),
    }),
    asynchronous: false
  });
  primitiveCollection.add(primitive);
}

const add3dtiles = async () => {
  const tileset = await Cesium.Cesium3DTileset.fromUrl(import.meta.env.VITE_APP_GISDATA + '/cctl/osm_community/tileset.json');
  tileset.style = new Cesium.Cesium3DTileStyle({
    color: {
      conditions: [
        ['${Elevation} === 18', 'rgba(255,140,0, 1)'],
        ['${Elevation} < 35', 'rgba(255,165,0, 1)'],
        ['${Elevation} < 50', 'rgba(30,144,255, 1)'],
        ['true', 'rgba(255,255,255,0.37)']
      ]
    }
  });
  primitiveCollection.add(tileset);
  viewer.zoomTo(tileset);
}

const addpostProcessStage1 = () => {
  const cartographicCenter = new Cesium.Cartographic(Cesium.Math.toRadians(125.330769), Cesium.Math.toRadians(43.802369), 0);

  const cartesian3Center = Cesium.Cartographic.toCartesian(cartographicCenter);
  const cartesian4Center = new Cesium.Cartesian4(cartesian3Center.x, cartesian3Center.y, cartesian3Center.z, 1);

  const cartographicCenter1 = new Cesium.Cartographic(cartographicCenter.longitude, cartographicCenter.latitude, cartographicCenter.height + 500);
  const cartesian3Center1 = Cesium.Cartographic.toCartesian(cartographicCenter1);
  const cartesian4Center1 = new Cesium.Cartesian4(cartesian3Center1.x, cartesian3Center1.y, cartesian3Center1.z, 1);

  const cartographicCenter2 = new Cesium.Cartographic(cartographicCenter.longitude + Cesium.Math.toRadians(0.001), cartographicCenter.latitude, cartographicCenter.height);
  const cartesian3Center2 = Cesium.Cartographic.toCartesian(cartographicCenter2);
  const cartesian4Center2 = new Cesium.Cartesian4(cartesian3Center2.x, cartesian3Center2.y, cartesian3Center2.z, 1);
  const rotateQ = new Cesium.Quaternion();
  const rotateM = new Cesium.Matrix3();

  const _time = moment().valueOf();

  const scratchCartesian4Center = new Cesium.Cartesian4();
  const scratchCartesian4Center1 = new Cesium.Cartesian4();
  const scratchCartesian4Center2 = new Cesium.Cartesian4();
  const scratchCartesian3Normal = new Cesium.Cartesian3();
  const scratchCartesian3Normal1 = new Cesium.Cartesian3();

  const ScanPostStage = new Cesium.PostProcessStage({
    fragmentShader: `
        #version 300 es
        precision highp float;

        uniform sampler2D colorTexture;
        uniform sampler2D depthTexture;

        uniform vec4 u_scanCenterEC;
        uniform vec3 u_scanPlaneNormalEC;
        uniform vec3 u_scanLineNormalEC;
        uniform float u_radius;
        uniform vec4 u_color;

        in vec2 v_textureCoordinates;
        out vec4 fragColor;

        vec4 toEye(in vec2 uv, in float depth){
            vec2 xy = vec2(uv.x * 2.0 - 1.0, uv.y * 2.0 - 1.0);
            vec4 posInCamera = czm_inverseProjection * vec4(xy, depth, 1.0);
            posInCamera = posInCamera / posInCamera.w;
            return posInCamera;
        }

        bool isPointOnLineRight(in vec3 ptOnLine, in vec3 lineNormal, in vec3 testPt){
            vec3 v01 = normalize(testPt - ptOnLine);
            vec3 temp = cross(v01, lineNormal);
            float d = dot(temp, u_scanPlaneNormalEC);
            return d > 0.5;
        }

        vec3 pointProjectOnPlane(in vec3 planeNormal, in vec3 planeOrigin, in vec3 point){
            vec3 v01 = point -planeOrigin;
            float d = dot(planeNormal, v01) ;
            return (point - planeNormal * d);
        }

        float distancePointToLine(in vec3 ptOnLine, in vec3 lineNormal, in vec3 testPt){
            vec3 tempPt = pointProjectOnPlane(lineNormal, ptOnLine, testPt);
            return length(tempPt - ptOnLine);
        }

        float getDepth(in vec4 depth){
            float z_window = czm_unpackDepth(depth);
            z_window = czm_reverseLogDepth(z_window);
            float n_range = czm_depthRange.near;
            float f_range = czm_depthRange.far;
            return (2.0 * z_window - n_range - f_range) / (f_range - n_range);
        }

        void main(){
            vec4 color = texture(colorTexture, v_textureCoordinates);
            float depth = getDepth(texture(depthTexture, v_textureCoordinates));
            vec4 viewPos = toEye(v_textureCoordinates, depth);

            vec3 prjOnPlane = pointProjectOnPlane(u_scanPlaneNormalEC.xyz, u_scanCenterEC.xyz, viewPos.xyz);
            float dis = length(prjOnPlane.xyz - u_scanCenterEC.xyz);
            float twou_radius = u_radius * 2.0;

            if(dis < u_radius){
                float f0 = 1.0 -abs(u_radius - dis) / u_radius;
                f0 = pow(f0, 64.0);
                float f = 0.0;
                vec3 lineEndPt = u_scanCenterEC.xyz + u_scanLineNormalEC * u_radius;

                if(isPointOnLineRight(u_scanCenterEC.xyz, u_scanLineNormalEC, prjOnPlane)){
                    float dis1= length(prjOnPlane - lineEndPt);
                    f = abs(twou_radius -dis1) / twou_radius;
                    f = pow(f, 3.0);
                }
                fragColor = mix(color, u_color, f + f0);
            }else{
                fragColor = color;
            }
        }
    `,
    uniforms: {
      u_scanCenterEC: Cesium.Matrix4.multiplyByVector(viewer.camera._viewMatrix, cartesian4Center, scratchCartesian4Center),
      u_scanPlaneNormalEC: function () {
        const temp = Cesium.Matrix4.multiplyByVector(viewer.camera._viewMatrix, cartesian4Center, scratchCartesian4Center);
        const temp1 = Cesium.Matrix4.multiplyByVector(viewer.camera._viewMatrix, cartesian4Center1, scratchCartesian4Center1);
        scratchCartesian3Normal.x = temp1.x - temp.x;
        scratchCartesian3Normal.y = temp1.y - temp.y;
        scratchCartesian3Normal.z = temp1.z - temp.z;

        Cesium.Cartesian3.normalize(scratchCartesian3Normal, scratchCartesian3Normal);
        return scratchCartesian3Normal;
      },
      u_radius: 1000,
      u_scanLineNormalEC: function () {
        const duration = 5000

        const temp = Cesium.Matrix4.multiplyByVector(viewer.camera._viewMatrix, cartesian4Center, scratchCartesian4Center);
        const temp1 = Cesium.Matrix4.multiplyByVector(viewer.camera._viewMatrix, cartesian4Center1, scratchCartesian4Center1);
        const temp2 = Cesium.Matrix4.multiplyByVector(viewer.camera._viewMatrix, cartesian4Center2, scratchCartesian4Center2);

        scratchCartesian3Normal.x = temp1.x - temp.x;
        scratchCartesian3Normal.y = temp1.y - temp.y;
        scratchCartesian3Normal.z = temp1.z - temp.z;

        Cesium.Cartesian3.normalize(scratchCartesian3Normal, scratchCartesian3Normal);

        scratchCartesian3Normal1.x = temp2.x - temp.x;
        scratchCartesian3Normal1.y = temp2.y - temp.y;
        scratchCartesian3Normal1.z = temp2.z - temp.z;

        const tempTime = ((moment().valueOf() - _time) % duration) / duration;
        Cesium.Quaternion.fromAxisAngle(scratchCartesian3Normal, tempTime * Cesium.Math.PI * 2, rotateQ);
        Cesium.Matrix3.fromQuaternion(rotateQ, rotateM);
        Cesium.Matrix3.multiplyByVector(rotateM, scratchCartesian3Normal1, scratchCartesian3Normal1);
        Cesium.Cartesian3.normalize(scratchCartesian3Normal1, scratchCartesian3Normal1);
        return scratchCartesian3Normal1;
      },
      u_color: Cesium.Color.fromCssColorString('red').withAlpha(1)
    }
  });
  viewer.scene.postProcessStages.add(ScanPostStage);
}

const addpostProcessStage2 = () => {
  const cartographicCenter = new Cesium.Cartographic(Cesium.Math.toRadians(125.300769), Cesium.Math.toRadians(43.802369), 0);

  const cartesian3Center = Cesium.Cartographic.toCartesian(cartographicCenter);
  const cartesian4Center = new Cesium.Cartesian4(cartesian3Center.x, cartesian3Center.y, cartesian3Center.z, 1);

  const cartograhpicCenter1 = new Cesium.Cartographic(cartographicCenter.longitude, cartographicCenter.latitude, cartographicCenter.height + 500);
  const cartesian3Center1 = Cesium.Cartographic.toCartesian(cartograhpicCenter1);
  const cartesian4Center1 = new Cesium.Cartesian4(cartesian3Center1.x, cartesian3Center1.y, cartesian3Center1.z, 1);

  const _time = moment().valueOf();

  const scratchCartesian4Center = new Cesium.Cartesian4();
  const scratchCartesian4Center1 = new Cesium.Cartesian4();
  const scratchCartesian3Normal = new Cesium.Cartesian3();

  const ScanPostStage = new Cesium.PostProcessStage({
    fragmentShader: `
      uniform sampler2D colorTexture;
      uniform sampler2D depthTexture;
      uniform vec4 u_scanCenterEC;
      uniform vec3 u_scanPlaneNormalEC;
      uniform float u_radius;
      uniform vec4 u_color;
      in vec2 v_textureCoordinates;
      out vec4 fragColor;

      vec4 toEye(in vec2 uv,in float depth){
          vec2 xy = vec2((uv.x * 2.0 - 1.0),(uv.y * 2.0 - 1.0));
          vec4 posIncamera = czm_inverseProjection * vec4(xy,depth,1.0);
          posIncamera = posIncamera/posIncamera.w;
          return posIncamera;
      }

      vec3 pointProjectOnPlane(in vec3 planeNormal,in vec3 planeOrigin,in vec3 point){
          vec3 v01 = point - planeOrigin;
          float d = dot(planeNormal,v01);
          return (point-planeNormal * d);
      }
      float getDepth(in vec4 depth){
          float z_window = czm_unpackDepth(depth);
          z_window = czm_reverseLogDepth(z_window);
          float n_range = czm_depthRange.near;
          float f_range = czm_depthRange.far;
          return (2.0 * z_window - n_range - f_range) / (f_range - n_range);
      }
      void main(){
          vec4 color = texture(colorTexture, v_textureCoordinates);
          float depth = getDepth(texture(depthTexture, v_textureCoordinates));
          vec4 viewPos = toEye(v_textureCoordinates, depth);
          vec3 prjOnPlane = pointProjectOnPlane(u_scanPlaneNormalEC.xyz, u_scanCenterEC.xyz, viewPos.xyz);
          float dis = length(prjOnPlane.xyz - u_scanCenterEC.xyz);
          if(dis < u_radius){
              float f = 1.0 - abs(u_radius - dis )/ u_radius;
              f = pow(f, 4.0);
              fragColor = mix(color, u_color, f);
          }else{
                fragColor = color;
          }
      }
    `,
    uniforms: {
      u_scanCenterEC: Cesium.Matrix4.multiplyByVector(viewer.camera._viewMatrix, cartesian4Center, scratchCartesian4Center),
      u_scanPlaneNormalEC: function () {
        const temp = Cesium.Matrix4.multiplyByVector(viewer.camera._viewMatrix, cartesian4Center, scratchCartesian4Center);
        const temp1 = Cesium.Matrix4.multiplyByVector(viewer.camera._viewMatrix, cartesian4Center1, scratchCartesian4Center1);

        scratchCartesian3Normal.x = temp1.x - temp.x;
        scratchCartesian3Normal.y = temp1.y - temp.y;
        scratchCartesian3Normal.z = temp1.z - temp.z;

        Cesium.Cartesian3.normalize(scratchCartesian3Normal, scratchCartesian3Normal);

        return scratchCartesian3Normal;
      },
      u_radius: function () {
        const maxRadius = 1000
        const duration = 4000
        return maxRadius * ((moment().valueOf() - _time) % duration) / duration;
      },
      u_color: Cesium.Color.fromCssColorString('red').withAlpha(1)
    }
  });

  viewer.scene.postProcessStages.add(ScanPostStage);
}

const reset = () => {
  primitiveCollection.removeAll()
  viewer.scene.postProcessStages.removeAll()
  window.clearInterval(timer)
}

// lil-gui逻辑
let gui, primitiveFolder, postProcessStageFolder
const formData = {
  reset,
  addPrimitive1,
  addPrimitive2,
  addPrimitive3,
  addPrimitive4,
  addPrimitive5,
  addPrimitive6,
  addPrimitive7,
  add3dtiles,
  addpostProcessStage1,
  addpostProcessStage2,
}
const initGui = () => {
  gui = new GUI({title: "dynamicDiffusion"});
  primitiveFolder = gui.addFolder("primitive")
  primitiveFolder.add(formData, "addPrimitive1").name("1 扩散效果Single")
  primitiveFolder.add(formData, "addPrimitive2").name("2 扩散效果")
  primitiveFolder.add(formData, "addPrimitive3").name("3 扫描效果")
  primitiveFolder.add(formData, "addPrimitive4").name("4 旋转图片效果")
  primitiveFolder.add(formData, "addPrimitive5").name("5 多边形扩散效果")
  primitiveFolder.add(formData, "addPrimitive6").name("6 围墙扩散效果")
  primitiveFolder.add(formData, "addPrimitive7").name("7 扫描线")
  postProcessStageFolder = gui.addFolder("postProcessStage")
  postProcessStageFolder.add(formData, "add3dtiles")
  postProcessStageFolder.add(formData, "addpostProcessStage1")
  postProcessStageFolder.add(formData, "addpostProcessStage2")
  gui.add(formData, "reset")
}


const icons = (() => {
  const raw = import.meta.glob<string>('/src/views/cesiumLast/component/blob/dynamicDiffusion/*.png', {
    eager: true,
    import: 'default'
  });
  return Object.keys(raw).reduce((obj, path) => {
    obj[path.match(/dynamicDiffusion\/(.*)\.png$/)[1]] = raw[path];
    return obj;
  }, {})
})()
</script>

<style lang="scss" scoped>
.dynamicDiffusion-wrap {

}
</style>
