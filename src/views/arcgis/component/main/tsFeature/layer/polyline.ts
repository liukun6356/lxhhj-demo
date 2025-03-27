import { Vector2 } from "three";

export interface TessellatePolylineMesh {
    vertices: number[];
    offset: number[];
    side: number[];
    indices: number[];
    vertexCount: number;
}

export function tessellatePolyLine(
    path: number[][],
    linejoin: "miter" | "round" | "bevel" = "miter",
    opts?: {
        miterLimit?: number;
        beforePoint?: number[];
        afterPoint?: number[];
    }
): TessellatePolylineMesh {
    if (path.length < 2) {
        console.warn(`线最少需要2个点!`);
        return null;
    }
    if (linejoin === "miter")
        return tessLineMiter(path, {
            before: opts?.beforePoint,
            after: opts?.afterPoint,
            miterLimit: opts?.miterLimit ?? 2,
        });
    return null;
    // const ctxs = [];
    // let totalLength = 0; //总长度
    // let vertexCount = (path.length - 1) * 4; //顶点数
    // let indexCount = (path.length - 1) * 6; //索引数
    // //计算布局信息
    //
    // {
    //     //初始dir逆时针旋转90指向的边为side=1,
    //     const lastDir = new Vector2(); //上一个方向
    //     const n1 = new Vector2(),
    //         n2 = new Vector2(),
    //         curDir = new Vector2(), //当前方向
    //         curPoint = new Vector2(), //当前点
    //         nextPoint = new Vector2(), //下一个点
    //         offset = new Vector2(), //当前offset
    //         c0 = new Vector2(), //拐角圆心offset
    //         c1 = new Vector2(), //拐角圆弧起点offset
    //         c2 = new Vector2(), //拐角圆弧终点offset;
    //         temp = new Vector2();
    //
    //     //for first point
    //     {
    //         lastDir.set(path[1][0] - path[0][0], path[1][1] - path[0][1]);
    //         totalLength += lastDir.length();
    //         lastDir.normalize();
    //         offset.set(-lastDir.y, lastDir.x);
    //         ctxs.push({
    //             isCw: true,//顺时针
    //             common: {
    //                 x: path[0][0],
    //                 y: path[0][1],
    //                 len: 0, //长度
    //                 index: 0, //原始点索引
    //             },
    //             p1: {
    //                 side: 1,
    //                 offset: [offset.x, offset.y],
    //                 delta: 0,
    //             },
    //             p2: {
    //                 side: -1,
    //                 offset: [-offset.x, -offset.y],
    //                 delta: 0,
    //             },
    //         })
    //     }
    //
    //     //between points
    //     for (let i = 1, count = path.length; i < count - 1; i++) {
    //         curPoint.set(path[i][0], path[i][1]);
    //         const oldLen = totalLength;
    //         nextPoint.set(path[i + 1][0], path[i + 1][1]);
    //         curDir.subVectors(nextPoint, curPoint);
    //         totalLength += curDir.length(); //更新长度
    //         curDir.normalize();
    //         const isCw = lastDir.cross(curDir) <= 0; //拐角是否是顺时针
    //         n1.copy(lastDir);
    //         n2.copy(curDir);
    //
    //         if (isCw) {
    //             n1.set(-n1.y, n1.x); //逆时针90
    //             n2.set(-n2.y, n2.x);
    //         } else {
    //             n1.set(n1.y, -n1.x); //顺时针90
    //             n2.set(n2.y, -n2.x);
    //         }
    //
    //         offset.addVectors(n1, n2).normalize();
    //         const cos = n1.dot(offset);
    //         const isSameLine = cos < MinValue || Math.abs(cos - 1) <= precisionNear1;
    //         if (isSameLine) { //同向或180°折返
    //             offset.set(-lastDir.y, lastDir.x);
    //             ctxs.push({
    //                 isCw,
    //                 sameDir: cos > 0.5,
    //                 common: {
    //                     x: curPoint.x,
    //                     y: curPoint.y,
    //                     len: oldLen,
    //                     index: i,
    //                 },
    //                 p1: {
    //                     side: 1,
    //                     offset: [offset.x, offset.y],
    //                     delta: 0,
    //                 },
    //                 p2: {
    //                     side: -1,
    //                     offset: [-offset.x, -offset.y],
    //                     delta: 0,
    //                 },
    //             });
    //         } else {
    //             //round 圆角
    //             offset.multiplyScalar(1 / cos);
    //             c0.copy(offset).multiplyScalar(-1);// -offset
    //             c1.copy(c0).addScaledVector(n1, 2);// c0 + 2n1;
    //             c2.copy(c0).addScaledVector(n2, 2);// c0 + 2n2;
    //
    //             const delta = temp.subVectors(offset, n1).length();
    //             const c0Side = isCw ? -1 : 1;
    //             const c1c2Side = isCw ? 1 : -1;
    //             //对n1,n2所夹的圆弧插值
    //             const sub = vecInterpolation(n1, n2, -delta, delta, isCw);
    //             vertexCount += sub.length * 2 - 1;
    //             indexCount += (sub.length - 1) * 3;
    //             sub.forEach(item => {
    //                 //c0 + 2 * sub
    //                 const [x, y] = item.vec;
    //                 item.vec = [c0.x + x * 2, c0.y + y * 2]
    //             })
    //             ctxs.push({
    //                 isCw: isCw,
    //                 common: {
    //                     x: curPoint.x,
    //                     y: curPoint.y,
    //                     len: oldLen, //长度
    //                     index: i, //原始点索引
    //                 },
    //                 c0: {
    //                     side: c0Side,
    //                     offset: [c0.x, c0.y],
    //                     delta: undefined, //动态值
    //                 },
    //                 c1: {
    //                     side: c1c2Side,
    //                     offset: [c1.x, c1.y],
    //                     delta: -delta,
    //                 },
    //                 c2: {
    //                     side: c1c2Side,
    //                     offset: [c2.x, c2.y],
    //                     delta: delta,
    //                 },
    //                 sub,
    //             });
    //         }
    //
    //         lastDir.copy(curDir);
    //     }
    //
    //     //the last point
    //     {
    //         const lastIndex = path.length - 1
    //         curPoint.set(path[lastIndex][0], path[lastIndex][1]);
    //         offset.copy(lastDir);
    //         offset.set(-offset.y, offset.x);
    //         ctxs.push({
    //             isCw: true,
    //             common: {
    //                 x: curPoint.x,
    //                 y: curPoint.y,
    //                 len: totalLength, //长度
    //                 index: lastIndex, //原始点索引
    //             },
    //             p1: {
    //                 side: 1,
    //                 offset: [offset.x, offset.y],
    //                 delta: 0,
    //             },
    //             p2: {
    //                 side: -1,
    //                 offset: [-offset.x, -offset.y],
    //                 delta: 0,
    //             },
    //         })
    //     }
    // }
    //
    // let vertexCursor = 0, indexCursor = 0, cursor = null;
    //
    // const vertexBuffer1 = new Float32Array(vertexCount * 4);
    // const vertexBuffer2 = new Float32Array(vertexCount * 4);
    // const vertexBuffer3 = new Float32Array(vertexCount * 2);
    // const indexBuffer = new Uint32Array(indexCount);
    //
    //
    // const ctxCounts = ctxs.length;
    // for (let i = 1; i < ctxCounts - 1; i++) {
    //     const before = ctxs[i - 1];
    //     const cur = ctxs[i];
    //     const {p1, p2} = before;
    //     const {c0, c1, c2, isCw, sub, p1: cp1, p2: cp2} = cur;
    //
    //     if (sub?.length) {
    //         //rect
    //         const _c0 = {...cur.common, ...c0, delta: c1.delta},
    //             _c1 = {...cur.common, ...c1};
    //
    //         cursor = vertexCursor;
    //         writeVertex(vertexCursor++, {...before.common, ...p1});
    //         writeVertex(vertexCursor++, {...before.common, ...p2});
    //         writeVertex(vertexCursor++, isCw ? _c1 : _c0);
    //         writeVertex(vertexCursor++, isCw ? _c0 : _c1);
    //         pushIndex(cursor, cursor + 1, cursor + 2, cursor + 1, cursor + 3, cursor + 2);
    //
    //         //corner
    //         cursor = vertexCursor;
    //         const subCount = sub.length - 1; //份数
    //         const subSide = isCw ? 1 : -1;
    //         writeVertex(vertexCursor++, {
    //             ...cur.common,
    //             delta: sub[0].value,
    //             offset: sub[0].vec,
    //             side: subSide
    //         });
    //         for (let i = 1; i <= subCount; i++) {
    //             const beforeSub = sub[i - 1];
    //             const curSub = sub[i];
    //             writeVertex(vertexCursor++, {
    //                 ...cur.common,
    //                 ...c0,
    //                 delta: (beforeSub.value + curSub.value) / 2
    //             });
    //             writeVertex(vertexCursor++, {
    //                 ...cur.common,
    //                 side: subSide,
    //                 delta: curSub.value,
    //                 offset: curSub.vec
    //             });
    //             const _cursor = cursor + i * 2;
    //             isCw ? pushIndex(_cursor - 2, _cursor - 1, _cursor)
    //                 : pushIndex(_cursor, _cursor - 1, _cursor - 2);
    //         }
    //         //update
    //         c0.delta = c2.delta;
    //         cur.p1 = isCw ? c2 : c0;
    //         cur.p2 = isCw ? c0 : c2;
    //     } else {
    //         //非拐角
    //         cursor = vertexCursor;
    //         writeVertex(vertexCursor++, {...before.common, ...p1});
    //         writeVertex(vertexCursor++, {...before.common, ...p2});
    //         writeVertex(vertexCursor++, {...cur.common, ...cp1});
    //         writeVertex(vertexCursor++, {...cur.common, ...cp2});
    //         pushIndex(cursor, cursor + 1, cursor + 2, cursor + 1, cursor + 3, cursor + 2);
    //         //180反向则交换p1, p2
    //         if (!cur.sameDir) {
    //             const temp = cp1.offset;
    //             cp1.offset = cp2.offset;
    //             cp2.offset = temp;
    //         }
    //     }
    // }
    //
    // //for last point
    // const before = ctxs[ctxCounts - 2];
    // const cur = ctxs[ctxCounts - 1];
    // cursor = vertexCursor;
    // writeVertex(vertexCursor++, {...before.common, ...before.p1});
    // writeVertex(vertexCursor++, {...before.common, ...before.p2});
    // writeVertex(vertexCursor++, {...cur.common, ...cur.p1},);
    // writeVertex(vertexCursor++, {...cur.common, ...cur.p2});
    // pushIndex(cursor, cursor + 1, cursor + 2, cursor + 1, cursor + 3, cursor + 2);
    //
    //
    // return {
    //     vertexCount: vertexBuffer1.length / 4,
    //     vPart1: vertexBuffer1,
    //     vPart2: vertexBuffer2,
    //     vPart3: vertexBuffer3,
    //     index: indexBuffer,
    //     totalDis: totalLength
    // }
    //
    // function writeVertex(index, data) {
    //     const i4 = index * 4, i2 = index * 2;
    //     const i41 = i4 + 1, i42 = i4 + 2, i43 = i4 + 3;
    //     const [hx, lx] = doubleToTwoFloats(data.x);
    //     const [hy, ly] = doubleToTwoFloats(data.y);
    //     // hx,hy,lx,ly,offsetx,offsety,distance,delta,side,index
    //     vertexBuffer1[i4] = hx;
    //     vertexBuffer1[i41] = hy;
    //     vertexBuffer1[i42] = lx;
    //     vertexBuffer1[i43] = ly;
    //     vertexBuffer2[i4] = data.offset[0];
    //     vertexBuffer2[i41] = data.offset[1] * -1;
    //     vertexBuffer2[i42] = data.len;
    //     vertexBuffer2[i43] = data.delta;
    //     vertexBuffer3[i2] = data.side;
    //     vertexBuffer3[i2 + 1] = data.index;
    // }
    //
    // function pushIndex(...args) {
    //     const now = indexCursor;
    //     for (let i = 0; i < args.length; i++) {
    //         indexBuffer[now + i] = args[i];
    //     }
    //     indexCursor += args.length;
    // }
    //
    // function vecInterpolation(n1, n2, range1, range2, cw = true) {
    //     let dot = n1.dot(n2) / (n1.length() * n2.length());
    //     if (Math.abs(dot) > 1) {
    //         dot = dot > 0 ? 1 : -1;
    //     }
    //     const angle = Math.acos(dot) || 0;
    //     let count = angle / SplitPerAngle,
    //         splitCount = count >> 0;
    //     if (count - splitCount >= 0.5) splitCount += 1;
    //     splitCount = Math.max(splitCount, 1);
    //     if (splitCount === 1) {
    //         return [
    //             {vec: [n1.x, n1.y], value: range1},
    //             {vec: [n2.x, n2.y], value: range2},
    //         ]
    //     }
    //     const per = (cw ? -1 : 1) * angle / splitCount, perVal = (range2 - range1) / splitCount;
    //     const cos = Math.cos(per), sin = Math.sin(per);
    //     const res = [{
    //         vec: [n1.x, n1.y],
    //         value: range1
    //     }];
    //     for (let i = 1; i <= splitCount; i++) {
    //         const before = res[i - 1];
    //         const _v = before.vec;
    //         res.push({
    //             vec: [
    //                 _v[0] * cos - _v[1] * sin,
    //                 _v[0] * sin + _v[1] * cos
    //             ],
    //             value: before.value + perVal
    //         });
    //     }
    //     return res;
    // }
}

