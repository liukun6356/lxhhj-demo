import * as Cesium from "cesium";

//添加Cesium原生Primitive
function addBoxPrimitive(opt) {
    if (!opt) opt = {};

    //添加立方体

    //立方体边长
    var boxLength = opt.boxLength;
    //立方体位置
    var position = Cesium.Cartesian3.fromDegrees(opt.jd, opt.wd, 0.5 * boxLength);
    //地方矩阵
    var modelMatrix = Cesium.Transforms.eastNorthUpToFixedFrame(position);
    // 1 定义位置数组
    var v0 = [0.5, -0.5, 0.5];
    var v1 = [-0.5, -0.5, 0.5];
    var v2 = [-0.5, -0.5, -0.5];
    var v3 = [0.5, -0.5, -0.5];
    var v4 = [0.5, 0.5, -0.5];
    var v5 = [0.5, 0.5, 0.5];
    var v6 = [-0.5, 0.5, 0.5];
    var v7 = [-0.5, 0.5, -0.5];
    var rawVertex = [
        // 下 -z
        ...v2, ...v3, ...v4, ...v7,
        // 前 -y
        ...v2, ...v3, ...v0, ...v1,
        // 后 +y
        ...v4, ...v7, ...v6, ...v5,
        // 左 -x
        ...v7, ...v2, ...v1, ...v6,
        // 右 +x
        ...v3, ...v4, ...v5, ...v0,
        // 上 +z
        ...v1, ...v0, ...v5, ...v6,
    ];
    // 乘上box的长度
    var boxVertex = rawVertex.map(function (v) {
        return v * boxLength;
    });
    var positions = new Float64Array(boxVertex);
    // 2 定义法向数组
    var npx = [1, 0, 0];
    var nnx = [-1, 0, 0];
    var npy = [0, 1, 0];
    var nny = [0, -1, 0];
    var npz = [0, 0, 1];
    var nnz = [0, 0, -1];
    var normals = new Float32Array([
        // 下 -z
        ...nnz, ...nnz, ...nnz, ...nnz,
        // 前 -y
        ...nny, ...nny, ...nny, ...nny,
        // 后 +y
        ...npy, ...npy, ...npy, ...npy,
        // 左 -x
        ...nnx, ...nnx, ...nnx, ...nnx,
        // 右 +x
        ...npx, ...npx, ...npx, ...npx,
        // 上 +z
        ...npz, ...npz, ...npz, ...npz,
    ]);
    // 3 定义纹理数组
    var sts = new Float32Array([
        0, 0, 1, 0, 1, 1, 0, 1,
        0, 0, 1, 0, 1, 1, 0, 1,
        0, 0, 1, 0, 1, 1, 0, 1,
        0, 0, 1, 0, 1, 1, 0, 1,
        0, 0, 1, 0, 1, 1, 0, 1,
        0, 0, 1, 0, 1, 1, 0, 1,
    ]);
    // 4 定义索引
    var indices = new Uint16Array([
        0, 1, 2, 0, 2, 3,
        4, 5, 6, 4, 6, 7,
        8, 9, 10, 8, 10, 11,
        12, 13, 14, 12, 14, 15,
        16, 17, 18, 16, 18, 19,
        20, 21, 22, 20, 22, 23,
    ]);
    // 5 创建Primitive
    var myBox = viewer.scene.primitives.add(new Cesium.Primitive({
        geometryInstances: new Cesium.GeometryInstance({
            geometry: new Cesium.Geometry({
                attributes: {
                    position: new Cesium.GeometryAttribute({
                        componentDatatype: Cesium.ComponentDatatype.DOUBLE,
                        componentsPerAttribute: 3,
                        values: positions
                    }),
                    normal: new Cesium.GeometryAttribute({
                        componentDatatype: Cesium.ComponentDatatype.FLOAT,
                        componentsPerAttribute: 3,
                        values: normals
                    }),
                    st: new Cesium.GeometryAttribute({
                        componentDatatype: Cesium.ComponentDatatype.FLOAT,
                        componentsPerAttribute: 2,
                        values: sts
                    }),
                },
                indices: indices,
                primitiveType: Cesium.PrimitiveType.TRIANGLES,
                boundingSphere: Cesium.BoundingSphere.fromVertices(positions)
            }),
        }),
        appearance: new Cesium.MaterialAppearance({
            material: Cesium.Material.fromType('Image', {
                image: opt.image
            }),
            closed: true // 是否为封闭体，实际上执行的是是否进行背面裁剪
        }),
        modelMatrix: modelMatrix,
        asynchronous: false
    }));

    return myBox;
}


