import {Cartesian2, Cartesian3, Color} from 'cesium';
import moment from 'moment';
import {
    asyncTaskScheduler,
    calcDataTexSize,
    findIntervalIndexThatValueIn,
    getFramePrediction,
    loadImg,
    LRUCache,
} from './utils';
import ColorStop from '@/assets/images/triangularMesh/colorstop.png';
import {isNil} from 'lodash-es';

type GLCtx = WebGLRenderingContext | WebGL2RenderingContext;
type TypedArray =
    Int8Array
    | Uint8Array
    | Uint8ClampedArray
    | Int16Array
    | Uint16Array
    | Int32Array
    | Uint32Array
    | Float32Array
    | Float64Array;

function fTime(t: any) {
    return moment(t).format('YYYY-MM-DD HH:mm');
}

type Source = {
    times: number[];
    dataGetter: (t: number) => Promise<Float32Array>;
};

export function createFloodPrimitive(mesh: {
    vertices: TypedArray;
    triangles: Uint32Array;
}) {
    const handlers = [] as (() => void)[];
    let _initialized = false;
    let _context: any = null;

    let _sourceOpts: Source;
    let dataSource: ReturnType<typeof createDataSource>;

    let _flood: { drawCommand: Cesium.DrawCommand; destroy: () => void };
    let _grid: {
        drawCommand: Cesium.DrawCommand;
        destroy: () => void;
    };
    let _showGrid = true;
    const uniformStore = {
        mappingRange: new Cartesian2(0, 5),
        colorstopTexture: null as Cesium.Texture,
        lerp: 0,
        tex1: null as Cesium.Texture,
        tex2: null as Cesium.Texture,
        texSize: new Cartesian2(1, 1),
        texDataFlag: new Cartesian2(0, 0),
        gridColor: Color.fromCssColorString('rgba(255, 255, 255, 0.1)'),
    };

    function doubleToTwoFloats(v: number) {
        // 高低位分解 2**6，笛卡尔束通常事很大的数字，将坐标分解为高位和低位，提高渲染经度，避免抖动 => 单精度浮点数->双精度浮点数
        // 高位  表示主要位置（粗略网格）
        // 低位  表示相对于高位的偏移量（细节）
        if (v >= 0) {
            const i = 65536 * Math.floor(v / 65536);
            return [i, v - i]; // [高位，低位]
        } else {
            const i = 65536 * Math.floor(-v / 65536);
            return [-i, v + i]; // [高位，低位]
        }
    }

    function init(context: any) {
        _context = context;
        const iswebgl2 = context.webgl2;

        const verticesHigh = new Float32Array(mesh.vertices.length);
        const verticesLow = new Float32Array(mesh.vertices.length);
        for (let i = 0; i < mesh.vertices.length; i += 3) {
            const i1 = i + 1,
                i2 = i + 2;
            const x = mesh.vertices[i];
            const y = mesh.vertices[i1];
            const z = mesh.vertices[i2];
            const [hx, lx] = doubleToTwoFloats(x);
            const [hy, ly] = doubleToTwoFloats(y);
            const [hz, lz] = doubleToTwoFloats(z);
            verticesHigh[i] = hx;
            verticesHigh[i1] = hy;
            verticesHigh[i2] = hz;
            verticesLow[i] = lx;
            verticesLow[i1] = ly;
            verticesLow[i2] = lz;
        }
        const positionHighBuffer = Cesium.Buffer.createVertexBuffer({
            context,
            typedArray: verticesHigh,
            usage: Cesium.BufferUsage.STATIC_DRAW,
        });
        const positionLowBuffer = Cesium.Buffer.createVertexBuffer({
            context,
            typedArray: verticesLow,
            usage: Cesium.BufferUsage.STATIC_DRAW,
        });

        _flood = (() => {
            const dataIndexArr = new Float32Array(mesh.vertices.length / 3);
            for (let i = dataIndexArr.length; i--;) dataIndexArr[i] = i;
            const dataIndexBuffer = Cesium.Buffer.createVertexBuffer({
                context,
                typedArray: dataIndexArr,
                usage: Cesium.BufferUsage.STATIC_DRAW,
            });
            const indexBuffer = Cesium.Buffer.createIndexBuffer({
                context,
                typedArray: mesh.triangles,
                usage: Cesium.BufferUsage.STATIC_DRAW,
                indexDatatype: Cesium.IndexDatatype.UNSIGNED_INT,
            });
            const attributeLocations = {
                dataIndex: 0,
                positionHigh: 1,
                positionLow: 2,
            } as const;
            const va = new Cesium.VertexArray({
                context,
                attributes: [
                    {
                        index: attributeLocations.dataIndex,
                        vertexBuffer: dataIndexBuffer,
                        componentDatatype: Cesium.ComponentDatatype.FLOAT,
                        componentsPerAttribute: 1,
                        normalize: false,
                    },
                    {
                        index: attributeLocations.positionHigh,
                        vertexBuffer: positionHighBuffer,
                        componentDatatype: Cesium.ComponentDatatype.FLOAT,
                        componentsPerAttribute: 3,
                        normalize: false,
                    },
                    {
                        index: attributeLocations.positionLow,
                        vertexBuffer: positionLowBuffer,
                        componentDatatype: Cesium.ComponentDatatype.FLOAT,
                        componentsPerAttribute: 3,
                        normalize: false,
                    },
                ],
                indexBuffer,
                attributeLocations,
            });
            const emptyTex1 = new Cesium.Texture({
                context,
                source: {
                    width: 1,
                    height: 1,
                    arrayBufferView: new Uint8ClampedArray(4),
                },
                pixelDatatype: Cesium.PixelDatatype.UNSIGNED_BYTE,
                pixelFormat: Cesium.PixelFormat.RGBA,
            });
            const emptyTex2 = new Cesium.Texture({
                context,
                source: {
                    width: 1,
                    height: 1,
                    arrayBufferView: new Uint8ClampedArray(4),
                },
                pixelDatatype: Cesium.PixelDatatype.UNSIGNED_BYTE,
                pixelFormat: Cesium.PixelFormat.RGBA,
            });
            const uniformMap = {
                u_lerp() {
                    return uniformStore.lerp;
                },
                u_tex1() {
                    return uniformStore.tex1 || emptyTex1;
                },
                u_tex2() {
                    return uniformStore.tex2 || emptyTex2;
                },
                u_texDataFlag() {
                    return uniformStore.texDataFlag;
                },
                u_texSize() {
                    return uniformStore.texSize;
                },
                u_colorstop() {
                    return uniformStore.colorstopTexture;
                },
                u_mappingRange() {
                    return uniformStore.mappingRange;
                },
            };
            const shaderProgram = Cesium.ShaderProgram.fromCache({
                context,
                vertexShaderSource: `
                ${iswebgl2 ? `#define texture2D texture` : ''}
    
                uniform vec2 u_texSize;
                uniform vec2 u_texDataFlag;
                uniform float u_lerp;
                uniform sampler2D u_tex1;
                uniform sampler2D u_tex2;
                uniform sampler2D u_colorstop;
                uniform vec2 u_mappingRange;
    
                in vec3 positionHigh;
                in vec3 positionLow;
                in float dataIndex;
                
                out vec4 v_color;
              
                float lookupValue(sampler2D map, float index){
                    float pixelIndex = floor(index / 4.0);
                    float componentIndex = mod(index, 4.0);
                    float col = mod(pixelIndex, u_texSize.x);
                    float row = floor(pixelIndex / u_texSize.x);
              
                    vec2 onePixel = 1.0 / u_texSize;
                    vec2 uv = (vec2(col, row) + 0.5) * onePixel;
              
                    vec4 v = texture2D(map, uv);
              
                    if(componentIndex == 0.0) return v.x;
                    if(componentIndex == 1.0) return v.y;
                    if(componentIndex == 2.0) return v.z;
                    if(componentIndex == 3.0) return v.w;
                }
               
                void main(){
                    vec4 positionRelativeToEye = czm_translateRelativeToEye(positionHigh, positionLow);
                    vec4 positionEC = czm_modelViewRelativeToEye * positionRelativeToEye; 
                    gl_Position = czm_projection * positionEC;
    
                    float v1 = u_texDataFlag.x > 0.5 ? lookupValue(u_tex1, dataIndex) : 0.0;
                    float v2 = u_texDataFlag.y > 0.5 ? lookupValue(u_tex2, dataIndex) : 0.0;
    
                    float v = mix(v1, v2, u_lerp);
                    
                    if(v <= 0.0){
                        v_color = vec4(0);
                    }else{
                        float ux = (v - u_mappingRange.x) / (u_mappingRange.y - u_mappingRange.x);
                        v_color = texture2D(u_colorstop, vec2(ux, 0.5));
                    }
                }`,
                fragmentShaderSource: `          
                in vec4 v_color;
                void main(){
                    vec3 color = czm_gammaCorrect(v_color.rgb);
                    out_FragColor = vec4(color, v_color.a);         
                }`,
                attributeLocations,
            });
            const renderState = Cesium.RenderState.fromCache({
                blending: {
                    enabled: true,
                    equationRgb: Cesium.BlendEquation.ADD,
                    equationAlpha: Cesium.BlendEquation.ADD,
                    functionSourceRgb: Cesium.BlendFunction.SOURCE_ALPHA,
                    functionSourceAlpha: Cesium.BlendFunction.SOURCE_ALPHA,
                    functionDestinationRgb:
                    Cesium.BlendFunction.ONE_MINUS_SOURCE_ALPHA,
                    functionDestinationAlpha:
                    Cesium.BlendFunction.ONE_MINUS_SOURCE_ALPHA,
                },
                cull: {
                    enabled: false,
                },
                depthTest: {
                    enabled: !true,
                },
                depthMask: false,
            });
            return {
                drawCommand: new Cesium.DrawCommand({
                    modelMatrix: Cesium.Matrix4.IDENTITY.clone(),
                    vertexArray: va,
                    shaderProgram: shaderProgram,
                    uniformMap: uniformMap,
                    renderState: renderState,
                    pass: Cesium.Pass.OPAQUE,
                    count: mesh.triangles.length,
                    receiveShadows: true,
                    castShadows: true,
                    pickId: null,
                    boundingVolume: null,
                }),
                destroy() {
                    va.destroy();
                    shaderProgram.destroy();
                    emptyTex1.destroy();
                    emptyTex2.destroy();
                },
            };
        })();
        _grid = (() => {
            const triangleCount = mesh.triangles.length / 3;
            const gridLineIndexArr = new Uint32Array(triangleCount * 6);
            for (let i = 0; i < triangleCount; i++) {
                const i3 = i * 3;
                const ia = mesh.triangles[i3];
                const ib = mesh.triangles[i3 + 1];
                const ic = mesh.triangles[i3 + 2];
                const i6 = i * 6;
                gridLineIndexArr[i6] = ia;
                gridLineIndexArr[i6 + 1] = ib;
                gridLineIndexArr[i6 + 2] = ia;
                gridLineIndexArr[i6 + 3] = ic;
                gridLineIndexArr[i6 + 4] = ib;
                gridLineIndexArr[i6 + 5] = ic;
            }
            const indexBuffer = Cesium.Buffer.createIndexBuffer({
                context,
                typedArray: gridLineIndexArr,
                usage: Cesium.BufferUsage.STATIC_DRAW,
                indexDatatype: Cesium.IndexDatatype.UNSIGNED_INT,
            });
            const attributeLocations = {positionHigh: 0, positionLow: 1} as const;
            const va = new Cesium.VertexArray({
                context,
                attributes: [
                    {
                        index: attributeLocations.positionHigh,
                        vertexBuffer: positionHighBuffer,
                        componentDatatype: Cesium.ComponentDatatype.FLOAT,
                        componentsPerAttribute: 3,
                        normalize: false,
                    },
                    {
                        index: attributeLocations.positionLow,
                        vertexBuffer: positionLowBuffer,
                        componentDatatype: Cesium.ComponentDatatype.FLOAT,
                        componentsPerAttribute: 3,
                        normalize: false,
                    },
                ],
                indexBuffer: indexBuffer,
                attributeLocations,
            });
            const uniformMap = {
                u_gridColor() {
                    return uniformStore.gridColor;
                },
            };
            const shaderProgram = Cesium.ShaderProgram.fromCache({
                context,
                vertexShaderSource: `
                in vec3 positionHigh;
                in vec3 positionLow;
                void main(){
                    vec4 positionRelativeToEye = czm_translateRelativeToEye(positionHigh, positionLow);
                    vec4 positionEC = czm_modelViewRelativeToEye * positionRelativeToEye; 
                    gl_Position = czm_projection * positionEC;
                }`,
                fragmentShaderSource: `
                uniform vec4 u_gridColor;       
                void main(){
                    out_FragColor = u_gridColor;         
                }`,
                attributeLocations,
            });
            const renderState = Cesium.RenderState.fromCache({
                blending: {
                    enabled: true,
                    equationRgb: Cesium.BlendEquation.ADD,
                    equationAlpha: Cesium.BlendEquation.ADD,
                    functionSourceRgb: Cesium.BlendFunction.SOURCE_ALPHA,
                    functionSourceAlpha: Cesium.BlendFunction.SOURCE_ALPHA,
                    functionDestinationRgb:
                    Cesium.BlendFunction.ONE_MINUS_SOURCE_ALPHA,
                    functionDestinationAlpha:
                    Cesium.BlendFunction.ONE_MINUS_SOURCE_ALPHA,
                },
                cull: {
                    enabled: false,
                },
                depthTest: {
                    enabled: !true,
                },
                depthMask: false,
            });
            return {
                drawCommand: new Cesium.DrawCommand({
                    modelMatrix: Cesium.Matrix4.IDENTITY.clone(),
                    vertexArray: va,
                    shaderProgram: shaderProgram,
                    uniformMap: uniformMap,
                    renderState: renderState,
                    pass: Cesium.Pass.OPAQUE,
                    count: gridLineIndexArr.length,
                    receiveShadows: true,
                    castShadows: true,
                    pickId: null,
                    boundingVolume: null,
                    primitiveType: Cesium.PrimitiveType.LINES,
                }),
                destroy() {
                    va.destroy();
                    shaderProgram.destroy();
                },
            };
        })();
        loadImg(ColorStop).then((img) => {
            uniformStore.colorstopTexture = new Cesium.Texture({
                context,
                flipY: false,
                sampler: new Cesium.Sampler({
                    minificationFilter: Cesium.TextureMinificationFilter.LINEAR,
                    magnificationFilter:
                    Cesium.TextureMagnificationFilter.NEAREST,
                }),
                source: img,
                pixelDatatype: Cesium.PixelDatatype.UNSIGNED_BYTE,
                pixelFormat: Cesium.PixelFormat.RGBA,
            });
        });
        let destroyed = false;
        handlers.push(() => {
            if (destroyed) return;
            destroyed = true;
            _flood.destroy();
            _grid.destroy();
            uniformStore.colorstopTexture?.destroy();
        });
    }

    function update(frameState: any) {
        // debugger
        if (!_initialized) {
            init(frameState.context);
            _initialized = true;
        }

        function canRenderFlood() {
            if (isNil(curTime) || isNaN(curTime)) return false;
            if (!uniformStore.colorstopTexture) return false;
            if (_sourceOpts !== dataSource?.sourceOpts) {
                if (dataSource) dataSource.destroy();
                if (_sourceOpts) {
                    dataSource = createDataSource(_context, _sourceOpts);
                    dataSource.setCurTime(curTime ?? dataSource.minTime);
                }
            }
            if (!dataSource) return false;
            const resource = dataSource.getDataAtTime(curTime);
            if (!resource) return false;
            const {beforeTime, afterTime, data1, data2} = resource;
            if (!data1 && !data2) return false; //都为空, 则没必要渲染
            uniformStore.lerp =
                (curTime - beforeTime) / (afterTime - beforeTime);
            uniformStore.tex1 = data1;
            uniformStore.tex2 = data2;
            uniformStore.texDataFlag.x = data1 ? 1 : 0;
            uniformStore.texDataFlag.y = data2 ? 1 : 0;
            uniformStore.texSize.x = dataSource.texSize[0];
            uniformStore.texSize.y = dataSource.texSize[1];
            return true;
        }

        if (!_show) return;
        canRenderFlood() && frameState.commandList.push(_flood.drawCommand);
        _showGrid && frameState.commandList.push(_grid.drawCommand);
    }

    let curTime: number;
    let _show = true;
    const primitive = {
        update,
        get show() {
            return _show
        },
        set show(v) {
            _show = v
        },
        setShowGrid(show: boolean) {
            _showGrid = show;
        },
        changeSource(opts: typeof _sourceOpts) {
            _sourceOpts = opts;
        },
        setCurTime(t: number) {
            curTime = t;
            if (!dataSource) return;
            dataSource.setCurTime(t);
        },
        canRenderAtTime(t: number) {
            if (!dataSource) return false;
            return !!dataSource.getDataAtTime(t);
        },
        destroy() {
            dataSource && dataSource.destroy();
            handlers.forEach((f) => f());
            handlers.length = 0;
        },
    };
    return primitive;
}

enum EnumTaskStatus {
    none = 'none',
    pending = 'pending',
    finish = 'finish',
    error = 'error',
}

function createDataSource(context: any, opts: Source) {
    const {times, dataGetter} = opts;
    times.sort((a, b) => a - b);
    const minTime = times[0],
        maxTime = times[times.length - 1];
    type TaskRecord = {
        key: number; //time
        status: EnumTaskStatus;
        isEmpty: boolean;
    };
    const taskMap = new Map<number /*time*/, TaskRecord>();
    const cache = new LRUCache<Cesium.Texture, number /*time*/>(256, {
        onRemove(obj, key) {
            taskMap.delete(key);
            obj.destroy();
        },
    });
    let dataLength: number;
    let texSize: number[];
    let totalTexBufferLength: number;
    const scheduler = asyncTaskScheduler<TaskRecord, Float32Array>({
        invoke(task) {
            task.status = EnumTaskStatus.pending;
            return dataGetter(task.key);
        },
        onSuccess(dataArr, task) {
            if (!dataLength) {
                dataLength = dataArr.length;
                texSize = calcDataTexSize(dataLength / 4);
                totalTexBufferLength = texSize[0] * texSize[1] * 4;
            }
            if (dataLength !== dataArr.length)
                throw new Error('时序数据长度不一致');
            let min = 0,
                max = 0;
            for (let i = dataArr.length; i--;) {
                min = Math.min(min, dataArr[i]);
                max = Math.max(max, dataArr[i]);
            }
            task.status = EnumTaskStatus.finish;
            if (max > 0) {
                const buffer = new Float32Array(totalTexBufferLength);
                buffer.set(dataArr);
                const tex = new Cesium.Texture({
                    context: context,
                    flipY: false,
                    sampler: new Cesium.Sampler({
                        minificationFilter:
                        Cesium.TextureMinificationFilter.LINEAR,
                        magnificationFilter:
                        Cesium.TextureMagnificationFilter.NEAREST,
                    }),
                    source: {
                        width: texSize[0], //rgba
                        height: texSize[1],
                        arrayBufferView: buffer,
                    },
                    pixelDatatype: Cesium.PixelDatatype.FLOAT,
                    pixelFormat: Cesium.PixelFormat.RGBA,
                });
                cache.add(task.key, tex);
                task.isEmpty = false;
            } else {
                task.isEmpty = true;
            }
            console.log(
                fTime(task.key),
                `[${min.toFixed(2)}, ${max.toFixed(2)}]`
            );
        },
        onError(error, task) {
            task.status = EnumTaskStatus.error;
            console.error(`load tile [${fTime(task.key)}] fail\n`, error);
            throw error;
        },
        maxConcurrency: 2,
    });
    let curTime = NaN;
    let beforeIndex = NaN;
    let afterIndex = NaN;

    function handleTimeChange(t: number) {
        if (curTime === t) return;
        curTime = t;
        const res = getFramePrediction({
            times,
            curTime: t,
            preload: {frame: 10},
        });
        if (beforeIndex === res.beforeIndex && afterIndex === res.afterIndex)
            return;
        beforeIndex = res.beforeIndex;
        afterIndex = res.afterIndex;
        const {timeIndexSet} = res;
        scheduler.updateQueue((running, waiting) => {
            const loadTimes = new Set(
                Array.from(timeIndexSet).map((i) => times[i])
            );
            running.forEach(({desc, cancel}) => {
                if (!loadTimes.has(desc.key)) cancel?.('时间超出范围');
            });
            return Array.from(timeIndexSet)
                .sort((A, B) => B - A)
                .map((index) => {
                    const time = times[index];
                    let task = taskMap.get(time);
                    if (!task) {
                        task = {
                            key: time,
                            status: EnumTaskStatus.none,
                            isEmpty: null,
                        };
                        taskMap.set(time, task);
                    }
                    return task.status === 'none' ? task : null;
                })
                .filter(Boolean);
        });
    }

    return {
        get minTime() {
            return minTime;
        },
        get maxTime() {
            return maxTime;
        },
        get texSize() {
            return texSize;
        },
        get dataLength() {
            return dataLength;
        },
        get sourceOpts() {
            return opts;
        },
        setCurTime: handleTimeChange,
        getDataAtTime: (t: number) => {
            const [beforeIndex, afterIndex] = findIntervalIndexThatValueIn(
                times,
                t
            );
            const beforeTime = times[beforeIndex],
                afterTime = times[afterIndex];
            const r1 = taskMap.get(beforeTime),
                r2 = taskMap.get(afterTime);
            return r1?.status === 'finish' && r2?.status === 'finish'
                ? {
                    beforeTime,
                    afterTime,
                    data1: cache.get(beforeTime),
                    data2: cache.get(afterTime),
                }
                : null;
        },
        destroy() {
            scheduler.clear('');
            cache.clear('');
            taskMap.clear();
        },
    };
}
