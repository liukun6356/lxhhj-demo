<!--挖方分析 todo-->
<template>
  <div class="terrainClipPlan-wrap">
    <div>
      <el-button @click="selecteHeight" type="primary">挖方分析</el-button>
      <el-button @click="reset" type="primary">重置</el-button>
    </div>
    <ul :style="{top:popupPos.top+'px',left:popupPos.left+'px'}">
      <li>计算结果</li>
      <li>体积:{{ formatToFixed(resObj.cut) }}m³</li>
      <li>横切面积:{{ formatToFixed(resObj.area) }}㎡</li>
      <li>最大海拔:{{ formatToFixed(resObj.maxHeight) }}m</li>
      <li>最小海拔:{{ formatToFixed(resObj.minHeight) }}m</li>
    </ul>
    <!-- 默认加载天地图-->
    <Tdt_img_d/>
    <Dom/>
    <Boundary/>
  </div>
</template>

<script lang="ts" setup>
import {onMounted, onUnmounted, reactive, toRefs} from "vue";
import {formatToFixed} from "@/utils/dictionary"
import * as mars3d from "mars3d";
import rxjs from "./rxjs.umd.min.js";
import {centerOfMass as turf_centerOfMass} from "@turf/turf";
import {usemapStore} from "@/store/modules/cesiumMap";
// Component
import Tdt_img_d from "@/views/cesium/component/controlPanel/layerManagement/basicMap/tdt_img_d.vue"
import Dom from "./component/dom.vue"
import Boundary from "./component/boundary.vue"
import {ElMessage, ElLoading} from "element-plus";

const mapStore = usemapStore()
const model = reactive({
  resObj: {
    cut: null,//体积
    area: null,//横切面积
    maxHeight: null,//最大高度
    minHeight: null,//最小高度
  },
  popupPos: {
    left: 400,
    top: 100
  }
})
const {resObj, popupPos} = toRefs(model)

onMounted(() => {
  add3dtileset()
  addDem()
  graphicLayer.on(mars3d.EventType.drawCreated, drawCreatedFn)
  viewer.scene.globe.depthTestAgainstTerrain = true;
  viewer.addLayer(graphicLayer)
})

onUnmounted(() => {
  graphicLayer.off(mars3d.EventType.drawCreated, drawCreatedFn)
  const primitive = viewer.scene.primitives._primitives.find(primitive => primitive.name === 'terrainClipPlan')
  viewer.scene.primitives.remove(primitive)
  viewer.terrainProvider = null;
  viewer.removeLayer(graphicLayer)
  loadingInstance && loadingInstance.close()
})

const selecteHeight = () => {
  if (graphicLayer.graphics.length) {
    ElMessage.warning('已存在计算范围，请重置')
    return
  }
  graphicLayer.startDraw({
    name: "terrainClipPlan",
    type: "polygon",
    style: {
      color: "#ffff00",
      opacity: 0.5,
      outline: true,
      outlineColor: "#ffffff",
      outlineWidth: 2.0,
    },
  })
}

const reset = () => {
  graphicLayer.clear()
  ElMessage.success('重置成功')
}

const drawCreatedFn = (e) => {
  compute({
    cartesians: e.positions,
    splitNum: 1000, //wall边界插值数,控制精度[注意精度越大，分析时间越长],
    isShowPoint: true
  }, (result) => {
    console.log(result, 111)
  }, (progress) => {
    console.log(progress, 222)
  })
}

// 地图逻辑
const viewer = mapStore.getCesiumViewer();
const graphicLayer = new mars3d.layer.GraphicLayer({
  // isRestorePositions: true,
  hasEdit: true,
  isAutoEditing: true // 绘制完成后是否自动激活编辑
})
let cctlLayer
const add3dtileset = () => {
  cctlLayer = new mars3d.layer.TilesetLayer({
    name: "terrainClipPlan",
    url: import.meta.env.VITE_APP_GISDATA + '/baoshan/3dtiles/tileset.json', //数据地址
    maximumScreenSpaceError: 25,
    maximumMemoryUsage: 1024,
    enableCollision: true,
    flyTo: true,
  })
  viewer.addLayer(cctlLayer)
}

