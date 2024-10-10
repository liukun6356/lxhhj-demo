import * as Cesium from "cesium";

function RectangularSensorGraphics(options) {
  this._show = undefined;
  this._radius = undefined;
  this._xHalfAngle = undefined;
  this._yHalfAngle = undefined;
  this._lineColor = undefined;
  this._showSectorLines = undefined;
  this._showSectorSegmentLines = undefined;
  this._showLateralSurfaces = undefined;
  this._material = undefined;
  this._showDomeSurfaces = undefined;
  this._showDomeLines = undefined;
  this._showIntersection = undefined;
  this._intersectionColor = undefined;
  this._intersectionWidth = undefined;
  this._showThroughEllipsoid = undefined;
  this._gaze = undefined;
  this._showScanPlane = undefined;
  this._scanPlaneColor = undefined;
  this._scanPlaneMode = undefined;
  this._scanPlaneRate = undefined;
  this._definitionChanged = new Cesium.Event();
  this.merge(Cesium.defaultValue(options, Cesium.defaultValue.EMPTY_OBJECT));
}

Object.defineProperties(RectangularSensorGraphics.prototype, {
  definitionChanged: {
    get: function() {
      return this._definitionChanged;
    }
  },

  show: Cesium.createPropertyDescriptor("show"),
  radius: Cesium.createPropertyDescriptor("radius"),
  xHalfAngle: Cesium.createPropertyDescriptor("xHalfAngle"),
  yHalfAngle: Cesium.createPropertyDescriptor("yHalfAngle"),
  lineColor: Cesium.createPropertyDescriptor("lineColor"),
  showSectorLines: Cesium.createPropertyDescriptor("showSectorLines"),
  showSectorSegmentLines: Cesium.createPropertyDescriptor("showSectorSegmentLines"),
  showLateralSurfaces: Cesium.createPropertyDescriptor("showLateralSurfaces"),
  material: Cesium.createMaterialPropertyDescriptor("material"),
  showDomeSurfaces: Cesium.createPropertyDescriptor("showDomeSurfaces"),
  showDomeLines: Cesium.createPropertyDescriptor("showDomeLines"),
  showIntersection: Cesium.createPropertyDescriptor("showIntersection"),
  intersectionColor: Cesium.createPropertyDescriptor("intersectionColor"),
  intersectionWidth: Cesium.createPropertyDescriptor("intersectionWidth"),
  showThroughEllipsoid: Cesium.createPropertyDescriptor("showThroughEllipsoid"),
  gaze: Cesium.createPropertyDescriptor("gaze"),
  showScanPlane: Cesium.createPropertyDescriptor("showScanPlane"),
  scanPlaneColor: Cesium.createPropertyDescriptor("scanPlaneColor"),
  scanPlaneMode: Cesium.createPropertyDescriptor("scanPlaneMode"),
  scanPlaneRate: Cesium.createPropertyDescriptor("scanPlaneRate")
});

RectangularSensorGraphics.prototype.clone = function(result) {
  if (!Cesium.defined(result)) {
    result = new RectangularSensorGraphics();
  }

  result.show = this.show;
  result.radius = this.radius;
  result.xHalfAngle = this.xHalfAngle;
  result.yHalfAngle = this.yHalfAngle;
  result.lineColor = this.lineColor;
  result.showSectorLines = this.showSectorLines;
  result.showSectorSegmentLines = this.showSectorSegmentLines;
  result.showLateralSurfaces = this.showLateralSurfaces;
  result.material = this.material;
  result.showDomeSurfaces = this.showDomeSurfaces;
  result.showDomeLines = this.showDomeLines;
  result.showIntersection = this.showIntersection;
  result.intersectionColor = this.intersectionColor;
  result.intersectionWidth = this.intersectionWidth;
  result.showThroughEllipsoid = this.showThroughEllipsoid;
  result.gaze = this.gaze;
  result.showScanPlane = this.showScanPlane;
  result.scanPlaneColor = this.scanPlaneColor;
  result.scanPlaneMode = this.scanPlaneMode;
  result.scanPlaneRate = this.scanPlaneRate;

  return result;
};

RectangularSensorGraphics.prototype.merge = function(source) {
  if (!Cesium.defined(source)) {
    throw new Cesium.DeveloperError("source is required.");
  }
  this.slice = Cesium.defaultValue(this.slice, source.slice);
  this.show = Cesium.defaultValue(this.show, source.show);
  this.radius = Cesium.defaultValue(this.radius, source.radius);
  this.xHalfAngle = Cesium.defaultValue(this.xHalfAngle, source.xHalfAngle);
  this.yHalfAngle = Cesium.defaultValue(this.yHalfAngle, source.yHalfAngle);
  this.lineColor = Cesium.defaultValue(this.lineColor, source.lineColor);
  this.showSectorLines = Cesium.defaultValue(this.showSectorLines, source.showSectorLines);
  this.showSectorSegmentLines = Cesium.defaultValue(
    this.showSectorSegmentLines,
    source.showSectorSegmentLines
  );
  this.showLateralSurfaces = Cesium.defaultValue(
    this.showLateralSurfaces,
    source.showLateralSurfaces
  );
  this.material = Cesium.defaultValue(this.material, source.material);
  this.showDomeSurfaces = Cesium.defaultValue(this.showDomeSurfaces, source.showDomeSurfaces);
  this.showDomeLines = Cesium.defaultValue(this.showDomeLines, source.showDomeLines);
  this.showIntersection = Cesium.defaultValue(this.showIntersection, source.showIntersection);
  this.intersectionColor = Cesium.defaultValue(this.intersectionColor, source.intersectionColor);
  this.intersectionWidth = Cesium.defaultValue(this.intersectionWidth, source.intersectionWidth);
  this.showThroughEllipsoid = Cesium.defaultValue(
    this.showThroughEllipsoid,
    source.showThroughEllipsoid
  );
  this.gaze = Cesium.defaultValue(this.gaze, source.gaze);
  this.showScanPlane = Cesium.defaultValue(this.showScanPlane, source.showScanPlane);
  this.scanPlaneColor = Cesium.defaultValue(this.scanPlaneColor, source.scanPlaneColor);
  this.scanPlaneMode = Cesium.defaultValue(this.scanPlaneMode, source.scanPlaneMode);
  this.scanPlaneRate = Cesium.defaultValue(this.scanPlaneRate, source.scanPlaneRate);
};

export { RectangularSensorGraphics };
