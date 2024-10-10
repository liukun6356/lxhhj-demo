//水对象专用的反射纹理
import * as Cesium from "cesium";
import { DasWater } from "../DasWater";

export class ReflectTexture extends DasWater {
  i(e, t, n, i, r) {
    var o = t._frameState;
    if (!Cesium.defined(t.debugCommandFilter) || t.debugCommandFilter(e)) {
      if (e instanceof Cesium.ClearCommand) {
        return void e.execute(n, i);
      }
      o.useLogDepth && Cesium.defined(e.derivedCommands.logDepth) && (e = e.derivedCommands.logDepth.command);
      var a = o.passes;
      !a.pick && t._hdr && Cesium.defined(e.derivedCommands) && Cesium.defined(e.derivedCommands.hdr) && (e = e.derivedCommands.hdr.command),
        a.pick || a.depth || t.debugShowCommands || t.debugShowFrustums || e.execute(n, i)
    }
  }
  r(e, t, n) {
  var r = new Cesium.PerspectiveFrustum
    , a = new Cesium.PerspectiveOffCenterFrustum
    , s = new Cesium.OrthographicFrustum
    , l = new Cesium.OrthographicOffCenterFrustum
    , u = Cesium.Cesium3DTilePassState && new Cesium.Cesium3DTilePassState({
      pass: Cesium.Cesium3DTilePass.RENDER
    });
  if (o || (o = new Cesium.Camera(e)),
    e.mode === Cesium.SceneMode.SCENE3D) {
    var h = e.context
      , c = e._view.passState
      , d = Cesium.Camera.clone(e.camera, o)
      , f = d.positionCartographic
      , p = d.pitch
      , m = d.heading
      , g = d.roll;
    d.setView({
      destination: Cesium.Cartesian3.fromRadians(f.longitude, f.latitude, t + t - f.height),
      orientation: {
        heading: m,
        pitch: -p,
        roll: g
      }
    });
    var v = .5 * e.context.drawingBufferWidth
      , y = .5 * e.context.drawingBufferHeight;
    c.viewport.x = 0,
      c.viewport.y = 0,
      c.viewport.width = v,
      c.viewport.height = y,
      n.update(h, v, y),
      n._colorTexture,
      c.framebuffer = n._framebuffer;
    var _ = e._clearColorCommand;
    Cesium.Color.multiplyByScalar(Cesium.Color.DEEPSKYBLUE, .1, _.color),
      _.color.alpha = 1,
      _.execute(h, c);
    var x = e._depthClearCommand
      , w = h.uniformState;
    w.updateCamera(d);
    var b;
    b = Cesium.defined(d.frustum.fov) ? d.frustum.clone(r) : Cesium.defined(d.frustum.infiniteProjectionMatrix) ? d.frustum.clone(a) : Cesium.defined(d.frustum.width) ? d.frustum.clone(s) : d.frustum.clone(l),
      b.near = d.frustum.near,
      b.far = d.frustum.far,
      w.updateFrustum(b);
    var C = e._frameState;
    C.passes.render = !0,
      C.tilesetPassState = u,
      e.frameState.commandList.length = 0,
      e._primitives.update(C),
      e._view.createPotentiallyVisibleSet(e);
    for (var M, S, T, E = e._view.frustumCommandsList, A = E.length, P = [Cesium.Pass.ENVIRONMENT, Cesium.Pass.GLOBE, Cesium.Pass.TERRAIN_CLASSIFICATION, Cesium.Pass.CESIUM_3D_TILE, Cesium.Pass.TRANSLUCENT], L = 0; L < A; ++L) {
      var D = A - L - 1
        , I = E[D];
      b.near = 0 !== D ? I.near * e.opaqueFrustumNearOffset : I.near,
        b.far = I.far,
        w.updateFrustum(b),
        x.execute(h, c);
      for (var R = 0; R < P.length; R++)
        for (w.updatePass(P[R]),
          M = I.commands[P[R]],
          S = I.indices[P[R]],
          T = 0; T < S; ++T)
          i(M[T], e, h, c)
    }
    c.framebuffer = void 0,
      w.das3dWaterHeight = -5e8
  }
}
}