//================== 自定义Primitive ==================
export class CustomPrimitive {
    constructor(modelMatrix, opt) {
        // 1.0 立方体顶点位置标号，以及坐标系示意图
        // 1.1 定义位置数组
        var v0 = [0.5, -0.5, 0.5];
        var v1 = [-0.5, -0.5, 0.5];
        var v2 = [-0.5, -0.5, -0.5];
        var v3 = [0.5, -0.5, -0.5];
        var v4 = [0.5, 0.5, -0.5];
        var v5 = [0.5, 0.5, 0.5];
        var v6 = [-0.5, 0.5, 0.5];
        var v7 = [-0.5, 0.5, -0.5];
        var rawVertex = [
            // 下 -z
            ...v2, ...v3, ...v4, ...v7,
            // 前 -y
            ...v2, ...v3, ...v0, ...v1,
            // 后 +y
            ...v4, ...v7, ...v6, ...v5,
            // 左 -x
            ...v7, ...v2, ...v1, ...v6,
            // 右 +x
            ...v3, ...v4, ...v5, ...v0,
            // 上 +z
            ...v1, ...v0, ...v5, ...v6,
        ];
        var positions = new Float32Array(rawVertex);
        // 1.2 定义法向数组
        var npx = [1, 0, 0];
        var nnx = [-1, 0, 0];
        var npy = [0, 1, 0];
        var nny = [0, -1, 0];
        var npz = [0, 0, 1];
        var nnz = [0, 0, -1];
        var normals = new Float32Array([
            // 下 -z
            ...nnz, ...nnz, ...nnz, ...nnz,
            // 前 -y
            ...nny, ...nny, ...nny, ...nny,
            // 后 +y
            ...npy, ...npy, ...npy, ...npy,
            // 左 -x
            ...nnx, ...nnx, ...nnx, ...nnx,
            // 右 +x
            ...npx, ...npx, ...npx, ...npx,
            // 上 +z
            ...npz, ...npz, ...npz, ...npz,
        ]);
        // 1.3 定义纹理数组
        var sts = new Float32Array([
            0, 0, 1, 0, 1, 1, 0, 1,
            0, 0, 1, 0, 1, 1, 0, 1,
            0, 0, 1, 0, 1, 1, 0, 1,
            0, 0, 1, 0, 1, 1, 0, 1,
            0, 0, 1, 0, 1, 1, 0, 1,
            0, 0, 1, 0, 1, 1, 0, 1,
        ]);
        // 1.4 定义索引
        var indices = new Uint16Array([
            0, 1, 2, 0, 2, 3,
            4, 5, 6, 4, 6, 7,
            8, 9, 10, 8, 10, 11,
            12, 13, 14, 12, 14, 15,
            16, 17, 18, 16, 18, 19,
            20, 21, 22, 20, 22, 23,
        ]);
        // 1.5 定义纹理
        var texture = undefined;
        var imageUri = opt.image;
        Cesium.Resource.createIfNeeded(imageUri).fetchImage().then(function (image) {
            var dasTexture;
            var context = viewer.scene.context;
            if (Cesium.defined(image.internalFormat)) {
                dasTexture = new Cesium.Texture({
                    context: context,
                    pixelFormat: image.internalFormat,
                    width: image.width,
                    height: image.height,
                    source: {
                        arrayBufferView: image.bufferView
                    }
                });
            } else {
                dasTexture = new Cesium.Texture({
                    context: context,
                    source: image
                });
            }
            texture = dasTexture;
        });
        var attributeLocations = {
            position: 0,
            normal: 1,
            textureCoordinates: 2,
        };

        // 1.7 定义shader
        var dasVertexShader =
            `
            //  使用double类型的position进行计算
            // attribute vec3 position3DHigh;
            // attribute vec3 position3DLow;
            attribute vec3 position;
            attribute vec3 normal;
            attribute vec2 st;
            attribute float batchId;
            varying vec3 v_positionEC;
            varying vec3 v_normalEC;
            varying vec2 v_st;
            void main()
            {
                //  使用double类型的position进行计算
                // vec4 p = czm_translateRelativeToEye(position3DHigh, position3DLow);
                // v_positionEC = (czm_modelViewRelativeToEye * p).xyz;      // position in eye coordinates
                // v_normalEC = czm_normal * normal;                         // normal in eye coordinates
                // v_st = st;
                // gl_Position = czm_modelViewProjectionRelativeToEye * p;
                v_positionEC = (czm_modelView * vec4(position, 1.0)).xyz;       // position in eye coordinates
                v_normalEC = czm_normal * normal;                               // normal in eye coordinates
                v_st = st;
                gl_Position = czm_modelViewProjection * vec4(position, 1.0);
            }
            `;
        var dasFragmentShader =
            `
            varying vec3 v_positionEC;
            varying vec3 v_normalEC;
            varying vec2 v_st;
            uniform sampler2D myImage;
            void main()
            {
                vec3 positionToEyeEC = -v_positionEC;
                vec3 normalEC = normalize(v_normalEC);
            #ifdef FACE_FORWARD
                normalEC = faceforward(normalEC, vec3(0.0, 0.0, 1.0), -normalEC);
            #endif
                czm_materialInput materialInput;
                materialInput.normalEC = normalEC;
                materialInput.positionToEyeEC = positionToEyeEC;
                materialInput.st = v_st;
                //czm_material material = czm_getMaterial(materialInput);
                czm_material material = czm_getDefaultMaterial(materialInput);
                material.diffuse = texture2D(myImage, materialInput.st).rgb;
            #ifdef FLAT
                gl_FragColor = vec4(material.diffuse + material.emission, material.alpha);
            #else
                gl_FragColor = czm_phong(normalize(positionToEyeEC), material,czm_lightDirectionEC);
            #endif
            }
            `;
        // 1.8 创建vertexArray
        function createVertexArray(context) {
            var geometry = new Cesium.Geometry({
                attributes: {
                    position: new Cesium.GeometryAttribute({
                        //  使用double类型的position进行计算
                        // componentDatatype : Cesium.ComponentDatatype.DOUBLE,
                        componentDatatype: Cesium.ComponentDatatype.FLOAT,
                        componentsPerAttribute: 3,
                        values: positions
                    }),
                    normal: new Cesium.GeometryAttribute({
                        componentDatatype: Cesium.ComponentDatatype.FLOAT,
                        componentsPerAttribute: 3,
                        values: normals
                    }),
                    textureCoordinates: new Cesium.GeometryAttribute({
                        componentDatatype: Cesium.ComponentDatatype.FLOAT,
                        componentsPerAttribute: 2,
                        values: sts
                    })
                },
                // Workaround Internet Explorer 11.0.8 lack of TRIANGLE_FAN
                indices: indices,
                primitiveType: Cesium.PrimitiveType.TRIANGLES,
                boundingSphere: Cesium.BoundingSphere.fromVertices(positions)
            });
            var vertexArray = Cesium.VertexArray.fromGeometry({
                context: context,
                geometry: geometry,
                attributeLocations: attributeLocations,
                bufferUsage: Cesium.BufferUsage.STATIC_DRAW,
                // interleave : true
            });
            return vertexArray;
        };

        // 1.9 创建command
        function createCommand(context) {
            var translucent = false;
            var closed = true;
            // 借用一下Appearance.getDefaultRenderState
            var rawRenderState = Cesium.Appearance.getDefaultRenderState(translucent, closed, undefined);
            var renderState = Cesium.RenderState.fromCache(rawRenderState);
            var vertexShaderSource = new Cesium.ShaderSource({
                sources: [dasVertexShader]
            });
            var fragmentShaderSource = new Cesium.ShaderSource({
                sources: [dasFragmentShader]
            });
            var uniformMap = {
                myImage: function () {
                    if (Cesium.defined(texture)) {
                        return texture;
                    } else {
                        return context.defaultTexture;
                    }
                }
            }
            var shaderProgram = Cesium.ShaderProgram.fromCache({
                context: context,
                vertexShaderSource: vertexShaderSource,
                fragmentShaderSource: fragmentShaderSource,
                attributeLocations: attributeLocations
            });
            return new Cesium.DrawCommand({
                vertexArray: createVertexArray(context),
                primitiveType: Cesium.PrimitiveType.TRIANGLES,
                renderState: renderState,
                shaderProgram: shaderProgram,
                uniformMap: uniformMap,
                owner: this,
                pass: Cesium.Pass.OPAQUE,
                modelMatrix: modelMatrix,
            });
        }
        this.show = true;
        this._command = undefined;
        this._createCommand = createCommand;
    }
    update(frameState) {
        if (!this.show) {
            return;
        }
        if (!Cesium.defined(this._command)) {
            this._command = this._createCommand(frameState.context);
        }
        if (Cesium.defined(this._command)) {
            frameState.commandList.push(this._command);
        }
    }
    isDestroyed() {
        return false;
    }
    destroy() {
        if (Cesium.defined(this._command)) {
            this._command.shaderProgram = this._command.shaderProgram && this._command.shaderProgram
                .destroy();
        }
        return destroyObject(this);
    };
}


