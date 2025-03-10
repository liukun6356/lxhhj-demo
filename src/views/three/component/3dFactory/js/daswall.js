import * as THREE from 'three';
class dasWalllib {

    constructor(manager) {

        // super(manager);
        this.height = manager.height || 1;

        this.vertexs = {
            normal_vertex: "\n  precision lowp float;\n  precision lowp int;\n  "
                .concat(
                    THREE.ShaderChunk.fog_pars_vertex,
                    "\n  varying vec2 vUv;\n  void main() {\n    vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );\n    vUv = uv;\n    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);\n    "
                )
                .concat(THREE.ShaderChunk.fog_vertex, "\n  }\n"),
        };
        this.fragments = {
            rippleWall_fragment:
                "\n  precision lowp float;\n  precision lowp int;\n  uniform float time;\n  uniform float opacity;\n  uniform vec3 color;\n  uniform float num;\n  uniform float hiz;\n\n  varying vec2 vUv;\n\n  void main() {\n    vec4 fragColor = vec4(0.2);\n    float sin = sin((vUv.y - time * hiz) * 10. * num);\n    float high = 0.92;\n    float medium = 0.4;\n    if (sin > high) {\n      fragColor = vec4(mix(vec3(.8, 1., 1.), color, (1. - sin) / (1. - high)), 1.);\n    } else if(sin > medium) {\n      fragColor = vec4(color, mix(1., 0., 1.-(sin - medium) / (high - medium)));\n    } else {\n      fragColor = vec4(color, 0.);\n    }\n\n    vec3 fade = mix(color, vec3(0., 0., 0.), vUv.y);\n    fragColor = mix(fragColor, vec4(fade, 1.), 0.85);\n    gl_FragColor = vec4(fragColor.rgb, fragColor.a * opacity * (1. - vUv.y));\n  }\n",
        };
        this.custMaterial1 = new THREE.ShaderMaterial({
            uniforms: {
                time: {
                    type: "pv2",
                    value: 0,
                },
                color: {
                    type: "uvs",
                    value: new THREE.Color("#FFBF00"),
                },
                opacity: {
                    type: "pv2",
                    value: 0.5,
                },
                num: {
                    type: "pv2",
                    value: 3,
                },
                hiz: {
                    type: "pv2",
                    value: 0.05,
                },
            },
            vertexShader: this.vertexs.normal_vertex,
            fragmentShader: this.fragments.rippleWall_fragment,
            blending: THREE.AdditiveBlending,
            transparent: true,
            depthWrite: false,
            depthTest: true,
            side: THREE.DoubleSide,
        });
        this.mesh;

    }

    addShape(c) {
        let posArr = [];
        let uvrr = [];
        let h = 2; //围墙拉伸高度
        for (let i = 0; i < c.length - 2; i += 2) {
            // 围墙多边形上两个点构成一个直线扫描出来一个高度为h的矩形
            // 矩形的三角形1
            posArr.push(c[i], c[i + 1], 0, c[i + 2], c[i + 3], 0, c[i + 2], c[i + 3], h);
            // 矩形的三角形2
            posArr.push(c[i], c[i + 1], 0, c[i + 2], c[i + 3], h, c[i], c[i + 1], h);

            // 注意顺序问题，和顶点位置坐标对应
            uvrr.push(0, 0, 1, 0, 1, 1);
            uvrr.push(0, 0, 1, 1, 0, 1);
        }
        let geometry = new THREE.BufferGeometry(); //声明一个空几何体对象
        // 设置几何体attributes属性的位置position属性
        geometry.attributes.position = new THREE.BufferAttribute(new Float32Array(posArr), 3);
        // 设置几何体attributes属性的位置uv属性
        geometry.attributes.uv = new THREE.BufferAttribute(new Float32Array(uvrr), 2);
        geometry.computeVertexNormals()
        let mesh = new THREE.Mesh(geometry, this.custMaterial1); //网格模型对象Mesh
        mesh.rotateX(-Math.PI / 2);
        this.mesh = mesh;
        return mesh
    }

    getGeometryPosition(positions, offset) {
        const vertexCount = positions.length / 3;

        var maxX = -Number.MAX_VALUE, minX = Number.MAX_VALUE;
        var maxY = -Number.MAX_VALUE, minY = Number.MAX_VALUE;
        for (let i = 0; i < vertexCount; i++) {
            const x = positions[i * 3] + offset.x;
            const y = (positions[i * 3 + 1] - offset.z);
            maxX = Math.max(maxX, x);
            minX = Math.min(minX, x);
            maxY = Math.max(maxY, y);
            minY = Math.min(minY, y);
        }
        return [minX, minY, minX, maxY, maxX, maxY, maxX, minY, minX, minY]
    }



}

export { dasWalllib };
