/* reference: https://github.com/timohausmann/quadtree-js.git */

//坐标系: x向右,y向上
export interface Rect {
    xmin: number, //左下角x
    ymin: number, //左下角y
    width: number,
    height: number,
}

enum RegionIndex {
    topLeft = 3,
    topRight = 2,
    bottomLeft = 0,
    bottomRight = 1
}

function isRectIntersect(rect1: Rect, rect2: Rect) {
    return !(
        (rect1.xmin + rect1.width) < rect2.xmin
        || rect1.xmin > (rect2.xmin + rect2.width)
        || (rect1.ymin + rect1.height) < rect2.ymin
        || rect1.ymin > (rect2.ymin + rect2.height)
    );
}

function rectIntersect(rect1: Rect, rect2: Rect) {
    const xmin = Math.max(rect1.xmin, rect2.xmin);
    const ymin = Math.max(rect1.ymin, rect2.ymin);
    const xmax = Math.min(rect1.xmin + rect1.width, rect2.xmin + rect2.width);
    const ymax = Math.min(rect1.ymin + rect1.height, rect2.ymin + rect2.height);
    return {
        xmin,
        ymin,
        width: xmax - xmin,
        height: ymax - ymin
    }
}

export class Quadtree<T extends Rect> {
    id: string;
    bounds: Rect & { cx: number, cy: number };
    maxObjects: number;
    maxLevels: number;

    level: number;
    objects: Map<T, RegionIndex[]>; //当前tree自身元素
    subTrees: Quadtree<T>[];//子tree

    /**
     * @param {Rect} bounds                只作为划分四叉树的依据(根据中心点划分), 并不要求其中对象完全处于该范围内
     * @param {number} [maxObjects=10]     所容纳的最大对象数目，默认10，超出后会分裂成4个子树
     * @param {number} [maxLevels=4]       分裂的最大等级
     * @param {number} [level=0]           当前等级
     */
    constructor(bounds: Rect, maxObjects?: number, maxLevels?: number, level?: number, region?: RegionIndex) {
        const cx = bounds.xmin + bounds.width / 2;
        const cy = bounds.ymin + bounds.height / 2;
        this.bounds = {...bounds, cx, cy};
        this.maxObjects = maxObjects || 10;
        this.maxLevels = maxLevels || 4;
        this.level = level || 0;

        this.id = [this.level, region || 0].join('/');

        this.subTrees = [];
        this.objects = new Map();
    }

    /**
     * Split the node into 4 subnodes
     */
    private split() {
        const nextLevel = this.level + 1,
            {xmin, ymin, width, height, cx, cy} = this.bounds,
            halfWidth = width / 2,
            halfHeight = height / 2;

        this.subTrees[RegionIndex.bottomLeft] = new Quadtree({
            xmin: xmin,
            ymin: ymin,
            width: halfWidth,
            height: halfHeight
        }, this.maxObjects, this.maxLevels, nextLevel, RegionIndex.bottomLeft);
        this.subTrees[RegionIndex.bottomRight] = new Quadtree({
            xmin: cx,
            ymin: ymin,
            width: halfWidth,
            height: halfHeight
        }, this.maxObjects, this.maxLevels, nextLevel, RegionIndex.bottomRight);
        this.subTrees[RegionIndex.topRight] = new Quadtree({
            xmin: cx,
            ymin: cy,
            width: halfWidth,
            height: halfHeight
        }, this.maxObjects, this.maxLevels, nextLevel, RegionIndex.topRight);
        this.subTrees[RegionIndex.topLeft] = new Quadtree({
            xmin: xmin,
            ymin: cy,
            width: halfWidth,
            height: halfHeight
        }, this.maxObjects, this.maxLevels, nextLevel, RegionIndex.topLeft);
    }

