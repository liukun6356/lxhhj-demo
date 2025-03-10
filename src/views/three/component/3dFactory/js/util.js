import * as THREE from 'three';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';
import {FontLoader} from 'three/examples/jsm/loaders/FontLoader.js';
import {TextGeometry} from 'three/examples/jsm/geometries/TextGeometry.js';

export function clone(obj) {
    var o;
    if (typeof obj == "object") {
        if (obj === null) {
            o = null;
        } else {
            if (obj instanceof Array) {
                o = [];
                for (var i = 0, len = obj.length; i < len; i++) {
                    o.push(clone(obj[i]));
                }
            } else {
                o = {};
                for (var j in obj) {
                    o[j] = clone(obj[j]);
                }
            }
        }
    } else {
        o = obj;
    }
    return o;
}

export function getObjectByUuid(uuid, node) {
    if (node.uuid === uuid) {
        return node;
    }

    for (const child of node.children) {
        const result = getObjectByUuid(uuid, child);
        if (result) {
            return result;
        }
    }

    return null;
}

export function loadeGLTF(name, offset, that, modelInfo, wraningType) {
    const loader = new GLTFLoader().setPath('./data/');
    return new Promise(function (resolve, reject) {
        loader.load(name, function (gltf) {
            offset.y = offset.y + 0.5;
            gltf.scene.p_name = "gltf";
            gltf.scene.wraningType = wraningType;

            gltf.scene.modelInfo = modelInfo;
            gltf.scene.systemId = that._id;
            gltf.scene.systemName = that._name;

            gltf.scene.canHover = true;
            gltf.scene.hoverColor = "#ffffff";
            gltf.scene.poffset = offset;

            const newMaterial = new THREE.MeshStandardMaterial({
                color: "#969595",
                metalness: 0.8,
                roughness: 0.6,
            });

            const Material = new THREE.MeshBasicMaterial({
                color: '#FD529B',
            });
            gltf.scene.traverse(function (child) {
                if (child instanceof THREE.Mesh) {
                    child.castShadow = true;
                    if (child.material.name.indexOf("发光") === -1) {
                        child.material = newMaterial;
                    }
                    if (child.material.name.indexOf("发光") > -1 && wraningType) {
                        child.material = Material;
                      child.material.name = '发光'
                    }
                }
                child.p_name = "gltf";
                child.wraningType = wraningType;
                child.systemId = that._id;
                child.systemName = that._name;
                child.receiveShadow = true;
                child.isChild = true;
            });
            gltf.scene.isChild = false;
            resolve(gltf.scene)
        })
    })

}

// 创建平面
export function createPlane(parentObj, x, y, z, color, width, height) {
    color = color || 0x232323;
    width = width || 50;
    height = height || 6
    const planeGeometry = new THREE.BoxGeometry(width, height, 0.1);
    //const planeGeometry = new THREE.PlaneGeometry(width, height); // 创建平面几何体
    const planeMaterial = new THREE.MeshPhongMaterial({
        color: color,
    });

    const plane = new THREE.Mesh(planeGeometry, planeMaterial); // 创建地板模型

    plane.rotation.x = -0.5 * Math.PI; // 默认平行于xoy面，沿着X轴旋转-90°至xoz面
    plane.receiveShadow = true;
    plane.castShadow = false;
    plane.position.set(x, y, z);
    //plane.z = 1;
    parentObj.add(plane); // 向场景中添加创建的地板
    return plane;
}