//================== 自定义Appearance  ==================
export class CustomAppearance extends Cesium.Appearance {
    constructor(options) {
        super(options);
        options = Cesium.defaultValue(options, Cesium.defaultValue.EMPTY_OBJECT);
        var translucent = this.translucent;
        var closed = this.closed;
        var defaultVertexShader = `
                attribute vec3 position3DHigh;
                attribute vec3 position3DLow;
                attribute vec3 normal;
                attribute vec2 st;
                attribute float batchId;
                varying vec3 v_positionEC;
                varying vec3 v_normalEC;
                varying vec2 v_st;
                void main()
                {
                    vec4 p = czm_computePosition();
                    v_positionEC = (czm_modelViewRelativeToEye * p).xyz;      // position in eye coordinates
                    v_normalEC = czm_normal * normal;                         // normal in eye coordinates
                    v_st = st;
                    gl_Position = czm_modelViewProjectionRelativeToEye * p;
                }
                `;
        var defaultFragmentShader = `
                varying vec3 v_positionEC;
                varying vec3 v_normalEC;
                varying vec2 v_st;
                uniform sampler2D myImage;
                void main()
                {
                    vec3 positionToEyeEC = -v_positionEC;
                    vec3 normalEC = normalize(v_normalEC);
                #ifdef FACE_FORWARD
                    normalEC = faceforward(normalEC, vec3(0.0, 0.0, 1.0), -normalEC);
                #endif
                    czm_materialInput materialInput;
                    materialInput.normalEC = normalEC;
                    materialInput.positionToEyeEC = positionToEyeEC;
                    materialInput.st = v_st;
                    //czm_material material = czm_getMaterial(materialInput);
                    czm_material material = czm_getDefaultMaterial(materialInput);
                    material.diffuse = texture2D(myImage, materialInput.st).rgb;
                #ifdef FLAT
                    gl_FragColor = vec4(material.diffuse + material.emission, material.alpha);
                #else
                    gl_FragColor = czm_phong(normalize(positionToEyeEC), material,czm_lightDirectionEC);
                #endif
                }
                `;
        this._vertexShaderSource = Cesium.defaultValue(options.vertexShaderSource, defaultVertexShader);
        this._fragmentShaderSource = Cesium.defaultValue(options.fragmentShaderSource,
            defaultFragmentShader);
        this._renderState = Cesium.Appearance.getDefaultRenderState(translucent, closed, options
            .renderState);
        this.uniforms = Cesium.defaultValue(options.uniforms, {});
    }
}

