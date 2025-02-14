define(['exports', '/arcgis-js-api/geometry/Polygon.js', '/arcgis-js-api/geometry/SpatialReference.js', '/arcgis-js-api/geometry/projection.js', './chunks/pack', './chunks/polygon', '/arcgis-js-api/geometry/geometryEngine.js'], (function (exports, Polygon, SpatialReference, projection, pack, polygon, geometryEngine_js) { 'use strict';

    function pip(arr, x, y) {
        let result = false;
        for (let i = 0, j = arr.length - 1; i < arr.length; j = i++) {
            if (arr[i][1] > y != arr[j][1] > y &&
                x < ((arr[j][0] - arr[i][0]) * (y - arr[i][1])) / (arr[j][1] - arr[i][1]) + arr[i][0]) {
                result = !result;
            }
        }
        return result;
    }
    function createArrayWithValues(value, length) {
        return new Array(length).fill(value);
    }
    // Matrix algebra
    function kriging_matrix_diag(value, n) {
        const matrix = createArrayWithValues(0, n * n);
        for (let i = 0; i < n; i++)
            matrix[i * n + i] = value;
        return matrix;
    }
    function kriging_matrix_transpose(matrix, n, m) {
        const M = Array(m * n);
        for (let i = 0; i < n; i++)
            for (let j = 0; j < m; j++) {
                M[j * n + i] = matrix[i * m + j];
            }
        return M;
    }
    function kriging_matrix_scale(M, scale, n, m) {
        for (let i = 0; i < n; i++)
            for (let j = 0; j < m; j++)
                M[i * m + j] *= scale;
    }
    function kriging_matrix_add(Ma, Mb, n, m) {
        const M = Array(n * m);
        for (let i = 0; i < n; i++)
            for (let j = 0; j < m; j++) {
                const index = i * m + j;
                M[index] = Ma[index] + Mb[index];
            }
        return M;
    }
    // Naive matrix multiplication
    function kriging_matrix_multiply(Ma, Mb, n /*前一个的rows*/, m, p /*后一个的cols*/) {
        const Z = Array(n * p).fill(0);
        for (let i = 0; i < n; i++) {
            for (let j = 0; j < p; j++) {
                for (let k = 0, index = i * p + j; k < m; k++) {
                    Z[index] += Ma[i * m + k] * Mb[k * p + j];
                }
            }
        }
        return Z;
    }
    // Cholesky decomposition
    function kriging_matrix_chol(M, n) {
        const p = Array(n);
        for (let i = 0; i < n; i++) {
            p[i] = M[i * n + i];
        }
        for (let i = 0; i < n; i++) {
            for (let j = 0; j < i; j++) {
                p[i] -= M[i * n + j] ** 2;
            }
            if (p[i] <= 0)
                return false;
            p[i] = Math.sqrt(p[i]);
            for (let j = i + 1; j < n; j++) {
                for (let k = 0; k < i; k++) {
                    M[j * n + i] -= M[j * n + k] * M[i * n + k];
                }
                M[j * n + i] /= p[i];
            }
        }
        for (let i = 0; i < n; i++)
            M[i * n + i] = p[i];
        return true;
    }
    // Inversion of cholesky decomposition
    function kriging_matrix_chol2inv(M, n) {
        let i, j, k, sum;
        for (i = 0; i < n; i++) {
            M[i * n + i] = 1 / M[i * n + i];
            for (j = i + 1; j < n; j++) {
                sum = 0;
                for (k = i; k < j; k++)
                    sum -= M[j * n + k] * M[k * n + i];
                M[j * n + i] = sum / M[j * n + j];
            }
        }
        for (i = 0; i < n; i++)
            for (j = i + 1; j < n; j++)
                M[i * n + j] = 0;
        for (i = 0; i < n; i++) {
            M[i * n + i] *= M[i * n + i];
            for (k = i + 1; k < n; k++)
                M[i * n + i] += M[k * n + i] * M[k * n + i];
            for (j = i + 1; j < n; j++)
                for (k = j; k < n; k++)
                    M[i * n + j] += M[k * n + i] * M[k * n + j];
        }
        for (i = 0; i < n; i++)
            for (j = 0; j < i; j++)
                M[i * n + j] = M[j * n + i];
    }
    // Inversion via gauss-jordan elimination
    function kriging_matrix_solve(M, n) {
        let m = n;
        let b = Array(n * n);
        let indxc = Array(n);
        let indxr = Array(n);
        let ipiv = Array(n);
        let i, icol, irow, j, k, l, ll;
        let big, dum, pivinv, temp;
        for (i = 0; i < n; i++)
            for (j = 0; j < n; j++) {
                if (i == j)
                    b[i * n + j] = 1;
                else
                    b[i * n + j] = 0;
            }
        for (j = 0; j < n; j++)
            ipiv[j] = 0;
        for (i = 0; i < n; i++) {
            big = 0;
            for (j = 0; j < n; j++) {
                if (ipiv[j] != 1) {
                    for (k = 0; k < n; k++) {
                        if (ipiv[k] == 0) {
                            if (Math.abs(M[j * n + k]) >= big) {
                                big = Math.abs(M[j * n + k]);
                                irow = j;
                                icol = k;
                            }
                        }
                    }
                }
            }
            ++ipiv[icol];
            if (irow != icol) {
                for (l = 0; l < n; l++) {
                    temp = M[irow * n + l];
                    M[irow * n + l] = M[icol * n + l];
                    M[icol * n + l] = temp;
                }
                for (l = 0; l < m; l++) {
                    temp = b[irow * n + l];
                    b[irow * n + l] = b[icol * n + l];
                    b[icol * n + l] = temp;
                }
            }
            indxr[i] = irow;
            indxc[i] = icol;
            if (M[icol * n + icol] == 0)
                return false; // Singular
            pivinv = 1 / M[icol * n + icol];
            M[icol * n + icol] = 1;
            for (l = 0; l < n; l++)
                M[icol * n + l] *= pivinv;
            for (l = 0; l < m; l++)
                b[icol * n + l] *= pivinv;
            for (ll = 0; ll < n; ll++) {
                if (ll != icol) {
                    dum = M[ll * n + icol];
                    M[ll * n + icol] = 0;
                    for (l = 0; l < n; l++)
                        M[ll * n + l] -= M[icol * n + l] * dum;
                    for (l = 0; l < m; l++)
                        b[ll * n + l] -= b[icol * n + l] * dum;
                }
            }
        }
        for (l = n - 1; l >= 0; l--)
            if (indxr[l] != indxc[l]) {
                for (k = 0; k < n; k++) {
                    temp = M[k * n + indxr[l]];
                    M[k * n + indxr[l]] = M[k * n + indxc[l]];
                    M[k * n + indxc[l]] = temp;
                }
            }
        return true;
    }
    // Variogram models
    function kriging_variogram_gaussian(h, nugget, range, sill, A) {
        return nugget + ((sill - nugget) / range) * (1.0 - Math.exp(-(1.0 / A) * Math.pow(h / range, 2)));
    }
    function kriging_variogram_exponential(h, nugget, range, sill, A) {
        return nugget + ((sill - nugget) / range) * (1.0 - Math.exp(-(1.0 / A) * (h / range)));
    }
    function kriging_variogram_spherical(h, nugget, range, sill, A) {
        if (h > range)
            return nugget + (sill - nugget) / range;
        return nugget + ((sill - nugget) / range) * (1.5 * (h / range) - 0.5 * Math.pow(h / range, 3));
    }
    function getModelFn(type) {
        switch (type) {
            case "gaussian":
                return kriging_variogram_gaussian;
            case "exponential":
                return kriging_variogram_exponential;
            case "spherical":
                return kriging_variogram_spherical;
        }
    }
    class Kriging {
        // Train using gaussian processes with bayesian priors
        static train(t, x, y, model, sigma2, alpha) {
            const variogram = {
                t: t,
                valueRange: [Math.min.apply(null, t), Math.max.apply(null, t)],
                x: x,
                y: y,
                nugget: 0.0,
                range: 0.0,
                sill: 0.0,
                A: 1 / 3,
                n: 0,
                model,
            };
            const modelFn = getModelFn(model);
            // Lag distance/semivariance
            var i, j, k, l, n = t.length;
            var distance = Array((n * n - n) / 2);
            for (i = 0, k = 0; i < n; i++)
                for (j = 0; j < i; j++, k++) {
                    distance[k] = Array(2);
                    distance[k][0] = Math.pow(Math.pow(x[i] - x[j], 2) + Math.pow(y[i] - y[j], 2), 0.5);
                    distance[k][1] = Math.abs(t[i] - t[j]);
                }
            distance.sort(function (a, b) {
                return a[0] - b[0];
            });
            variogram.range = distance[(n * n - n) / 2 - 1][0];
            // Bin lag distance
            var lags = (n * n - n) / 2 > 30 ? 30 : (n * n - n) / 2;
            var tolerance = variogram.range / lags;
            var lag = createArrayWithValues(0, lags);
            var semi = createArrayWithValues(0, lags);
            if (lags < 30) {
                for (l = 0; l < lags; l++) {
                    lag[l] = distance[l][0];
                    semi[l] = distance[l][1];
                }
            }
            else {
                for (i = 0, j = 0, k = 0, l = 0; i < lags && j < (n * n - n) / 2; i++, k = 0) {
                    while (distance[j][0] <= (i + 1) * tolerance) {
                        lag[l] += distance[j][0];
                        semi[l] += distance[j][1];
                        j++;
                        k++;
                        if (j >= (n * n - n) / 2)
                            break;
                    }
                    if (k > 0) {
                        lag[l] /= k;
                        semi[l] /= k;
                        l++;
                    }
                }
                if (l < 2)
                    return variogram; // Error: Not enough points
            }
            // Feature transformation
            n = l;
            variogram.range = lag[n - 1] - lag[0];
            var X = createArrayWithValues(1, 2 * n);
            var Y = Array(n);
            var A = variogram.A;
            for (i = 0; i < n; i++) {
                switch (model) {
                    case "gaussian":
                        X[i * 2 + 1] = 1.0 - Math.exp(-(1.0 / A) * Math.pow(lag[i] / variogram.range, 2));
                        break;
                    case "exponential":
                        X[i * 2 + 1] = 1.0 - Math.exp((-(1.0 / A) * lag[i]) / variogram.range);
                        break;
                    case "spherical":
                        X[i * 2 + 1] = 1.5 * (lag[i] / variogram.range) - 0.5 * Math.pow(lag[i] / variogram.range, 3);
                        break;
                }
                Y[i] = semi[i];
            }
            // Least squares
            var Xt = kriging_matrix_transpose(X, n, 2);
            var Z = kriging_matrix_multiply(Xt, X, 2, n, 2);
            Z = kriging_matrix_add(Z, kriging_matrix_diag(1 / alpha, 2), 2, 2);
            var cloneZ = Z.slice(0);
            if (kriging_matrix_chol(Z, 2))
                kriging_matrix_chol2inv(Z, 2);
            else {
                kriging_matrix_solve(cloneZ, 2);
                Z = cloneZ;
            }
            var W = kriging_matrix_multiply(kriging_matrix_multiply(Z, Xt, 2, 2, n), Y, 2, n, 1);
            // Variogram parameters
            variogram.nugget = W[0];
            variogram.sill = W[1] * variogram.range + variogram.nugget;
            variogram.n = x.length;
            // Gram matrix with prior
            n = x.length;
            var K = Array(n * n);
            for (i = 0; i < n; i++) {
                for (j = 0; j < i; j++) {
                    K[i * n + j] = modelFn(Math.pow(Math.pow(x[i] - x[j], 2) + Math.pow(y[i] - y[j], 2), 0.5), variogram.nugget, variogram.range, variogram.sill, variogram.A);
                    K[j * n + i] = K[i * n + j];
                }
                K[i * n + i] = modelFn(0, variogram.nugget, variogram.range, variogram.sill, variogram.A);
            }
            // Inverse penalized Gram matrix projected to target vector
            var C = kriging_matrix_add(K, kriging_matrix_diag(sigma2, n), n, n);
            var cloneC = C.slice(0);
            if (kriging_matrix_chol(C, n))
                kriging_matrix_chol2inv(C, n);
            else {
                kriging_matrix_solve(cloneC, n);
                C = cloneC;
            }
            // Copy unprojected inverted matrix as K
            var K = C.slice(0);
            var M = kriging_matrix_multiply(C, t, n, n, 1);
            variogram.K = K;
            variogram.M = M;
            return variogram;
        }
        static predict(x, y, variogram) {
            const M = Array(variogram.n);
            const modelFn = getModelFn(variogram.model);
            for (let i = 0; i < variogram.n; i++) {
                M[i] = modelFn(Math.hypot(x - variogram.x[i], y - variogram.y[i]), variogram.nugget, variogram.range, variogram.sill, variogram.A);
            }
            return kriging_matrix_multiply(M, variogram.M, 1, variogram.n, 1)[0];
        }
        static variance(x, y, variogram) {
            const M = Array(variogram.n);
            const modelFn = getModelFn(variogram.model);
            for (let i = 0; i < variogram.n; i++)
                M[i] = modelFn(Math.pow(Math.pow(x - variogram.x[i], 2) + Math.pow(y - variogram.y[i], 2), 0.5), variogram.nugget, variogram.range, variogram.sill, variogram.A);
            return (modelFn(0, variogram.nugget, variogram.range, variogram.sill, variogram.A) +
                kriging_matrix_multiply(kriging_matrix_multiply(M, variogram.K, 1, variogram.n, variogram.n), M, 1, variogram.n, 1)[0]);
        }
        // Gridded matrices or contour paths
        static grid(polygons, variogram, width) {
            const n = polygons.length;
            if (n == 0)
                return null;
            const range = { xmin: Infinity, ymin: Infinity, xmax: -Infinity, ymax: -Infinity };
            for (let i = 0; i < n; i++) {
                calcPointsRange(polygons[i], range);
            }
            // Alloc for O(n^2) space
            const cols = Math.ceil((range.xmax - range.xmin) / width);
            const rows = Math.ceil((range.ymax - range.ymin) / width);
            const A = Array(cols + 1);
            for (let i = 0; i <= cols; i++)
                A[i] = Array(rows + 1);
            for (let i = 0; i < n; i++) {
                const { xmin, xmax, ymin, ymax } = calcPointsRange(polygons[i]);
                const a = [
                    Math.floor((xmin - ((xmin - range.xmin) % width) - range.xmin) / width),
                    Math.ceil((xmax - ((xmax - range.xmax) % width) - range.xmin) / width),
                ];
                const b = [
                    Math.floor((ymin - ((ymin - range.ymin) % width) - range.ymin) / width),
                    Math.ceil((ymax - ((ymax - range.ymax) % width) - range.ymin) / width),
                ];
                for (let j = a[0]; j <= a[1]; j++)
                    for (let k = b[0]; k <= b[1]; k++) {
                        let xtarget = range.xmin + j * width;
                        let ytarget = range.ymin + k * width;
                        if (pip(polygons[i], xtarget, ytarget))
                            A[j][k] = Kriging.predict(xtarget, ytarget, variogram);
                    }
            }
            A.xlim = [range.xmin, range.xmax];
            A.ylim = [range.ymin, range.ymax];
            A.zlim = [Math.min.apply(null, variogram.t), Math.max.apply(null, variogram.t)];
            A.width = width;
            return A;
            function calcPointsRange(points, range) {
                const r = range || { xmin: Infinity, ymin: Infinity, xmax: -Infinity, ymax: -Infinity };
                for (let i = 0; i < points.length; i++) {
                    const [x, y] = points[i];
                    r.xmin = Math.min(r.xmin, x);
                    r.xmax = Math.max(r.xmax, x);
                    r.ymin = Math.min(r.ymin, y);
                    r.ymax = Math.max(r.ymax, y);
                }
                return r;
            }
        }
        static plot(canvas, grid, xlim, ylim, colors) {
            var ctx = canvas.getContext("2d");
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            // Starting boundaries
            var range = [xlim[1] - xlim[0], ylim[1] - ylim[0], grid.zlim[1] - grid.zlim[0]];
            var i, j, x, y, z;
            var n = grid.length;
            var m = grid[0].length;
            var wx = Math.ceil((grid.width * canvas.width) / (xlim[1] - xlim[0]));
            var wy = Math.ceil((grid.width * canvas.height) / (ylim[1] - ylim[0]));
            for (i = 0; i < n; i++)
                for (j = 0; j < m; j++) {
                    if (grid[i][j] == undefined)
                        continue;
                    x = (canvas.width * (i * grid.width + grid.xlim[0] - xlim[0])) / range[0];
                    y = canvas.height * (1 - (j * grid.width + grid.ylim[0] - ylim[0]) / range[1]);
                    z = (grid[i][j] - grid.zlim[0]) / range[2];
                    if (z < 0.0)
                        z = 0.0;
                    if (z > 1.0)
                        z = 1.0;
                    ctx.fillStyle = colors[Math.floor((colors.length - 1) * z)];
                    ctx.fillRect(Math.round(x - wx / 2), Math.round(y - wy / 2), wx, wy);
                }
        }
    }

    /**
     * kriging.grid方法的webgl版本,
     */
    let ctx;
    function initWebglCtx() {
        if (typeof OffscreenCanvas === "undefined")
            throw new Error("kriging webgl需要支持OffscreenCanvas!");
        const canvas = new OffscreenCanvas(1, 1);
        const isWebGL2 = typeof WebGL2RenderingContext !== "undefined";
        const gl = canvas.getContext(isWebGL2 ? "webgl2" : "webgl", {
            alpha: true,
            depth: false,
            stencil: false,
        });
        if (!gl)
            throw new Error("webgl not support");
        if (!isWebGL2) {
            //for mxy texture
            const ext1 = gl.getExtension("OES_texture_float");
            if (!ext1)
                throw new Error("不支持浮点纹理!");
        }
        const vertexShader = `
    precision highp float;
    attribute vec2 position;
    void main(){
        gl_Position = vec4(position * 2.0 - 1.0, 0, 1);
    }`;
        const positionBuffer = (() => {
            const buffer = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([0, 0, 1, 0, 1, 1, 0, 0, 1, 1, 0, 1]), gl.STATIC_DRAW);
            gl.bindBuffer(gl.ARRAY_BUFFER, null);
            return buffer;
        })();
        const cache = new Map();
        const ModelCodeMap = {
            gaussian: 1,
            exponential: 2,
            spherical: 3,
        };
        const getRenderProgram = (dimension) => {
            let p = cache.get(dimension);
            if (!p) {
                const program = createProgram(gl, vertexShader, getFragmentShader(dimension));
                p = {
                    program,
                    uniformLoc: {
                        model: gl.getUniformLocation(program, "model"),
                        texture: gl.getUniformLocation(program, "variogram_mxy"),
                        value_range: gl.getUniformLocation(program, "value_range"),
                        variogram_mxy_size: gl.getUniformLocation(program, "variogram_mxy_size"),
                        variogram_param: gl.getUniformLocation(program, "variogram_param"),
                        grid_info: gl.getUniformLocation(program, "grid_info"),
                    },
                    positionLoc: gl.getAttribLocation(program, "position"),
                };
                cache.set(dimension, p);
            }
            return p;
        };
        const cretaeMxyTexture = (variogram) => {
            const [texWidth, texHeight] = polygon.calcDataTexSize(variogram.n);
            const { M, x, y } = variogram;
            const array = new Float32Array(texWidth * texHeight * 4);
            for (let i = 0; i < variogram.n; i++) {
                const cursor = i * 4;
                array[cursor] = M[i];
                array[cursor + 1] = x[i];
                array[cursor + 2] = y[i];
            }
            const texture = gl.createTexture();
            gl.bindTexture(gl.TEXTURE_2D, texture);
            gl.pixelStorei(gl.UNPACK_ALIGNMENT, polygon.getTextureUnpackAlign(texWidth));
            gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
            gl.texImage2D(gl.TEXTURE_2D, 0, isWebGL2 ? gl.RGBA32F : gl.RGBA, texWidth, texHeight, 0, gl.RGBA, gl.FLOAT, array);
            gl.bindTexture(gl.TEXTURE_2D, null);
            return { texture, texWidth, texHeight };
        };
        return {
            gl,
            isWebGL2,
            gernerate(opts) {
                const { variogram, llCorner, gridSize, cellSize } = opts;
                const model = variogram.model;
                const valueRange = variogram.valueRange;
                const dimension = variogram.n;
                const { program, uniformLoc, positionLoc } = getRenderProgram(dimension);
                //clear
                canvas.width = gridSize[0];
                canvas.height = gridSize[1];
                gl.viewport(0, 0, canvas.width, canvas.height);
                gl.clearColor(0, 0, 0, 0);
                gl.clear(gl.COLOR_BUFFER_BIT);
                gl.useProgram(program);
                //position
                gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
                gl.enableVertexAttribArray(positionLoc);
                gl.vertexAttribPointer(positionLoc, 2, gl.FLOAT, false, 0, 0);
                gl.bindBuffer(gl.ARRAY_BUFFER, null);
                const { texture, texHeight, texWidth } = cretaeMxyTexture(opts.variogram);
                gl.uniform1f(uniformLoc.model, ModelCodeMap[model]);
                gl.uniform2fv(uniformLoc.variogram_mxy_size, [texWidth, texHeight]);
                gl.uniform2fv(uniformLoc.value_range, [valueRange[0], valueRange[1]]);
                gl.uniform4fv(uniformLoc.variogram_param, [variogram.nugget, variogram.range, variogram.sill, variogram.A]);
                gl.uniform3fv(uniformLoc.grid_info, [llCorner[0], llCorner[1], cellSize]);
                gl.activeTexture(gl.TEXTURE0);
                gl.bindTexture(gl.TEXTURE_2D, texture);
                gl.uniform1i(uniformLoc.texture, 0);
                gl.drawArrays(gl.TRIANGLES, 0, 6);
                // const arr = new Uint8Array(canvas.width * canvas.height * 4);
                // gl.readPixels(0, 0, canvas.width, canvas.height, gl.RGBA, gl.UNSIGNED_BYTE, arr);
                return canvas.transferToImageBitmap();
            },
        };
    }
    function krigingGernerater_WEBGL(opts) {
        if (!ctx) {
            ctx = initWebglCtx();
        }
        return ctx.gernerate(opts);
    }
    const glsl_krigingModel = `
#define MODEL_GAUSSIAN 1.0
#define MODEL_EXPONENTIAL 2.0
#define MODEL_SPHERICAL 3.0

uniform vec4 variogram_param; //nugget, range, sill, A
uniform float model; //模型类型

float variogram_gaussian(float h){
    float nugget = variogram_param.x;
    float range = variogram_param.y;
    float sill = variogram_param.z;
    float A = variogram_param.w;

    float i = -(1.0 / A) * pow(h / range, 2.0);
    return nugget + ((sill - nugget) / range) * (1.0 - exp(i));
}
float variogram_exponential(float h){
    float nugget = variogram_param.x;
    float range = variogram_param.y;
    float sill = variogram_param.z;
    float A = variogram_param.w;

    float i = -(1.0 / A) * (h / range);
    return nugget + ((sill - nugget) / range) * (1.0 - exp(i));
}
float variogram_spherical(float h){
    float nugget = variogram_param.x;
    float range = variogram_param.y;
    float sill = variogram_param.z;
    float A = variogram_param.w;

    if (h > range) return nugget + (sill - nugget) / range;
    return nugget + ((sill - nugget) / range) * (1.5 * (h / range) - 0.5 * pow(h / range, 3.0));
}
float modelValue(float h){
    return model == MODEL_GAUSSIAN
            ? variogram_gaussian(h) 
            : ( model == MODEL_EXPONENTIAL ? variogram_exponential(h) : variogram_spherical(h));
}
`;
    function getFragmentShader(dimension) {
        return `
    precision highp float;

    #define DIMENSION ${dimension}
   
    uniform highp sampler2D variogram_mxy; //实际上是 dimension x 1 的数组 三个分量分别为 M,x,y
    uniform vec2 variogram_mxy_size; //传入的纹理尺寸

    uniform vec2 value_range; //归一化值域
    uniform vec3 grid_info; // llx, lly, cellSize 

    ${pack.glsl_pack}
    ${glsl_krigingModel}

    vec3 lookup(float index){
        float col = mod(index, variogram_mxy_size.x);
        float row = floor(index / variogram_mxy_size.x);
        vec2 pixel = 1.0 / variogram_mxy_size;
        vec2 uv = vec2(col, row) * pixel + pixel * 0.5;
        return texture2D(variogram_mxy, uv).xyz;
    }
    float hypot(float a, float b){
        return pow(pow(a,2.0) + pow(b,2.0), 0.5);
    }
    void main(){
        vec2 inputCoord = gl_FragCoord.xy * grid_info.z + grid_info.xy;

        float sum = 0.0;
        for(int i = 0; i < DIMENSION; i++){
            vec3 mxy = lookup(float(i));
            sum += modelValue(hypot(inputCoord.x - mxy[1], inputCoord.y - mxy[2])) * mxy[0];
        }
        float normalizedSum = (sum - value_range.x) / (value_range.y - value_range.x);
        gl_FragColor = packNormalizeFloatToRGBA(normalizedSum);
    }`;
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

    const isBrowser = !!(typeof window !== "undefined" && typeof navigator !== "undefined" && window.document);
    const isWebWorker = !isBrowser && typeof importScripts !== "undefined";
    function generate_normal(opts) {
        let start = performance.now();
        const trainOpts = opts.trainOpts;
        const variogram = opts.variogram ||
            Kriging.train(trainOpts.value, trainOpts.x, trainOpts.y, trainOpts.model, trainOpts.sigma2, trainOpts.alpha);
        const trainTime = performance.now() - start;
        start = performance.now();
        const { cellSize, gridSize, llCorner } = opts;
        const [cols, rows] = gridSize;
        const [xmin, ymin] = llCorner;
        const ymax = ymin + cellSize * rows;
        const halfSize = cellSize / 2;
        const result = new Float32Array(cols * rows);
        const [ox, oy] = [xmin + halfSize, ymax - halfSize];
        for (let y = 0; y < rows; y++) {
            for (let x = 0, cursor = y * cols, _y = oy - (halfSize + y * cellSize); x < cols; x++) {
                result[cursor + x] = Kriging.predict(ox + x * cellSize, _y, variogram);
            }
        }
        const gridTime = performance.now() - start;
        // {
        //     const canvas = document.createElement("canvas");
        //     document.body.append(canvas);
        //     canvas.width = cols;
        //     canvas.height = rows;
        //     canvas.style.cssText = "position:fixed;z-index:10000;right:0;bottom:0;";
        //     const ctx = canvas.getContext("2d");
        //     const vmin = Math.min.apply(null, opts.value),
        //         vmax = Math.max.apply(null, opts.value),
        //         vrange = vmax - vmin;
        //     const colors = ["#006837", "#1a9850", "#66bd63", "#a6d96a", "#d9ef8b", "#ffffbf", "#fee08b", "#fdae61", "#f46d43", "#d73027", "#a50026"];
        //     for (let y = 0; y < rows; y++) {
        //         for (let x = 0; x < cols; x++) {
        //             const val = result[y * cols + x];
        //             const z = (val - vmin) / vrange;
        //             const color = colors[Math.floor((colors.length - 1) * z)];
        //             ctx.fillStyle = color;
        //             ctx.fillRect(x, y, 1, 1);
        //         }
        //     }
        // }
        return {
            result: {
                trainTime,
                gridTime,
                data: result,
                cols,
                rows,
                type: "arraybuffer",
                variogramCache: opts.variogram ? null : { variogram, cellSize, gridSize, llCorner },
            },
            transferList: [result.buffer],
        };
    }
    function generate_webgl(opts) {
        const { cellSize, llCorner, gridSize } = opts;
        let start = performance.now();
        const trainOpts = opts.trainOpts;
        const variogram = opts.variogram ||
            Kriging.train(trainOpts.value, trainOpts.x, trainOpts.y, trainOpts.model, trainOpts.sigma2, trainOpts.alpha);
        const trainTime = performance.now() - start;
        start = performance.now();
        const imagebitmap = krigingGernerater_WEBGL({
            variogram,
            llCorner,
            gridSize,
            cellSize,
        });
        const gridTime = performance.now() - start;
        return {
            result: {
                data: imagebitmap,
                trainTime,
                gridTime,
                cols: gridSize[0],
                rows: gridSize[1],
                type: "imagebitmap",
                valueRange: variogram.valueRange,
                variogramCache: opts.variogram
                    ? null
                    : {
                        variogram,
                        cellSize,
                        llCorner,
                        gridSize,
                    },
            },
            transferList: [imagebitmap],
        };
    }
    function runKrigingInExtent(opts) {
        const fn = opts.method || (typeof OffscreenCanvas !== "undefined" ? "webgl" : "normal");
        if (fn === "webgl") {
            return generate_webgl(opts.variogram ? opts : normalized(opts));
        }
        else {
            return generate_normal(opts);
        }
        //webgl数据类型为float, 对坐标归一化, 提高精度
        function normalized(_opts) {
            const opts = isWebWorker ? _opts : JSON.parse(JSON.stringify(_opts));
            const { trainOpts, cellSize, llCorner } = opts;
            const { x, y } = trainOpts;
            let xmin = Infinity, xmax = -Infinity, ymin = Infinity, ymax = -Infinity;
            for (let i = 0, len = x.length; i < len; i++) {
                xmin = Math.min(xmin, x[i]);
                xmax = Math.max(xmax, x[i]);
                ymin = Math.min(ymin, y[i]);
                ymax = Math.max(ymax, y[i]);
            }
            const cx = (xmin + xmax) / 2, cy = (ymin + ymax) / 2;
            const normalize_radius = Math.min((xmax - xmin) / 2, (ymax - ymin) / 2);
            const n_x = x.map((i) => (i - cx) / normalize_radius);
            const n_y = y.map((i) => (i - cy) / normalize_radius);
            const n_llCorner = [(llCorner[0] - cx) / normalize_radius, (llCorner[1] - cy) / normalize_radius];
            trainOpts.x = n_x;
            trainOpts.y = n_y;
            opts.llCorner = n_llCorner;
            opts.cellSize = cellSize / normalize_radius;
            return opts;
        }
    }
    async function tessellatePolygons(opts) {
        const sr = new SpatialReference(opts.sr);
        const convert = opts?.convertDouble ?? false;
        await projection.load();
        const polygons = opts.polygons.map((p) => {
            if (sr.equals(p.spatialReference)) {
                return new Polygon(p);
            }
            else {
                return projection.project(p, sr);
            }
        });
        const { vertices, indices, vertexCount } = polygon.mergePolygonMesh(polygons.map((p) => polygon.tessellatePolygon(p)));
        const indicesBuffer = vertexCount < 256
            ? new Uint8Array(indices)
            : vertexCount < 65536
                ? new Uint16Array(indices)
                : new Uint32Array(indices);
        let xmin = Infinity, ymin = Infinity, xmax = -Infinity, ymax = -Infinity;
        for (let i = 0; i < vertices.length; i += 2) {
            const x = vertices[i], y = vertices[i + 1];
            xmin = Math.min(xmin, x);
            xmax = Math.max(xmax, x);
            ymin = Math.min(ymin, y);
            ymax = Math.max(ymax, y);
        }
        if (convert) {
            const length = vertices.length;
            const verticesHigh = new Float32Array(length);
            const verticesLow = new Float32Array(length);
            for (let i = 0; i < length; i++) {
                const [high, low] = polygon.doubleToTwoFloats(vertices[i]);
                verticesHigh[i] = high;
                verticesLow[i] = low;
            }
            return {
                result: {
                    verticesHigh,
                    verticesLow,
                    indices: indicesBuffer,
                    extent: { xmin, ymin, xmax, ymax },
                },
                transferList: [verticesHigh.buffer, verticesLow.buffer, indicesBuffer.buffer],
            };
        }
        else {
            const vBuffer = new Float32Array(vertices);
            return {
                result: {
                    vertices: vBuffer,
                    indices: indicesBuffer,
                    extent: { xmin, ymin, xmax, ymax },
                },
                transferList: [vBuffer.buffer, indicesBuffer.buffer],
            };
        }
    }

    exports.generate_normal = generate_normal;
    exports.generate_webgl = generate_webgl;
    exports.runKrigingInExtent = runKrigingInExtent;
    exports.tessellatePolygons = tessellatePolygons;

}));
//# sourceMappingURL=Kriging.js.map
