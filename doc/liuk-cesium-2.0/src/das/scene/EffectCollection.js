//效果响应
import * as Cesium from "cesium";
import { DasClass } from "../core/DasClass";
export class EffectCollection extends DasClass {
    constructor(options) {
        super(options);
        this._name = Cesium.defaultValue(options.name, "");
        this._viewer = options.viewer;
        this._effects = [];
    }
    add(e) {
        if (e._add) {
            e = e._add(this._viewer);
            this._effects.push(e);
            return e
        }
    }
    get(e) {
        return this._effects[e]
    }

    remove(e) {
        var t = false
            , n = this._effects.indexOf(e);
        return e._remove && (t = e._remove(this._viewer)),
            -1 < n && this._effects.splice(n, 1),
            t
    }

    removeAll() {
        for (; 0 < this._effects.length;)
            this.remove(this._effects[0])
    }
    destroy() {
        for (; 0 < this._effects.length;)
            this.remove(this._effects[0]);
        return Cesium.destroyObject(this)
    }
}