const addDem = () => {
  const terrainProvider = new Cesium.CesiumTerrainProvider({
    url: import.meta.env.VITE_APP_GISDATA + "/baoshan/dem",
  });
  viewer.terrainProvider = terrainProvider;
}

// 土方计算逻辑
let loadingInstance
const compute = (options, result, progress) => {
  // const loading = this.$loading({
  //   lock: true,
  //   text: '请稍等，正在计算数据中...(范围越大计算时间越长，可按f12查看进度，目前为了计算精度，把边界插值数调高了，后续可处理)',
  //   spinner: 'el-icon-loading',
  //   background: 'rgba(0, 0, 0, 0.7)'
  // });
  let _subsription
  var cartesians = options.cartesians;
  var that = {}, scene = viewer.scene;
  that.resultTempR = new Cesium.Cartesian3();
  that.resultTempO = new Cesium.Cartesian3();
  that.resultTempK = new Cesium.Cartesian3();
  that.NewCartographic = new Cesium.Cartographic();
  that.cartesiansIndex0ScalarResult = new Cesium.Cartesian3();
  that.cartesiansIndex1ScalarResult = new Cesium.Cartesian3();
  that.resultTempB = new Cesium.Cartesian3();
  that.differenceMatrixClone = new Cesium.Cartesian3();
  that.positions = cartesians;
  debugger
  var area = areaFn(cartesians).toFixed(2);
  //求中心点
  var ptcenter = centerOfMass(cartesians);
  // var gridWidth = Math.max(0.5, Math.sqrt(area / that.splitNum));
  that.splitNum = options.splitNum || 1000;
  that.isShow = options.isShowPoint || true;
  var gridWidth = Math.sqrt(area / that.splitNum);
  var finalHeight = getMinHeight(cartesians);
  that._minHeight = finalHeight;
  that._jzmHeight = finalHeight;
  that._maxHeight = result.maxHeight;
  _subsription && _subsription.unsubscribe(),
      _subsription = function (cartesians, gridWidth, finalHeight, scene, result, progress) {
        if (!(cartesians.length < 3)) {
          progress && progress(0);
          debugger
          var positionArr = [];
          cartesians.forEach(function (pointItem) {
            var tempPoint;
            if (finalHeight) {
              // (t = Cesium.Cartographic.fromCartesian(pointItem, void 0, that.NewCartographic)).height = finalHeight
              tempPoint = Cesium.Cartographic.fromCartesian(pointItem, void 0, that.NewCartographic);
              tempPoint.height = finalHeight;
            } else {
              tempPoint = Cesium.Cartographic.fromCartesian(pointItem, void 0, that.NewCartographic);
              finalHeight = tempPoint.height;
            }
            positionArr.push(Cesium.Cartesian3.fromRadians(tempPoint.longitude, tempPoint.latitude, tempPoint.height));
          });
          var center = Cesium.CoplanarPolygonGeometry.fromPositions({
            positions: positionArr
          });
          var cartesians = Cesium.CoplanarPolygonGeometry.createGeometry(center);
          var positionValue = cartesians.attributes.position.values;
          var indices = cartesians.indices;
          var boundingSphere = cartesians.boundingSphere;
          center = Cesium.Cartesian3.clone(boundingSphere.center);
          cartesians = Cesium.Cartographic.fromCartesian(center, void 0, that.NewCartographic);
          Cesium.Cartesian3.fromRadians(cartesians.longitude, cartesians.latitude, finalHeight, void 0, center);
          cartesians = Cesium.Transforms.eastNorthUpToFixedFrame(center);
          var cartesiansIndex0 = Cesium.Matrix4.getColumn(cartesians, 0, new Cesium.Cartesian3());
          var cartesiansIndex1 = Cesium.Matrix4.getColumn(cartesians, 1, new Cesium.Cartesian3());
          var differenceMatrix = Cesium.Cartesian3.subtract(center, Cesium.Cartesian3.multiplyByScalar(cartesiansIndex0, boundingSphere.radius, that.cartesiansIndex0ScalarResult), that.resultTempB);
          differenceMatrix = Cesium.Cartesian3.subtract(differenceMatrix, Cesium.Cartesian3.multiplyByScalar(cartesiansIndex1, boundingSphere.radius, that.cartesiansIndex1ScalarResult), differenceMatrix);
          var splitLength = Math.round(2 * boundingSphere.radius / gridWidth) + 1;
          var cellSize = gridWidth;
          var differenceMatrixClone = that.differenceMatrixClone;
          Cesium.Cartesian3.clone(differenceMatrix, differenceMatrixClone);
          for (var y = [], v = [], i = 0; i < splitLength; ++i)
            for (var x = 0; x < splitLength; ++x)
              if (Cesium.Cartesian3.add(differenceMatrix, Cesium.Cartesian3.multiplyByScalar(cartesiansIndex0, cellSize * i, that.cartesiansIndex0ScalarResult), differenceMatrixClone),
                  Cesium.Cartesian3.add(differenceMatrixClone, Cesium.Cartesian3.multiplyByScalar(cartesiansIndex1, cellSize * x, that.cartesiansIndex1ScalarResult), differenceMatrixClone),
                  !(0 < boundingSphere.distanceSquaredTo(differenceMatrixClone))) {
                for (var w = false, b = indices.length / 3, C = 0; C < b; ++C) {
                  var S = Cesium.Cartesian3.fromElements(positionValue[3 * indices[3 * C + 0] + 0], positionValue[3 * indices[3 * C + 0] + 1], positionValue[3 * indices[3 * C + 0] + 2], that.resultTempR)
                      ,
                      T = Cesium.Cartesian3.fromElements(positionValue[3 * indices[3 * C + 1] + 0], positionValue[3 * indices[3 * C + 1] + 1], positionValue[3 * indices[3 * C + 1] + 2], that.resultTempO)
                      ,
                      M = Cesium.Cartesian3.fromElements(positionValue[3 * indices[3 * C + 2] + 0], positionValue[3 * indices[3 * C + 2] + 1], positionValue[3 * indices[3 * C + 2] + 2], that.resultTempK);
                  if (D(differenceMatrixClone, S, T, M)) {
                    w = true;
                    break
                  }
                }
                w && (v.push(Cesium.Cartesian3.clone(differenceMatrixClone)),
                    y.push(Cesium.Ellipsoid.WGS84.scaleToGeodeticSurface(differenceMatrixClone)))
              }
          progress && progress(0.1);
          var E, P = 0;

          return rxjs.of({
            clampCartesians: y,
            heightCartesians: v
          }).pipe(rxjs.operators.concatMap(function (e) {
                for (var t = e.clampCartesians, n = e.heightCartesians, i = 0, r = t.length, a = []; i < r;) {
                  var o = 10 < r - i ? i + 10 : r
                      , l = t.slice(i, o)
                      , s = n.slice(i, o);
                  a.push({
                    pClampCartesians: l,
                    pHeightCartesians: s
                  }),
                      i = o
                }
                return E = a.length,
                    rxjs.from(a).pipe(rxjs.operators.concatMap(function (e) {
                      var t = e.pClampCartesians
                          , u = e.pHeightCartesians;
                      return rxjs.fromEventPattern(function (n) {
                        scene.clampToHeightMostDetailed(t).then(function (e) {
                          ++P,
                          progress && progress(P / E * .8 + .1, e);
                          var t = e.some(function (e) {
                            return void 0 === e
                          });
                          n(t ? void 0 : e)
                        }).otherwise(function (e) {
                          n(void 0)
                        })
                      }, function (e) {
                      }).pipe(rxjs.operators.observeOn(rxjs.animationFrameScheduler), rxjs.operators.delay(10), rxjs.operators.map(function (e) {
                        if (!e)
                          throw new Error("clampToHeightMostDetailed error!");
                        for (var t = [], n = e.length, i = new Cesium.Cartesian3(), r = 0, a = 0, o = 0, mh = 0, mhNum = 0; o < n; ++o) {
                          var l = Cesium.Cartesian3.subtract(e[o], u[o], i);
                          var s = Cesium.Cartesian3.magnitude(l);
                          var sk = 0;
                          if (Cesium.Cartesian3.dot(l, u[o]) > 0) {
                            t.push(s);
                            r += s * gridWidth * gridWidth;
                            sk = s;
                          } else {
                            t.push(-s);
                            sk = -s;
                            a += s * gridWidth * gridWidth;
                          }
                          if (sk > mh) {
                            mh = sk;
                            mhNum = Cesium.Cartographic.fromCartesian(e[o]).height;
                          }
                        }
                        return {
                          pHeightCartesians: u,
                          pClampCartesians: e,
                          pDiffHeights: t,
                          maxHeight: mhNum,
                          fill: a,
                          cut: r,
                          total: a - r
                        }
                      }), rxjs.operators.first())
                    }))
              }), rxjs.operators.toArray(), rxjs.operators.map(function (e) {
                var pHeightCartesiansList = [];
                var pClampCartesiansList = [];
                var pDiffHeightsList = [];
                var cutResult = 0;
                var fillResult = 0;
                var totalResult = 0;
                var pmaxHeight = 0;
                e.forEach(function (e) {
                  pHeightCartesiansList.push.apply(pHeightCartesiansList, copyArray(e.pHeightCartesians));
                  pClampCartesiansList.push.apply(pClampCartesiansList, copyArray(e.pClampCartesians));
                  pDiffHeightsList.push.apply(pDiffHeightsList, copyArray(e.pDiffHeights));
                  if (e.maxHeight > pmaxHeight) {
                    pmaxHeight = e.maxHeight;
                  }
                  cutResult += e.cut;
                  fillResult += e.fill;
                  totalResult += e.total;
                })
                if (progress) {
                  progress(1)
                }
                return {
                  heightCartesians: pHeightCartesiansList,
                  clampCartesians: pClampCartesiansList,
                  diffHeights: pDiffHeightsList,
                  maxHeight: pmaxHeight,
                  minHeight: finalHeight,
                  cut: cutResult,
                  fill: fillResult,
                  total: totalResult
                }
              }),
              rxjs.operators.map(function (e) {
                e.area = area;
                e.ptcenter = ptcenter;
                that.result = e;
                // loading.close();
                return result(e)
              }))
        }
      }(cartesians, gridWidth, finalHeight, scene, result, progress).subscribe(function () {
      }, function (e) {
        // that.cancel()//,
        //  o(e)
      }, function () {
      })
}

