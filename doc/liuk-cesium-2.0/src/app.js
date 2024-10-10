import "./assets/map.css";
import "./assets/widget.css";

import * as Cesium from "cesium";

exports.Cesium = Cesium; //方便vue等技术栈直接使用

//===========框架基本信息=========
import * as ver from "./version";

exports.name = "云端地球 DasEarth";
exports.website = "https://www.daspatial.com/";
exports.author = "大势智慧";
exports.version = ver.version;
exports.update = ver.update;

//=============Cesium原生对象做的外挂扩展=====================
import "./das/expand/bindEvent";
import "./das/expand/EntityCluster";

import { Cesium3DTilesetEx } from "./das/expand/Cesium3DTilesetEx";
exports.Cesium3DTilesetEx = Cesium3DTilesetEx;

import { ViewerEx } from "./das/expand/ViewerEx";
exports.ViewerEx = ViewerEx;

//=============基础类=====================
import { DasClass, eventType } from "./das/core/DasClass";
exports.DasClass = DasClass;
exports.event = eventType;

//=============widget=====================
import * as widget from "./widget/widgetManager";
exports.widget = widget;

import { ES5BaseWidget } from "./widget/es5/ES5BaseWidget";
exports.widget.ES5BaseWidget = ES5BaseWidget;

import { BaseWidget } from "./widget/BaseWidget";
exports.widget.BaseWidget = BaseWidget;
exports.widget.BaseWidget.extend = function(obj) {
  //兼容v2.2之前的老版本的使用
  return ES5BaseWidget.extend(obj);
};

//=============三维框架类=====================
import { createMap } from "./das/map";
exports.createMap = createMap;

import * as layer from "./das/layer";
exports.layer = layer;

//=====================分析相关=====================
exports.analysi = {};

//淹没分析（polygon矢量面抬高）
import { FloodByEntity } from "./das/analysi/FloodByEntity";
exports.analysi.FloodByEntity = FloodByEntity;

//淹没分析 （基于terrain地形）
import { FloodByTerrain } from "./das/analysi/FloodByTerrain";
exports.analysi.FloodByTerrain = FloodByTerrain;

//量算（长度、面积、角度等）
import { Measure } from "./das/analysi/Measure";
exports.analysi.Measure = Measure;

import { MeasureAngle } from "./das/analysi/measure/MeasureAngle";
exports.analysi.MeasureAngle = MeasureAngle;
import { MeasureArea } from "./das/analysi/measure/MeasureArea";
exports.analysi.MeasureArea = MeasureArea;
import { MeasureAreaSurface } from "./das/analysi/measure/MeasureAreaSurface";
exports.analysi.MeasureAreaSurface = MeasureAreaSurface;
import { MeasureHeight } from "./das/analysi/measure/MeasureHeight";
exports.analysi.MeasureHeight = MeasureHeight;
import { MeasureHeightTriangle } from "./das/analysi/measure/MeasureHeightTriangle";
exports.analysi.MeasureHeightTriangle = MeasureHeightTriangle;
import { MeasureLength } from "./das/analysi/measure/MeasureLength";
exports.analysi.MeasureLength = MeasureLength;
import { MeasureLengthSection } from "./das/analysi/measure/MeasureLengthSection";
exports.analysi.MeasureLengthSection = MeasureLengthSection;
import { MeasureLengthSurface } from "./das/analysi/measure/MeasureLengthSurface";
exports.analysi.MeasureLengthSurface = MeasureLengthSurface;
import { MeasurePoint } from "./das/analysi/measure/MeasurePoint";
exports.analysi.MeasurePoint = MeasurePoint;
import { MeasureVolume } from "./das/analysi/measure/MeasureVolume";
exports.analysi.MeasureVolume = MeasureVolume; //方量分析

//天际线 描边
import { Skyline } from "./das/analysi/Skyline";
exports.analysi.Skyline = Skyline;
//天际线分析
import { SkylineAnalyse } from "./das/analysi/SkylineAnalyse";
exports.analysi.SkylineAnalyse = SkylineAnalyse;

//地形开挖 类 (基于地形)
import { TerrainClip } from "./das/analysi/TerrainClip";
exports.analysi.TerrainClip = TerrainClip;
import { newTerrainClip } from "./das/analysi/newTerrainClip";
exports.analysi.newTerrainClip = newTerrainClip;

//地形开挖 类（平面 Plan原生）
import { TerrainClipPlan } from "./das/analysi/TerrainClipPlan";
exports.analysi.TerrainClipPlan = TerrainClipPlan;

