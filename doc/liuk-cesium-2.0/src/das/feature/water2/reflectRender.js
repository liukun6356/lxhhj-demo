//纹理变化对象
import * as Cesium from "cesium";

export class reflectRender {
  constructor() {
    this._reflectCam = null;
    this.scratchColorZero = new Cesium.Color(0, 0, 0, 0);
    this.renderTilesetPassState = new Cesium.Cesium3DTilePassState({
      pass: Cesium.Cesium3DTilePass.RENDER
    });
  }
  executeCommand(e, t, n, i, r) {
    var frameState = t._frameState;
    (Cesium.defined(t.debugCommandFilter) && !t.debugCommandFilter(e)) ||
      (e instanceof Cesium.ClearCommand
        ? e.execute(n, i)
        : (frameState.useLogDepth &&
            Cesium.defined(e.derivedCommands.logDepth) &&
            (e = e.derivedCommands.logDepth.command),
          !(frameState = frameState.passes).pick &&
            t._hdr &&
            Cesium.defined(e.derivedCommands) &&
            Cesium.defined(e.derivedCommands.hdr) &&
            (e = e.derivedCommands.hdr.command),
          frameState.pick ||
            frameState.depth ||
            t.debugShowCommands ||
            t.debugShowFrustums ||
            e.execute(n, i)));
  }
  reflect(e, t) {
    var n = Cesium.Cartesian3.dot(t, e),
      n = Cesium.Cartesian3.multiplyByScalar(t, 2 * n, new Cesium.Cartesian3());
    return Cesium.Cartesian3.subtract(e, n, new Cesium.Cartesian3());
  }
  getCenter(camera) {
    var position = Cesium.Cartesian3.clone(camera.position);
    var direction = Cesium.Cartesian3.clone(camera.direction);
    var pitch = camera.pitch + Math.PI / 2;
    var position1 = Cesium.Cartesian3.magnitude(position);
    if (pitch == 0) {
      return Cesium.Cartesian3.multiplyByScalar(
        position,
        6378137 / position1,
        new Cesium.Cartesian3()
      );
    }
    camera = new Cesium.Cartesian3(-direction.x, -direction.y, -direction.z);
    pitch = Math.PI - pitch;
    camera = Cesium.Cartesian3.angleBetween(position, camera);
    camera = Math.PI - pitch - camera;
    camera = Math.sqrt(
      position1 * position1 + 40680631590769 - 2 * position1 * 6378137 * Math.cos(camera)
    );
    camera = Cesium.Cartesian3.multiplyByScalar(direction, camera, new Cesium.Cartesian3());
    return Cesium.Cartesian3.add(position, camera, new Cesium.Cartesian3());
  }
  applyMat4(e, t) {
    var n = e.x,
      i = e.y,
      r = e.z,
      a = t,
      e = 1 / (a[3] * n + a[7] * i + a[11] * r + a[15]),
      t = new Cesium.Cartesian3();
    return (
      (t.x = (a[0] * n + a[4] * i + a[8] * r + a[12]) * e),
      (t.y = (a[1] * n + a[5] * i + a[9] * r + a[13]) * e),
      (t.z = (a[2] * n + a[6] * i + a[10] * r + a[14]) * e),
      t
    );
  }

