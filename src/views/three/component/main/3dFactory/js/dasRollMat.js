import * as THREE from 'three';
class dasRollMat {

    constructor(options) {
        this.parent = options.that;
        this._obj3D = options.obj3D || scene;
        this._imgUrl = options.imgUrl;
        this._position = options.position || {
            x: -3,
            y: 0.2,
            z: 0.3,
        };
        this._size = options.size || { a: 3, b: 0.3 }
        this._color1 = options.color1;
        this._color2 = options.color2;
        this.RollTexture = new THREE.TextureLoader().load(this._imgUrl);
        this.RollTexture.wrapS = THREE.RepeatWrapping;
        this.RollTexture.wrapT = THREE.RepeatWrapping;
        this.RollMat;
        this.behind = options.behind || false;
        this.systemId = this.parent._id;
        this.systemName = this.parent._name;
        this.p_name = "RollMat";
        return this.createRollMat();
    }
    createRollMat() {
        var that = this;
        // 创建自定义片段着色器
        var fragmentShader = `
                varying vec2 vUv;
                uniform float time;
                uniform vec2 resolution;
                uniform vec2 lightDirection;
                uniform sampler2D map;
                uniform float speed;
                uniform float amplitude;
                uniform vec3 color1; // 添加一个 uniform 变量来传递颜色 color1
    uniform vec3 color2; // 添加一个 uniform 变量来传递颜色 color2
                        float smoothStep(float edge0, float edge1, float x) {
                                float t = clamp((x - edge0) / (edge1 - edge0), 0.0, 1.0);
                                return t * t * (3.0 - 2.0 * t);
                            }
                void main() {
                    // 计算纹理坐标
                    vec2 uv = vUv;
                    // 根据光照方向计算当前像素点到光源的向量
                    vec2 lightVector = normalize(lightDirection);
                    // 计算从光源到当前像素的距离比例
                    float distanceFromLight = dot(uv, lightVector);
                    // 计算呼吸灯效果的周期
                    float period = 0.8;
                    // 计算呼吸灯效果的幅度
                    float amplitude1 = amplitude;
                    // 计算呼吸灯效果的强度，从光源方向向外逐渐减弱
                    float intensity = amplitude1 * sin(time / period -1.5 + distanceFromLight * 3.14) + amplitude1;
                    float repeatFactor = 0.35;
                    // 计算偏移量，确保在一轮循环结束后重新从绿色开始渐变
                    float offset = mod(time * speed, repeatFactor);
                    // 将uv坐标的x值映射到[0, 1]区间，并乘以repeatFactor来控制循环次数
                    float x = (vUv.x + 0.0) * repeatFactor;
                    // 对x做平滑转换
                    float smoothedX = smoothStep(0.0, 1.0, x);
                    // 插值颜色从color1到color2，离起点越远颜色越深
                   
                    vec3 color = mix(color1, color2, smoothedX);
                    vec4 textureColor = texture2D(map, vec2(x, vUv.y));
                    gl_FragColor =vec4(color, textureColor.a)* intensity;
                }`
        // 创建自定义顶点着色器

        var vertexShader = ` varying vec2 vUv;
            void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }  `;

        // 创建Shader材质
        this.RollMat = new THREE.ShaderMaterial({
            uniforms: {
                map: { value: that.RollTexture },
                time: { value: 0.0 }, // 控制时间变量，实现贴图运动
                speed: { value: 0.2 }, // 运动速度控制
                resolution: { value: new THREE.Vector2() },
                lightDirection: { value: new THREE.Vector2(1.0, 0.0) }, // 默认光照方向为右侧
                amplitude: { value: 0.35 },
                color1: { value: new THREE.Vector3(this._color1.r, this._color1.g, this._color1.b) },
                color2: { value: new THREE.Vector3(this._color2.r, this._color2.g, this._color2.b) },
            },
            vertexShader, // 设置顶点着色器
            fragmentShader, // 设置片段着色器
            transparent: true,
        });

        // 创建平面
        const geometry = new THREE.PlaneGeometry(this._size.a, this._size.b);
        const obj = new THREE.Mesh(geometry, this.RollMat);
        //obj.rotation.x = Math.PI / 2;
        if (this.behind) {
            obj.rotation.z = Math.PI;
        }
        obj.p_name = this.p_name;
        obj.systemId = this.systemId;
        obj.systemName = this.systemName
        obj.position.set(this._position.x, this._position.y, this._position.z);
        this._obj3D.add(obj);
        return this.RollMat;

    }
    // animate(op) {
    //     requestAnimationFrame(op.animate);
    //     this.RollMat.uniforms.time.value += 0.005; // 控制时间变量，实现贴图运动
    // }
}
export { dasRollMat };