//地下模式
import { Underground } from "./das/analysi/Underground";
exports.analysi.Underground = Underground;

//可视域分析
import { ViewShed3D } from "./das/analysi/ViewShed3D";
exports.analysi.ViewShed3D = ViewShed3D;

//通视分析
import { Sightline } from "./das/analysi/Sightline";
exports.analysi.Sightline = Sightline;

//体积测量分析
import { CutFillAnalysis } from "./das/analysi/CutFillAnalysis";
exports.analysi.CutFillAnalysis = CutFillAnalysis;

//等高线
import { ContourLine } from "./das/analysi/ContourLine";
exports.analysi.ContourLine = ContourLine;

//坡度坡向
import { Slope } from "./das/analysi/Slope";
exports.analysi.Slope = Slope;

//阴影率分析
import { ShadowAnalyse } from "./das/analysi/ShadowAnalyse";
exports.analysi.ShadowAnalyse = ShadowAnalyse;

//剖面分析
import { ProfileAnalysis } from "./das/analysi/ProfileAnalysis";
exports.analysi.ProfileAnalysis = ProfileAnalysis;

//=====================3dtiles模型 分析相关  =====================
exports.tiles = {};

//混合遮挡
import { MixedOcclusion } from "./das/tiles/MixedOcclusion";
exports.tiles.MixedOcclusion = MixedOcclusion;

//模型裁剪（平面 Plan原生）
import { TilesClipPlan } from "./das/tiles/TilesClipPlan";
exports.tiles.TilesClipPlan = TilesClipPlan;

//模型 裁剪（单个、对数据有要求）
import { TilesClip } from "./das/tiles/TilesClip";
exports.tiles.TilesClip = TilesClip;

//模型 压平分析 （单个、对数据有要求）
import { TilesFlat } from "./das/tiles/TilesFlat";
exports.tiles.TilesFlat = TilesFlat;

//模型 淹没分析（单个、对数据有要求）
import { TilesFlood } from "./das/tiles/TilesFlood";
exports.tiles.TilesFlood = TilesFlood;

//gltf模型 裁剪
import { GltfClipPlan } from "./das/tiles/GltfClipPlan";
exports.GltfClipPlan = GltfClipPlan;

//=====================相机 视角 相关=====================
import { FlyLine } from "./das/camera/FlyLine";
exports.FlyLine = FlyLine;

import { DynamicFlyLine } from "./das/camera/DynamicFlyLine";
exports.DynamicFlyLine = DynamicFlyLine;

// import { KeyboardType } from "./das/camera/KeyboardRoam";
// exports.KeyboardType = KeyboardType;

import { FirstPersonRoam } from "./das/camera/FirstPersonRoam";
exports.FirstPersonRoam = FirstPersonRoam;

import { StreetCameraController } from "./das/camera/StreetCameraController";
exports.StreetCameraController = StreetCameraController;

import { CameraViewController } from "./das/camera/CameraViewController";
exports.CameraViewController = CameraViewController;

import { MouseOperationController } from "./das/camera/MouseOperationController";;
exports.MouseOperationController = MouseOperationController;

//=====================Draw标绘=====================
import { register, Draw } from "./das/draw/Draw";
exports.Draw = Draw;

exports.draw = {};
exports.draw.register = register;
import * as Attr from "./das/draw/attr/index";
exports.draw.attr = Attr;

import { message } from "./das/draw/core/Tooltip";
exports.draw.tooltip = message;

import * as draggerCtl from "./das/draw/edit/Dragger";
exports.draw.dragger = draggerCtl;

exports.DrawEdit = {};

import { EditBase } from "./das/draw/edit/Edit.Base";
exports.DrawEdit.Base = EditBase;

import { EditCircle } from "./das/draw/edit/Edit.Circle";
exports.DrawEdit.Circle = EditCircle;

import { EditCorridor } from "./das/draw/edit/Edit.Corridor";
exports.DrawEdit.Corridor = EditCorridor;

import { EditCurve } from "./das/draw/edit/Edit.Curve";
exports.DrawEdit.Curve = EditCurve;

import { EditEllipsoid } from "./das/draw/edit/Edit.Ellipsoid";
exports.DrawEdit.Ellipsoid = EditEllipsoid;

import { EditPoint } from "./das/draw/edit/Edit.Point";
exports.DrawEdit.Point = EditPoint;

import { EditPolygon } from "./das/draw/edit/Edit.Polygon";
exports.DrawEdit.Polygon = EditPolygon;

