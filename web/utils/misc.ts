export function randomUUID(length = 16) {
    return crypto?.randomUUID?.() || randomString(length);
}
export function randomString(length = 16) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

export function loadImage(src: string) {
    return new Promise<HTMLImageElement>((resolve, reject) => {
        const img = document.createElement('img');
        img.src = src;
        img.onload = () => resolve(img);
        img.onerror = reject;
    });
}
export function isAbortError(e: any) {
    return e && e instanceof DOMException && e.name === 'AbortError';
}
export function throwIfNotAbortError(e: any) {
    if (!isAbortError(e)) throw e;
}

export function createIdGenerator(start = 1) {
    let id = start;
    return () => id++;
}

export function flatTreeNodes<T extends { children?: T[] }>(nodes: T[]) {
    const results = [] as T[];
    const queue = [...nodes] as T[];
    while (queue.length) {
        const last = queue.pop();
        if (last.children?.length) {
            queue.push(...last.children);
        } else {
            results.push(last);
        }
    }
    return results;
}

export function ensurePromise<T>(p: T) {
    if (!p) return Promise.resolve(p);
    if (p instanceof Promise) return p;
    if (p instanceof Error) return Promise.reject(p);
}

export function noop() { }