//x,y => 逆时针90 (-y,x)
//    => 顺时针90 (y,-x)
function tessLineMiter(
    path: number[][],
    opts?: {
        before?: number[];
        after?: number[];
        miterLimit?: number;
    }
): TessellatePolylineMesh {
    const before = opts?.before,
        after = opts?.after;
    const miterLimit = opts?.miterLimit ?? Infinity;
    const halfMiterLimit = miterLimit / 2;

    const positionBuf: number[] = [];
    const offsetBuf: number[] = [];
    const sideBuf: number[] = [];
    const indexBuf: number[] = [];

    let vCursor = 0;
    const n1 = new Vector2(),
        n2 = new Vector2(),
        dir1 = new Vector2(),
        dir2 = new Vector2(),
        offset = new Vector2(),
        c0 = new Vector2(),
        cm = new Vector2(), //miterLimit点
        c1 = new Vector2(),
        c2 = new Vector2();

    //init ctx at 0
    if (before) {
        dir1.set(path[0][0] - before[0], path[0][1] - before[1]).normalize();
    } else {
        dir1.set(path[1][0] - path[0][0], path[1][1] - path[0][1]).normalize();
    }
    n1.set(-dir1.y, dir1.x);
    for (let i = 0, l = path.length, end = l - 1; i < l; i++) {
        const x = path[i][0],
            y = path[i][1];
        if (i > 0 && x === path[i - 1][0] && y === path[i - 1][1]) continue; //重复点

        //calc dir2
        if (i === end) {
            //last point
            if (after) {
                dir2.set(after[0] - x, after[1] - y);
            } else {
                dir2.copy(dir1);
            }
        } else {
            dir2.set(path[i + 1][0] - x, path[i + 1][1] - y);
        }

        dir2.normalize();
        n2.set(-dir2.y, dir2.x);
        offset.addVectors(n1, n2).normalize();
        const cos = n2.dot(offset);
        const offsetScale = 1 / cos;

        if (Math.abs(offsetScale - halfMiterLimit) > 1e-3) {
            //bevel
            const isCCW = dir1.cross(dir2) >= 0;
            const f = isCCW ? 1 : -1;
            c0.copy(offset).multiplyScalar(offsetScale * f);
            cm.set(c0.x - offset.x * miterLimit * f, c0.y - offset.y * miterLimit * f);
            const tan = (offsetScale ** 2 - 1) ** 0.5;
            const dir = (offsetScale * 2 - miterLimit) / tan;
            c1.set(cm.x + -offset.y * dir, cm.y + offset.x * dir);
            c2.set(cm.x + offset.y * dir, cm.y + -offset.x * dir);
            if (i === 0) {
                if (isCCW) {
                    writeVertex(x, y, cm.x, cm.y, -1);
                    writeVertex(x, y, c0.x, c0.y, 1);
                    writeVertex(x, y, c2.x, c2.y, -1);
                } else {
                    writeVertex(x, y, cm.x, cm.y, 1);
                    writeVertex(x, y, c2.x, c2.y, 1);
                    writeVertex(x, y, c0.x, c0.y, -1);
                }
                indexBuf.push(0, 2, 1);
                vCursor += 3;
            } else {
                const v = vCursor;
                const isLast = i === end;
                if (isCCW) {
                    //c1 ,c0, c2/cm
                    writeVertex(x, y, c1.x, c1.y, -1); //v
                    writeVertex(x, y, c0.x, c0.y, 1); //v+1
                    isLast ? writeVertex(x, y, cm.x, cm.y, -1) : writeVertex(x, y, c2.x, c2.y, -1); //v+2
                    indexBuf.push(...[-2, -1, 0, -2, 0, 1, 0, 2, 1].map((i) => i + v));
                } else {
                    //c1, c2/cm, c0
                    writeVertex(x, y, c1.x, c1.y, 1); //v
                    isLast ? writeVertex(x, y, cm.x, cm.y, 1) : writeVertex(x, y, c2.x, c2.y, 1); //v+1
                    writeVertex(x, y, c0.x, c0.y, -1); //v+2
                    indexBuf.push(...[-2, -1, 2, -2, 2, 0, 0, 2, 1].map((i) => i + v));
                }
                vCursor += 3;
            }
        } else {
            offset.multiplyScalar(offsetScale);
            writeVertex(x, y, offset.x, offset.y, 1);
            writeVertex(x, y, -offset.x, -offset.y, -1);
            if (i > 0) {
                const v = vCursor - 2;
                indexBuf.push(v, v + 1, v + 2, v + 1, v + 3, v + 2);
            }
            vCursor += 2;
        }

        dir1.copy(dir2);
        n1.copy(n2);
    }

    const vertexCount = vCursor;
    return {
        vertexCount,
        vertices: positionBuf,
        offset: offsetBuf,
        side: sideBuf,
        indices: indexBuf,
    };
   
    function writeVertex(x: number, y: number, offsetX: number, offsetY: number, side: number) {
        positionBuf.push(x, y);
        offsetBuf.push(offsetX, offsetY);
        sideBuf.push(side);
    }
}