const D = (e, t, n, i) => {
  var r = getMagnitude(t, n, i)
      , a = getMagnitude(e, t, n)
      , n = getMagnitude(e, n, i)
      , t = getMagnitude(e, i, t);
  return Math.abs(r - a - n - t) < 1e-5 * r;
}

const getMagnitude = (e, t, n) => {
  var r = new Cesium.Cartesian3()
  var a = new Cesium.Cartesian3()
  var o = new Cesium.Cartesian3();
  return t = Cesium.Cartesian3.subtract(t, e, r),
      e = Cesium.Cartesian3.subtract(n, e, a),
      e = Cesium.Cartesian3.cross(t, e, o),
  0.5 * Cesium.Cartesian3.magnitude(e)
}

const copyArray = (arr) => {
  if (Array.isArray(arr)) {
    for (var t = 0, n = Array(arr.length); t < arr.length; t++)
      n[t] = arr[t];
    return n
  }
  return arr
}

const areaFn = (e) => {
  var h = new Cesium.Cartesian3();
  var d = new Cesium.Cartesian3();
  var f = new Cesium.Cartesian3();

  if (!(e.length <= 2)) {
    e = Cesium.CoplanarPolygonGeometry.fromPositions({
      positions: e
    }),
        e = Cesium.CoplanarPolygonGeometry.createGeometry(e);
    if (e) {
      for (var t = e.attributes.position.values, n = e.indices, i = n.length / 3, r = 0, a = 0; a < i; ++a) {
        var o = Cesium.Cartesian3.fromElements(t[3 * n[3 * a + 0] + 0], t[3 * n[3 * a + 0] + 1], t[3 * n[3 * a + 0] + 2], h)
            ,
            l = Cesium.Cartesian3.fromElements(t[3 * n[3 * a + 1] + 0], t[3 * n[3 * a + 1] + 1], t[3 * n[3 * a + 1] + 2], d)
            ,
            s = Cesium.Cartesian3.fromElements(t[3 * n[3 * a + 2] + 0], t[3 * n[3 * a + 2] + 1], t[3 * n[3 * a + 2] + 2], f);
        r += getMagnitude(o, l, s);
      }
      return r
    }
  }
}