function customAppearance(opt) {
    if (!opt) opt = {};
    //创建自定义appearance
    var myAppearance = new DasAppearance({
        closed: true,
        translucent: true,
        uniforms: {
            myImage: viewer.scene.context.defaultTexture
        }
    });
    //构建纹理
    var imageUri = opt.image;
    Cesium.Resource.createIfNeeded(imageUri).fetchImage().then(function (image) {
        var texture;
        var context = viewer.scene.context;
        if (Cesium.defined(image.internalFormat)) {
            texture = new Cesium.Texture({
                context: context,
                pixelFormat: image.internalFormat,
                width: image.width,
                height: image.height,
                source: {
                    arrayBufferView: image.bufferView
                }
            });
        } else {
            texture = new Cesium.Texture({
                context: context,
                source: image
            });
        }
        myAppearance.uniforms.myImage = texture;
    });
    return myAppearance;
}



//================== 自定义材质 ==================
//纯色材质
function colorMaterial(opt) {
    if (!opt) opt = {};
    return new Cesium.Material({
        fabric: {
            type: 'Color',
            uniforms: {
                color: Cesium.defaultValue(opt.Color, new Cesium.Color(1.0, 1.0, 0.0, 1.0))
            },
            components: {
                diffuse: 'color.bgr',
                alpha: 'color.a'
            }
        },
        translucent: Cesium.defaultValue(opt.translucent, false)
    });
}


