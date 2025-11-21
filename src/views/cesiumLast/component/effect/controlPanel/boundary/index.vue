<!-- 遮罩层 -->
<template></template>

<script lang="ts" setup>
import geojson from "@/assets/data/boundaryOld20240807.json";
import {onMounted, onUnmounted} from "vue";
import {usemapStore} from "@/store/modules/cesiumLastMap";
import * as Cesium from "cesium";
import imgPng from '@/assets/images/cesiumMap/line.png'

// Props
const props = defineProps<{
  isDualMap?: boolean
}>()

const mapStore = usemapStore()
const viewer = props.isDualMap ? mapStore.getDualCesoumViewer() : mapStore.getCesiumViewer();

onMounted(() => {
  viewer.dataSources.add(mapBoundaryDatasource);
  addBoundary()
  addShadow()
})

onUnmounted(() => {
  viewer.scene.primitives.remove(primitive);
  mapBoundaryDatasource.entities.removeAll();
  viewer.dataSources.remove(mapBoundaryDatasource);
})

// 地图逻辑
const mapBoundaryDatasource = new Cesium.GeoJsonDataSource()
let primitive

const addBoundary = () => {
  // GroundPolyline
  primitive = new Cesium.GroundPolylinePrimitive({
    geometryInstances: new Cesium.GeometryInstance({
      geometry: new Cesium.GroundPolylineGeometry({
        positions: Cesium.Cartesian3.fromDegreesArray(geojson.geometry.coordinates[0][0].map(x=>x.slice(0,2)).flat()),
        width: 8,
      })
    }),
    appearance: new Cesium.PolylineMaterialAppearance({
      material: new Cesium.Material({
        fabric: {
          uniforms: {
            axisY: false,
            hasImage2: false,
            image2: Cesium.Material.DefaultImageId,
            color2: new Cesium.Color(1, 1, 1),
            color: Cesium.Color.fromCssColorString("#16C6FF"),
            repeat: new Cesium.Cartesian2(3.0, 2.0),
            image: imgPng,
            speed: 2,
          },
          source: `
            czm_material czm_getMaterial(czm_materialInput materialInput)
            {
                czm_material material = czm_getDefaultMaterial(materialInput);
                vec2 st = repeat * materialInput.st;

                vec2 uv = vec2(fract((axisY ? st.t : st.s) - speed * float(czm_frameNumber) / 1000.0), st.t);
                vec4 colorImage = texture(image, uv);

                if (color.a == 0.0) {
                    material.alpha = colorImage.a;
                    material.diffuse = colorImage.rgb;
                } else {
                    material.alpha = colorImage.a * color.a;
                    material.diffuse = max(color.rgb * material.alpha * 3.0, color.rgb);
                }

                if (hasImage2) {
                    vec4 colorBG = texture(image2, materialInput.st);
                    if (colorBG.a > 0.5) {
                        material.diffuse = color2.rgb;
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
  viewer.scene.primitives.add(primitive);
}

const addShadow = async () => {
  const extent = {xmin: 73.0, xmax: 136.0, ymin: 3.0, ymax: 59.0};
  const geojson1 = {
    type: 'Feature',
    geometry: {
      type: 'MultiPolygon',
      coordinates: [
        [
          [
            [extent.xmin, extent.ymax],
            [extent.xmin, extent.ymin],
            [extent.xmax, extent.ymin],
            [extent.xmax, extent.ymax],
            [extent.xmin, extent.ymax],
          ],
          geojson.geometry.coordinates[0][0],
        ],
      ],
    },
  };
  await mapBoundaryDatasource.load(geojson1, {
    fill: Cesium.Color.fromCssColorString('rgb(0,0,0)').withAlpha(0.4),
    clampToGround: true
  });
}

</script>
