<template>
  <div class="lineObj-wrap">
    <!-- 默认加载天地图-->
    <Tdt_img_d/>
  </div>
</template>

<script lang="ts" setup>
import {usemapStore} from "@/store/modules/cesiumLastMap";
import GUI from "lil-gui";
import {onMounted, onUnmounted} from "vue";
import * as Cesium from "cesium";
import geojson1 from "./bjgj.json"
import geojson2 from "./whcar.json"
import geojson3 from "./lineback1.json"
import geojson4 from "./lineback2.json"
import geojson5 from "./lineback3.json"
// Component
import Tdt_img_d from "@/views/cesiumLast/component/effect/controlPanel/layerManagement/basicMap/tdt_img_d.vue"

const mapStore = usemapStore()
onMounted(async () => {
  initGui()
  viewer.scene.primitives.add(primitiveCollection);
  viewer.dataSources.add(datasource);
  imgdLayer = viewer.imageryLayers._layers.find(layer => layer._imageryProvider._layer === 'img_d')
})

onUnmounted(() => {
  viewer.scene.primitives.remove(primitiveCollection);
  viewer.dataSources.remove(datasource);
  gui.destroy()
})

// 地图逻辑
const viewer = mapStore.getCesiumViewer()
const primitiveCollection = new Cesium.PrimitiveCollection()
const datasource = new Cesium.CustomDataSource();
let imgdLayer, geoJsonDataSource1, geoJsonDataSource2, geoJsonDataSource3

