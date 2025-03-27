//最近最少使用,缓存
export class LRUCache<V = any, K = any> {
    private cache: Map<K, V>;
    private capacity: number;
    private _setWithEffect: (key: K, val: V) => void;
    private _deleteWithEffect: (key: K, val: V, reason?: any) => void;

    //[ 旧 -> 新, map插入位置 ],
    constructor(
        capacity: number,
        opts?: {
            onAdd?: (obj: V, key: K) => void;
            onRemove?: (obj: V, key: K, reason?: any) => void;
        }
    ) {
        this.cache = new Map<K, V>();
        this.capacity = capacity;
        this._deleteWithEffect = (key: K, val: V, reason?: any) => {
            this.cache.delete(key);
            opts?.onRemove && opts.onRemove(val, key, reason);
        };
        this._setWithEffect = (key: K, val: V) => {
            this.cache.set(key, val);
            opts?.onAdd && opts.onAdd(val, key);
        };
    }

    //是否存在
    has(key: K) {
        return this.cache.has(key);
    }

    //修改容量
    resize(capacity: number) {
        if (capacity <= 0) throw new Error("无效的容量");
        capacity = Math.max(10, capacity >> 0);
        if (capacity >= this.capacity) {
            //扩容
            this.capacity = capacity;
        } else {
            //缩减
            if (this.cache.size > capacity) {
                //移除多余的
                const iter = this.cache.keys();
                while (true) {
                    const key = iter.next().value;
                    const val = this.cache.get(key);
                    this._deleteWithEffect(key, val);
                    if (this.cache.size <= capacity) break;
                }
            }
            this.capacity = capacity;
        }
    }

    get(key: K, reinsert = true) {
        if (this.cache.has(key)) {
            // 存在即更新
            const temp = this.cache.get(key);
            if (reinsert) {
                this.cache.delete(key);
                this.cache.set(key, temp);
            }
            return temp;
        }
        return null;
    }

    add(key: K, value: V) {
        if (this.cache.has(key)) {
            // 存在即更新（删除后加入）
            this.cache.delete(key);
        } else if (this.cache.size >= this.capacity) {
            const removeKey = this.cache.keys().next().value;
            const removeObj = this.cache.get(removeKey);
            this._deleteWithEffect(removeKey, removeObj, "LRU缓存已满");
        }
        this._setWithEffect(key, value);
    }

    remove(key: K, reason?: any) {
        if (!this.cache.has(key)) return null;
        const removeItem = this.cache.get(key);
        this._deleteWithEffect(key, removeItem, reason);
        return removeItem;
    }

    clear(reason?: any) {
        Array.from(this.cache.entries()).forEach((i) => this._deleteWithEffect(i[0], i[1], reason));
        this.cache.clear();
    }
}
