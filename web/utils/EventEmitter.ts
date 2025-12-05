

export interface Evented<E extends EventMap> {
    emit<K extends keyof E>(name: K, payload: E[K]): void;
    on<K extends keyof E>(name: K | K[], handler: (payload: E[K]) => void): IHandle;
    once<K extends keyof E>(name: K, handler: (payload: E[K]) => void): IHandle;
    hasEventListener(name: string): boolean;
}

export type EventMap = Record<string/*name*/, any/*event payload*/>

export class EventEmitter<E extends EventMap, T = any> {
    private _target: T;
    private _listenersMap: Map<string, any[]>;
    constructor(target?: T) {
        this._target = target;
        this._listenersMap = null;
    }
    clear() {
        this._listenersMap?.clear();
        this._listenersMap = null
    }
    destroy() { this.clear() }
    emit<K extends keyof E>(name: K, payload?: E[K]) {
        let cbs = this._listenersMap?.get(name as string);
        if (!cbs) return false;
        const target = this._target || this;
        for (const cb of cbs.slice()) {
            cb.call(target, payload)
        }
    }
    on<K extends keyof E>(name: K | K[], handler: (payload: E[K]) => void): IHandle {
        if (!handler) throw new Error('handler not exist');
        if (Array.isArray(name)) {
            const handles = name.map((e => this.on(e, handler)));
            return {
                remove: () => handles.forEach(h => h.remove())
            }
        }
        this._listenersMap ??= new Map();
        let cbs = this._listenersMap.get(name as string);
        if (!cbs) {
            cbs = [];
            this._listenersMap.set(name as string, cbs);
        }
        const index = cbs.findIndex(i => i === handler);
        if (index === -1) cbs.push(handler);
        return {
            remove: () => {
                const arr = this._listenersMap?.get(name as string);
                const index = arr?.indexOf(handler) ?? -1;
                index >= 0 && arr.splice(index, 1);
            }
        }
    }
    once<K extends keyof E>(name: K, handler: (payload: E[K]) => void) {
        if (!handler) throw new Error('handler not exist');
        const handle = this.on(name, (e => {
            handle.remove();
            handler.call(this._target || null, e);
        }));
        return handle;
    }
    hasEventListener(name: string) {
        const arr = this._listenersMap?.get(name);
        return !!arr?.length;
    }
}