  applyMatrix4(e, t) {
    var n = Cesium.Matrix4.getMatrix3(t, new Cesium.Matrix3()),
      n = Cesium.Matrix3.inverse(n, new Cesium.Matrix3()),
      i = Cesium.Matrix3.transpose(n, new Cesium.Matrix3()),
      n = Cesium.Cartesian3.clone(e.normal),
      n = Cesium.Cartesian3.multiplyByScalar(n, -e.distance, new Cesium.Cartesian3()),
      t = this.applyMat4(n, t),
      i = Cesium.Matrix3.multiplyByVector(i, e.normal, new Cesium.Cartesian3()),
      e = new Cesium.Plane(e.normal, e.distance);
    return (
      (e.normal = Cesium.Cartesian3.normalize(i, new Cesium.Cartesian3())),
      (e.distance = -Cesium.Cartesian3.dot(t, e.normal)),
      e
    );
  }
  render(scene, rPolygon, wrfboReflect, layers) {
    var passState,
      camera,
      CloneCamera,
      curNormal,
      curAxis,
      CloneCameraPosition,
      viewMatrix,
      PolygonNormal,
      context;
    if (!this._reflectCam) {
      this._reflectCam = new Cesium.Camera(scene);
    }
    if (scene.mode === Cesium.SceneMode.SCENE3D && rPolygon.show) {
      rPolygon.show = false;
      context = scene.context;
      passState = scene._view.passState;
      camera = scene.camera;
      CloneCamera = Cesium.Camera.clone(scene.camera, this._reflectCam);
      CloneCameraPosition = CloneCamera.position;
      viewMatrix = CloneCamera.viewMatrix;
      Cesium.Matrix4.getMatrix3(viewMatrix, new Cesium.Matrix3());
      PolygonNormal = rPolygon.normal;
      curAxis = Cesium.Cartesian3.subtract(
        rPolygon.centerPos,
        CloneCameraPosition,
        new Cesium.Cartesian3()
      );
      curNormal = this.reflect(curAxis, PolygonNormal);
      viewMatrix = Cesium.Cartesian3.negate(curNormal, new Cesium.Cartesian3());
      viewMatrix = Cesium.Cartesian3.add(rPolygon.centerPos, viewMatrix, new Cesium.Cartesian3());
      CloneCameraPosition = this.getCenter(scene.camera);
      curAxis = Cesium.Cartesian3.subtract(
        rPolygon.centerPos,
        CloneCameraPosition,
        new Cesium.Cartesian3()
      );
      curNormal = this.reflect(curAxis, PolygonNormal);
      CloneCameraPosition = Cesium.Cartesian3.negate(curNormal, new Cesium.Cartesian3());
      CloneCameraPosition = Cesium.Cartesian3.add(
        rPolygon.centerPos,
        CloneCameraPosition,
        new Cesium.Cartesian3()
      );
      curAxis = Cesium.Cartesian3.clone(CloneCamera.up, new Cesium.Cartesian3());
      curAxis = this.reflect(curAxis, PolygonNormal);
      curNormal = Cesium.Cartesian3.subtract(
        CloneCameraPosition,
        viewMatrix,
        new Cesium.Cartesian3()
      );
      curNormal = Cesium.Cartesian3.normalize(curNormal, new Cesium.Cartesian3());
      CloneCameraPosition = Cesium.Cartesian3.cross(curNormal, curAxis, new Cesium.Cartesian3());
      CloneCameraPosition = Cesium.Cartesian3.normalize(
        CloneCameraPosition,
        new Cesium.Cartesian3()
      );
      CloneCamera.position = viewMatrix;
      CloneCamera.direction = curNormal;
      CloneCamera.up = curAxis;
      CloneCamera.right = CloneCameraPosition;
      CloneCamera.update(scene.mode);
      scene.camera = CloneCamera;
      curAxis = 0.5 * scene.context.drawingBufferWidth;
      CloneCameraPosition = 0.5 * scene.context.drawingBufferHeight;
      passState.viewport.x = 0;
      passState.viewport.y = 0;
      passState.viewport.width = curAxis;
      passState.viewport.height = CloneCameraPosition;
      wrfboReflect.update(context, curAxis, CloneCameraPosition);
      passState.framebuffer = wrfboReflect._framebuffer;
      wrfboReflect = scene._clearColorCommand;
      Cesium.Color.multiplyByScalar(Cesium.Color.DEEPSKYBLUE, 0.1, wrfboReflect.color);
      wrfboReflect.color.alpha = 1;
      wrfboReflect.execute(context, passState);
      scene._depthClearCommand;
      wrfboReflect = context.uniformState;
      context = Cesium.Plane.fromPointNormal(rPolygon.centerPos, PolygonNormal);
      Math.abs(Cesium.Plane.getPointDistance(context, viewMatrix));
      viewMatrix = Cesium.Plane.transform(context, CloneCamera.viewMatrix);
      context = new Cesium.Cartesian4(
        viewMatrix.normal.x,
        viewMatrix.normal.y,
        viewMatrix.normal.z,
        viewMatrix.distance
      );
      CloneCamera.frustum.fov;
      Cesium.Cartesian3.angleBetween(PolygonNormal, CloneCamera.direction);
      CloneCamera.frustum._offCenterFrustum.clipPlane = context;
      wrfboReflect.updateCamera(CloneCamera);
      scene.updateFrameState();
      viewMatrix = scene.globe.show;
      context = (PolygonNormal = scene._frameState).useLogDepth;
      PolygonNormal.invertClassification = false;
      PolygonNormal.passes.render = true;
      PolygonNormal.tilesetPassState = this.renderTilesetPassState;
      PolygonNormal.camera = CloneCamera;
      PolygonNormal.useLogDepth = false;
      scene.globe.show = false;
      wrfboReflect.update(PolygonNormal);
      scene.updateEnvironment();
      scene.updateAndExecuteCommands(passState, this.scratchColorZero);
      scene.resolveFramebuffers(passState);
      passState.framebuffer = null;
      PolygonNormal.camera = camera;
      PolygonNormal.useLogDepth = context;
      scene.camera = camera;
      rPolygon.show = true;
      scene.globe.show = viewMatrix;
    }
  }
}
export default reflectRender;
