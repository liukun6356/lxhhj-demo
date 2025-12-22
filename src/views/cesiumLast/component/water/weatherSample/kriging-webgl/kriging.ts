/* 
Copyright (C) 2011-2013, Omar Olmedo

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
"Software"), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE. 
*/

function pip(arr: number[][], x: number, y: number) {
    let result = false;
    for (let i = 0, j = arr.length - 1; i < arr.length; j = i++) {
        if (
            arr[i][1] > y != arr[j][1] > y &&
            x < ((arr[j][0] - arr[i][0]) * (y - arr[i][1])) / (arr[j][1] - arr[i][1]) + arr[i][0]
        ) {
            result = !result;
        }
    }
    return result;
}
function createArrayWithValues(value: number, length: number) {
    return new Array<number>(length).fill(value);
}
// Matrix algebra
function kriging_matrix_diag(value: number, n: number) {
    const matrix = createArrayWithValues(0, n * n);
    for (let i = 0; i < n; i++) matrix[i * n + i] = value;
    return matrix;
}
function kriging_matrix_transpose(matrix: number[], n: number, m: number) {
    const M = Array<number>(m * n);
    for (let i = 0; i < n; i++)
        for (let j = 0; j < m; j++) {
            M[j * n + i] = matrix[i * m + j];
        }
    return M;
}
function kriging_matrix_scale(M: number[], scale: number, n: number, m: number) {
    for (let i = 0; i < n; i++) for (let j = 0; j < m; j++) M[i * m + j] *= scale;
}
function kriging_matrix_add(Ma: number[], Mb: number[], n: number, m: number) {
    const M = Array<number>(n * m);
    for (let i = 0; i < n; i++)
        for (let j = 0; j < m; j++) {
            const index = i * m + j;
            M[index] = Ma[index] + Mb[index];
        }
    return M;
}

