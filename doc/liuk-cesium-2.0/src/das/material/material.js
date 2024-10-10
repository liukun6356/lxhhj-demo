import * as Cesium from "cesium";

import czm_cellular from "../shaders/czm/cellular.glsl";
Cesium.ShaderSource._czmBuiltinsAndUniforms.czm_cellular = czm_cellular;

import czm_snoise from "../shaders/czm/snoise.glsl";
Cesium.ShaderSource._czmBuiltinsAndUniforms.czm_snoise = czm_snoise;

//线状: 流动效果 材质
import LineFlowMaterial from "../shaders/Materials/LineFlowMaterial.glsl";
export const LineFlowType = "LineFlow";
Cesium.Material.LineFlowType = LineFlowType;
Cesium.Material._materialCache.addMaterial(Cesium.Material.LineFlowType, {
  fabric: {
    type: Cesium.Material.LineFlowType,
    uniforms: {
      image: Cesium.Material.DefaultImageId,
      color: new Cesium.Color(1, 0, 0, 1.0),
      repeat: new Cesium.Cartesian2(1.0, 1.0),
      axisY: false,
      speed: 10.0,
      hasImage2: false,
      image2: Cesium.Material.DefaultImageId,
      color2: new Cesium.Color(1, 1, 1)
    },
    source: LineFlowMaterial
  },
  translucent: true
});

//线状: OD线效果 材质
import ODLineMaterial from "../shaders/Materials/ODLineMaterial.glsl";
export const ODLineType = "ODLine";
Cesium.Material.ODLineType = ODLineType;
Cesium.Material._materialCache.addMaterial(Cesium.Material.ODLineType, {
  fabric: {
    type: Cesium.Material.ODLineType,
    uniforms: {
      color: new Cesium.Color(1.0, 1.0, 0.0, 0.7),
      startTime: 0,
      speed: 20
    },
    source: ODLineMaterial
  },
  translucent: true
});

//面状: 用于面状对象的 扫描线放大效果
import ScanLineMaterial from "../shaders/Materials/ScanLineMaterial.glsl";
export const ScanLineType = "ScanLine";
Cesium.Material.ScanLineType = ScanLineType;
Cesium.Material._materialCache.addMaterial(Cesium.Material.ScanLineType, {
  fabric: {
    type: Cesium.Material.ScanLineType,
    uniforms: {
      color: new Cesium.Color(1.0, 1.0, 0.0, 1.0),
      speed: 10
    },
    source: ScanLineMaterial
  },
  translucent: true
});

//圆形: 扫描效果
import CircleScanMaterial from "../shaders/Materials/CircleScanMaterial.glsl";
export const CircleScanType = "CircleScan";
Cesium.Material.CircleScanType = CircleScanType;
Cesium.Material._materialCache.addMaterial(Cesium.Material.CircleScanType, {
  fabric: {
    type: Cesium.Material.CircleScanType,
    uniforms: {
      color: new Cesium.Color(1.0, 0.0, 0.0, 1.0),
      scanImg: Cesium.Material.DefaultImageId
    },
    source: CircleScanMaterial
  },
  translucent: function(material) {
    return material.uniforms.color.alpha < 1.0;
  }
});

//圆形: 扩散波纹效果
import CircleWaveMaterial from "../shaders/Materials/CircleWaveMaterial.glsl";
export const CircleWaveType = "CircleWave";
Cesium.Material.CircleWaveType = CircleWaveType;
Cesium.Material._materialCache.addMaterial(Cesium.Material.CircleWaveType, {
  fabric: {
    type: Cesium.Material.CircleWaveType,
    uniforms: {
      color: new Cesium.Color(1.0, 1.0, 0.0, 1.0),
      speed: 10.0,
      count: 1.0,
      gradient: 0.1
    },
    source: CircleWaveMaterial
  },
  translucent: true
});

//面状： 柏油路面效果
import AsphaltMaterial from "../shaders/Materials/PolyAsphaltMaterial.glsl";
export const PolyAsphaltType = "PolyAsphalt";
Cesium.Material.PolyAsphaltType = PolyAsphaltType;
Cesium.Material._materialCache.addMaterial(Cesium.Material.PolyAsphaltType, {
  fabric: {
    type: Cesium.Material.PolyAsphaltType,
    uniforms: {
      asphaltColor: new Cesium.Color(0.15, 0.15, 0.15, 1.0),
      bumpSize: 0.02,
      roughness: 0.2
    },
    source: AsphaltMaterial
  },
  translucent: function(material) {
    return material.uniforms.asphaltColor.alpha < 1.0;
  }
});