export function createGradientPlane(parentObj, x, y, z, colorStart, colorEnd, width, height) {

    // 顶点着色器代码
    const vertexShader = `
  varying vec2 vUv;

  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

    // 片段着色器代码
    const fragmentShader = `
  varying vec2 vUv;
  uniform vec3 colorStart;
  uniform vec3 colorEnd;

  void main() {
    // 控制渐变方向：从左上到右下
    vec2 gradientDirection = normalize(vec2(1.0, 1.0));
    float gradient = dot(vUv, gradientDirection);

    // 设置透明度为1.0
    gl_FragColor = vec4(mix(colorStart, colorEnd, gradient), 1.0);
  }
`;


    colorStart = colorStart || new THREE.Color(0x000000); // 红色
    colorEnd = colorEnd || new THREE.Color(0x000000); // 绿色
    width = width || 50;
    height = height || 6;

    const planeGeometry = new THREE.PlaneGeometry(width, height); // 创建平面几何体

    const gradientMaterial = new THREE.ShaderMaterial({
        uniforms: {
            colorStart: { value: colorStart }, // 转换为数组
            colorEnd: { value: colorEnd } // 转换为数组
        },
        vertexShader: vertexShader,
        fragmentShader: fragmentShader,
        transparent: false
    });

    const plane = new THREE.Mesh(planeGeometry, gradientMaterial); // 创建平面模型

    plane.rotation.x = -0.5 * Math.PI; // 默认平行于xoy面，沿着X轴旋转-90°至xoz面
    plane.receiveShadow = true;
    plane.castShadow = false;
    plane.position.set(x, y, z);

    parentObj.add(plane); // 向场景中添加创建的平面
    return plane;
}

// export function getTextCanvas(str, x, y, z,width,height) {
//   //用canvas生成图片
//   let canvas = document.createElement("canvas");
//   let ctx = canvas.getContext('2d')
//   canvas.width = width || 200
//   canvas.height = height || 40
//   //设置文字
//   ctx.fillStyle = "white";
//   ctx.font = 'normal 45px "楷体"'
//   ctx.fillText(str, 1, 34)
//
//   const geometry1 = new THREE.PlaneGeometry(4 ,1.5); // 根据 Canvas 宽高比设置几何体大小
//   // 导入图片贴图
//   const texture =  new THREE.TextureLoader().load(canvas.toDataURL('image/png'));
//   // const texture =  new THREE.TextureLoader().load('./assets/img/wz@2x.png');
//   texture.wrapS = THREE.ClampToEdgeWrapping; // RepeatWrapping
//   texture.wrapT = THREE.ClampToEdgeWrapping;
//   texture.repeat.set(1, 1); // 设置贴图的重复次数，可以根据需要进行调整
//   const material1 = new THREE.MeshBasicMaterial({
//     map: texture,
//     side: THREE.DoubleSide,
//     opacity: 1,
//     transparent: true,
//     // 设置贴图映射方式为 ClampToEdgeWrapping，确保贴图不重复
//   });
//
//   const rect = new THREE.Mesh(geometry1, material1);
//   rect.position.set(x, y, z);
//   rect.rotation.x = -Math.PI / 2;
//   rect.rotation.z = Math.PI / 2;
//   rect.canHover = false;
//   return rect;
// }

const loader = new FontLoader();
let fontPromise = null;
let font = null;

// 定义异步函数以加载字体
function loadFont() {
    if (!fontPromise) {
        fontPromise = new Promise((resolve, reject) => {
            loader.load('./data/PingFangSC-Medium_Medium.json', function (response) {
                font = response;
                resolve();
            }, undefined, reject);
        });
    }
    return fontPromise;
}



// 定义函数，使用加载字体后创建textMesh
export async function getTextCanvas(str, x, y, z, size) {
    await loadFont(); // 等待字体加载完成

    const textGeometry = new TextGeometry(str, {
        font: font,
        size: size || 0.7,
        height: 0.01,
        curveSegments: 12,
        bevelEnabled: false,
    });

    textGeometry.computeBoundingBox();
    const textMaterial = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 1,
    });

    const textMesh = new THREE.Mesh(textGeometry, textMaterial);
    textMesh.position.set(x, -3 + y, z);
    textMesh.rotation.z = Math.PI / 2;

    return textMesh;
}


export function setGLTFEmissiveColor(gltf, color) {
    gltf.traverse(function (child) {
        if (child.isMesh) {
            if (child.material.name.indexOf("发光") > -1) {
                child.material.emissive = new THREE.Color(color);
            }
        }

    })
}


