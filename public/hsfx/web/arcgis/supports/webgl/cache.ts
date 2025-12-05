
const _cache = new WeakMap<WebGL2RenderingContext, Map<symbol, any>>();

interface CacheConstraint<T> { }

export type CacheKey<T> = symbol & CacheConstraint<T>;

function getStore(gl: WebGL2RenderingContext) {
    let glStore = _cache.get(gl);
    if (!glStore) {
        glStore = new Map();
        _cache.set(gl, glStore);
    }
    return glStore;
}


export function fromGLCache<T>(
    gl: WebGL2RenderingContext,
    key: CacheKey<T>,
    create?: (gl: WebGL2RenderingContext) => T
) {
    const store = getStore(gl);
    let item = store.get(key) as T;
    if (!item && create) {
        item = create(gl);
        store.set(key, item);
    }
    return item;
}