// Naive matrix multiplication
function kriging_matrix_multiply(
    Ma: number[],
    Mb: number[],
    n: number /*前一个的rows*/,
    m: number,
    p: number /*后一个的cols*/
) {
    const Z = Array<number>(n * p).fill(0);
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
function kriging_matrix_chol(M: number[], n: number) {
    const p = Array(n);
    for (let i = 0; i < n; i++) {
        p[i] = M[i * n + i];
    }

    for (let i = 0; i < n; i++) {
        for (let j = 0; j < i; j++) {
            p[i] -= M[i * n + j] ** 2;
        }
        if (p[i] <= 0) return false;
        p[i] = Math.sqrt(p[i]);
        for (let j = i + 1; j < n; j++) {
            for (let k = 0; k < i; k++) {
                M[j * n + i] -= M[j * n + k] * M[i * n + k];
            }
            M[j * n + i] /= p[i];
        }
    }
    for (let i = 0; i < n; i++) M[i * n + i] = p[i];
    return true;
}
// Inversion of cholesky decomposition
function kriging_matrix_chol2inv(M: number[], n: number) {
    let i, j, k, sum;
    for (i = 0; i < n; i++) {
        M[i * n + i] = 1 / M[i * n + i];
        for (j = i + 1; j < n; j++) {
            sum = 0;
            for (k = i; k < j; k++) sum -= M[j * n + k] * M[k * n + i];
            M[j * n + i] = sum / M[j * n + j];
        }
    }
    for (i = 0; i < n; i++) for (j = i + 1; j < n; j++) M[i * n + j] = 0;
    for (i = 0; i < n; i++) {
        M[i * n + i] *= M[i * n + i];
        for (k = i + 1; k < n; k++) M[i * n + i] += M[k * n + i] * M[k * n + i];
        for (j = i + 1; j < n; j++) for (k = j; k < n; k++) M[i * n + j] += M[k * n + i] * M[k * n + j];
    }
    for (i = 0; i < n; i++) for (j = 0; j < i; j++) M[i * n + j] = M[j * n + i];
}
// Inversion via gauss-jordan elimination
function kriging_matrix_solve(M: number[], n: number) {
    let m = n;
    let b = Array(n * n);
    let indxc = Array(n);
    let indxr = Array(n);
    let ipiv = Array(n);
    let i, icol, irow, j, k, l, ll;
    let big, dum, pivinv, temp;

    for (i = 0; i < n; i++)
        for (j = 0; j < n; j++) {
            if (i == j) b[i * n + j] = 1;
            else b[i * n + j] = 0;
        }
    for (j = 0; j < n; j++) ipiv[j] = 0;
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

        if (M[icol * n + icol] == 0) return false; // Singular

        pivinv = 1 / M[icol * n + icol];
        M[icol * n + icol] = 1;
        for (l = 0; l < n; l++) M[icol * n + l] *= pivinv;
        for (l = 0; l < m; l++) b[icol * n + l] *= pivinv;

        for (ll = 0; ll < n; ll++) {
            if (ll != icol) {
                dum = M[ll * n + icol];
                M[ll * n + icol] = 0;
                for (l = 0; l < n; l++) M[ll * n + l] -= M[icol * n + l] * dum;
                for (l = 0; l < m; l++) b[ll * n + l] -= b[icol * n + l] * dum;
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
function kriging_variogram_gaussian(h: number, nugget: number, range: number, sill: number, A: number) {
    return nugget + ((sill - nugget) / range) * (1.0 - Math.exp(-(1.0 / A) * Math.pow(h / range, 2)));
}
function kriging_variogram_exponential(h: number, nugget: number, range: number, sill: number, A: number) {
    return nugget + ((sill - nugget) / range) * (1.0 - Math.exp(-(1.0 / A) * (h / range)));
}
function kriging_variogram_spherical(h: number, nugget: number, range: number, sill: number, A: number) {
    if (h > range) return nugget + (sill - nugget) / range;
    return nugget + ((sill - nugget) / range) * (1.5 * (h / range) - 0.5 * Math.pow(h / range, 3));
}

export interface Variogram {
    t: number[];
    x: number[];
    y: number[];
    nugget: number;
    range: number;
    sill: number;
    A: number;
    n: number;
    K: number[];
    M: number[];
    model: KrigingModel;
}

export type KrigingModel = "gaussian" | "exponential" | "spherical";

function getModelFn(type: KrigingModel) {
    switch (type) {
        case "gaussian":
            return kriging_variogram_gaussian;
        case "exponential":
            return kriging_variogram_exponential;
        case "spherical":
            return kriging_variogram_spherical;
    }
}

export function train(t: number[], x: number[], y: number[], model: KrigingModel, sigma2: number, alpha: number) {
    const variogram = {
        t: t,
        x: x,
        y: y,
        nugget: 0.0,
        range: 0.0,
        sill: 0.0,
        A: 1 / 3,
        n: 0,
        model,
    } as Variogram;
    const modelFn = getModelFn(model);

    // Lag distance/semivariance
    var i,
        j,
        k,
        l,
        n = t.length;
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
    } else {
        for (i = 0, j = 0, k = 0, l = 0; i < lags && j < (n * n - n) / 2; i++, k = 0) {
            while (distance[j][0] <= (i + 1) * tolerance) {
                lag[l] += distance[j][0];
                semi[l] += distance[j][1];
                j++;
                k++;
                if (j >= (n * n - n) / 2) break;
            }
            if (k > 0) {
                lag[l] /= k;
                semi[l] /= k;
                l++;
            }
        }
        if (l < 2) return variogram; // Error: Not enough points
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
    if (kriging_matrix_chol(Z, 2)) kriging_matrix_chol2inv(Z, 2);
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
    var K = Array<number>(n * n);
    for (i = 0; i < n; i++) {
        for (j = 0; j < i; j++) {
            K[i * n + j] = modelFn(
                Math.pow(Math.pow(x[i] - x[j], 2) + Math.pow(y[i] - y[j], 2), 0.5),
                variogram.nugget,
                variogram.range,
                variogram.sill,
                variogram.A
            );
            K[j * n + i] = K[i * n + j];
        }
        K[i * n + i] = modelFn(0, variogram.nugget, variogram.range, variogram.sill, variogram.A);
    }

    // Inverse penalized Gram matrix projected to target vector
    var C = kriging_matrix_add(K, kriging_matrix_diag(sigma2, n), n, n);
    var cloneC = C.slice(0);
    if (kriging_matrix_chol(C, n)) kriging_matrix_chol2inv(C, n);
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

export function predict(x: number, y: number, variogram: Variogram) {
    const M = Array(variogram.n);
    const modelFn = getModelFn(variogram.model);
    for (let i = 0; i < variogram.n; i++) {
        M[i] = modelFn(
            Math.hypot(x - variogram.x[i], y - variogram.y[i]),
            variogram.nugget,
            variogram.range,
            variogram.sill,
            variogram.A
        );
    }
    return kriging_matrix_multiply(M, variogram.M, 1, variogram.n, 1)[0];
}



export function variance(x: number, y: number, variogram: Variogram) {
    const M = Array(variogram.n);
    const modelFn = getModelFn(variogram.model);
    for (let i = 0; i < variogram.n; i++)
        M[i] = modelFn(
            Math.pow(Math.pow(x - variogram.x[i], 2) + Math.pow(y - variogram.y[i], 2), 0.5),
            variogram.nugget,
            variogram.range,
            variogram.sill,
            variogram.A
        );
    return (
        modelFn(0, variogram.nugget, variogram.range, variogram.sill, variogram.A) +
        kriging_matrix_multiply(
            kriging_matrix_multiply(M, variogram.K, 1, variogram.n, variogram.n),
            M,
            1,
            variogram.n,
            1
        )[0]
    );
}