//Turf求面的中心点
const centerOfMass = (positions, height) => {
  try {
    if (positions.length == 1) {
      return positions[0];
    } else if (positions.length == 2) {
      return Cesium.Cartesian3.midpoint(positions[0], positions[1], new Cesium.Cartesian3());
    }

    if (height == null) {
      height = getMaxHeight(positions);
    }

    var coordinates = cartesians2lonlats(positions);
    coordinates.push(coordinates[0]);

    var center = turf_centerOfMass({
      type: "Feature",
      geometry: {
        type: "Polygon",
        coordinates: [coordinates]
      }
    });
    var centerX = center.geometry.coordinates[0];
    var centerY = center.geometry.coordinates[1];

    //所求的中心点在边界外时，求矩形中心点
    var extent = getRectangle(positions, true);
    if (
        centerX < extent.xmin ||
        centerX > extent.xmax ||
        centerY < extent.ymin ||
        centerY > extent.ymax
    ) {
      centerX = (extent.xmin + extent.xmax) / 2;
      centerY = (extent.ymin + extent.ymax) / 2;
    }

    var ptcenter = Cesium.Cartesian3.fromDegrees(centerX, centerY, height);
    return ptcenter;
  } catch (e) {
    return positions[Math.floor(positions.length / 2)];
  }
}

