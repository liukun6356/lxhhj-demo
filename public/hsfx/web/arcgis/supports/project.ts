import { execute } from "@arcgis/core/geometry/operators/projectOperator";
import Point from "@arcgis/core/geometry/Point";

let point: __esri.Point;
//ensure projection.load() before use
export function project(
    [x, y]: Coord,
    sourceCrs: __esri.SpatialReference,
    targetCrs: __esri.SpatialReference
) {
    point ??= new Point({ spatialReference: sourceCrs });
    point.spatialReference = sourceCrs;
    point.x = x;
    point.y = y;
    const newPoint = execute(point, targetCrs) as __esri.Point;
    return newPoint ? [newPoint.x, newPoint.y] : null;
};