//面状：混合效果
import BlobMaterial from "../shaders/Materials/PolyBlobMaterial.glsl";
export const PolyBlobType = "PolyBlob";
Cesium.Material.PolyBlobType = PolyBlobType;
Cesium.Material._materialCache.addMaterial(Cesium.Material.PolyBlobType, {
  fabric: {
    type: Cesium.Material.PolyBlobType,
    uniforms: {
      lightColor: new Cesium.Color(1.0, 1.0, 1.0, 0.5),
      darkColor: new Cesium.Color(0.0, 0.0, 1.0, 0.5),
      frequency: 10.0
    },
    source: BlobMaterial
  },
  translucent: function(material) {
    var uniforms = material.uniforms;
    return uniforms.lightColor.alpha < 1.0 || uniforms.darkColor.alpha < 0.0;
  }
});

//面状：碎石面效果
import FacetMaterial from "../shaders/Materials/PolyFacetMaterial.glsl";
export const PolyFacetType = "PolyFacet";
Cesium.Material.PolyFacetType = PolyFacetType;
Cesium.Material._materialCache.addMaterial(Cesium.Material.PolyFacetType, {
  fabric: {
    type: Cesium.Material.PolyFacetType,
    uniforms: {
      lightColor: new Cesium.Color(0.25, 0.25, 0.25, 0.75),
      darkColor: new Cesium.Color(0.75, 0.75, 0.75, 0.75),
      frequency: 10.0
    },
    source: FacetMaterial
  },
  translucent: function(material) {
    var uniforms = material.uniforms;
    return uniforms.lightColor.alpha < 1.0 || uniforms.darkColor.alpha < 0.0;
  }
});

//面状：草地面效果
import PolyGrassMaterial from "../shaders/Materials/PolyGrassMaterial.glsl";
export const PolyGrassType = "PolyGrass";
Cesium.Material.PolyGrassType = PolyGrassType;
Cesium.Material._materialCache.addMaterial(Cesium.Material.PolyGrassType, {
  fabric: {
    type: Cesium.Material.PolyGrassType,
    uniforms: {
      grassColor: new Cesium.Color(0.25, 0.4, 0.1, 1.0),
      dirtColor: new Cesium.Color(0.1, 0.1, 0.1, 1.0),
      patchiness: 1.5
    },
    source: PolyGrassMaterial
  },
  translucent: function(material) {
    var uniforms = material.uniforms;
    return uniforms.grassColor.alpha < 1.0 || uniforms.dirtColor.alpha < 1.0;
  }
});

//面状：木材面效果
import PolyWoodMaterial from "../shaders/Materials/PolyWoodMaterial.glsl";
export const PolyWoodType = "PolyWood";
Cesium.Material.PolyWoodType = PolyWoodType;
Cesium.Material._materialCache.addMaterial(Cesium.Material.PolyWoodType, {
  fabric: {
    type: Cesium.Material.PolyWoodType,
    uniforms: {
      lightWoodColor: new Cesium.Color(0.6, 0.3, 0.1, 1.0),
      darkWoodColor: new Cesium.Color(0.4, 0.2, 0.07, 1.0),
      ringFrequency: 3.0,
      noiseScale: new Cesium.Cartesian2(0.7, 0.5),
      grainFrequency: 27.0
    },
    source: PolyWoodMaterial
  },
  translucent: function(material) {
    var uniforms = material.uniforms;
    return uniforms.lightWoodColor.alpha < 1.0 || uniforms.darkWoodColor.alpha < 1.0;
  }
});

import das3dWaterMaterial from "../shaders/Materials/dasWaterMaterial.glsl";
export const Das3dWaterType = "das3dWaterMaterial";
Cesium.Material.Das3dWaterType = Das3dWaterType;
Cesium.Material._materialCache.addMaterial(Cesium.Material.Das3dWaterType, {
  fabric: {
    type: "Das3dWaterType",
    uniforms: {
      color: Cesium.Color.BLUE,
      image: Cesium.DefaultImageId,
      normalMap: Cesium.Material.DefaultImageId,
      frequency: 10.0,
      animationSpeed: 0.01,
      amplitude: 1.0,
      specularIntensity: 0.5,
      fadeFactor: 1.0
    },
    source: das3dWaterMaterial
  },
  translucent: function(material) {
    return material.uniforms.color.alpha < 1;
  }
});