import { EditPolygonEx } from "./das/draw/edit/Edit.PolygonEx";
exports.DrawEdit.PolygonEx = EditPolygonEx;

import { EditPolyline } from "./das/draw/edit/Edit.Polyline";
exports.DrawEdit.Polyline = EditPolyline;

import { EditPolylineVolume } from "./das/draw/edit/Edit.PolylineVolume";
exports.DrawEdit.PolylineVolume = EditPolylineVolume;

import { EditRectangle } from "./das/draw/edit/Edit.Rectangle";
exports.DrawEdit.Rectangle = EditRectangle;

import { EditWall } from "./das/draw/edit/Edit.Wall";
exports.DrawEdit.Wall = EditWall;

import { EditBox } from "./das/draw/edit/Edit.Box";
exports.DrawEdit.Box = EditBox;

import { EditPlane } from "./das/draw/edit/Edit.Plane";
exports.DrawEdit.Plane = EditPlane;

//Draw标绘 扩展部分，下面也可以单独插件的方式另外打包
import { plotUtil } from "./das/draw-ex/core/PlotUtil";
exports.draw.plotUtil = plotUtil;

import "./das/draw-ex/ex-plot/attackArrow";
import "./das/draw-ex/ex-plot/attackArrowPW";
import "./das/draw-ex/ex-plot/attackArrowYW";
import "./das/draw-ex/ex-plot/closeVurve";
import "./das/draw-ex/ex-plot/doubleArrow";
import "./das/draw-ex/ex-plot/fineArrow";
import "./das/draw-ex/ex-plot/fineArrowYW";
import "./das/draw-ex/ex-plot/gatheringPlace";
import "./das/draw-ex/ex-plot/straightArrow";
import "./das/draw-ex/ex-plot/lune";
import "./das/draw-ex/ex-plot/sector";
import "./das/draw-ex/ex-plot/regular";
import "./das/draw-ex/ex-plot/triangleDY";
import "./das/draw-ex/ex-imgpoint/divPointImg";
import "./das/draw-ex/ex-imgpoint/fontPoint";
import "./das/draw-ex/ex-point/divPoint";

//=====================扩展的矢量对象=====================
//相控阵雷达
import { RectangularSensorPrimitive } from "./das/feature/RectangularSensor/RectangularSensorPrimitive";
import { RectangularSensorGraphics } from "./das/feature/RectangularSensor/RectangularSensorGraphics";
import { RectangularSensorVisualizer } from "./das/feature/RectangularSensor/RectangularSensorVisualizer";
exports.RectangularSensorPrimitive = RectangularSensorPrimitive;
exports.RectangularSensorGraphics = RectangularSensorGraphics;
exports.RectangularSensorVisualizer = RectangularSensorVisualizer;

//div点
import { DivPoint } from "./das/feature/DivPoint";
exports.DivPoint = DivPoint;

//动态河流、公路
import { DynamicRiver } from "./das/feature/DynamicRiver";
exports.DynamicRiver = DynamicRiver;

//水域 相关效果
import * as water from "./das/feature/water";
exports.water = water;

//镜面反射水
import { DasWater } from "./das/feature/DasWater";
exports.DasWater = DasWater;

//镜面反射水2
import { DasWater2 } from "./das/feature/DasWater2";
exports.DasWater2 = DasWater2;

//粒子效果封装
import { ParticleSystemEx } from "./das/feature/ParticleSystemEx";
exports.ParticleSystemEx = ParticleSystemEx;

//点光源
import { PointLight } from "./das/feature/PointLight";
exports.PointLight = PointLight;

//聚光灯
import { SpotLight } from "./das/feature/SpotLight";
exports.SpotLight = SpotLight;

//平放的图标
import { FlatBillboard } from "./das/feature/FlatBillboard";
exports.FlatBillboard = FlatBillboard;

//平放的图片（随地图缩放）
import { FlatImage } from "./das/feature/FlatImage";
exports.FlatImage = FlatImage;

//光柱椎体
import { ConeGlow } from "./das/feature/ConeGlow";
exports.ConeGlow = ConeGlow;

//立体面(或圆)散射围墙效果
import { DiffuseWallGlow } from "./das/feature/DiffuseWallGlow";
exports.DiffuseWallGlow = DiffuseWallGlow;

//走马灯围墙效果
import { ScrollWallGlow } from "./das/feature/ScrollWallGlow";
exports.ScrollWallGlow = ScrollWallGlow;

