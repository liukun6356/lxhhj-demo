import * as Cesium from "cesium";

var unprojectedScratch = new Cesium.Cartographic();
var rayScratch = new Cesium.Ray();
var cartesian3Scratch = new Cesium.Cartesian3();

/**
 * gets the focus point of the camera
 * @param {Viewer|Widget} viewer The viewer
 * @param {boolean} inWorldCoordinates true to get the focus in world coordinates, otherwise get it in projection-specific map coordinates, in meters.
 * @param {Cesium.Cartesian3} [result] The object in which the result will be stored.
 * @return {Cesium.Cartesian3} The modified result parameter, a new instance if none was provided or undefined if there is no focus point.
 */
function getCameraFocus(viewer, inWorldCoordinates, result) {
  var scene = viewer.scene;
  var camera = scene.camera;

  if (scene.mode == Cesium.SceneMode.MORPHING) {
    return undefined;
  }

  if (!Cesium.defined(result)) {
    result = new Cesium.Cartesian3();
  }

  // TODO bug when tracking: if entity moves the current position should be used and not only the one when starting orbiting/rotating
  // TODO bug when tracking: reset should reset to default view of tracked entity

  if (Cesium.defined(viewer.trackedEntity)) {
    result = viewer.trackedEntity.position.getValue(viewer.clock.currentTime, result);
  } else {
    rayScratch.origin = camera.positionWC;
    rayScratch.direction = camera.directionWC;
    result = scene.globe.pick(rayScratch, scene, result);
  }

  if (!Cesium.defined(result)) {
    return undefined;
  }

  if (scene.mode == Cesium.SceneMode.SCENE2D || scene.mode == Cesium.SceneMode.COLUMBUS_VIEW) {
    result = camera.worldToCameraCoordinatesPoint(result, result);

    if (inWorldCoordinates) {
      result = scene.globe.ellipsoid.cartographicToCartesian(
        scene.mapProjection.unproject(result, unprojectedScratch),
        result
      );
    }
  } else {
    if (!inWorldCoordinates) {
      result = camera.worldToCameraCoordinatesPoint(result, result);
    }
  }

  return result;
}

export class ZoomNavigation {
  //========== 构造方法 ==========
  // is used for zooming in (true) or out (false)
  constructor(viewer, zoomIn) {
    this.viewer = viewer;

    this.relativeAmount = 2;
    if (zoomIn) {
      // this ensures that zooming in is the inverse of zooming out and vice versa
      // e.g. the camera position remains when zooming in and out
      this.relativeAmount = 1 / this.relativeAmount;
    }
  }

  /**
   * When implemented in a derived class, performs an action when the user clicks
   * on this control
   * @abstract
   * @protected
   */
  activate() {
    this.zoom(this.relativeAmount);
  }
  zoom(relativeAmount) {
    this.isActive = true;

    if (Cesium.defined(this.viewer)) {
      var scene = this.viewer.scene;

      var sscc = scene.screenSpaceCameraController;
      // do not zoom if it is disabled
      if (!sscc.enableInputs || !sscc.enableZoom) {
        return;
      }
      // TODO
      //            if(scene.mode == Cesium.SceneMode.COLUMBUS_VIEW && !sscc.enableTranslate) {
      //                return;
      //            }

      var camera = scene.camera;
      var orientation;

      switch (scene.mode) {
        case Cesium.SceneMode.MORPHING:
          break;
        case Cesium.SceneMode.SCENE2D:
          camera.zoomIn(camera.positionCartographic.height * (1 - this.relativeAmount));
          break;
        default:
          var focus;

          if (Cesium.defined(this.viewer.trackedEntity)) {
            focus = new Cesium.Cartesian3();
          } else {
            focus = getCameraFocus(this.viewer, false);
          }

          if (!Cesium.defined(focus)) {
            // Camera direction is not pointing at the globe, so use the ellipsoid horizon point as
            // the focal point.
            var ray = new Cesium.Ray(
              camera.worldToCameraCoordinatesPoint(
                scene.globe.ellipsoid.cartographicToCartesian(camera.positionCartographic)
              ),
              camera.directionWC
            );
            focus = Cesium.IntersectionTests.grazingAltitudeLocation(ray, scene.globe.ellipsoid);

            orientation = {
              heading: camera.heading,
              pitch: camera.pitch,
              roll: camera.roll
            };
          } else {
            orientation = {
              direction: camera.direction,
              up: camera.up
            };
          }

          var direction = Cesium.Cartesian3.subtract(camera.position, focus, cartesian3Scratch);
          var movementVector = Cesium.Cartesian3.multiplyByScalar(
            direction,
            relativeAmount,
            direction
          );
          var endPosition = Cesium.Cartesian3.add(focus, movementVector, focus);

          if (
            Cesium.defined(this.viewer.trackedEntity) ||
            scene.mode == Cesium.SceneMode.COLUMBUS_VIEW
          ) {
            // sometimes flyTo does not work (jumps to wrong position) so just set the position without any animation
            // do not use flyTo when tracking an entity because during animatiuon the position of the entity may change
            camera.position = endPosition;
          } else {
            camera.flyTo({
              destination: endPosition,
              orientation: orientation,
              duration: 0.5,
              convert: false
            });
          }
      }
    }

    // this.viewer.notifyRepaintRequired();
    this.isActive = false;
  }
}