const getMaxHeight = (positions, defaultVal) => {
  if (defaultVal == null) defaultVal = 0;

  var maxHeight = defaultVal;
  if (positions == null || positions.length == 0) return maxHeight;

  for (var i = 0; i < positions.length; i++) {
    var tempCarto = Cesium.Cartographic.fromCartesian(positions[i]);
    if (tempCarto.height > maxHeight) {
      maxHeight = tempCarto.height;
    }
  }
  return Number(Number(maxHeight).toFixed(0 || 0));
}

//格式化Rectangle
const formatRectangle = (rectangle) => {
  var west = formatNum(Cesium.Math.toDegrees(rectangle.west), 6);
  var east = formatNum(Cesium.Math.toDegrees(rectangle.east), 6);
  var north = formatNum(Cesium.Math.toDegrees(rectangle.north), 6);
  var south = formatNum(Cesium.Math.toDegrees(rectangle.south), 6);

  return {
    xmin: west,
    xmax: east,
    ymin: south,
    ymax: north
  };
}

const getMinHeight = (positions) => {
  let height = 0;
  for (let index = 0; index < positions.length; index++) {
    const cartographic = Cesium.Cartographic.fromCartesian(positions[index]);
    let h = cartographic.height;
    if (index == 0) {
      height = h;
    } else if (h < height) {
      height = h;
    }
  }
  return height;
}

const cartesians2lonlats = (positions) => {//数组，cesium笛卡尔空间坐标 转 经纬度坐标【用于转geojson】
  const coordinates = [];
  for (let i = 0, len = positions.length; i < len; i++) {
    const point = cartesian2lonlat(positions[i]);
    if (point) coordinates.push(point);
  }
  return coordinates;
}

const getRectangle = (positions, isFormat) => {
  //剔除null值的数据
  for (var i = positions.length - 1; i >= 0; i--) {
    if (!Cesium.defined(positions[i])) {
      positions.splice(i, 1);
    }
  }

  var rectangle = Cesium.Rectangle.fromCartesianArray(positions);
  if (isFormat) return formatRectangle(rectangle);
  else return rectangle;
}

const formatNum = (num, digits) => {
  return Number(num.toFixed(digits || 0));
}
</script>

<style lang="scss" scoped>
.terrainClipPlan-wrap {
  display: flex;
  position: absolute;
  left: 300px;
  top: 100px;
  pointer-events: auto;

  ul {
    margin-left: 15px;
    padding: 10px;
    border-radius: 5px;
    background: rgba(0, 0, 0, 0.6);

    li {
      margin-top: 2px;

      &:nth-child(1) {
        font-weight: bold;
        text-align: center;
      }
    }
  }
}
</style>
