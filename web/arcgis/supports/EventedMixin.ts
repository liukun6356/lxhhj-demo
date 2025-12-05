import Accessor from "@arcgis/core/core/Accessor";
import { subclass } from "@arcgis/core/core/accessorSupport/decorators";
import { type Evented, EventEmitter, type EventMap } from "web/utils/EventEmitter";

export const EventedMixin = <T extends Accessor>(Base: Constructor<T>) => {
    @subclass()
    //@ts-ignore
    class EventMixinClass<E extends EventMap = {}> extends Base implements Evented<E> {
        private _emitter: EventEmitter<E>;
        constructor(...args: any[]) { super(...args), this._emitter = new EventEmitter(); }
        emit<K extends keyof E>(name: K, payload?: E[K]) { return this._emitter.emit(name, payload) }
        on<K extends keyof E>(name: K, handler: (event: E[K]) => void) { return this._emitter.on(name, handler) }
        once<K extends keyof E>(name: K, handler: (event: E[K]) => void) { return this._emitter.once(name, handler) }
        hasEventListener(name: string) { return this._emitter.hasEventListener(name) }
        destroy() {
            super.destroy();
            this._emitter.clear()
        }
    }
    return EventMixinClass;
}
