import * as Cesium from "cesium";
import { eventType } from "../core/DasClass";
import { BaseLayer } from "./base/BaseLayer";
import { getTerrainProvider, getEllipsoidTerrain } from "../layer";

export class TerrainLayer extends BaseLayer {
  get layer() {
    return this.terrain;
  }
  //添加
  add() {
    if (!this.terrain) {
      this.terrain = getTerrainProvider(this.options.terrain || this.options);
      this.fireMap(eventType.load, { terrain: this.terrain });
    }
    this.viewer.terrainProvider = this.terrain;
    super.add();
  }
  //移除
  remove() {
    this.viewer.terrainProvider = getEllipsoidTerrain();
    super.remove();
  }
}