const addLineQx = () => {
  reset()
  viewer.camera.setView({
    destination: Cesium.Cartesian3.fromDegrees(119.009792, 28.793162, 309817.22),
    orientation: {
      heading: Cesium.Math.toRadians(337.5),
      pitch: Cesium.Math.toRadians(-42.5),
      roll: Cesium.Math.toRadians(359.9)
    },
  })
  const center = Cesium.Cartesian3.fromDegrees(117.29, 32.0581, 0);
  const cities = [
    { lon: 116.3123, lat: 31.8329},
    { lon: 116.7517, lat: 30.5255},
    { lon: 118.1909, lat: 32.536},
    { lon: 118.8062, lat: 30.6244},
    { lon: 115.7629, lat: 32.9919},
    { lon: 117.5208, lat: 33.6841},
    { lon: 118.0481, lat: 29.9542},
    { lon: 117.7734, lat: 31.4978},
    { lon: 116.1914, lat: 33.4698},
    { lon: 117.3889, lat: 30.2014},
    { lon: 117.4109, lat: 33.1073},
    { lon: 118.3557, lat: 31.0858},
    { lon: 116.6968, lat: 33.6896},
    { lon: 116.7847, lat: 32.7722},
    { lon: 118.6304, lat: 31.5363},
    { lon: 117.9382, lat: 30.9375}
  ];
  cities.forEach(item => {
    const thisPoint = Cesium.Cartesian3.fromDegrees(item.lon, item.lat, 0);
    const positions = getLinkedPointList(center, thisPoint, 40000, 100);
    const primitive = new Cesium.Primitive({
      geometryInstances: new Cesium.GeometryInstance({
        geometry: new Cesium.PolylineGeometry({
          positions,
          width: 2,
        })
      }),
      appearance: new Cesium.PolylineMaterialAppearance({
        material: new Cesium.Material({
          fabric: {
            uniforms: {
              color: Cesium.Color.fromCssColorString("rgb(255,201,38)"),
              repeat: new Cesium.Cartesian2(1, 1),
              image: icons['line1'],
              speed: 10,
            },
            source: `
            czm_material czm_getMaterial(czm_materialInput materialInput){
                czm_material material = czm_getDefaultMaterial(materialInput);
                vec2 st = repeat * materialInput.st;

                vec2 uv = vec2(fract((st.s) - speed * float(czm_frameNumber) / 1000.0), st.t);
                vec4 colorImage = texture(image, uv);

                material.alpha = colorImage.a * color.a;
                material.diffuse = max(color.rgb * material.alpha * 3.0, color.rgb);

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
  })
  const circlePrimitive = new Cesium.GroundPrimitive({
    geometryInstances: new Cesium.GeometryInstance({
      geometry: new Cesium.EllipseGeometry({
        center,
        semiMinorAxis: 6 * 1e4,
        semiMajorAxis: 6 * 1e4,
      })
    }),
    appearance: new Cesium.PolylineMaterialAppearance({
      material: new Cesium.Material({
        fabric: {
          uniforms: {
            u_color: Cesium.Color.fromCssColorString("rgb(77,201,255)").withAlpha(1),
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
  primitiveCollection.add(circlePrimitive);

  function getLinkedPointList(startPoint, endPoint, angularityFactor, numOfSingleLine) {
    const result = [];
    const startPosition = Cesium.Cartographic.fromCartesian(startPoint);
    const endPosition = Cesium.Cartographic.fromCartesian(endPoint);
    const startLon = (startPosition.longitude * 180) / Math.PI;
    const startLat = (startPosition.latitude * 180) / Math.PI;
    const endLon = (endPosition.longitude * 180) / Math.PI;
    const endLat = (endPosition.latitude * 180) / Math.PI;
    const dist = Math.sqrt((startLon - endLon) * (startLon - endLon) + (startLat - endLat) * (startLat - endLat));
    const angularity = dist * angularityFactor;
    const startVec = Cesium.Cartesian3.clone(startPoint);
    const endVec = Cesium.Cartesian3.clone(endPoint);
    const startLength = Cesium.Cartesian3.distance(startVec, Cesium.Cartesian3.ZERO);
    const endLength = Cesium.Cartesian3.distance(endVec, Cesium.Cartesian3.ZERO);
    Cesium.Cartesian3.normalize(startVec, startVec);
    Cesium.Cartesian3.normalize(endVec, endVec);
    if (Cesium.Cartesian3.distance(startVec, endVec) == 0) return result;
    const omega = Cesium.Cartesian3.angleBetween(startVec, endVec);
    result.push(startPoint);
    for (let i = 1; i < numOfSingleLine - 1; i++) {
      const t = (i * 1.0) / (numOfSingleLine - 1);
      const invT = 1 - t;
      const startScalar = Math.sin(invT * omega) / Math.sin(omega);
      const endScalar = Math.sin(t * omega) / Math.sin(omega);
      const startScalarVec = Cesium.Cartesian3.multiplyByScalar(startVec, startScalar, new Cesium.Cartesian3());
      const endScalarVec = Cesium.Cartesian3.multiplyByScalar(endVec, endScalar, new Cesium.Cartesian3());
      let centerVec = Cesium.Cartesian3.add(startScalarVec, endScalarVec, new Cesium.Cartesian3());
      const ht = t * Math.PI;
      const centerLength = startLength * invT + endLength * t + Math.sin(ht) * angularity;
      centerVec = Cesium.Cartesian3.multiplyByScalar(centerVec, centerLength, centerVec);
      result.push(centerVec);
    }
    result.push(endPoint);
    return result;
  }
}

const addLineGj = async () => {
  reset()
  imgdLayer.saturation = 0.2
  viewer.camera.setView({
    destination: Cesium.Cartesian3.fromDegrees(116.426859, 39.653086, 75211.73),
    orientation: {
      heading: Cesium.Math.toRadians(0.2),
      pitch: Cesium.Math.toRadians(-68),
      roll: Cesium.Math.toRadians(0)
    },
  })
  const busLines = [];
  geojson1.forEach(busLine => {
    let prevPt;
    const points = [];
    for (let i = 0; i < busLine.length; i += 2) {
      let pt = [busLine[i], busLine[i + 1]];
      if (i > 0) pt = [prevPt[0] + pt[0], prevPt[1] + pt[1]];
      prevPt = pt;
      const cart = Cesium.Cartesian3.fromDegrees(pt[0] / 1e4, pt[1] / 1e4, 100.0);
      points.push(cart);
    }
    busLines.push({positions: points});
  });
  busLines.forEach(busLine => {
    const primitive = new Cesium.Primitive({
      geometryInstances: new Cesium.GeometryInstance({
        geometry: new Cesium.PolylineGeometry({
          positions: busLine.positions,
          width: 2.0,
        }),
        vertexFormat: Cesium.PolylineMaterialAppearance.VERTEX_FORMAT,
      }),
      appearance: new Cesium.PolylineMaterialAppearance({
        material: new Cesium.Material({
          fabric: {
            uniforms: {
              color: new Cesium.Color(Math.random() * 0.5 + 0.5, Math.random() * 0.8 + 0.2, 0.0, 1.0),
              speed: 2 + 1.0 * Math.random(),
              startTime: Math.random()
            },
            source: `
            czm_material czm_getMaterial(czm_materialInput materialInput){
                czm_material material = czm_getDefaultMaterial(materialInput);
                vec2 st = materialInput.st;
                float t = fract(startTime + czm_frameNumber * speed / 1000.0);
                t *= 1.03;
                float alpha = smoothstep(t- 0.03, t, st.s) * step(-t, -st.s);
                alpha += 0.1;
                material.diffuse = color.rgb;
                material.alpha = alpha;
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
  })
}

const addLineWh = async () => {
  reset()
  imgdLayer.saturation = 0.2
  viewer.clock.shouldAnimate = true
  viewer.camera.setView({
    destination: Cesium.Cartesian3.fromDegrees(114.2827, 30.4434, 126468),
    orientation: {
      heading: Cesium.Math.toRadians(0),
      pitch: Cesium.Math.toRadians(-90),
      roll: Cesium.Math.toRadians(0)
    },
  })
  geojson2.forEach(item => {
    const linePos = [];
    for (let j = 0; j < item.length; j += 2) {
      const proj = new Cesium.WebMercatorProjection();
      const pos = new Cesium.Cartesian3(item[j], item[j + 1], 0);
      const latlon = new Cesium.Cartographic();
      proj.unproject(pos, latlon);
      const lat = latlon.latitude * 180 / Math.PI;
      const lon = latlon.longitude * 180 / Math.PI;
      const posReal = gcj2wgs(bd2gcj([lon, lat]))
      linePos.push(posReal[0]);
      linePos.push(posReal[1]);
      linePos.push(0);
      const entity = datasource.entities.add({
        position: Cesium.Cartesian3.fromDegrees(+posReal[0], +posReal[1], 0),
        nameID: j,
        billboard: {
          image: icons['marker'],
          width: 5,
          height: 5,
          color: Cesium.Color.fromCssColorString("rgba(255,250,250,0.2)"),
        }
      });
      entity.isAvailable = ((entity) => {
        return function (currentTime) {
          if (!Cesium.defined(currentTime)) throw new Cesium.DeveloperError('time is required.');
          const nMS = Cesium.JulianDate.toDate(currentTime).getTime() / 75;
          const time = nMS % 50;
          if (time && entity.nameID > time - 10 && entity.nameID < time) {
            entity.billboard.color._value.alpha = 0.8 * (entity.nameID - time + 10) / 10;
            return true;
          } else {
            return false;
          }
        }
      })(entity)
    }
    const primitive = new Cesium.Primitive({
      geometryInstances: new Cesium.GeometryInstance({
        geometry: new Cesium.PolylineGeometry({
          positions: Cesium.Cartesian3.fromDegreesArrayHeights(linePos),
          width: 2,
        }),
      }),
      appearance: new Cesium.PolylineMaterialAppearance({
        material: new Cesium.Material({
          fabric: {
            type: 'PolylineArrow',
            uniforms: {color: Cesium.Color.fromCssColorString("rgb(53,57,255)").withAlpha(0.8)}
          }
        })
      }),
      asynchronous: false
    });
    primitiveCollection.add(primitive);
  })

  function bd2gcj(arrdata) {
    const bd_lon = Number(arrdata[0]);
    const bd_lat = Number(arrdata[1]);
    const x_pi = (3.14159265358979324 * 3000.0) / 180.0;
    const x = bd_lon - 0.0065;
    const y = bd_lat - 0.006;
    const z = Math.sqrt(x * x + y * y) - 0.00002 * Math.sin(y * x_pi);
    const theta = Math.atan2(y, x) - 0.000003 * Math.cos(x * x_pi);
    let gg_lng = z * Math.cos(theta);
    let gg_lat = z * Math.sin(theta);
    gg_lng = Number(gg_lng.toFixed(6));
    gg_lat = Number(gg_lat.toFixed(6));
    return [gg_lng, gg_lat];
  }

  function gcj2wgs(arrdata) {
    const a = 6378245.0;
    const ee = 0.00669342162296594323;
    const lng = Number(arrdata[0]);
    const lat = Number(arrdata[1]);
    if (out_of_china(lng, lat)) {
      return [lng, lat];
    } else {
      let dlat = transformlat(lng - 105.0, lat - 35.0);
      let dlng = transformlng(lng - 105.0, lat - 35.0);
      const radlat = (lat / 180.0) * Math.PI;
      let magic = Math.sin(radlat);
      magic = 1 - ee * magic * magic;
      const sqrtmagic = Math.sqrt(magic);
      dlat = (dlat * 180.0) / (((a * (1 - ee)) / (magic * sqrtmagic)) * Math.PI);
      dlng = (dlng * 180.0) / ((a / sqrtmagic) * Math.cos(radlat) * Math.PI);
      const mglat = lat + dlat;
      const mglng = lng + dlng;
      let jd = lng * 2 - mglng;
      let wd = lat * 2 - mglat;
      jd = Number(jd.toFixed(6));
      wd = Number(wd.toFixed(6));
      return [jd, wd];
    }
  }

  function out_of_china(lng, lat) {
    return lng < 72.004 || lng > 137.8347 || lat < 0.8293 || lat > 55.8271 || false;
  }

  function transformlat(lng, lat) {
    let ret = -100.0 + 2.0 * lng + 3.0 * lat + 0.2 * lat * lat + 0.1 * lng * lat + 0.2 * Math.sqrt(Math.abs(lng));
    ret += ((20.0 * Math.sin(6.0 * lng * Math.PI) + 20.0 * Math.sin(2.0 * lng * Math.PI)) * 2.0) / 3.0;
    ret += ((20.0 * Math.sin(lat * Math.PI) + 40.0 * Math.sin((lat / 3.0) * Math.PI)) * 2.0) / 3.0;
    ret += ((160.0 * Math.sin((lat / 12.0) * Math.PI) + 320 * Math.sin((lat * Math.PI) / 30.0)) * 2.0) / 3.0;
    return ret;
  }

  function transformlng(lng, lat) {
    let ret = 300.0 + lng + 2.0 * lat + 0.1 * lng * lng + 0.1 * lng * lat + 0.1 * Math.sqrt(Math.abs(lng));
    ret += ((20.0 * Math.sin(6.0 * lng * Math.PI) + 20.0 * Math.sin(2.0 * lng * Math.PI)) * 2.0) / 3.0;
    ret += ((20.0 * Math.sin(lng * Math.PI) + 40.0 * Math.sin((lng / 3.0) * Math.PI)) * 2.0) / 3.0;
    ret += ((150.0 * Math.sin((lng / 12.0) * Math.PI) + 300.0 * Math.sin((lng / 30.0) * Math.PI)) * 2.0) / 3.0;
    return ret;
  }
}

const addLineGlow = async () => {
  reset()
  viewer.camera.setView({
    destination: Cesium.Cartesian3.fromDegrees(106.518886, 29.544926, 14985),
    orientation: {
      heading: Cesium.Math.toRadians(0),
      pitch: Cesium.Math.toRadians(-90),
      roll: Cesium.Math.toRadians(0)
    },
  })

  geoJsonDataSource1 = await viewer.dataSources.add(new Cesium.GeoJsonDataSource.load(geojson3, {strokeWidth: 50}))
  geoJsonDataSource1.entities.values.forEach(entity => entity.polyline.material = new Cesium.PolylineGlowMaterialProperty({
    glowPower: 0.06,
    color: Cesium.Color.fromCssColorString("#FF4500").withAlpha(0.9)
  }))
  geoJsonDataSource2 = await viewer.dataSources.add(new Cesium.GeoJsonDataSource.load(geojson4, {strokeWidth: 10}))
  geoJsonDataSource2.entities.values.forEach(entity => entity.polyline.material = new Cesium.PolylineDashMaterialProperty({
    dashLength: 10,
    color: Cesium.Color.fromCssColorString("#b700ff").withAlpha(0.9)
  }))
  geoJsonDataSource3 = await viewer.dataSources.add(new Cesium.GeoJsonDataSource.load(geojson5, {strokeWidth: 10}))
  geoJsonDataSource3.entities.values.forEach(entity => entity.polyline.material = new Cesium.PolylineArrowMaterialProperty(Cesium.Color.fromCssColorString("#33ff99").withAlpha(0.9)))
}

const addLineRiver = () => {
  reset()
  viewer.camera.setView({
    destination: Cesium.Cartesian3.fromDegrees(114.355012, 30.525486, 892),
    orientation: {
      heading: Cesium.Math.toRadians(330.5),
      pitch: Cesium.Math.toRadians(-37.6),
      roll: Cesium.Math.toRadians(0)
    },
  })
  const lines = [[114.347819, 30.528961, 0], [114.348155, 30.529824, 0], [114.348504, 30.530718, 0], [114.348813, 30.531634, 0], [114.349198, 30.53254, 0], [114.349549, 30.53347, 0], [114.349885, 30.534357, 0], [114.350282, 30.535254, 0], [114.350666, 30.536134, 0], [114.35096, 30.537147, 0], [114.350439, 30.538686, 0], [114.349896, 30.539568, 0], [114.349211, 30.540571, 0]]
  const sideRes = Lines2Plane(lines.map(item => Cesium.Cartesian3.fromDegrees(item[0], item[1])), 15, 1)
  const positions = new Float64Array(sideRes.vertexs);
  const attributes = new Cesium.GeometryAttributes();
  attributes.position = new Cesium.GeometryAttribute({
    componentDatatype: Cesium.ComponentDatatype.DOUBLE,
    componentsPerAttribute: 3,
    values: positions
  });
  attributes.st = new Cesium.GeometryAttribute({
    componentDatatype: Cesium.ComponentDatatype.FLOAT,
    componentsPerAttribute: 2,
    values: sideRes.uvs
  });
  const instance = new Cesium.GeometryInstance({
    geometry: new Cesium.Geometry({
      attributes: attributes,
      indices: sideRes.indexs,
      primitiveType: Cesium.PrimitiveType.TRIANGLES,
      boundingSphere: Cesium.BoundingSphere.fromVertices(positions)
    })
  });
  const renderState = new Cesium.RenderState();
  renderState.depthTest.enabled = true
  const primitive = new Cesium.Primitive({
    geometryInstances: instance,
    appearance: new Cesium.Appearance({
      material: new Cesium.Material({
        fabric: {
          uniforms: {
            image: icons['road'],
            alpha: 1,
            moveVar: new Cesium.Cartesian3(50, 1, 100),
            reflux: true ? -1 : 1,
            speed: 1,
            move: true,
            flipY: true
          },
          source: `
            czm_material czm_getMaterial(czm_materialInput materialInput) {
                czm_material material = czm_getDefaultMaterial(materialInput);
                vec2 st = materialInput.st;
                if(move){
                    float r = sqrt((st.x-0.8)*(st.x-0.8) + (st.y-0.8)*(st.y-0.8));
                    float r2 = sqrt((st.x-0.2)*(st.x-0.2) + (st.y-0.2)*(st.y-0.2));
                    float z = cos(moveVar.x*r + czm_frameNumber/100.0*moveVar.y)/moveVar.z;
                    float z2 = cos(moveVar.x*r2 + czm_frameNumber/100.0*moveVar.y)/moveVar.z;
                    st += sqrt(z*z+z2*z2);
                    st.s += reflux * czm_frameNumber/1000.0 * speed;
                    st.s = mod(st.s,1.0);
                }
                if(flipY)st = vec2(st.t,st.s);
                vec4 colorImage = texture(image, st);
                material.alpha = alpha;
                material.diffuse = colorImage.rgb;
                return material;
            }
        `
        },
        translucent: false
      }),
      renderState: renderState,
      vertexShaderSource: `
          in vec3 position3DHigh;
          in vec3 position3DLow;
          in vec2 st;
          in float batchId;

          out vec3 v_positionMC;
          out vec3 v_positionEC;
          out vec2 v_st;

          void main(){
              vec4 p = czm_computePosition();
              v_positionMC = position3DHigh + position3DLow;           // position in model coordinates
              v_positionEC = (czm_modelViewRelativeToEye * p).xyz;     // position in eye coordinates
              v_st = st;
              gl_Position = czm_modelViewProjectionRelativeToEye * p;
          }
      `,
      fragmentShaderSource: `
        in vec3 v_positionMC;
        in vec3 v_positionEC;
        in vec2 v_st;
        out vec4 fragColor;

        void main(){
            czm_materialInput materialInput;
            vec3 normalEC = normalize(czm_normal3D * czm_geodeticSurfaceNormal(v_positionMC, vec3(0.0), vec3(1.0)));
            #ifdef FACE_FORWARD
                normalEC = faceforward(normalEC, vec3(0.0, 0.0, 1.0), -normalEC);
            #endif

            materialInput.s = v_st.s;
            materialInput.st = v_st;
            materialInput.str = vec3(v_st, 0.0);

            // Convert tangent space material normal to eye space
            materialInput.normalEC = normalEC;
            materialInput.tangentToEyeMatrix = czm_eastNorthUpToEyeCoordinates(v_positionMC, materialInput.normalEC);

            // Convert view vector to world space
            vec3 positionToEyeEC = -v_positionEC;
            materialInput.positionToEyeEC = positionToEyeEC;

            czm_material material = czm_getMaterial(materialInput);

            #ifdef FLAT
                fragColor = vec4(material.diffuse + material.emission, material.alpha);
            #else
                fragColor = czm_phong(normalize(positionToEyeEC), material, czm_lightDirectionEC);
            #endif
        }
      `
    }),
    asynchronous: false
  });
  primitiveCollection.add(primitive);

  function Lines2Plane(lineArr, width, height) {
    if (!lineArr || lineArr.length <= 1 || !width || width == 0) {
      console.warn("请确认参数符合规则：数组长度大于1，宽高不能为0！", lineArr);
      return;
    }
    const len = lineArr.length;
    const leftPots = [];
    const rightPots = [];
    const halfW = width / 2.0;
    for (let i = 0; i < len; i++) {
      let prevP;
      let currP;
      let nextP;
      let leftPot;
      let rightPot;
      if (i == 0) {
        prevP = lineArr[i];
        currP = lineArr[i];
        nextP = lineArr[i + 1];
      } else if (i == len - 1) {
        prevP = lineArr[i - 1];
        currP = lineArr[i];
        nextP = lineArr[i - 1];
      } else {
        prevP = lineArr[i - 1];
        currP = lineArr[i];
        nextP = lineArr[i + 1];
      }

      if (height != 0) {
        prevP = RaisePoint(prevP, height);
        currP = RaisePoint(currP, height);
        nextP = RaisePoint(nextP, height);
      }

      if (prevP && currP && nextP) {
        let sides = GetSides(currP, nextP, halfW);
        leftPot = sides.left;
        rightPot = sides.right;
        if (i == 0) {
          leftPots.push(leftPot);
          rightPots.push(rightPot);
          leftPots.push(leftPot);
          rightPots.push(rightPot);
          continue;
        } else {
          if (i < len - 1) {
            leftPots.push(leftPot);
            rightPots.push(rightPot);
          } else {
            leftPots.push(rightPot);
            rightPots.push(leftPot);
            leftPots.push(rightPot);
            rightPots.push(leftPot);
            continue;
          }
        }
        sides = GetSides(currP, prevP, halfW);
        leftPot = sides.left;
        rightPot = sides.right;
        leftPots.push(rightPot);
        rightPots.push(leftPot);
      }
    }

    let leftPotsRes = [];
    let rightPotsRes = [];
    if (leftPots.length == len * 2) {
      for (let i = 0; i < len; i++) {
        const CurrP = lineArr[i];
        const lf1 = leftPots[i * 2 + 0];
        const lf2 = leftPots[i * 2 + 1];
        let dir1 = Cesium.Cartesian3.subtract(lf1, CurrP, new Cesium.Cartesian3());
        let dir2 = Cesium.Cartesian3.subtract(lf2, CurrP, new Cesium.Cartesian3());
        let avgDir = Cesium.Cartesian3.add(dir1, dir2, new Cesium.Cartesian3());
        let avgPot = Cesium.Cartesian3.add(CurrP, avgDir, new Cesium.Cartesian3());
        leftPotsRes.push(Cesium.clone(avgPot));
        const rg1 = rightPots[i * 2 + 0];
        const rg2 = rightPots[i * 2 + 1];
        dir1 = Cesium.Cartesian3.subtract(rg1, CurrP, new Cesium.Cartesian3());
        dir2 = Cesium.Cartesian3.subtract(rg2, CurrP, new Cesium.Cartesian3());
        avgDir = Cesium.Cartesian3.add(dir1, dir2, new Cesium.Cartesian3());
        avgPot = Cesium.Cartesian3.add(CurrP, avgDir, new Cesium.Cartesian3());
        rightPotsRes.push(Cesium.clone(avgPot));
      }
    } else {
      console.warn("计算左右侧点出问题！");
      return;
    }
    const uvs = [];
    let vertexs = [];
    let vertexsH = [];
    let vertexsL = [];
    const indexs = [];

    //先记录右边点，后记录左边点、记录2遍为了分离UV
    for (let i = 0; i < len; i++) {
      let encodeRes = Cesium.EncodedCartesian3.fromCartesian(rightPotsRes[i]);
      vertexs.push(rightPotsRes[i].x);
      vertexs.push(rightPotsRes[i].y);
      vertexs.push(rightPotsRes[i].z);
      vertexsH.push(encodeRes.high.x);
      vertexsH.push(encodeRes.high.y);
      vertexsH.push(encodeRes.high.z);
      vertexsL.push(encodeRes.low.x);
      vertexsL.push(encodeRes.low.y);
      vertexsL.push(encodeRes.low.z);
      uvs.push(1, 1);

      //记录索引以及UV
      if (i < len - 1) {
        indexs.push(i + len * 2);
        indexs.push(i + 1);
        indexs.push(i + 1 + len);
        indexs.push(i + len * 2);
        indexs.push(i + 1 + len);
        indexs.push(len + i + len * 2);
      }
    }
    for (let i = 0; i < len; i++) {
      const encodeRes = Cesium.EncodedCartesian3.fromCartesian(leftPotsRes[i]);
      vertexs.push(leftPotsRes[i].x);
      vertexs.push(leftPotsRes[i].y);
      vertexs.push(leftPotsRes[i].z);
      vertexsH.push(encodeRes.high.x);
      vertexsH.push(encodeRes.high.y);
      vertexsH.push(encodeRes.high.z);
      vertexsL.push(encodeRes.low.x);
      vertexsL.push(encodeRes.low.y);
      vertexsL.push(encodeRes.low.z);
      uvs.push(1, 0);
    }

    for (let i = 0; i < len; i++) {
      const encodeRes = Cesium.EncodedCartesian3.fromCartesian(rightPotsRes[i]);
      vertexs.push(rightPotsRes[i].x);
      vertexs.push(rightPotsRes[i].y);
      vertexs.push(rightPotsRes[i].z);
      vertexsH.push(encodeRes.high.x);
      vertexsH.push(encodeRes.high.y);
      vertexsH.push(encodeRes.high.z);
      vertexsL.push(encodeRes.low.x);
      vertexsL.push(encodeRes.low.y);
      vertexsL.push(encodeRes.low.z);
      uvs.push(0, 1);
    }
    for (let i = 0; i < len; i++) {
      const encodeRes = Cesium.EncodedCartesian3.fromCartesian(leftPotsRes[i]);
      vertexs.push(leftPotsRes[i].x);
      vertexs.push(leftPotsRes[i].y);
      vertexs.push(leftPotsRes[i].z);
      vertexsH.push(encodeRes.high.x);
      vertexsH.push(encodeRes.high.y);
      vertexsH.push(encodeRes.high.z);
      vertexsL.push(encodeRes.low.x);
      vertexsL.push(encodeRes.low.y);
      vertexsL.push(encodeRes.low.z);
      uvs.push(0, 0);
    }

    return {
      left: leftPotsRes,
      right: rightPotsRes,
      self: lineArr,
      vertexs: new Float32Array(vertexs),
      vertexsH: new Float32Array(vertexsH),
      vertexsL: new Float32Array(vertexsL),
      indexs: new Uint16Array(indexs),
      uvs: new Float32Array(uvs)
    };
  }

  function GetSides(firstP, sceondP, halfW) {
    const dir = Cesium.Cartesian3.normalize(Cesium.Cartesian3.subtract(sceondP, firstP, new Cesium.Cartesian3()), new Cesium.Cartesian3());
    const nor = Cesium.Cartesian3.normalize(firstP, new Cesium.Cartesian3());
    const leftDir = Cesium.Cartesian3.cross(nor, dir, new Cesium.Cartesian3());
    const rightDir = Cesium.Cartesian3.cross(dir, nor, new Cesium.Cartesian3());
    const leftray = new Cesium.Ray(firstP, leftDir);
    const rightray = new Cesium.Ray(firstP, rightDir);
    const leftPot = Cesium.Ray.getPoint(leftray, halfW);
    const rightPot = Cesium.Ray.getPoint(rightray, halfW);
    return {left: leftPot, right: rightPot};
  }

  function RaisePoint(pot, height) {
    if (!(pot instanceof Cesium.Cartesian3)) {
      console.warn("请确认点是Cartesian3类型！");
      return;
    }
    if (!height || height == 0) {
      console.warn("请确认高度是非零数值！");
      return;
    }
    const dir = Cesium.Cartesian3.normalize(pot, new Cesium.Cartesian3());
    const ray = new Cesium.Ray(pot, dir);
    return Cesium.Ray.getPoint(ray, height);
  }
}

const reset = () => {
  primitiveCollection.removeAll()
  datasource.entities.removeAll()
  viewer.clock.shouldAnimate = false
  imgdLayer.saturation = 1
  if (geoJsonDataSource1) viewer.dataSources.remove(geoJsonDataSource1)
  if (geoJsonDataSource2) viewer.dataSources.remove(geoJsonDataSource2)
  if (geoJsonDataSource3) viewer.dataSources.remove(geoJsonDataSource3)
}

// lil-gui逻辑
let gui
const formData = {
  addLineQx,
  addLineGj,
  addLineWh,
  addLineGlow,
  addLineRiver,
  reset,
}

const initGui = () => {
  gui = new GUI({title: "lineObj"});
  gui.add(formData, "addLineQx")
  gui.add(formData, "addLineGj")
  gui.add(formData, "addLineWh")
  gui.add(formData, "addLineGlow")
  gui.add(formData, "addLineRiver")
  gui.add(formData, "reset")
}

// 图标
const icons = (() => {
  const raw = import.meta.glob('/src/views/cesiumLast/component/blob/lineObj/*.png', {eager: true, import: 'default'});
  return Object.keys(raw).reduce((obj, path) => {
    obj[path.match(/lineObj\/(.*)\.png$/)[1]] = raw[path];
    return obj;
  }, {})
})()

</script>

<style lang="scss" scoped>
.lineObj-wrap {

}
</style>
