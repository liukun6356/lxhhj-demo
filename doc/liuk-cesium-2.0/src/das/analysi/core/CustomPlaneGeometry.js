import * as Cesium from "cesium";

export class CustomPlaneGeometry {
  constructor(options) {
    options = Cesium.defaultValue(options, Cesium.defaultValue.EMPTY_OBJECT);

    var vertexFormat = new Cesium.VertexFormat({
      st: true,
      position: true,
      bitangent: false,
      normal: false,
      color: false,
      tangent: false
    });
    this._pos_arr = Cesium.clone(options.pos_arr);
    this._vertexFormat = vertexFormat;
    var Rect = new Cesium.BoundingRectangle();
    this._SERectangle = Cesium.BoundingRectangle.fromPoints(this._pos_arr, Rect);
    this._workerName = "createCustomPlaneGeometry";
  }

  /**
   * Computes the geometric representation of a plane, including its vertices, and a bounding sphere.
   *
   * @param {CustomPlaneGeometry} CustomPlaneGeometry A description of the plane.
   * @returns {Geometry|undefined} The computed vertices and indices.
   */
  createGeometry(geometry) {
    var vertexFormat = geometry._vertexFormat;
    var SERectangle = geometry._SERectangle;
    var pos_arr = geometry._pos_arr;
    var attributes = new Cesium.GeometryAttributes();
    var indices;
    var positions;
    var poslen = pos_arr.length;
    if (Cesium.defined(vertexFormat.position)) {
      // 4 corner points.  Duplicated 3 times each for each incident edge/face.
      positions = new Float64Array(poslen * 3);

      for (var i = 0; i < poslen; i++) {
        positions[(i % poslen) * 3 + 0] = pos_arr[i].x;
        positions[(i % poslen) * 3 + 1] = pos_arr[i].y;
        positions[(i % poslen) * 3 + 2] = pos_arr[i].z;
      }

      attributes.position = new Cesium.GeometryAttribute({
        componentDatatype: Cesium.ComponentDatatype.DOUBLE,
        componentsPerAttribute: 3,
        values: positions
      });

      if (Cesium.defined(vertexFormat.st)) {
        var texCoords = new Float32Array(poslen * 2);
        // var oX = SERectangle.x - SERectangle.width;
        // var oY = SERectangle.y - SERectangle.height;
        var oX = SERectangle.x;
        var oY = SERectangle.y;
        for (let i = 0; i < poslen; i++) {
          texCoords[i * 2 + 0] = Math.abs((positions[i * 3 + 0] - oX) / SERectangle.width);
          texCoords[i * 2 + 1] = Math.abs((positions[i * 3 + 1] - oY) / SERectangle.height);
        }
        attributes.st = new Cesium.GeometryAttribute({
          componentDatatype: Cesium.ComponentDatatype.FLOAT,
          componentsPerAttribute: 2,
          values: texCoords
        });
      }

      indices = new Uint16Array((poslen - 2) * 3);

      for (let i = 1; i < poslen - 1; i++) {
        indices[(i - 1) * 3 + 0] = 0;
        indices[(i - 1) * 3 + 1] = i;
        indices[(i - 1) * 3 + 2] = i + 1;
      }
    }

    return new Cesium.Geometry({
      attributes: attributes,
      indices: indices,
      primitiveType: Cesium.PrimitiveType.TRIANGLE_FAN,
      boundingSphere: new Cesium.BoundingSphere(Cesium.Cartesian3.ZERO, Math.sqrt(2.0))
    });
  }
}