    /**
     * 判断当前rect在哪个区域.以中心点划分,不要求一定在bounds范围
     *       |
     *  3    |   2
     * ______|______
     *   0   |   1
     *       |
     */
    private getIndex(pRect: Rect) {
        const {cx, cy} = this.bounds;
        const {width, height} = pRect;
        if (width === 0 && height === 0) { //点
            const x = pRect.xmin, y = pRect.ymin;
            if (x < cx) {
                return y < cy ? [RegionIndex.bottomLeft] : [RegionIndex.topLeft]
            } else if (x > cx) {
                return y < cy ? [RegionIndex.bottomRight] : [RegionIndex.topRight]
            } else { //xmin == cx
                if (y < cy) return [RegionIndex.bottomLeft, RegionIndex.bottomRight]
                if (y > cy) return [RegionIndex.topLeft, RegionIndex.topRight];
                return [
                    RegionIndex.topLeft, RegionIndex.topRight,
                    RegionIndex.bottomLeft, RegionIndex.bottomRight
                ]
            }
        } else {//线or面
            const {xmin, ymin} = pRect;
            const indexes = [] as RegionIndex[];
            const isStartLeft = width ? xmin < cx : xmin <= cx,
                isEndRight = xmin + width > cx,
                isStartBottom = height ? ymin < cy : ymin <= cy,
                isEndTop = ymin + height > cy;
            if (isStartLeft && isStartBottom) indexes.push(RegionIndex.bottomLeft);
            if (isEndRight && isStartBottom) indexes.push(RegionIndex.bottomRight);
            if (isEndRight && isEndTop) indexes.push(RegionIndex.topRight);
            if (isStartLeft && isEndTop) indexes.push(RegionIndex.topLeft);
            return indexes;
        }
    };

    /**
     * 插入对象到tree中. 如果当前tree容量满了, 就会分裂成子tree, 然后将当前tree所有对象插入到子树节点中
     * @param {Rect} pRect bounds of the object to be added ({ x, y, width, height })
     * @memberof Quadtree
     */
    insert(pRect: T) {
        const indexes = this.getIndex(pRect);
        if (!this.subTrees.length) { //没有子节点
            this.objects.set(pRect, indexes);
            if (this.objects.size > this.maxObjects && this.level < this.maxLevels) {
                this.split(); //分裂
                //循环插入子节点
                for (let [rect, rectIndices] of this.objects) {
                    for (let idx of rectIndices) {
                        this.subTrees[idx].insert(rect);
                    }
                }
                this.objects.clear();
            }
        } else {
            indexes.forEach(idx => this.subTrees[idx].insert(pRect));
        }
    };

    /**
     * 移除一个rect对象
     * @param pRect
     */
    remove(pRect: T) {
        const containNodes = this.getSmallIntersectTrees(pRect);
        containNodes.forEach(node => {
            node.objects.has(pRect) && node.objects.delete(pRect);
        })
    }

    /**
     * Return all objects that could collide with the given object
     * @param {Rect} pRect  bounds of the object to be checked ({ x, y, width, height })
     * @return {Rect[]}  array with all detected objects
     * @memberof Quadtree
     */
    retrieve(pRect: Rect) {
        let targetIndices = this.getIndex(pRect),
            returnObjects: T[] = [];

        if (this.subTrees.length) {
            const childRetrieves: T[][] = [];
            targetIndices.forEach(idx => {
                childRetrieves.push(this.subTrees[idx].retrieve(pRect));
            });
            returnObjects = childRetrieves.flat();
        } else {
            for (let [rect, indices] of this.objects) {
                if (indicesIntersects(targetIndices, indices) && isRectIntersect(rect, pRect)) {
                    returnObjects.push(rect);
                }
            }
        }
        return returnObjects.length ? Array.from(new Set(returnObjects)) : returnObjects;

        function indicesIntersects(arr1: RegionIndex[], arr2: RegionIndex[]) {
            const flag1 = arr1.reduce((result, index) => {
                result = result | (1 << index);
                return result;
            }, 0)
            const flag2 = arr2.reduce((result, index) => {
                result = result | (1 << index);
                return result;
            }, 0)
            return !!(flag1 & flag2);
        }
    };

    getAll() {
        let result: T[] = [];
        if (this.subTrees.length) {
            result = result.concat(this.subTrees.map(n => n.getAll()).flat());
        } else {
            for (let [rect, i] of this.objects) {
                result.push(rect);
            }
        }
        return result.length ? Array.from(new Set(result)) : result;
    }

    //查找与输入rect相交的尽可能小的全部tree节点
    getSmallIntersectTrees(obj: Rect) {
        if (!this.subTrees.length) return [this];
        const indices = this.getIndex(obj);
        let result: Quadtree<T>[] = [];
        for (let i = 0; i < indices.length; i++) {
            const subTree = this.subTrees[indices[i]];
            const isIntersect = isRectIntersect(subTree.bounds, obj);
            const findRect = isIntersect ? rectIntersect(subTree.bounds, obj) : obj;
            const nodes = subTree.getSmallIntersectTrees(findRect);
            if (nodes) result.push(...nodes.flat());
        }
        return result;
    }

    /**
     * Clear the quadtree
     * @memberof Quadtree
     */
    clear() {
        this.objects.clear();
        for (let i = 0; i < this.subTrees.length; i++) {
            if (this.subTrees.length) {
                this.subTrees[i].clear();
            }
        }
        this.subTrees = [];
    };
}