//=====================场景特效=====================
exports.scene = {};

//雾特效
import { FogEffect } from "./das/scene/FogEffect";
exports.scene.FogEffect = FogEffect;

//场景倒影
import { InvertedScene } from "./das/scene/InvertedScene";
exports.scene.InvertedScene = InvertedScene;

//雾覆盖 效果
import { SnowCover } from "./das/scene/SnowCover";
exports.scene.SnowCover = SnowCover;

//颜色校正效果
import { ColorCorrection } from "./das/scene/ColorCorrection";
exports.scene.ColorCorrection = ColorCorrection;

//界面蒙版
import { DivMask } from "./das/scene/DivMask";
exports.scene.DivMask = DivMask;

//高亮边界
import { HighlightBoundary } from "./das/scene/HighlightBoundary";
exports.scene.HighlightBoundary = HighlightBoundary;


//=====================material材质=====================
import * as material from "./das/material/material";
exports.material = material;

//文本文字  primitive材质
import { TextMaterial } from "./das/material/TextMaterial";
exports.material.TextMaterial = TextMaterial;

//圆锥扩散波纹效果 primitive材质
import { CylinderWaveMaterial } from "./das/material/CylinderWaveMaterial";
exports.material.CylinderWaveMaterial = CylinderWaveMaterial;

//圆扫描效果 材质
import { CircleScanMaterialProperty } from "./das/material/property/CircleScanMaterialProperty";
exports.material.CircleScanMaterialProperty = CircleScanMaterialProperty;

//圆扩散波纹效果  材质
import { CircleWaveMaterialProperty } from "./das/material/property/CircleWaveMaterialProperty";
exports.material.CircleWaveMaterialProperty = CircleWaveMaterialProperty;

//扫描线放大效果 材质
import { ScanLineMaterialProperty } from "./das/material/property/ScanLineMaterialProperty";
exports.material.ScanLineMaterialProperty = ScanLineMaterialProperty;

//动态线、墙  材质
import { LineFlowMaterialProperty } from "./das/material/property/LineFlowMaterialProperty";
exports.material.LineFlowMaterialProperty = LineFlowMaterialProperty;

//OD线
import { ODLineMaterialProperty } from "./das/material/property/ODLineMaterialProperty";
exports.material.ODLineMaterialProperty = ODLineMaterialProperty;

//文本文字  entity材质
import { TextMaterialProperty } from "./das/material/property/TextMaterialProperty";
exports.material.TextMaterialProperty = TextMaterialProperty;

import { WaterMaterialProperty } from "./das/material/property/WaterMaterialProperty";
exports.material.WaterMaterialProperty = WaterMaterialProperty;

//=====================Shader特效=====================
exports.shader = {};
//雨雪 着色器
import RainShader from "./das/shaders/PostProcessStage/Rain.glsl";
exports.shader.rain = RainShader;
import SnowShader from "./das/shaders/PostProcessStage/Snow.glsl";
exports.shader.snow = SnowShader;

//===================== tool =====================

import { ZoomNavigation } from "./das/tool/ZoomNavigation";
exports.ZoomNavigation = ZoomNavigation;



//===================== util =====================
import * as matrix from "./das/util/matrix";
exports.matrix = matrix;

import * as model from "./das/util/model";
exports.model = model;

import * as point from "./das/util/point";
exports.point = point;

import * as polygon from "./das/util/polygon";
exports.polygon = polygon;

import * as polyline from "./das/util/polyline";
exports.polyline = polyline;

import * as pointconvert from "./das/util/pointconvert";
exports.pointconvert = pointconvert;

import * as token from "./das/util/token";
exports.token = token;

import * as util from "./das/util/util";
exports.util = util;

import { config2Entity } from "./das/core/config2Entity";
exports.util.config2Entity = config2Entity;

import { getDefaultContextMenu } from "./das/tool/defaultContextMenu";
exports.util.getDefaultContextMenu = getDefaultContextMenu;

import * as measure from "./das/util/measure";
exports.measure = measure;

import * as tileset from "./das/util/tileset";
exports.tileset = tileset;

import * as daslog from "./das/util/log";
exports.log = daslog;


//=====================视频融合 相关  =====================
exports.video = {};

//视频融合（投射3D，贴物体表面）
import { Video3D } from "./das/video/Video3D";
exports.video.Video3D = Video3D;

//视频融合（投射2D平面）
import { Video2D } from "./das/video/Video2D";
exports.video.Video2D = Video2D;

//打印信息
util.printVersion();
