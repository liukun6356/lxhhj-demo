define(['exports', './chunks/tile', './chunks/pack', './chunks/polygon', '/arcgis-js-api/geometry/Extent.js', '/arcgis-js-api/geometry/Polygon.js', '/arcgis-js-api/geometry/geometryEngine.js', '/arcgis-js-api/geometry/projection.js', '/arcgis-js-api/geometry/SpatialReference.js', '/arcgis-js-api/layers/support/TileInfo.js'], (function (exports, tile, pack, polygon, Extent, Polygon, geometryEngine_js, projection, SpatialReference, TileInfo) { 'use strict';

    function _interopNamespaceDefault(e) {
        var n = Object.create(null);
        if (e) {
            Object.keys(e).forEach(function (k) {
                if (k !== 'default') {
                    var d = Object.getOwnPropertyDescriptor(e, k);
                    Object.defineProperty(n, k, d.get ? d : {
                        enumerable: true,
                        get: function () { return e[k]; }
                    });
                }
            });
        }
        n.default = e;
        return Object.freeze(n);
    }

    var projection__namespace = /*#__PURE__*/_interopNamespaceDefault(projection);

    //最近最少使用,缓存
    class LRUCache {
        //[ 旧 -> 新, map插入位置 ],
        constructor(capacity, opts) {
            this.cache = new Map();
            this.capacity = capacity;
            this._deleteWithEffect = (key, val, reason) => {
                this.cache.delete(key);
                opts?.onRemove && opts.onRemove(val, key, reason);
            };
            this._setWithEffect = (key, val) => {
                this.cache.set(key, val);
                opts?.onAdd && opts.onAdd(val, key);
            };
        }
        //是否存在
        has(key) {
            return this.cache.has(key);
        }
        //修改容量
        resize(capacity) {
            if (capacity <= 0)
                throw new Error("无效的容量");
            capacity = Math.max(10, capacity >> 0);
            if (capacity >= this.capacity) {
                //扩容
                this.capacity = capacity;
            }
            else {
                //缩减
                if (this.cache.size > capacity) {
                    //移除多余的
                    const iter = this.cache.keys();
                    while (true) {
                        const key = iter.next().value;
                        const val = this.cache.get(key);
                        this._deleteWithEffect(key, val);
                        if (this.cache.size <= capacity)
                            break;
                    }
                }
                this.capacity = capacity;
            }
        }
        get(key, reinsert = true) {
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
        add(key, value) {
            if (this.cache.has(key)) {
                // 存在即更新（删除后加入）
                this.cache.delete(key);
            }
            else if (this.cache.size >= this.capacity) {
                const removeKey = this.cache.keys().next().value;
                const removeObj = this.cache.get(removeKey);
                this._deleteWithEffect(removeKey, removeObj, "LRU缓存已满");
            }
            this._setWithEffect(key, value);
        }
        remove(key, reason) {
            if (!this.cache.has(key))
                return null;
            const removeItem = this.cache.get(key);
            this._deleteWithEffect(key, removeItem, reason);
            return removeItem;
        }
        clear(reason) {
            Array.from(this.cache.entries()).forEach((i) => this._deleteWithEffect(i[0], i[1], reason));
            this.cache.clear();
        }
    }

    /**
     * 提取单通道栅格数据子区域
     * @param data 原始数据
     * @param dataSize 原始尺寸[宽,高]
     * @param subExtent 要提取的子区域范围
     * @param subExtent.sx 子区域范围左上角x
     * @param subExtent.sy 子区域范围左上角y
     * @param subExtent.width 子区域范围宽度
     * @param subExtent.height 子区域范围高度
     * @param noDataValue 无效值
     */
    function extractSubRegion(data, dataSize, subExtent, noDataValue, outputArrayType) {
        const { sx, sy, width, height } = subExtent;
        const result = {
            hasData: false,
            pixel: new (outputArrayType || data.constructor || Array)(width * height),
            min: Infinity,
            max: -Infinity,
        };
        for (let colmin = sx, colmax = sx + width - 1, col = dataSize[0], cursor = width * height, sourceBuffer = data, i = colmax, j = sy + height - 1, output = result; cursor--;) {
            const dataIndex = i + j * col;
            const v = (output.pixel[cursor] = sourceBuffer[dataIndex]);
            if (v !== noDataValue) {
                output.hasData = true;
                output.min = Math.min(output.min, v);
                output.max = Math.max(output.max, v);
            }
            i--;
            if (i < colmin) {
                i = colmax;
                j--;
            }
        }
        return result.hasData ? result : null;
    }
    /**
     * 提取矢量场栅格数据子区域, (noDataValue需要预先处理并转为0)
     * @param data 原始数据
     * @param dataSize 原始尺寸[宽,高]
     * @param subExtent 要提取的子区域范围
     * @param subExtent.sx 子区域范围左上角x
     * @param subExtent.sy 子区域范围左上角y
     * @param subExtent.width 子区域范围宽度
     * @param subExtent.height 子区域范围高度
     */
    function extractVectorFieldSubRegion(data, dataSize, subExtent, outputArrayType) {
        const { sx, sy, width, height } = subExtent;
        const result = {
            hasData: false,
            pixel: new (outputArrayType || data.constructor || Array)(width * height * 2),
            umin: Infinity,
            umax: -Infinity,
            vmin: Infinity,
            vmax: -Infinity,
        };
        for (let colmin = sx, colmax = sx + width - 1, col = dataSize[0], pixelCursor = width * height, sourceBuffer = data, i = colmax, j = sy + height - 1, output = result; pixelCursor--;) {
            const dataIndex = (i + j * col) * 2;
            const outputIndex = pixelCursor * 2;
            const u = (output.pixel[outputIndex] = sourceBuffer[dataIndex]);
            const v = (output.pixel[outputIndex + 1] = sourceBuffer[dataIndex + 1]);
            output.hasData = output.hasData || !!u || !!v;
            output.umin = Math.min(output.umin, u);
            output.umax = Math.max(output.umax, u);
            output.vmin = Math.min(output.vmin, v);
            output.vmax = Math.max(output.vmax, v);
            i--;
            if (i < colmin) {
                i = colmax;
                j--;
            }
        }
        if (result.hasData && result.umin === result.umax) {
            debugger;
        }
        return result.hasData ? result : null;
    }

    //  单一值投影,
    //  原值为 v, 范围为[r1, r2]
    //  归一值 = nv;
    //  输出rgb = packNormalizeFloatToRGB(nv);
    //  输出a = 0/1, mask位,对应是否有数据
    const SingleChannelReProjectShader = {
        vertex: `
        precision highp float;
        attribute vec2 positionRTC;
        attribute vec2 uv;
        varying vec2 vUv;
        void main(){
            gl_Position = vec4(positionRTC, 0.0, 1.0);
            vUv = uv;
        } 
    `,
        fragment: `
        precision highp float;
        {defines}
        uniform sampler2D dataTex; //数据纹理图像
        uniform vec2 dataTexSize; //数据纹理尺寸
        uniform float noDataValue; //无效值
        uniform vec2 valueRange; //当前tile范围内的值的值域
        uniform bool isNearest; //最邻近
        varying vec2 vUv;
    
        ${pack.glsl_pack}
        
        float samplerData(vec2 uv){
            #ifdef webgl2  
                return texture2D(dataTex, uv).r;
            #else
                return texture2D(dataTex, uv).a;
            #endif
        }
        float lookupData(vec2 uv){
            vec2 onePixel = 1.0 / dataTexSize;
            vec2 uv0 = floor(uv / onePixel) * onePixel + onePixel * 0.5;
            if(isNearest){
                return samplerData(uv0);
            }else{
                vec2 offset = vec2( 
                    uv.x > uv0.x ? 1.0 : -1.0, 
                    uv.y > uv0.y ? 1.0 : -1.0 
                );
                vec2 uv1 = uv0 + offset * onePixel * vec2(1,0);
                vec2 uv2 = uv0 + offset * onePixel * vec2(0,1);
                vec2 uv3 = uv0 + offset * onePixel * vec2(1,1);

                float v0 = samplerData(uv0);
                float v1 = samplerData(uv1);
                float v2 = samplerData(uv2);
                float v3 = samplerData(uv3);
                if(any(equal(vec4(v0,v1,v2,v3), vec4(noDataValue)))){
                    return v0;
                }else{
                    float v01 = mix(v0, v1, (uv.x - uv0.x) / (uv1.x - uv0.x));
                    float v23 = mix(v2, v3, (uv.x - uv2.x) / (uv3.x - uv2.x));
                    return mix(v01, v23, (uv.y - uv0.y) / (uv2.y - uv0.y));
                }
            }
        }
        
        void main(){
            float v = lookupData(vUv);
            //将采样值按值域进行归一化
            float nv = valueRange.y == valueRange.x ? 1.0 : (v - valueRange.x) / (valueRange.y - valueRange.x);
            //归一化值打包成rgb
            gl_FragColor.rgb = packNormalizeFloatToRGB(nv);
            gl_FragColor.a = v == noDataValue ? 0.0 : 1.0; //mask
        }
    `,
    };
    function initSingleChannelProjectProgram(gl, isWebGL2) {
        const defines = isWebGL2 ?? gl instanceof WebGL2RenderingContext ? `#define webgl2` : "";
        const program = createProgram(gl, SingleChannelReProjectShader.vertex, SingleChannelReProjectShader.fragment.replace("{defines}", defines));
        const textureLoc = gl.getUniformLocation(program, "dataTex");
        const uniformsLoc = {
            dataTexSize: gl.getUniformLocation(program, "dataTexSize"),
            noDataValue: gl.getUniformLocation(program, "noDataValue"),
            valueRange: gl.getUniformLocation(program, "valueRange"),
            isNearest: gl.getUniformLocation(program, "isNearest"),
        };
        const attributes = [
            {
                name: "positionRTC",
                loc: gl.getAttribLocation(program, "positionRTC"),
                size: 2,
                type: gl.FLOAT,
                normalize: false,
                stride: 0,
                offset: 0,
            },
            {
                name: "uv",
                loc: gl.getAttribLocation(program, "uv"),
                size: 2,
                type: gl.FLOAT,
                normalize: false,
                stride: 0,
                offset: 0,
            },
        ];
        return {
            program,
            textureLoc,
            uniformsLoc,
            attributes,
            textureParams: {
                format: isWebGL2 ? gl.RED : gl.ALPHA,
                internalFormat: isWebGL2 ? gl.R32F : gl.ALPHA,
            },
        };
    }
    //  矢量投影, 对xy分量分别
    //  原值为 xy, 范围为[xmin, xmax, ymin, ymax]
    //  归一值 = nx,ny;
    //  输出.rg = packNormalizeFloatToRG(nx);
    //  输出.ba = packNormalizeFloatToRG(ny);
    const vectorFieldTileReProjectShader = {
        vertex: `
        precision highp float;
        attribute vec2 positionRTC;
        attribute vec2 uv;
        varying vec2 vUv;
        void main(){
            gl_Position = vec4(positionRTC, 0.0, 1.0);
            vUv = uv;
        } 
    `,
        fragment: `
        precision highp float;
        {defines}
        uniform sampler2D dataTex; //数据纹理图像
        uniform vec2 dataTexSize; //数据纹理尺寸
        uniform vec4 valueRange; //[umin, umax, vmin, vmax];
        uniform bool isNearest; //最邻近
        varying vec2 vUv;
    
        ${pack.glsl_pack}
        
        vec2 samplerData(vec2 uv){
            #ifdef webgl2  
                return texture2D(dataTex, uv).rg; //RG32F
            #else
                return texture2D(dataTex, uv).ba; //LUMINANCE_ALPHA
            #endif
        }
        vec2 lookupData(vec2 uv){
            vec2 onePixel = 1.0 / dataTexSize;
            vec2 uv0 = floor(uv / onePixel) * onePixel + onePixel * 0.5;
            if(isNearest){
                return samplerData(uv0);
            }else{
                vec2 offset = vec2( 
                    uv.x > uv0.x ? 1.0 : -1.0, 
                    uv.y > uv0.y ? 1.0 : -1.0 
                );
                vec2 uv1 = uv0 + offset * onePixel * vec2(1,0);
                vec2 uv2 = uv0 + offset * onePixel * vec2(0,1);
                vec2 uv3 = uv0 + offset * onePixel * vec2(1,1);

                vec2 v0 = samplerData(uv0);
                vec2 v1 = samplerData(uv1);
                vec2 v2 = samplerData(uv2);
                vec2 v3 = samplerData(uv3);

                vec2 v01 = mix(v0, v1, (uv.x - uv0.x) / (uv1.x - uv0.x));
                vec2 v23 = mix(v2, v3, (uv.x - uv2.x) / (uv3.x - uv2.x));
                return mix(v01, v23, (uv.y - uv0.y) / (uv2.y - uv0.y));
            }
        }
        
        void main(){
            vec2 vel = lookupData(vUv);
            float nu = valueRange.y == valueRange.x ? 1.0 : (vel.x - valueRange.x) / (valueRange.y - valueRange.x);
            float nv = valueRange.w == valueRange.z ? 1.0 : (vel.y - valueRange.z) / (valueRange.w - valueRange.z);
            gl_FragColor.rg = vel.x == 0.0 ? vec2(1) : packNormalizeFloatToRG(nu); //encode 0 with (1,1)
            gl_FragColor.ba = vel.y == 0.0 ? vec2(1) : packNormalizeFloatToRG(nv);
        }
    `,
    };
    function initVectorFieldProjectProgram(gl, isWebGL2) {
        const defines = isWebGL2 ?? gl instanceof WebGL2RenderingContext ? `#define webgl2` : "";
        const program = createProgram(gl, vectorFieldTileReProjectShader.vertex, vectorFieldTileReProjectShader.fragment.replace("{defines}", defines));
        const textureLoc = gl.getUniformLocation(program, "dataTex");
        const uniformsLoc = {
            dataTexSize: gl.getUniformLocation(program, "dataTexSize"),
            valueRange: gl.getUniformLocation(program, "valueRange"),
            isNearest: gl.getUniformLocation(program, "isNearest"),
        };
        const attributes = [
            {
                name: "positionRTC",
                loc: gl.getAttribLocation(program, "positionRTC"),
                size: 2,
                type: gl.FLOAT,
                normalize: false,
                stride: 0,
                offset: 0,
            },
            {
                name: "uv",
                loc: gl.getAttribLocation(program, "uv"),
                size: 2,
                type: gl.FLOAT,
                normalize: false,
                stride: 0,
                offset: 0,
            },
        ];
        return {
            program,
            textureLoc,
            uniformsLoc,
            attributes,
            textureParams: {
                format: isWebGL2 ? gl.RG : gl.LUMINANCE_ALPHA,
                internalFormat: isWebGL2 ? gl.RG32F : gl.LUMINANCE_ALPHA,
            },
        };
    }
    let rasterProjCtx;
    function initRasterProjectCtx() {
        if (!globalThis.OffscreenCanvas)
            throw new Error("浏览器不支持OffscreenCanvas!");
        const canvas = new OffscreenCanvas(1, 1);
        const opts = {
            premultipliedAlpha: false,
            alpha: true,
            depth: false,
            stencil: false,
        };
        const isWebGL2 = typeof WebGL2RenderingContext !== undefined;
        const gl = isWebGL2 ? canvas.getContext("webgl2", opts) : canvas.getContext("webgl", opts);
        if (!isWebGL2) {
            const ext1 = gl.getExtension("OES_texture_float");
            if (!ext1)
                throw new Error("栅格重投影: 你的浏览器不支持浮点纹理OES_texture_float");
        }
        //固定的全局设置
        gl.disable(gl.DEPTH_TEST);
        gl.disable(gl.CULL_FACE);
        gl.disable(gl.BLEND);
        const createBuffer = (array) => {
            const buffer = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
            gl.bufferData(gl.ARRAY_BUFFER, array, gl.STATIC_DRAW);
            gl.bindBuffer(gl.ARRAY_BUFFER, null);
            return buffer;
        };
        const createDataTex = (opts) => {
            const { data, internalFormat, width, height, format, type } = opts;
            const texture = gl.createTexture();
            gl.bindTexture(gl.TEXTURE_2D, texture);
            gl.pixelStorei(gl.UNPACK_ALIGNMENT, polygon.getTextureUnpackAlign(width));
            gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
            gl.texImage2D(gl.TEXTURE_2D, 0, internalFormat, width, height, 0, format, type, data);
            gl.bindTexture(gl.TEXTURE_2D, null);
            return texture;
        };
        const disposeItems = (items) => {
            items.forEach((i) => {
                if (i instanceof WebGLTexture) {
                    gl.deleteTexture(i);
                }
                else if (i instanceof WebGLBuffer) {
                    gl.deleteBuffer(i);
                }
            });
        };
        let singleProgramInfo;
        const projectSingleChannel = (opts) => {
            if (!singleProgramInfo) {
                singleProgramInfo = initSingleChannelProjectProgram(gl, isWebGL2);
            }
            const { program, attributes, textureLoc, uniformsLoc, textureParams } = singleProgramInfo;
            //clear
            canvas.width = opts.outputTexSize[0];
            canvas.height = opts.outputTexSize[1];
            gl.viewport(0, 0, canvas.width, canvas.height);
            gl.clearColor(0, 0, 0, 0); //a is mask, 默认全部没有数据
            gl.clear(gl.COLOR_BUFFER_BIT);
            gl.useProgram(program);
            //set attributes
            const buffers = attributes.map((attr) => {
                let glBuffer = opts[attr.name];
                if (!(glBuffer instanceof WebGLBuffer)) {
                    glBuffer = createBuffer(glBuffer);
                }
                gl.bindBuffer(gl.ARRAY_BUFFER, glBuffer);
                gl.enableVertexAttribArray(attr.loc);
                gl.vertexAttribPointer(attr.loc, attr.size, attr.type, attr.normalize, attr.stride, attr.offset);
                return { name: attr.name, glBuffer };
            });
            //set uniforms
            gl.uniform2fv(uniformsLoc.dataTexSize, opts.inputDataTexSize);
            gl.uniform1f(uniformsLoc.noDataValue, opts.noDataValue ?? NaN);
            gl.uniform2fv(uniformsLoc.valueRange, opts.valueRange);
            gl.uniform1i(uniformsLoc.isNearest, (opts.sampling ?? "nearest") === "nearest" ? 1 : 0);
            //set texture
            let dataTex = opts.inputDataTex;
            if (!(dataTex instanceof WebGLTexture)) {
                dataTex = createDataTex({
                    data: dataTex,
                    internalFormat: textureParams.internalFormat,
                    width: opts.inputDataTexSize[0],
                    height: opts.inputDataTexSize[1],
                    format: textureParams.format,
                    type: gl.FLOAT,
                });
            }
            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, dataTex);
            gl.uniform1i(textureLoc, 0);
            gl.drawArrays(gl.TRIANGLES, 0, opts.triangles * 3);
            return {
                imagebitmap: canvas.transferToImageBitmap(),
                //原始gl数据, 可以复用, 不使用时调用disposeItems释放gpu资源
                positionRTC: buffers[0].glBuffer,
                uv: buffers[1].glBuffer,
                tex: dataTex,
            };
        };
        let vectorFieldProgramInfo;
        const projectVectorField = (opts) => {
            if (!vectorFieldProgramInfo) {
                vectorFieldProgramInfo = initVectorFieldProjectProgram(gl, isWebGL2);
            }
            const { program, attributes, textureLoc, uniformsLoc, textureParams } = vectorFieldProgramInfo;
            //clear
            canvas.width = opts.outputTexSize[0];
            canvas.height = opts.outputTexSize[1];
            gl.viewport(0, 0, canvas.width, canvas.height);
            //uv编码到rgba, 每2个通道存储一个值
            //0值比较特殊, 这里代表无数据, 参与颜色映射时=无颜色
            //方案1: 取编码前2位, 由于矢量有方向性, min可能为负值,
            //比如U ∈ [-1, 1], 0的归一化值为0.5,
            //packNormalizeFloatToRGBA(0.5) = [0.4980392156862745, 0.4980392156862745, 0.4980392156862745, 0.5]
            //unpackRGBAToNormalizeFloat([0.4980392156862745, 0.4980392156862745, 0, 0]) = 0.4999923106497501
            //0值的表示存在一定误差
            //方案2:
            //packNormalizeFloatToRGBA(1) = [1,0,0,0], 为最大值, 当r=1时, 不存在rgb > 0
            //使用rg=(1,1)代表特殊值0,
            gl.clearColor(1, 1, 1, 1);
            gl.clear(gl.COLOR_BUFFER_BIT);
            gl.useProgram(program);
            //set attributes
            const buffers = attributes.map((attr) => {
                let glBuffer = opts[attr.name];
                if (!(glBuffer instanceof WebGLBuffer)) {
                    glBuffer = createBuffer(glBuffer);
                }
                gl.bindBuffer(gl.ARRAY_BUFFER, glBuffer);
                gl.enableVertexAttribArray(attr.loc);
                gl.vertexAttribPointer(attr.loc, attr.size, attr.type, attr.normalize, attr.stride, attr.offset);
                return { name: attr.name, glBuffer };
            });
            //set uniforms
            gl.uniform2fv(uniformsLoc.dataTexSize, opts.inputDataTexSize);
            gl.uniform4fv(uniformsLoc.valueRange, opts.valueRange);
            gl.uniform1i(uniformsLoc.isNearest, (opts.sampling ?? "nearest") === "nearest" ? 1 : 0);
            //set texture
            let dataTex = opts.inputDataTex;
            if (!(dataTex instanceof WebGLTexture)) {
                dataTex = dataTex = createDataTex({
                    data: dataTex,
                    internalFormat: textureParams.internalFormat,
                    width: opts.inputDataTexSize[0],
                    height: opts.inputDataTexSize[1],
                    format: textureParams.format,
                    type: gl.FLOAT,
                });
            }
            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, dataTex);
            gl.uniform1i(textureLoc, 0);
            gl.drawArrays(gl.TRIANGLES, 0, opts.triangles * 3);
            //const a = new Uint8ClampedArray(256 * 256 * 4);
            //gl.readPixels(0, 0, 256, 256, gl.RGBA, gl.UNSIGNED_BYTE, a);
            return {
                imagebitmap: canvas.transferToImageBitmap(),
                positionRTC: buffers[0].glBuffer,
                uv: buffers[1].glBuffer,
                tex: dataTex,
            };
        };
        return {
            canvas,
            gl,
            disposeItems,
            projectSingleChannel,
            projectVectorField,
            createBuffer,
        };
    }
    function getRasterProjectContext() {
        if (!rasterProjCtx) {
            rasterProjCtx = initRasterProjectCtx();
        }
        return rasterProjCtx;
    }
    function createShader(gl, type, source) {
        const shader = gl.createShader(type);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        const success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
        if (success)
            return shader;
        const errinfo = gl.getShaderInfoLog(shader);
        gl.deleteShader(shader);
        throw new Error(errinfo);
    }
    function createProgram(gl, vertexShaderSource, fragmentShaderSource) {
        const program = gl.createProgram();
        const vShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
        const fShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);
        gl.attachShader(program, vShader);
        gl.attachShader(program, fShader);
        gl.linkProgram(program);
        const success = gl.getProgramParameter(program, gl.LINK_STATUS);
        gl.deleteShader(vShader);
        gl.deleteShader(fShader);
        if (success)
            return program;
        const errinfo = gl.getProgramInfoLog(program);
        gl.deleteProgram(program);
        throw new Error(errinfo);
    }

    /**
     * This file is a trivial rename of tinyqueue.
     *
     * See https://github.com/mourner/tinyqueue
     *
     * ---
     *
     * ISC License
     *
     * Copyright (c) 2017, Vladimir Agafonkin
     *
     * Permission to use, copy, modify, and/or distribute this software for any purpose
     * with or without fee is hereby granted, provided that the above copyright notice
     * and this permission notice appear in all copies.
     *
     * THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
     * REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY AND
     * FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
     * INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM LOSS
     * OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR OTHER
     * TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR PERFORMANCE OF
     * THIS SOFTWARE.
     *
     */

    class TinyQueue {
    	constructor(data = [], compare = defaultCompare) {
    		this.data = data;
    		this.length = this.data.length;
    		this.compare = compare;

    		if (this.length > 0) {
    			for (let i = (this.length >> 1) - 1; i >= 0; i--) this._down(i);
    		}
    	}

    	push(item) {
    		this.data.push(item);
    		this.length++;
    		this._up(this.length - 1);
    	}

    	pop() {
    		if (this.length === 0) return undefined;

    		const top = this.data[0];
    		const bottom = this.data.pop();
    		this.length--;

    		if (this.length > 0) {
    			this.data[0] = bottom;
    			this._down(0);
    		}

    		return top;
    	}

    	peek() {
    		return this.data[0];
    	}

    	_up(pos) {
    		const { data, compare } = this;
    		const item = data[pos];

    		while (pos > 0) {
    			const parent = (pos - 1) >> 1;
    			const current = data[parent];
    			if (compare(item, current) >= 0) break;
    			data[pos] = current;
    			pos = parent;
    		}

    		data[pos] = item;
    	}

    	_down(pos) {
    		const { data, compare } = this;
    		const halfLength = this.length >> 1;
    		const item = data[pos];

    		while (pos < halfLength) {
    			let left = (pos << 1) + 1;
    			let best = data[left];
    			const right = left + 1;

    			if (right < this.length && compare(data[right], best) < 0) {
    				left = right;
    				best = data[right];
    			}
    			if (compare(best, item) >= 0) break;

    			data[pos] = best;
    			pos = left;
    		}

    		data[pos] = item;
    	}
    }

    function defaultCompare(a, b) {
    	return a < b ? -1 : a > b ? 1 : 0;
    }

    class Arrugator {
    	constructor(projector, verts, uv, trigs) {
    		// The projector function. Must be able to take
    		// an array of two numbers [x,y] and return an array of
    		// two numbers.
    		// The typical use case is a proj4(from,to).forward function.
    		this._projector = projector;

    		// A two-dimensional array of vertex coordinates. Each vertex is a
    		// two-element [x,y] array.
    		this._verts = verts;

    		// A two-dimensional array of UV-map coordinates. These are intended to
    		// represent the [0,0]-[1-1] coordinate space of WebGL textures. Each
    		// n-th element is the UV coordinates of the n-th vertex. These shall
    		// be linearly interpolated when splitting segments.
    		this._uv = uv;

    		// A two-dimensional array of vertex coordinates, projected. Each
    		// vertex is a two-element [x,y] array.
    		this._projVerts = verts.map(projector);

    		// A two-dimensional array of triangle vertex IDs. Each triangle is a
    		// three-element [v1,v2,v3] array.
    		// The mesh is **expected** to be compact, planar, non-overlapping.
    		this._trigs = trigs;

    		// A map of segments to vertices. Key is the segment index (generated inside
    		// arrugator), value is an array of two vertex indices.
    		this._segs = [];

    		this._segCount = 0;

    		// A map of segments to triangles. Key is the segment index (generated inside
    		// arrugator), value is an array of triangle indices (all segments should
    		// have either 1 or 2 triangles associated)
    		this._segTrigs = [];

    		// A priority queue of segments, ordered by their epsilons, in descending order.
    		this._queue = new TinyQueue([], function (a, b) {
    			return b.epsilon - a.epsilon;
    		});

    		// A map of vertex indices to segment indices.
    		this._vertToSeg = new Array(verts.length);
    		for (let i in this._verts) {
    			this._vertToSeg[i] = [];
    		}
    		/// NOTE: Not using .fill([]), because that would use a reference to the *same*
    		/// empty array for every element.

    		for (let t in this._trigs) {
    			let trig = this._trigs[t];
    			let v0 = trig[0];
    			let v1 = trig[1];
    			let v2 = trig[2];
    			this._segment(v0, v1, t);
    			this._segment(v1, v2, t);
    			this._segment(v2, v0, t);
    		}
    	}

    	// Returns the segment index linking the two given vertex indices;
    	// Must be passed a triangle index to use as context.
    	// Might create a new segment index (as well as segment data structure and
    	// entry in the priority queue).
    	_segment(v1, v2, t, maxEpsilon = Infinity) {
    		if (this._vertToSeg[v1] && this._vertToSeg[v1][v2] !== undefined) {
    			const found = this._vertToSeg[v1][v2];

    			if (!this._segTrigs[found].includes(t)) {
    				this._segTrigs[found].push(t);
    			}

    			return found;
    		}

    		const segIdx = this._segCount++;

    		this._segs[segIdx] = [v1, v2];
    		this._vertToSeg[v1][v2] = segIdx;
    		this._vertToSeg[v2][v1] = segIdx;
    		this._segTrigs[segIdx] = [t];

    		// Calculate segment epsilon

    		// The "epsilon" of a segment is the square of the midpoint projection distance:
    		// i.e. the square of the distance between:
    		//  - the projected midpoint of the two vertices, and
    		//  - the midpoint of the two projected vertices,
    		// the distance function being euclidean distance in the "destination"
    		// projection, squared.

    		const midpoint = [
    			(this._verts[v1][0] + this._verts[v2][0]) / 2,
    			(this._verts[v1][1] + this._verts[v2][1]) / 2,
    		];
    		const projectedMid = this._projector(midpoint);
    		const midProjected = [
    			(this._projVerts[v1][0] + this._projVerts[v2][0]) / 2,
    			(this._projVerts[v1][1] + this._projVerts[v2][1]) / 2,
    		];

    		const epsilon =
    			(projectedMid[0] - midProjected[0]) ** 2 +
    			(projectedMid[1] - midProjected[1]) ** 2;

    		if (Number.isFinite(epsilon) && epsilon < maxEpsilon) {
    			this._queue.push({
    				v1: v1,
    				v2: v2,
    				epsilon: epsilon,
    				midpoint: midpoint,
    				projectedMid: projectedMid,
    			});
    		}

    		return segIdx;
    	}

    	// Outputs shallow copies of some data structures at the current step.
    	output() {
    		// Most data structs are 2-dimensional arrays, and doing a shallow copy
    		// of the first level *should* just work.
    		return {
    			unprojected: Array.from(this._verts),
    			projected: Array.from(this._projVerts),
    			uv: Array.from(this._uv),
    			trigs: Array.from(this._trigs),
    		};
    	}

    	// Subdivides the mesh until the maximum segment epsilon is below the
    	// given threshold.
    	// The `targetEpsilon` parameter must be in the same units as the
    	// internal epsilons: units of the projected CRS, **squared**.
    	lowerEpsilon(targetEpsilon) {
    		while (this._queue.peek().epsilon > targetEpsilon) {
    			this.step();
    		}
    	}

    	get epsilon() {
    		return this._queue.peek().epsilon;
    	}

    	set epsilon(ep) {
    		return this.lowerEpsilon(ep);
    	}

    	// Triggers subdivision of the segment with the largest epsilon.
    	// This deletes the segment, spawns a new vertex at the midpoint, and
    	// for each triangle the segment was originally a part of (either 1 or 2),
    	// the triangle is divided into two.
    	step() {
    		const top = this._queue.pop();

    		// Which are the two vertices affected by the popped segment?
    		const v1 = top.v1;
    		const v2 = top.v2;
    		const s = this._vertToSeg[v1] && this._vertToSeg[v1][v2];

    		// Which triangle(s) are affected by the popped segment?
    		const trigs = this._segTrigs[s];

    		// Sanity check
    		if (trigs.length >= 3) {
    			throw new Error("Somehow a segment is shared by three triangles");
    		}

    		// Clean up refs
    		delete this._segTrigs[s];
    		delete this._segs[s];
    		delete this._vertToSeg[v1][v2];
    		delete this._vertToSeg[v2][v1];

    		// What is the vertex ID of the new midpoint vertex?
    		const vm = this._verts.length;

    		this._projVerts[vm] = top.projectedMid;
    		this._verts[vm] = top.midpoint;
    		this._vertToSeg[vm] = [];
    		this._uv[vm] = [
    			(this._uv[v1][0] + this._uv[v2][0]) / 2,
    			(this._uv[v1][1] + this._uv[v2][1]) / 2,
    		];

    		for (let t of trigs) {
    			this._splitTriangle(v1, v2, vm, t, top.epsilon);
    		}
    	}

    	// Split a triangle in two.
    	// Must be given vertex indices of the segment being splitted, the index of the new
    	// midpoint vertex, and the triangle index.
    	// Shall silently drop any new segments with an epsilon larger than the
    	// given one. This means that the segment shall be in the triangle mesh,
    	// but will not be queued and therefore not subdivided ever.
    	_splitTriangle(v1, v2, vm, t, epsilon = Infinity) {
    		const tvs = this._trigs[t];

    		let v3;
    		let winding = false;
    		// Fetch the ID of the 3rd vertex in the original triangle, and the winding order
    		if (tvs[0] === v1 && tvs[1] === v2) {
    			v3 = tvs[2];
    			winding = true; // A-B-C
    		} else if (tvs[1] === v1 && tvs[2] === v2) {
    			v3 = tvs[0];
    			winding = true; // C-A-B
    		} else if (tvs[2] === v1 && tvs[0] === v2) {
    			v3 = tvs[1];
    			winding = true; // B-C-A
    		} else if (tvs[1] === v1 && tvs[0] === v2) {
    			v3 = tvs[2];
    			winding = false; // B-A-C
    		} else if (tvs[2] === v1 && tvs[1] === v2) {
    			v3 = tvs[0];
    			winding = false; // C-B-A
    		} else if (tvs[0] === v1 && tvs[2] === v2) {
    			v3 = tvs[1];
    			winding = false; // A-C-B
    		} else {
    			throw new Error(
    				"Data structure mishap: could not fetch 3rd vertex used in triangle"
    			);
    		}

    		// Index of the first "half" triangle will be the reused index of the original triangle
    		// Index of the second "half" triangle must be allocated at the end of the triangles structure
    		const t2 = this._trigs.length;

    		if (winding) {
    			this._trigs[t] = [v1, vm, v3];
    			this._trigs[t2] = [vm, v2, v3];
    		} else {
    			this._trigs[t] = [vm, v1, v3];
    			this._trigs[t2] = [v2, vm, v3];
    		}

    		// Clean up references from old segments
    		const s1 = this._vertToSeg[v1] && this._vertToSeg[v1][v2];
    		const s2 = this._vertToSeg[v2] && this._vertToSeg[v2][v3];
    		const s3 = this._vertToSeg[v3] && this._vertToSeg[v3][v1];

    		function filterTrig(i) {
    			return i !== t;
    		}

    		if (s1 !== undefined) {
    			this._segTrigs[s1] = this._segTrigs[s1].filter(filterTrig);
    		}
    		if (s2 !== undefined) {
    			this._segTrigs[s2] = this._segTrigs[s2].filter(filterTrig);
    		}
    		if (s3 !== undefined) {
    			this._segTrigs[s3] = this._segTrigs[s3].filter(filterTrig);
    		}

    		this._segment(v1, vm, t, epsilon);
    		this._segment(vm, v3, t, epsilon);
    		this._segment(v3, v1, t, epsilon);

    		this._segment(v2, vm, t2, epsilon);
    		this._segment(vm, v3, t2, epsilon);
    		this._segment(v3, v2, t2, epsilon);
    	}
    }

    //获取栅格投影区域划分的tile
    async function getRasterProjectionExtentTileSplit(opts) {
        const { col, row, srcCrs, dstCrs } = opts;
        const srcExtent = new Extent(opts.srcExtent);
        const tileScheme = TileInfo.fromJSON(opts.dstTileScheme);
        const tileHalfSizeFactor = [2 / tileScheme.size[0], 2 / tileScheme.size[1]]; //tile的半宽高
        const isSameCrs = new SpatialReference(srcCrs).equals(dstCrs);
        if (!isSameCrs)
            await projection__namespace.load();
        const project = isSameCrs
            ? (pointSrc) => pointSrc
            : (pointSrc) => {
                const point = projection__namespace.project({
                    type: "point",
                    x: pointSrc[0],
                    y: pointSrc[1],
                    spatialReference: srcCrs,
                }, dstCrs);
                return [point.x, point.y];
            };
        const projectInvert = (pointDst) => {
            const point = projection__namespace.project({
                type: "point",
                x: pointDst[0],
                y: pointDst[1],
                spatialReference: dstCrs,
            }, srcCrs);
            return [point.x, point.y];
        };
        let triangleSplit, //三角划分
        dstFullExtent, //栅格投影后的范围
        dstCoverTiles, //dst范围包含的tiles
        useDstTileSplit = isSameCrs; //是否使用tile划分而不是三角划分
        if (!isSameCrs) {
            triangleSplit = extentProjectionTriangulation({
                srcExtent: srcExtent,
                srcResolution: (srcExtent.xmax - srcExtent.xmin) / col,
                project,
                splitMaxError: opts.resolutionDst,
            });
            dstFullExtent = triangleSplit.extentDst;
            const dstProjectLod = tile.findLodAtGivenResolution(triangleSplit.tessellateResolution, tileScheme);
            dstCoverTiles = tile.findCoverVTilesAtGivenLevel(dstFullExtent, tileScheme, dstProjectLod.level);
            //2个坐标系投影误差较小, 仅输出2个三角形, 说明瓦片无需拆分即满足精度要求
            //直接使用目标瓦片作为划分依据, 跳过检索和求交的步骤
            useDstTileSplit = triangleSplit.mesh.trigs.length <= 2;
        }
        else {
            dstFullExtent = srcExtent; //无需投影
        }
        const cellSize = (srcExtent.xmax - srcExtent.xmin) / col;
        if (useDstTileSplit) {
            //使用瓦片划分
            return {
                tileSplit: dstCoverTiles
                    .map((dstTile) => {
                    const r = dstTile.resolution, padding = r * opts.padding;
                    const { cx, cy } = dstTile;
                    //dst待检索的范围,扩宽padding像素
                    const dstRetrieveExtent = {
                        xmin: dstTile.xmin - padding,
                        ymin: dstTile.ymin - padding,
                        xmax: dstTile.xmax + padding,
                        ymax: dstTile.ymax + padding,
                    };
                    //检索范围投影到原参考系,并取交集(搜索区域逆投影后可能会超出原范围,搜索区域扩大了padding个像素)
                    const srcRetrieveExtent = polygon.extentIntersection(polygon.calcCoordsExtent([
                        projectInvert([dstRetrieveExtent.xmin, dstRetrieveExtent.ymin]),
                        projectInvert([dstRetrieveExtent.xmin, dstRetrieveExtent.ymax]),
                        projectInvert([dstRetrieveExtent.xmax, dstRetrieveExtent.ymin]),
                        projectInvert([dstRetrieveExtent.xmax, dstRetrieveExtent.ymax]),
                    ]), srcExtent);
                    if (!srcRetrieveExtent)
                        return null;
                    const srcPoints = {
                        topLeft: [srcRetrieveExtent.xmin, srcRetrieveExtent.ymax],
                        bottomLeft: [srcRetrieveExtent.xmin, srcRetrieveExtent.ymin],
                        topRight: [srcRetrieveExtent.xmax, srcRetrieveExtent.ymax],
                        bottomRight: [srcRetrieveExtent.xmax, srcRetrieveExtent.ymin],
                    };
                    //取交集的四个点重新投影到dst坐标系
                    const dstPoint = {
                        topLeft: project(srcPoints.topLeft),
                        bottomLeft: project(srcPoints.bottomLeft),
                        topRight: project(srcPoints.topRight),
                        bottomRight: project(srcPoints.bottomRight),
                    };
                    const raw = [
                        [dstPoint.bottomLeft, dstPoint.bottomRight, dstPoint.topRight],
                        [dstPoint.bottomLeft, dstPoint.topRight, dstPoint.topLeft],
                    ];
                    const sx = tile.clamp(Math.floor((srcRetrieveExtent.xmin - srcExtent.xmin) / cellSize), 0, col - 1);
                    const sy = tile.clamp(Math.floor((srcExtent.ymax - srcRetrieveExtent.ymax) / cellSize), 0, row - 1);
                    return {
                        tileInfo: dstTile,
                        positionRTC: raw.flat().map((point) => {
                            return [
                                Math.round((point[0] - cx) / r) * tileHalfSizeFactor[0],
                                Math.round((point[1] - cy) / r) * tileHalfSizeFactor[1],
                            ];
                        }),
                        uv: [
                            [0, 0],
                            [1, 0],
                            [1, 1],
                            [0, 0],
                            [1, 1],
                            [0, 1],
                        ],
                        imageExtent: {
                            sx,
                            sy,
                            width: tile.clamp(Math.ceil((srcRetrieveExtent.xmax - srcRetrieveExtent.xmin) / cellSize), 0, col - 1 - sx),
                            height: tile.clamp(Math.ceil((srcRetrieveExtent.ymax - srcRetrieveExtent.ymin) / cellSize), 0, row - 1 - sy),
                        },
                        debugData: { raw: raw, optimize: raw },
                    };
                })
                    .filter(Boolean),
                fullExtent: dstFullExtent,
                projectData: triangleSplit?.mesh,
            };
        }
        else {
            //使用三角网划分
            const { trigs, unprojected, projected } = triangleSplit.mesh;
            const dstQuadtree = new tile.Quadtree({
                xmin: dstFullExtent.xmin,
                ymin: dstFullExtent.ymin,
                width: dstFullExtent.xmax - dstFullExtent.xmin,
                height: dstFullExtent.ymax - dstFullExtent.ymin,
            });
            for (let i = 0, l = trigs.length; i < l; i++) {
                const [a, b, c] = trigs[i];
                const rect = polygon.calcTriangleExtent(projected[a], projected[b], projected[c]);
                rect.width = rect.xmax - rect.xmin;
                rect.height = rect.ymax - rect.ymin;
                rect.srcTri = [unprojected[a], unprojected[b], unprojected[c]];
                rect.dstTri = [projected[a], projected[b], projected[c]];
                dstQuadtree.insert(rect);
            }
            return {
                tileSplit: dstCoverTiles
                    .map((dstTile) => {
                    const r = dstTile.resolution, padding = r * opts.padding;
                    const { cx, cy } = dstTile;
                    const retrieveExtent = new Extent({
                        xmin: dstTile.xmin - padding,
                        ymin: dstTile.ymin - padding,
                        xmax: dstTile.xmax + padding,
                        ymax: dstTile.ymax + padding,
                        spatialReference: dstCrs,
                    });
                    //检索相交的三角形(检索是用extent检索)
                    const rawTriMeshes = dstQuadtree.retrieve(retrieveExtent);
                    if (!rawTriMeshes.length)
                        return null;
                    //求交, 最小化范围, 检索是用extent检索, 实际可能并不相交
                    const optimizeTriMeshes = rawTriMeshes
                        .map(({ dstTri }) => {
                        const [A, B, C] = dstTri;
                        const output = geometryEngine_js.intersect(new Polygon({
                            rings: [[A, B, C, A]],
                            spatialReference: dstCrs,
                        }), retrieveExtent);
                        return [].concat(output).filter(Boolean).map((polygon$1) => {
                            return polygon.invokeEarcut(polygon$1.rings.map((r) => r.flat()));
                        });
                    })
                        .flat()
                        .map(({ vertices, indices }) => {
                        const res = [];
                        for (let i = 0; i < indices.length; i += 3) {
                            let c = indices[i], c2 = c * 2;
                            const A = [vertices[c2], vertices[c2 + 1]];
                            (c = indices[i + 1]), (c2 = c * 2);
                            const B = [vertices[c2], vertices[c2 + 1]];
                            (c = indices[i + 2]), (c2 = c * 2);
                            const C = [vertices[c2], vertices[c2 + 1]];
                            const meshItem = polygon.calcCoordsExtent([A, B, C]);
                            meshItem.dstTri = [A, B, C];
                            meshItem.srcTri = [A, B, C].map((p) => {
                                return projectInvert(p);
                            });
                            res.push(meshItem);
                        }
                        return res;
                    })
                        .flat();
                    if (!optimizeTriMeshes.length)
                        return null;
                    const position = optimizeTriMeshes
                        .map((item) => item.dstTri)
                        .flat()
                        .map((point) => {
                        return [
                            Math.round((point[0] - cx) / r) * tileHalfSizeFactor[0],
                            Math.round((point[1] - cy) / r) * tileHalfSizeFactor[1],
                        ];
                    });
                    //找出这些三角形在srcCrs内的范围。
                    const srcImageExtent = polygon.calcCoordsExtent(optimizeTriMeshes.map((i) => i.srcTri).flat());
                    //提取该子部分范围作为纹理
                    const imageWidth = srcImageExtent.xmax - srcImageExtent.xmin, imageHeight = srcImageExtent.ymax - srcImageExtent.ymin;
                    //计算uv坐标
                    const uv = optimizeTriMeshes
                        .map((item) => item.srcTri)
                        .flat()
                        .map((srcPoint) => {
                        return [
                            (srcPoint[0] - srcImageExtent.xmin) / imageWidth,
                            (srcPoint[1] - srcImageExtent.ymin) / imageHeight,
                        ];
                    });
                    const sx = tile.clamp(Math.floor((srcImageExtent.xmin - srcExtent.xmin) / cellSize), 0, col - 1);
                    const sy = tile.clamp(Math.floor((srcExtent.ymax - srcImageExtent.ymax) / cellSize), 0, row - 1);
                    return {
                        tileInfo: dstTile,
                        positionRTC: position,
                        uv,
                        imageExtent: {
                            //子纹理的范围
                            sx,
                            sy,
                            width: tile.clamp(Math.ceil(imageWidth / cellSize), 0, col - 1 - sx),
                            height: tile.clamp(Math.ceil(imageHeight / cellSize), 0, row - 1 - sy),
                        },
                        debugData: {
                            raw: rawTriMeshes.map((i) => i.dstTri),
                            optimize: optimizeTriMeshes.map((i) => i.dstTri),
                        },
                    };
                })
                    .filter(Boolean),
                fullExtent: dstFullExtent,
                projectData: triangleSplit?.mesh,
            };
        }
    }
    //重投影区域三角划分
    //reference: https://ivan.sanchezortega.es/development/2021/03/08/introducing-arrugator.html
    function extentProjectionTriangulation(opts) {
        const { srcExtent, srcResolution, project } = opts;
        const splitMaxError = opts.splitMaxError ?? rasterProjectErrorSampling(srcExtent, srcResolution, project);
        const arrugator = new Arrugator(project, [
            [srcExtent.xmin, srcExtent.ymax],
            [srcExtent.xmin, srcExtent.ymin],
            [srcExtent.xmax, srcExtent.ymax],
            [srcExtent.xmax, srcExtent.ymin],
        ], [
            [0, 1],
            [0, 0],
            [1, 1],
            [1, 0], // bottom-right
        ], [
            [0, 1, 3],
            [0, 3, 2],
        ]);
        //进行细分直到误差低于resolutionDst
        arrugator.lowerEpsilon(splitMaxError ** 2);
        const result = arrugator.output();
        return {
            mesh: result,
            extentDst: polygon.calcCoordsExtent(result.projected),
            tessellateResolution: splitMaxError, //细分的分辨率
        };
    }
    //栅格投影误差采样, 获取目标投影下的最大误差
    function rasterProjectErrorSampling(rasterExtent, //栅格
    rasterResolution, //栅格分辨率
    project) {
        const cx = (rasterExtent.xmin + rasterExtent.xmax) / 2, cy = (rasterExtent.ymin + rasterExtent.ymax) / 2;
        const errors = [
            [cx, cy, 1, 1],
            [rasterExtent.xmin, rasterExtent.ymax, 1, -1],
            [rasterExtent.xmax, rasterExtent.ymax, -1, -1],
            [rasterExtent.xmin, rasterExtent.ymin, 1, 1],
            [rasterExtent.xmax, rasterExtent.ymin, -1, 1],
        ].map(([x, y, offsetx, offsety]) => {
            const pointDst = project([x, y]);
            const pointOffsetDst = project([x + offsetx * rasterResolution, y + offsety * rasterResolution]);
            const curError = Math.hypot(pointDst[0] - pointOffsetDst[0], pointDst[1] - pointOffsetDst[1]);
            return curError;
        });
        return Math.min.apply(null, errors);
    }

    const newReprojectCtxId = (() => {
        let id = 0;
        return () => ++id;
    })();
    const __STORE__ = new Map();
    const ResponseTypePrefix = "return:";
    exports.RequestRasterWorkerType = void 0;
    (function (RequestRasterWorkerType) {
        RequestRasterWorkerType["takeSnapshot"] = "takeSnapshot";
        RequestRasterWorkerType["init"] = "init";
        RequestRasterWorkerType["getTileDataAtTime"] = "getTileDataAtTime";
        RequestRasterWorkerType["getTileDataAtTimeBatch"] = "getTileDataAtTimeBatch";
        RequestRasterWorkerType["cancelGetTileDataAtTimeBatch"] = "cancelGetTileDataAtTimeBatch";
        RequestRasterWorkerType["cancelFrameAndTaskAtTimes"] = "cancelFrameAndTaskAtTimes";
        RequestRasterWorkerType["getFrameDataAtTime"] = "getFrameDataAtTime";
        RequestRasterWorkerType["close"] = "close";
        RequestRasterWorkerType["toggleUniqueCodeMapping"] = "toggleUniqueCodeMapping";
    })(exports.RequestRasterWorkerType || (exports.RequestRasterWorkerType = {}));
    exports.ResponseRasterWorkerType = void 0;
    (function (ResponseRasterWorkerType) {
        ResponseRasterWorkerType["takeSnapshot"] = "return:takeSnapshot";
        ResponseRasterWorkerType["init"] = "return:init";
        ResponseRasterWorkerType["getTileDataAtTime"] = "return:getTileDataAtTime";
        ResponseRasterWorkerType["getFrameDataAtTime"] = "return:getFrameDataAtTime";
        ResponseRasterWorkerType["toggleUniqueCodeMapping"] = "return:toggleUniqueCodeMapping";
    })(exports.ResponseRasterWorkerType || (exports.ResponseRasterWorkerType = {}));
    async function _create(storeId) {
        const newRequestTaskId = (() => {
            let id = 0;
            return () => ++id;
        })();
        let $enableUniqueMapping = false;
        let $uniqueCodeMap;
        let $meta;
        const { markEmpty, isEmpty } = (() => {
            const set = new Set(); //为空的切片集合(值全为noDataValue)
            return {
                markEmpty(tileId, time) {
                    set.add([tileId, time].join(":"));
                },
                isEmpty(tileId, time) {
                    return set.has([tileId, time].join(":"));
                },
            };
        })();
        const $splitTileMap = new Map();
        const $frameManager = (() => {
            const taskMap = new Map();
            const getTaskAtTime = (time) => {
                return Array.from(taskMap.entries()).find((i) => i[1].time === time)?.[1];
            };
            const cache = new LRUCache(5, {
                onRemove(obj, time) {
                    const record = getTaskAtTime(time);
                    record && taskMap.delete(record.taskId);
                },
            });
            const runningTaskIds = new Set();
            return {
                getTaskAtTime,
                taskMap,
                runningTaskIds,
                cache,
                cancelFrameAtTimes: (times) => {
                    const deletes = [];
                    Array.from(taskMap.entries()).forEach(([taskId, record]) => {
                        if (record.status === "pending" && times.has(record.time)) {
                            taskMap.delete(taskId);
                            runningTaskIds.delete(taskId);
                            cache.remove(record.time);
                            deletes.push(record.time);
                        }
                    });
                    setTimeout(walkTaskQueue);
                },
                fetchFrame: (time) => {
                    if (runningTaskIds.size >= 2)
                        return; //最多同时2个任务
                    let taskRecord = getTaskAtTime(time);
                    if (!taskRecord) {
                        const taskId = [time, newRequestTaskId()].join("/");
                        taskRecord = {
                            taskId,
                            time,
                            status: "pending",
                            error: null,
                        };
                        taskMap.set(taskId, taskRecord);
                        runningTaskIds.add(taskId);
                        sendMessage({
                            type: exports.RequestRasterWorkerType.getFrameDataAtTime,
                            data: time,
                            taskId,
                        });
                    }
                },
                resolveFetch: (data) => {
                    const { taskId, status, data: frameResult, errMsg } = data;
                    const item = taskMap.get(taskId);
                    if (!item)
                        return;
                    if (status === "success") {
                        const { noDataValue } = $meta;
                        //对vectorField做转换
                        if ($meta.type === "vector-field" && !tile.isNil(noDataValue)) {
                            const arr = frameResult.data;
                            for (let i = arr.length; i--;) {
                                if (arr[i] === noDataValue)
                                    arr[i] = 0;
                            }
                        }
                        cache.add(item.time, frameResult.data);
                        item.status = "success";
                    }
                    else {
                        if (tile.isAbortError(errMsg)) {
                            taskMap.delete(taskId);
                        }
                        else {
                            item.status = "error";
                            item.error = errMsg;
                        }
                    }
                    runningTaskIds.delete(taskId);
                    setTimeout(walkTaskQueue);
                },
                isFetchError: (time) => {
                    return getTaskAtTime(time)?.error;
                },
                getFrameData: (time) => cache.get(time),
                destroy: () => {
                    cache.clear();
                    taskMap.clear();
                },
            };
        })();
        //任务队列
        const $tileTimeDataTaskQueue = new Map();
        const channel = new MessageChannel();
        const myPort = channel.port1;
        const sendMessage = (msg, transfer) => {
            myPort.postMessage(msg, transfer);
        };
        myPort.onmessage = async (e) => {
            const msgData = e.data;
            const type = msgData.type;
            if (type === exports.RequestRasterWorkerType.init) {
                init(msgData.data);
                sendMessage({
                    type: exports.ResponseRasterWorkerType.init,
                    data: null,
                    status: "success",
                    taskId: msgData.taskId,
                });
            }
            else if (type === exports.RequestRasterWorkerType.cancelGetTileDataAtTimeBatch) {
                $tileTimeDataTaskQueue.size &&
                    msgData.data.forEach((taskId) => {
                        const item = $tileTimeDataTaskQueue.get(taskId);
                        if (!item)
                            return;
                        $tileTimeDataTaskQueue.delete(taskId);
                    });
            }
            else if (type === exports.RequestRasterWorkerType.cancelFrameAndTaskAtTimes) {
                const timeSet = new Set(msgData.data);
                $frameManager.cancelFrameAtTimes(timeSet);
                Array.from($tileTimeDataTaskQueue.keys()).forEach((taskId) => {
                    const item = $tileTimeDataTaskQueue.get(taskId);
                    if (timeSet.has(item.time)) {
                        $tileTimeDataTaskQueue.delete(taskId);
                    }
                });
            }
            else if (type === exports.RequestRasterWorkerType.takeSnapshot) {
                const result = {
                    frame: {
                        taskMap: Array.from($frameManager.taskMap.values()),
                        runningTaskIds: Array.from($frameManager.runningTaskIds),
                        //@ts-ignore
                        loaded: Array.from($frameManager.cache.cache.keys()),
                    },
                    tiles: Array.from($tileTimeDataTaskQueue.entries()).reduce((res, [taskId, data]) => {
                        res[taskId] = data;
                        return res;
                    }, {}),
                };
                sendMessage({
                    type: exports.ResponseRasterWorkerType.takeSnapshot,
                    data: result,
                    taskId: msgData.taskId,
                    status: "success",
                });
            }
            //获取某个时间某个tile
            else if (type === exports.RequestRasterWorkerType.getTileDataAtTimeBatch) {
                msgData.data.forEach(({ taskId, tileId, time }) => {
                    if (!$splitTileMap.has(tileId) || isEmpty(tileId, time)) {
                        sendMessage({
                            type: exports.ResponseRasterWorkerType.getTileDataAtTime,
                            data: {
                                type: $meta.type,
                                imagebitmap: null,
                                range: null,
                                costTime: null,
                                time,
                                tileId,
                            },
                            taskId,
                            status: "success",
                        });
                        return;
                    }
                    if ($tileTimeDataTaskQueue.has(taskId)) {
                        return;
                    }
                    $tileTimeDataTaskQueue.set(taskId, { tileId, time });
                    $frameManager.fetchFrame(time);
                });
                walkTaskQueue();
            }
            //销毁
            else if (type === exports.RequestRasterWorkerType.close) {
                $tileTimeDataTaskQueue.clear();
                const glObjects = Array.from($splitTileMap.values())
                    .map((i) => [i.glResource?.positionRTC, i.glResource?.uv])
                    .flat()
                    .filter(Boolean);
                if (glObjects.length) {
                    getRasterProjectContext().disposeItems(glObjects);
                }
                $splitTileMap.clear();
                $frameManager.destroy();
                myPort.close();
                __STORE__.delete(storeId);
            }
            //切换编码转换
            else if (type === exports.RequestRasterWorkerType.toggleUniqueCodeMapping) {
                const { enable, codeMap } = msgData.data;
                if ($enableUniqueMapping !== enable) {
                    $tileTimeDataTaskQueue.clear(); //清空待做任务
                    $enableUniqueMapping = enable;
                    $uniqueCodeMap = codeMap;
                    if (enable) {
                        codeMap.set($meta.noDataValue, $meta.noDataValue);
                    }
                }
                sendMessage({
                    type: exports.ResponseRasterWorkerType.toggleUniqueCodeMapping,
                    data: undefined,
                    taskId: msgData.taskId,
                    status: "success",
                });
            }
            //获取某个时间的帧数据
            else if (type === exports.ResponseRasterWorkerType.getFrameDataAtTime) {
                //获取帧数据的返回结果
                $frameManager.resolveFetch(msgData);
            }
        };
        function walkTaskQueue() {
            if (!$tileTimeDataTaskQueue.size)
                return;
            let hasFrameDataSettled = false;
            for (let taskId of $tileTimeDataTaskQueue.keys()) {
                const { tileId, time } = $tileTimeDataTaskQueue.get(taskId);
                const error = $frameManager.isFetchError(time);
                if (error) {
                    sendMessage({
                        type: exports.ResponseRasterWorkerType.getTileDataAtTime,
                        taskId,
                        status: "error",
                        data: undefined,
                        errMsg: error,
                    });
                    $tileTimeDataTaskQueue.delete(taskId);
                    hasFrameDataSettled = true;
                    continue;
                }
                const frameData = $frameManager.getFrameData(time);
                if (!frameData) {
                    $frameManager.fetchFrame(time);
                    continue;
                }
                hasFrameDataSettled = true;
                try {
                    const result = run(frameData, tileId, time);
                    if (!result)
                        markEmpty(tileId, time);
                    sendMessage({
                        type: exports.ResponseRasterWorkerType.getTileDataAtTime,
                        data: {
                            ...result,
                            tileId,
                            time,
                        },
                        taskId,
                        status: "success",
                    }, result ? [result.imagebitmap] : undefined);
                    break;
                }
                catch (e) {
                    sendMessage({
                        type: exports.ResponseRasterWorkerType.getTileDataAtTime,
                        taskId,
                        status: "error",
                        data: undefined,
                        errMsg: e,
                    });
                }
                finally {
                    $tileTimeDataTaskQueue.delete(taskId);
                }
            }
            hasFrameDataSettled && setTimeout(walkTaskQueue);
            function run(frameData, tileId, time) {
                const now = performance.now();
                const { projectSingleChannel, disposeItems, createBuffer, projectVectorField } = getRasterProjectContext();
                const tileCtx = $splitTileMap.get(tileId);
                if (!tileCtx.glResource) {
                    tileCtx.glResource = {
                        positionRTC: createBuffer(new Float32Array(tileCtx.resource.positionRTC.flat())),
                        uv: createBuffer(new Float32Array(tileCtx.resource.uv.flat())),
                    };
                    tileCtx.resource = null; //上传gpu后释放内存
                }
                if ($meta.type === "vector-field") {
                    const subImage = extractVectorFieldSubRegion(frameData, [$meta.col, $meta.row], tileCtx.subImageRange, Float32Array);
                    if (!subImage) {
                        markEmpty(tileId, time);
                        return null;
                    }
                    const range = [subImage.umin, subImage.umax, subImage.vmin, subImage.vmax];
                    const result = projectVectorField({
                        outputTexSize: $meta.outputSize,
                        inputDataTex: subImage.pixel,
                        inputDataTexSize: [tileCtx.subImageRange.width, tileCtx.subImageRange.height],
                        positionRTC: tileCtx.glResource.positionRTC,
                        uv: tileCtx.glResource.uv,
                        valueRange: range,
                        triangles: tileCtx.triangleCount,
                        sampling: "nearest",
                    });
                    disposeItems([result.tex]);
                    return {
                        type: $meta.type,
                        imagebitmap: result.imagebitmap,
                        range,
                        costTime: performance.now() - now,
                    };
                }
                else {
                    const subImage = extractSubRegion(frameData, [$meta.col, $meta.row], tileCtx.subImageRange, $meta.noDataValue, Float32Array);
                    if (!subImage) {
                        markEmpty(tileId, time);
                        return null;
                    }
                    if ($enableUniqueMapping) {
                        for (let arr = subImage.pixel, i = arr.length; i--;) {
                            arr[i] = $uniqueCodeMap.get(arr[i]);
                        }
                        subImage.min = 1;
                        subImage.max = $uniqueCodeMap.size - 1;
                    }
                    const result = projectSingleChannel({
                        outputTexSize: $meta.outputSize,
                        noDataValue: $meta.noDataValue,
                        inputDataTex: subImage.pixel,
                        inputDataTexSize: [tileCtx.subImageRange.width, tileCtx.subImageRange.height],
                        positionRTC: tileCtx.glResource.positionRTC,
                        uv: tileCtx.glResource.uv,
                        valueRange: [subImage.min, subImage.max],
                        triangles: tileCtx.triangleCount,
                        sampling: $enableUniqueMapping ? "nearest" : "linear",
                    });
                    disposeItems([result.tex]);
                    return {
                        type: $meta.type,
                        imagebitmap: result.imagebitmap,
                        range: [subImage.min, subImage.max],
                        costTime: performance.now() - now,
                    };
                }
            }
        }
        __STORE__.set(storeId, myPort);
        return {
            port: channel.port2,
        };
        function init(opts) {
            $meta = {
                noDataValue: opts.noDataValue,
                col: opts.col,
                row: opts.row,
                outputSize: [opts.outputSize, opts.outputSize],
                type: opts.type,
            };
            opts.tiles.forEach((item) => {
                const { id, positionRTC, uv, imageExtent } = item;
                $splitTileMap.set(id, {
                    subImageRange: imageExtent,
                    triangleCount: positionRTC.length / 3,
                    glResource: null,
                    resource: { positionRTC, uv },
                });
            });
        }
    }
    //创建一个store, 返回其id;
    async function createRasterReprojectContext() {
        const storeId = newReprojectCtxId();
        const result = await _create(storeId);
        return {
            result,
            transferList: [result.port],
        };
    }
    async function rasterReprojectExtentSplit(opts) {
        const { tileSplit, fullExtent, projectData } = await getRasterProjectionExtentTileSplit(opts);
        const level = tileSplit[0].tileInfo.z;
        const bounds = tile.findCoverTileBoundsAtGivenLevel(fullExtent, opts.dstTileScheme, level);
        return {
            fullExtent,
            tileSplit: tileSplit.map((i) => {
                return {
                    id: i.tileInfo.id,
                    debugData: i.debugData,
                    imageExtent: i.imageExtent,
                    positionRTC: i.positionRTC,
                    uv: i.uv,
                };
            }),
            projectData,
            level,
            bounds,
        };
    }

    exports.ResponseTypePrefix = ResponseTypePrefix;
    exports.createRasterReprojectContext = createRasterReprojectContext;
    exports.rasterReprojectExtentSplit = rasterReprojectExtentSplit;

}));
//# sourceMappingURL=Raster.js.map