//图片材质
export const shaderMaterial = (opt) => {
    if (!opt) opt = {};
    return new Cesium.Material({
        fabric: {
            type: 'MyCustomShader1',
            uniforms: {
                image: opt.image,
                color: Cesium.defaultValue(opt.Color, new Cesium.Color(1.0, 1.0, 0.0, 1.0)),
                cellAlpha: Cesium.defaultValue(opt.cellAlpha, 0.3)
            },
            source: `
                    uniform vec4 color;
                    uniform float cellAlpha;
                    czm_material czm_getMaterial(czm_materialInput materialInput)
                    {
                        czm_material material = czm_getDefaultMaterial(materialInput);
                        vec2 st = materialInput.st;
                        float aa = st.s * st.t;
                        vec3 halfColor = color.rgb * aa + texture2D(image, materialInput.st).rgb * (1.0 - aa);
                        halfColor *= 0.5;
                        material.diffuse = halfColor;
                        material.emission = halfColor;
                        // material.alpha = color.a * aa;
                        material.alpha = 1.0;
                        return material;
                    }
                `
        },
        translucent: Cesium.defaultValue(opt.translucent, false)
    });
}


//组合材质
function compositeMaterial(opt) {
    if (!opt) opt = {};
    return new Cesium.Material({
        fabric: {
            type: 'OurMappedPlastic',
            materials: {
                diffuseMaterial: {
                    type: 'DiffuseMap',
                    uniforms: {
                        image: opt.image1
                    }
                },
                alphaMap: {
                    type: 'AlphaMap',
                    uniforms: {
                        image: opt.image2,
                        channel: 'r'
                    }
                }
            },
            components: {
                diffuse: 'diffuseMaterial.diffuse',
                alpha: 'alphaMap.alpha * 3.0',
            },
        },
        translucent: function () {
            return false;
        }
    });
}

