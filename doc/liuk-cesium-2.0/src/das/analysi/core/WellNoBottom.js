import * as Cesium from "cesium";

export class WellNoBottom {
  constructor(options) {
    options = Cesium.defaultValue(options, Cesium.defaultValue.EMPTY_OBJECT);

    var min = options.minimumArr;
    var max = options.maximumArr;
    Cesium.Check.defined("dingmian", max);
    Cesium.Check.defined("dimianmian", min);

    Cesium.Check.typeOf.number.greaterThanOrEquals("dingmian.length", max.length, 3);
    Cesium.Check.typeOf.number.greaterThanOrEquals("dimian.length", min.length, 3);

    var vertexFormat = new Cesium.VertexFormat({
      st: true,
      position: true,
      bitangent: false,
      normal: false,
      color: false,
      tangent: false
    });

    this._minimumArr = Cesium.clone(min);
    this._maximumArr = Cesium.clone(max);
    this._vertexFormat = vertexFormat;
    this._workerName = "createWellNoBottom";
  }

  createGeometry(WellNoBottom, that) {
    var min = WellNoBottom._minimumArr;
    var max = WellNoBottom._maximumArr;
    var vertexFormat = WellNoBottom._vertexFormat;

    var attributes = new Cesium.GeometryAttributes();
    var indices;
    var positions;
    if (Cesium.defined(vertexFormat.position) && Cesium.defined(vertexFormat.st)) {
      if (Cesium.defined(vertexFormat.position)) {
        // 8 corner points.  Duplicated 3 times each for each incident edge/face.
        positions = new Float64Array(max.length * 4 * 3);

        for (var i = 0; i < max.length; i++) {
          if (i == max.length - 1) {
            positions[i * 12 + 0] = max[i].x;
            positions[i * 12 + 1] = max[i].y;
            positions[i * 12 + 2] = max[i].z;

            positions[i * 12 + 3] = min[i].x;
            positions[i * 12 + 4] = min[i].y;
            positions[i * 12 + 5] = min[i].z;

            positions[i * 12 + 9] = min[0].x;
            positions[i * 12 + 10] = min[0].y;
            positions[i * 12 + 11] = min[0].z;

            positions[i * 12 + 6] = max[0].x;
            positions[i * 12 + 7] = max[0].y;
            positions[i * 12 + 8] = max[0].z;

            // positions.push(max[i].x,max[i].y,max[i].z);
            // positions.push(min[i].x,min[i].y,min[i].z);
            // positions.push(min[0].x,min[0].y,min[0].z);
            // positions.push(max[0].x,max[0].y,max[0].z);
          } else {
            positions[i * 12 + 0] = max[i].x;
            positions[i * 12 + 1] = max[i].y;
            positions[i * 12 + 2] = max[i].z;

            positions[i * 12 + 3] = min[i].x;
            positions[i * 12 + 4] = min[i].y;
            positions[i * 12 + 5] = min[i].z;

            positions[i * 12 + 9] = min[i + 1].x;
            positions[i * 12 + 10] = min[i + 1].y;
            positions[i * 12 + 11] = min[i + 1].z;

            positions[i * 12 + 6] = max[i + 1].x;
            positions[i * 12 + 7] = max[i + 1].y;
            positions[i * 12 + 8] = max[i + 1].z;

            // positions.push(max[i].x,max[i].y,max[i].z);
            // positions.push(min[i].x,min[i].y,min[i].z);
            // positions.push(min[i+1].x,min[i+1].y,min[i+1].z);
            // positions.push(max[i+1].x,max[i+1].y,max[i+1].z);
          }
        }

        attributes.position = new Cesium.GeometryAttribute({
          componentDatatype: Cesium.ComponentDatatype.DOUBLE,
          componentsPerAttribute: 3,
          values: positions
        });
      }

      var top_heights = that.top_heights;
      var maxHeight = that.maxHeight || 0;
      var splitNum = that.splitNum;

      if (Cesium.defined(vertexFormat.st)) {
        var texCoords = new Float32Array(max.length * 4 * 2);
        var maxLen = max.length;
        for (let i = 0; i < max.length; i++) {
          var currX = i / maxLen;
          var currMaxHeight = (top_heights && top_heights[i]) || 0;
          var currY = (currMaxHeight - that.targetHeight) / (maxHeight - that.targetHeight);
          var nextIndex = i + 1;
          // if (i == max.length - 1) {
          //     nextIndex = 0;
          // }
          var nextMaxHeight = (top_heights && top_heights[nextIndex]) || 0;
          var nextX = nextIndex / maxLen;
          var nextY = (nextMaxHeight - that.targetHeight) / (maxHeight - that.targetHeight);

          texCoords[i * 8 + 0] = currX;
          texCoords[i * 8 + 1] = currY - 0.0;
          texCoords[i * 8 + 2] = currX;
          texCoords[i * 8 + 3] = currY - currY;
          texCoords[i * 8 + 4] = nextX;
          texCoords[i * 8 + 5] = nextY - 0.0;
          texCoords[i * 8 + 6] = nextX;
          texCoords[i * 8 + 7] = nextY - nextY;

          // texCoords[i*8 + 0]  = 0.0;
          // texCoords[i*8 + 1]  = 0.0;
          // texCoords[i*8 + 2]  = 0.0;
          // texCoords[i*8 + 3]  = 1.0;
          // texCoords[i*8 + 4]  = 1.0;
          // texCoords[i*8 + 5]  = 0.0;
          // texCoords[i*8 + 6]  = 1.0;
          // texCoords[i*8 + 7]  = 1.0;
        }

        attributes.st = new Cesium.GeometryAttribute({
          componentDatatype: Cesium.ComponentDatatype.FLOAT,
          componentsPerAttribute: 2,
          values: texCoords
        });
      }

      // 12 triangles:  6 faces, 2 triangles each.
      indices = new Uint16Array(max.length * 2 * 3);
      var min_pos = new Cesium.Cartesian3(9999999999999, 9999999999999, 9999999999999);
      var max_pos = new Cesium.Cartesian3(-9999999999999, -9999999999999, -9999999999999);
      for (let i = 0; i < max.length; i++) {
        indices[i * 6 + 0] = 4 * i + 0;
        indices[i * 6 + 1] = 4 * i + 1;
        indices[i * 6 + 2] = 4 * i + 2;
        indices[i * 6 + 3] = 4 * i + 1;
        indices[i * 6 + 4] = 4 * i + 2;
        indices[i * 6 + 5] = 4 * i + 3;

        if (max[i].x >= max_pos.x && max[i].y >= max_pos.y && max[i].z >= max_pos.z) {
          max_pos = max[i];
        }
        if (min[i].x <= min_pos.x && min[i].y <= min_pos.y && min[i].z <= min_pos.z) {
          min_pos = min[i];
        }
      }
    }

    var diff = Cesium.Cartesian3.subtract(max_pos, min_pos, new Cesium.Cartesian3());
    var radius = Cesium.Cartesian3.magnitude(diff) * 0.5;

    return new Cesium.Geometry({
      attributes: attributes,
      indices: indices,
      primitiveType: Cesium.PrimitiveType.TRIANGLES,
      boundingSphere: new Cesium.BoundingSphere(Cesium.Cartesian3.ZERO, radius)
    });
  }
}
