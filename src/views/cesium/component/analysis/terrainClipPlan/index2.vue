<!--/**
   * @author: liuk
   * @date: 2024/3/16
   * @describe: 挖方分析
   * @email:1229223630@qq.com
  */-->
<template>
  <div class="terrainClipPlan-wrap">
    <div>
      <el-button @click="selecteHeight">挖方分析</el-button>
    </div>
    <ul :style="{top:popupPos.top+'px',left:popupPos.left+'px'}">
      <div>计算结果</div>
      <li>体积:{{ formatToFixed(resObj.cut) }}m³</li>
      <li>横切面积:{{ formatToFixed(resObj.area) }}㎡</li>
      <li>最大海拔:{{ formatToFixed(resObj.maxHeight) }}m</li>
      <li>最小海拔:{{ formatToFixed(resObj.minHeight) }}m</li>
    </ul>
  </div>
</template>

<script>
import * as rxjs from "./rxjs.umd.min.js";
import {centerOfMass as turf_centerOfMass} from "@turf/turf";
import {usemapStore} from "@/store/modules/cesiumMap";
const mapStore = usemapStore()
// 地图逻辑
const viewer = mapStore.getCesiumViewer();
let handler
export default {
  data() {
    return {
      resObj: {
        cut: null,//体积
        area: null,//横切面积
        maxHeight: null,//最大高度
        minHeight: null,//最小高度
      },
      popupPos: {
        left: 140,
        top: 50
      }
    }
  },
  methods: {
    formatToFixed(val, fractionDights = 2, emptyStr = '--') {
      switch (typeof val) {
        case 'number':
          return Number.isNaN(val) || !Number.isFinite(val) ? emptyStr : val.toFixed(fractionDights)
        case 'string':
          return Number.isNaN(Number(val)) ? emptyStr : Number(val).toFixed(fractionDights)
        default:
          return emptyStr
      }
    },
    onMouseMove(movement) {
      const viewer = mapStore.getCesiumViewer();
      this.popupPos.left = 140
      this.popupPos.top = 50
      const pickedObject = viewer.scene.pick(movement.endPosition);
      if (!Cesium.defined(pickedObject) || !Cesium.defined(pickedObject.id)) {
        // ...
        return;
      }
      var entity = pickedObject.id;
      if (!(entity instanceof Cesium.Entity) || entity.customType !== "aaa") {
        // ...
        return;
      }
      const {x: left, y: top} = movement.endPosition
      this.popupPos.left = left
      this.popupPos.top = top
    },
    selecteHeight() {
      const viewer = mapStore.getCesiumViewer();
      const self = this
      window.dasDrawControl.startDraw({
        type: "polygon",
        style: {
          color: "#00fff2"
        },
        success: function (entity) {
          var positions = viewer.das.draw.getPositions(entity);
          window.dasDrawControl.deleteEntity(entity);
          console.log(positions,222)
          debugger
          self.compute({
            cartesians: positions,
            splitNum: 1000, //wall边界插值数,控制精度[注意精度越大，分析时间越长]
            isShowPoint: true
          }, function (result) {
            const {cut, area, maxHeight, minHeight, ptcenter} = result
            // 弹框定位
            const {x: left, y: top} = Cesium.SceneTransforms.wgs84ToWindowCoordinates(viewer.scene, ptcenter);
            self.popupPos.left = left
            self.popupPos.top = top
            self.resObj = {cut, area, maxHeight, minHeight}
            const entity = viewer.entities.add({
              customType: "aaa",
              polygon: {
                hierarchy: positions,
                extrudedHeight: minHeight, // 初始高度 + 拉伸高度
                height: maxHeight,
                material: Cesium.Color.fromAlpha(Cesium.Color.BLUE, 0.2),
              },
            });
            viewer.flyTo(entity)
          }, function (progress, e) {
            console.log('进度条', progress * 100 + '%');
          });
        }
      })
    },
    add3dtiles() {
      const viewer = mapStore.getCesiumViewer();
      const tileset = viewer.scene.primitives.add(new Cesium.Cesium3DTileset({
        url: process.env.VUE_APP_GIS_API + "/baoshan/3dtiles/tileset.json", //数据地址
        maximumScreenSpaceError: 10,  //最大的屏幕空间误差
        maximumNumberOfLoadedTiles: 512, //最大加载瓦片个数
        maximumMemoryUsage: 1024,
      }));
      tileset.readyPromise.then(function (tileset) {
        viewer.zoomTo(tileset)
        window.dasViewer.camera.flyTo({
          destination: Cesium.Cartesian3.fromDegrees(99.150961, 25.129298, 1811.49),
          orientation: {
            heading: Cesium.Math.toRadians(333.5),
            pitch: Cesium.Math.toRadians(-32.4),
            roll: 0.1
          }
        });
      });
      let terrainProvider = new Cesium.CesiumTerrainProvider({
        url: process.env.VUE_APP_GIS_API + "/baoshan/dem",
      });
      viewer.terrainProvider = terrainProvider;
    },
    compute(options, result, progress) {
      const loading = this.$loading({
        lock: true,
        text: '请稍等，正在计算数据中...(范围越大计算时间越长，可按f12查看进度，目前为了计算精度，把边界插值数调高了，后续可处理)',
        spinner: 'el-icon-loading',
        background: 'rgba(0, 0, 0, 0.7)'
      });
      const viewer = mapStore.getCesiumViewer();
      var cartesians = options.cartesians;
      var that = {}, scene = viewer.scene, self = this;
      that.resultTempR = new Cesium.Cartesian3();
      that.resultTempO = new Cesium.Cartesian3();
      that.resultTempK = new Cesium.Cartesian3();
      that.NewCartographic = new Cesium.Cartographic();
      that.cartesiansIndex0ScalarResult = new Cesium.Cartesian3();
      that.cartesiansIndex1ScalarResult = new Cesium.Cartesian3();
      that.resultTempB = new Cesium.Cartesian3();
      that.differenceMatrixClone = new Cesium.Cartesian3();
      that.positions = cartesians;
      var area = this.area(cartesians).toFixed(2);
      //求中心点
      var ptcenter = this.centerOfMass(cartesians);
      // var gridWidth = Math.max(0.5, Math.sqrt(area / that.splitNum));
      that.splitNum = options.splitNum || 1000;
      that.isShow = options.isShowPoint || true;
      var gridWidth = Math.sqrt(area / that.splitNum);
      var finalHeight = this.getMinHeight(cartesians);
      that._minHeight = finalHeight;
      that._jzmHeight = finalHeight;
      that._maxHeight = result.maxHeight;
      this._subsription && this._subsription.unsubscribe(),
          this._subsription = function (cartesians, gridWidth, finalHeight, scene, result, progress) {
            if (!(cartesians.length < 3)) {
              progress && progress(0);
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
                      if (self.D(differenceMatrixClone, S, T, M)) {
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
                      pHeightCartesiansList.push.apply(pHeightCartesiansList, self.copyArray(e.pHeightCartesians));
                      pClampCartesiansList.push.apply(pClampCartesiansList, self.copyArray(e.pClampCartesians));
                      pDiffHeightsList.push.apply(pDiffHeightsList, self.copyArray(e.pDiffHeights));
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
                    loading.close();
                    return result(e)
                  }))
            }
          }(cartesians, gridWidth, finalHeight, scene, result, progress).subscribe(function () {
          }, function (e) {
            // that.cancel()//,
            //  o(e)
          }, function () {
          })

    },
    copyArray(arr) {
      if (Array.isArray(arr)) {
        for (var t = 0, n = Array(arr.length); t < arr.length; t++)
          n[t] = arr[t];
        return n
      }
      return arr
    },
    D(e, t, n, i) {
      var r = this.getMagnitude(t, n, i)
          , a = this.getMagnitude(e, t, n)
          , n = this.getMagnitude(e, n, i)
          , t = this.getMagnitude(e, i, t);
      return Math.abs(r - a - n - t) < 1e-5 * r;
    },
    area(e) {
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
            r += this.getMagnitude(o, l, s);
          }
          return r
        }
      }
    },
    getMagnitude(e, t, n) {
      var r = new Cesium.Cartesian3()
      var a = new Cesium.Cartesian3()
      var o = new Cesium.Cartesian3();
      return t = Cesium.Cartesian3.subtract(t, e, r),
          e = Cesium.Cartesian3.subtract(n, e, a),
          e = Cesium.Cartesian3.cross(t, e, o),
      0.5 * Cesium.Cartesian3.magnitude(e)
    },
    //Turf求面的中心点
    centerOfMass(positions, height) {
      try {
        if (positions.length == 1) {
          return positions[0];
        } else if (positions.length == 2) {
          return Cesium.Cartesian3.midpoint(positions[0], positions[1], new Cesium.Cartesian3());
        }

        if (height == null) {
          height = getMaxHeight(positions);
        }

        var coordinates = this.cartesians2lonlats(positions);
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
        var extent = this.getRectangle(positions, true);
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
    },
    cartesians2lonlats(positions) {//数组，cesium笛卡尔空间坐标 转 经纬度坐标【用于转geojson】
      var coordinates = [];
      for (var i = 0, len = positions.length; i < len; i++) {
        var point = cartesian2lonlat(positions[i]);
        if (point) coordinates.push(point);
      }
      return coordinates;
    },
    getMaxHeight(positions, defaultVal) {
      if (defaultVal == null) defaultVal = 0;

      var maxHeight = defaultVal;
      if (positions == null || positions.length == 0) return maxHeight;

      for (var i = 0; i < positions.length; i++) {
        var tempCarto = Cesium.Cartographic.fromCartesian(positions[i]);
        if (tempCarto.height > maxHeight) {
          maxHeight = tempCarto.height;
        }
      }
      return Number(Number(maxHeight).toFixed(digits || 0));
    },
    getRectangle(positions, isFormat) {
      //剔除null值的数据
      for (var i = positions.length - 1; i >= 0; i--) {
        if (!Cesium.defined(positions[i])) {
          positions.splice(i, 1);
        }
      }

      var rectangle = Cesium.Rectangle.fromCartesianArray(positions);
      if (isFormat) return formatRectangle(rectangle);
      else return rectangle;
    },
    //格式化Rectangle
    formatRectangle(rectangle) {
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
    },
    getMinHeight(positions) {
      var height = 0;
      for (let index = 0; index < positions.length; index++) {
        var cartographic = Cesium.Cartographic.fromCartesian(positions[index]);
        var h = cartographic.height;
        if (index == 0) {
          height = h;
        } else if (h < height) {
          height = h;
        }
      }
      return height;
    }
  },
  mounted() {
    const viewer = mapStore.getCesiumViewer();
    handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
    handler.setInputAction(this.onMouseMove, Cesium.ScreenSpaceEventType.MOUSE_MOVE);
    viewer.scene.globe.depthTestAgainstTerrain = true;
    this.add3dtiles()
  }
}
</script>

<style lang="scss">
.terrainClipPlan-wrap {
  display: flex;
  position: absolute;
  left: 50px;
  top: 50px;

  ul {
    position: fixed;
    margin-left: 20px;
    background: #fff;
  }
}
</style>
