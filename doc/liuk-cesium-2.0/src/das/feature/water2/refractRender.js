import * as Cesium from "cesium";

export class refractRender {
  constructor() {
    this._refractCam = null;
    this.scratchColorZero = new Cesium.Color(0, 0, 0, 0);
    this.renderTilesetPassState = new Cesium.Cesium3DTilePassState({
      pass: Cesium.Cesium3DTilePass.RENDER
    });
  }
  reflect(e, t) {
    var n = Cesium.Cartesian3.dot(t, e);
    n = Cesium.Cartesian3.multiplyByScalar(t, 2 * n, new Cesium.Cartesian3());
    return Cesium.Cartesian3.subtract(e, n, new Cesium.Cartesian3());
  }

  render(scene, rPolygon, wrfboRefract, layers) {
    var passState;
    var   camera;
    var  CloneCamera;
    var  BufferWidth;
    var  CloneCameraViewMatrix;
    var  rPolygonNormal;
    var  CloneCameraPosition;
    var  context;
    if (!this._refractCam) {
      this._refractCam = new Cesium.Camera(scene);
    }
    if (scene.mode === Cesium.SceneMode.SCENE3D && rPolygon.show) {
      rPolygon.show = false;
      context = scene.context;
      passState = scene._view.passState;
      camera = scene.camera;
      CloneCamera = Cesium.Camera.clone(scene.camera, this._refractCam);
      CloneCameraPosition = CloneCamera.position;
      CloneCameraViewMatrix = CloneCamera.viewMatrix;
      Cesium.Matrix4.getMatrix3(CloneCameraViewMatrix, new Cesium.Matrix3());
      rPolygonNormal = rPolygon.normal;
      scene.camera = CloneCamera;
      BufferWidth = scene.context.drawingBufferWidth;
      CloneCameraViewMatrix = scene.context.drawingBufferHeight;
      passState.viewport.x = 0;
      passState.viewport.y = 0;
      passState.viewport.width = BufferWidth;
      passState.viewport.height = CloneCameraViewMatrix;
      wrfboRefract.update(context, BufferWidth, CloneCameraViewMatrix);
      passState.framebuffer = wrfboRefract._framebuffer;
      wrfboRefract = scene._clearColorCommand;
      Cesium.Color.multiplyByScalar(Cesium.Color.DEEPSKYBLUE, 0.1, wrfboRefract.color);
      wrfboRefract.color.alpha = 1;
      wrfboRefract.execute(context, passState);
      scene._depthClearCommand;
      wrfboRefract = context.uniformState;
      context = Cesium.Cartesian3.clone(CloneCameraPosition, new Cesium.Cartesian3());
      CloneCameraPosition = Cesium.Cartesian3.negate(rPolygonNormal, new Cesium.Cartesian3());
      rPolygonNormal = Cesium.Plane.fromPointNormal(rPolygon.centerPos, CloneCameraPosition);
      Math.abs(Cesium.Plane.getPointDistance(rPolygonNormal, context));
      CloneCameraPosition = Cesium.Plane.transform(rPolygonNormal, CloneCamera.viewMatrix);
      context = new Cesium.Cartesian4(
        CloneCameraPosition.normal.x,
        CloneCameraPosition.normal.y,
        CloneCameraPosition.normal.z,
        CloneCameraPosition.distance
      );
      CloneCamera.frustum._offCenterFrustum.clipPlane = context;
      wrfboRefract.updateCamera(CloneCamera);
      scene.updateFrameState();
      rPolygonNormal = scene.globe.show;
      context = (CloneCameraPosition = scene._frameState).useLogDepth;
      CloneCameraPosition.invertClassification = false;
      CloneCameraPosition.passes.render = true;
      CloneCameraPosition.tilesetPassState = this.renderTilesetPassState;
      CloneCameraPosition.camera = CloneCamera;
      CloneCameraPosition.useLogDepth = false;
      scene.globe.show = false;
      wrfboRefract.update(CloneCameraPosition);
      scene.updateEnvironment();
      scene.updateAndExecuteCommands(passState, this.scratchColorZero);
      scene.resolveFramebuffers(passState);
      passState.framebuffer = void 0;
      CloneCameraPosition.camera = camera;
      CloneCameraPosition.useLogDepth = context;
      scene.camera = camera;
      rPolygon.show = true;
      scene.globe.show = rPolygonNormal;
    }
  }
}
export default refractRender;
