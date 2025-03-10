import * as THREE from 'three';
//边缘墙
import {dasWalllib} from './daswall.js'
//箭头
import {dasRollMat} from './dasRollMat.js'
//小标签
import {dasImgTags} from './dasImgTags.js'
import * as util from './util.js'
import {CSS2DObject,} from "three/examples/jsm/renderers/CSS2DRenderer.js";

// 图片
import linePng from "@/assets/images/3dFactory/line.png"
import ph from '@/assets/images/3dFactory/ph.svg'
import qg from '@/assets/images/3dFactory/qg.svg'
import gg from '@/assets/images/3dFactory/gg.svg'
import tsyj from '@/assets/images/3dFactory/tsyj.svg'
import yj from '@/assets/images/3dFactory/yj.svg'
import EI from '@/assets/images/3dFactory/EI.svg'
import EI2 from '@/assets/images/3dFactory/EI2.svg'

class heatingSystem {
    constructor(options) {
        this._position = this.defaultValue(options.position, {x: 0, y: 0, z: 0});
        this._id = this.defaultValue(options.id, this.guid());
        this._name = this.defaultValue(options.name, "xxx");
        this._camera = options.camera;
        this.labelRendererArr = options.labelRendererArr;
        this.labelRenderer = options.labelRenderer;
        this.floorPanelMesh = null
        this.systemInfo = null
        this.systemWarningTags = null
        this.lineArr = [];

        /** 模型id */
        this.options = options.options

        /**以下为可编辑值*/
        //热源厂
        this._HeatSourcePlant_max = this.options.sourceB || 0
        this._HeatSourcePlant_min = this.options.sourceT || 0
        this._HeatSourcePlant_warningNum = this.options.warningNum || 0
        this._HeatSourcePlant_warningType = this._HeatSourcePlant_warningNum > 0

        //机组
        this._ThermalUnit_max = this.options.unitB || 0
        this._ThermalUnit_min = this.options.unitT || 0
        this._ThermalUnit_warningNum = this.options.warningNum_2 || 0
        this._ThermalUnit_warningType = this._ThermalUnit_warningNum > 0


        //热单元
        this._ThermodynamicUnit_max = this.options.hallB || 0
        this._ThermodynamicUnit_min = this.options.hallT || 0
        this._ThermodynamicUnit_warningNum = this.options.warningNum_3 || 0;
        this._ThermodynamicUnit_warningType = this._ThermodynamicUnit_warningNum > 0


        /**以下为功能所需属性*/
        this._scene = options.scene;
        this.systemGroup = new THREE.Group();// 系统组
        this.obj3d = new THREE.Object3D(); //存储对象
        this.systemPosition = this.defaultValue(options.position, {x: 0, y: 0, z: 0})
        this.FloorPanelMesh = "";// 底板
        //描边用参数,全局使用同一个,不然浪费资源
        this._outlinePass = options.outlinePass;
        this.systemClick = options.systemClick; //系统点击事件
        this.gltfClick = options.gltfClick;
        this.RollMatArr = []; //做动画用的
        this.wallCustMaterial; //做动画用的
        this.createSystem();
        this.systemGroup.add(this.obj3d);
        this._scene.add(this.systemGroup)
        this.LabelObj3d = new THREE.Object3D();//存储广告牌
        this.systemGroup.add(this.LabelObj3d);
        this.imageTagsArr = [];
        this.gltfArr = [];
        this.wallMesh;
        this.systemNameBullboard;//系统名称广告牌
        //  this._scene.add(this.obj3d)
        return this;
    }

    gltfArrarr = []

    /**
     * 创建system主体
     */
    async createSystem() {
        //创建底板
        const that = this;
        this.createFloorPanel(50, 6, 0.5, this._position);

        const hotSourceTypeInfo = this.hotSourceTypeInfo(this.options.hotSource)
        util.loadeGLTF(hotSourceTypeInfo.name + '.glb', util.clone(this._position), this, {
            id: this.options.system_id,
            type: 1
        }, that._HeatSourcePlant_warningType).then(async function (gltf) {
            var offset = gltf.poffset;
            //添加进数组保存起来
            that.gltfArr.push({
                name: "热源厂",
                id: gltf.uuid,
                obj: gltf
            });
            that.gltfArrarr.push({
                name: "热源厂",
                id: gltf.uuid,
                obj: gltf
            })

            gltf.position.set(hotSourceTypeInfo.offsetX + offset.x, hotSourceTypeInfo.offsetY + offset.y, hotSourceTypeInfo.offsetZ + offset.z);
            gltf.rotation.y = hotSourceTypeInfo.rotationY * Math.PI;
            gltf.showTips = function () {
                if (!gltf.tipsTytpe) {
                    if (that._HeatSourcePlant_warningNum > 0) {
                        var position = {
                            x: -23 + offset.x,
                            y: 5 + offset.y,
                            z: offset.z
                        }
                        that.CreateTips(that._HeatSourcePlant_warningNum, position, gltf.uuid, 1);
                        gltf.tipsTytpe = true;
                    }

                }
            }
            gltf.deleteTips = function () {
                if (gltf.tipsTytpe && that.imageTagsArr.length > 0) {
                    var uuid = gltf.uuid;
                    for (var i = 0; i < that.imageTagsArr.length; i++) {
                        if (that.imageTagsArr[i].tag == uuid) {
                            if (that.imageTagsArr[i].delete) {
                                that.imageTagsArr[i].delete()
                            }
                        }
                    }
                    gltf.tipsTytpe = false;
                }
            }
            gltf.showBillboard = function (labelRendererArr) {
                if (!gltf.BillboardTytpe) {
                    var str = `
                <div>
    <div class="pop-container">
      <div class="pop-box">

        <div class="monitor_tips_content">
          <div class="Billboard_bt"><span>热源厂</span></div>
          <div class="Billboard_str"><span class='Billboard_red'>` + that._HeatSourcePlant_min + `</span><span>/` + that._HeatSourcePlant_max + `</span></div>
        </div>
      </div>
      <div class="Billboard_line"></div>
    </div>
    <div>.</div>
  </div> `
                    that.CreateBillboard(labelRendererArr, {x: -23 + offset.x, y: 0.3 + offset.y, z: 0 + offset.z}, str)
                    gltf.BillboardTytpe = true;
                }
            }
            gltf.deleteBillboard = function () {
                that.deleteBillboard();
                gltf.BillboardTytpe = false;
            }
            gltf.showTips()
            that.obj3d.add(gltf);
            /*加载热源厂文字*/
            var rycLabel = await util.getTextCanvas("热源厂", -17, 1.6, 0.5);
            //	rycLabel.baseUUID = baseUUID;
            rycLabel.rotation.x = Math.PI * 2;
            that.FloorPanelMesh.add(rycLabel);
        });

        /*加载机组模型*/
        util.loadeGLTF('model7.glb', util.clone(this._position), this, {
            id: this.options.system_id,
            type: 2
        }, that._ThermalUnit_warningType).then(async function (gltf) {
            var offset = gltf.poffset;
            //添加进数组保存起来
            that.gltfArr.push({
                name: "机组",
                id: gltf.uuid,
                obj: gltf
            });
            that.gltfArrarr.push({
                name: "机组",
                id: gltf.uuid,
                obj: gltf
            })
            gltf.position.set(0 + offset.x, 0.5 + offset.y, -0.5 + offset.z);
            gltf.rotation.y = -0.5 * Math.PI;
            gltf.showTips = function () {
                if (!gltf.tipsTytpe) {
                    if (that._ThermalUnit_warningNum > 0) {
                        var position = {
                            x: 0 + offset.x,
                            y: 5 + offset.y,
                            z: offset.z
                        }
                        that.CreateTips(that._ThermalUnit_warningNum, position, gltf.uuid, 1);
                        gltf.tipsTytpe = true;
                    }

                }
            }
            gltf.showBillboard = function (labelRendererArr) {
                if (!gltf.BillboardTytpe) {
                    var str = `
                <div>
    <div class="pop-container">
      <div class="pop-box">

        <div class="monitor_tips_content">
          <div class="Billboard_bt"><span>机组</span></div>
          <div class="Billboard_str"><span class='Billboard_red'>` + that._ThermalUnit_min + `</span><span>/` + that._ThermalUnit_max + `</span></div>
        </div>
      </div>
      <div class="Billboard_line"></div>
    </div>
    <div>.</div>
  </div> `


                    that.CreateBillboard(labelRendererArr, {x: offset.x - 1, y: 0.5 + offset.y, z: 0 + offset.z}, str)
                    gltf.BillboardTytpe = true;
                }
            }
            gltf.deleteBillboard = function () {
                that.deleteBillboard();
                gltf.BillboardTytpe = false;
            }
            gltf.showTips()
            that.obj3d.add(gltf);
            /*加载机组文字*/
            var jzLabel = await util.getTextCanvas("机组", 6, 2, 0.5);

            jzLabel.rotation.x = Math.PI * 2;
            that.FloorPanelMesh.add(jzLabel);
        });

        /*加载热单元模型*/
        util.loadeGLTF('zz.glb', util.clone(this._position), this, {
            id: this.options.system_id,
            type: 3
        }, that._ThermodynamicUnit_warningType).then(async function (gltf) {
            var offset = gltf.poffset;
            //添加进数组保存起来
            that.gltfArr.push({
                name: "热单元",
                id: gltf.uuid,
                obj: gltf
            });
            that.gltfArrarr.push({
                name: "热单元",
                id: gltf.uuid,
                obj: gltf
            })
            gltf.position.set(20 + offset.x, 0.5 + offset.y, 0.5 + offset.z);
            gltf.rotation.y = -Math.PI;
            gltf.showBillboard = function (labelRendererArr) {
                if (!gltf.BillboardTytpe) {
                    var str = `
      <div>
    <div class="pop-container">
      <div class="pop-box">
        <div class="monitor_tips_content">
          <div class="Billboard_bt"><span>热单元</span></div>
          <div class="Billboard_str">
          <span class="Billboard_red">` + that._ThermodynamicUnit_min + `</span
          ><span>/` + that._ThermodynamicUnit_max + `</span>
          </div>
        </div>
      </div>
        <div class="Billboard_line"></div>
    </div>
    <div>.</div>
  </div>
`
                    that.CreateBillboard(labelRendererArr, {x: 20 + offset.x, y: 0.5 + offset.y, z: 0 + offset.z}, str)
                    gltf.BillboardTytpe = true;
                }
            }
            gltf.deleteBillboard = function () {
                that.deleteBillboard();
                gltf.BillboardTytpe = false;
            }
            gltf.showTips = function () {
                if (!gltf.tipsTytpe) {
                    if (that._ThermodynamicUnit_warningNum > 0) {
                        var position = {
                            x: 21 + offset.x,
                            y: 6 + offset.y,
                            z: offset.z - 0.5
                        }
                        that.CreateTips(that._ThermodynamicUnit_warningNum, position, gltf.uuid, 1);
                        gltf.tipsTytpe = true;
                    }

                }
            }
            gltf.showTips()
            that.obj3d.add(gltf);

            /*加载热单元文字*/
            var rdyLabel = await util.getTextCanvas("热单元/栋", 24, 0.8, 0.5);
            //rdyLabel.baseUUID = baseUUID
            rdyLabel.rotation.x = Math.PI * 2;
            that.FloorPanelMesh.add(rdyLabel);

        });


        //组名
        // var ItemLabel = util.getTextCanvas(that._name, this._position.x + 26.5, this._position.y + 0.8, this._position.z + 0.1, 280, 40);
        //	ItemLabel.baseUUID = baseUUID
        // ItemLabel.rotation.z = Math.PI * 0.5;
        // that.obj3d.add(ItemLabel);

        var statusBarLeft = util.createPlane(that.obj3d, this._position.x + 25.5, this._position.y + 0.5, this._position.z + 3 / 2, this.options.warningSum > 0 ? '#FFBF00' : '#484848', 3, 0.2);
        statusBarLeft.rotation.z = Math.PI * 0.5;

        var statusBarRight = util.createPlane(that.obj3d, this._position.x + 25.5, this._position.y + 0.5, this._position.z - 3 / 2, this.options.supplyType == 0 ? '#2978FF' : this.options.supplyType == 2 ? '#EA6C01' : '#484848', 3, 0.2);
        statusBarRight.rotation.z = Math.PI * 0.5;

        var RollMat1 = new dasRollMat({
            obj3D: that.FloorPanelMesh,
            imgUrl: linePng,
            that: this,
            position: {
                x: -10,
                y: -1,
                z: 0.5,
            },
            size: {a: 8, b: 0.6},
            color1: new THREE.Color(0xffcc99),
            color2: new THREE.Color(0xff9933),
            behind: true
        })
        var RollMat1_1 = new dasRollMat({
            obj3D: that.FloorPanelMesh,
            imgUrl: linePng,
            that: this,
            position: {
                x: -10,
                y: 1,
                z: 0.5,
            },
            size: {a: 8, b: 0.6},
            color1: new THREE.Color(0x0099cc),
            color2: new THREE.Color(0xccffff),
            behind: false
        })
        var RollMat2 = new dasRollMat({
            obj3D: that.FloorPanelMesh,
            imgUrl: linePng,
            that: this,
            position: {
                x: 13,
                y: -1,
                z: 0.5,
            },
            size: {a: 8, b: 0.6},
            color1: new THREE.Color(0xffcc99),
            color2: new THREE.Color(0xff9933),
            behind: true
        })
        var RollMat2_2 = new dasRollMat({
            obj3D: that.FloorPanelMesh,
            imgUrl: linePng,
            that: this,
            position: {
                x: 13,
                y: 1,
                z: 0.5,
            },
            size: {a: 8, b: 0.6},
            color1: new THREE.Color(0x0099cc),
            color2: new THREE.Color(0xccffff),
            behind: false
        })
        that.RollMatArr.push(RollMat1, RollMat1_1, RollMat2, RollMat2_2)
        this.createSystemInfo()
    }

    /**
     * 创建底板
     * @param {number} width 长度
     * @param {number} height 宽度
     * @param {number} depth  高度
     * @param {Vector3} position  位置
     */
    createFloorPanel(width, height, depth, position) {
        // const floorMaterial = new THREE.MeshPhongMaterial({ side: THREE.DoubleSide, color: 0x242424 });
        const floorMaterial = new THREE.MeshStandardMaterial({
            color: "#696868",
            metalness: 0.6,
            roughness: 0.6,
        });
        const floorGeometry = new THREE.BoxGeometry(width, height, depth);
        const floorMesh = new THREE.Mesh(floorGeometry, floorMaterial);
        floorMesh.rotation.x = -Math.PI * 0.5;

        floorMesh.receiveShadow = true;
        if (position) {
            floorMesh.position.set(position.x, position.y + 0.5, position.z);
        }
        floorMesh.p_name = "floorPanel";
        floorMesh.systemId = this._id;
        floorMesh.systemName = this._name;
        floorMesh.options = this.options;
        this.FloorPanelMesh = floorMesh;
        this.bindFloorPanelEvent(floorMesh);

        this.systemGroup.add(floorMesh);
        this.floorPanelMesh = floorMesh;

        // this.createWallLine()
    }


    /**
     * 绑定底座的事件,底座点击的回调事件通过创建的参数来绑定调用, 参数名是systemClick 参数类型是function
     * @param {*} Mesh
     */
    bindFloorPanelEvent(Mesh) {
        var that = this;
        var hoverEvent = function (outlinePass) {
            outlinePass.selectedObjects = [that.FloorPanelMesh];
            //that.CreateBillboard(floorMesh.position)
        }
        var clickEvent = function (outlinePass, labelRendererArr) {
            outlinePass.selectedObjects = [that.FloorPanelMesh];
            if (that.systemClick) {
                that.systemClick(that.FloorPanelMesh);
            }
            that.gltfArr.forEach((item) => {
                item.obj.showBillboard(labelRendererArr)
            })

        }
        that.FloorPanelMesh.hoverEvent = hoverEvent;
        that.FloorPanelMesh.clickEvent = clickEvent;
    }


    /**
     * 创建系统信息
     * */
    createSystemInfo() {
        var str = `
        <div class="content">
           <img src="${this.options.supplyType === 1 ? ph : (this.options.supplyType === 0 ? qg : gg)}">
              <img src="${this.options.warningSum > 0 ? tsyj : yj}">
                 <img src="${this.options.EI ? EI : EI2}">
                         <span>${this.options.name}</span>
        </div>
 `
        var offset = this._position;
        const chinaDiv = document.createElement('div');
        chinaDiv.className = "three_systemName";
        chinaDiv.id = "three_systemName";
        chinaDiv.innerHTML = str;
        var chinaLabel = new CSS2DObject(chinaDiv);
        chinaLabel.position.set(28, 3, 0);//三维位置xyz
        this.systemInfo = chinaLabel;
    }

    /**
     * 显示系统信息
     * */
    showSystemInfo() {
        if (this.systemInfo) this.floorPanelMesh.add(this.systemInfo)


    }

    /**
     * 移除系统信息
     * */
    hideSystemInfo() {
        this.systemInfo?.parent?.remove(this.systemInfo);
    }


    /**
     * wall创建
     * */

    createWallLine() {
        const startYPos = 0; // 起点Y坐标
        const endYPos = 1.5; // 终点Y坐标
        const speed = 0.005; // 运动速度

        this.createLineAnimation(
            this.floorPanelMesh,
            4,
            startYPos,
            endYPos,
            speed,
        );
    }

    /**
     * 显示墙体
     * */
    showWallLine() {
        this.setGltfColor(0xffffff)
        // 打开黄色预警
        this.showWarningTag()
        if (this.lineArr.length < 1) {
            // 如果没有创建过墙体，就创建墙体
            this.createWallLine()
        }
        // 添加墙体
        this.lineArr.forEach(item => {
            this.floorPanelMesh.add(item)
        })
        // 隐藏小标签
        this.imageTagsArr.forEach(item => {
            item.delete()
        })
        // 开启动画
        this.startAnimation()
    }

    /**
     * 隐藏墙体
     * */
    hideWallLine() {
        this.setGltfColor(0xFD529B)
        // 关闭黄色预警
        this.hideWarningTag()
        this.lineArr.forEach(item => {
            // 移除墙体
            this.floorPanelMesh.remove(item)
        })
        this.imageTagsArr.forEach(item => {
            // 显示小标签
            item.start()
        })
        // 停止动画
        this.stopAnimation()
    }

    setGltfColor(color) {
        this.gltfArr.forEach(item => {
            const gltf = item.obj
            gltf.traverse(function (child) {
                if (child instanceof THREE.Mesh) {
                    if (child.material.name.indexOf("发光") > -1 && child.wraningType) {
                        child.material.color.set(color)
                    }
                }
            });
        })
    }

    /**
     * 停止动画
     * */
    stopAnimation() {
        if (this.animationId !== null) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }

    /**
     * wall动画
     * */

    createLineAnimation(plane, numLines, startYPos, endYPos, speed) {
        const planeGeometry = plane.geometry;
        const planeWidth = planeGeometry.parameters.width;
        const planeHeight = planeGeometry.parameters.height;

        const spacing = (endYPos - startYPos) / numLines; // 光线之间的垂直间距

        let yPositions = []; // 存储每个光线的Y坐标

        let resetLine = -1; // 重置的光线索引，初始为-1表示没有需要重置的光线

        let opacity = 0.2

        for (let i = 0; i < numLines; i++) {
            yPositions.push(startYPos + i * spacing); // 计算每个光线的Y坐标
            const lineGeometry = new THREE.BufferGeometry().setFromPoints([
                new THREE.Vector3(-planeWidth / 2, -planeHeight / 2, 0.55),
                new THREE.Vector3(-planeWidth / 2, planeHeight / 2, 0.55),
                new THREE.Vector3(planeWidth / 2, planeHeight / 2, 0.55),
                new THREE.Vector3(planeWidth / 2, -planeHeight / 2, 0.55),
                new THREE.Vector3(-planeWidth / 2, -planeHeight / 2, 0.55),
            ]);
            const lineMaterial = new THREE.LineBasicMaterial({color: 0xE0C050, transparent: true, opacity: opacity});
            const line = new THREE.Line(lineGeometry, lineMaterial);
            this.lineArr.push(line);
            opacity += 0.2
        }

        let startTime = null;
        let animationId = null; // 用于存储requestAnimationFrame的返回值
        let that = this

        function animate(timestamp) {
            if (!startTime) {
                startTime = timestamp;
            }

            // 计算已过时间
            const elapsedTime = timestamp - startTime;

            // 使用正弦函数模拟光线的垂直运动
            for (let i = 0; i < numLines; i++) {
                const yOffset = Math.sin(elapsedTime * speed + i * 0.5) * 0.1; // 0.01是振幅，可以根据需要调整
                that.lineArr[i].position.z = yPositions[i] + yOffset;
            }

            // 继续请求下一帧
            animationId = requestAnimationFrame(animate);
        }

        // 停止动画
        // function stopAnimation() {
        //   if (animationId !== null) {
        //     cancelAnimationFrame(animationId);
        //     animationId = null;
        //   }
        // }
        // this.stopAnimation = stopAnimation

// 启动动画
        function startAnimation() {
            // that.gltfArr.forEach(item=>{
            //   item.deleteTips?.()
            // })
            requestAnimationFrame(animate);
        }

        this.startAnimation = startAnimation
    }

    /**
     * 显示黄色预警
     * */
    showWarningTag() {
        const text = JSON.parse(JSON.stringify(this.options.warningSum))
        if (text < 1 || this.systemWarningTags) return
        console.log(this.options.warningSum, 'this.options.warningSum')
        this.systemWarningTags = new dasImgTags({
            obj3D: this.floorPanelMesh,
            moveRange: 1,
            scale: 2.5,
            scaleRange: 1,
            text: text,
            position: {x: -27, y: 6, z: 5},
            typeNum: 0, //0是黄色， 1 是红色
            moveZ: true
        })
    }

    /**
     * 隐藏黄色预警
     * */
    hideWarningTag() {
        this.systemWarningTags?.delete()
        this.systemWarningTags = null
    }


    /**
     * 创建标签
     * @param {number} num  标签显示的数字
     * @param {Vector3} position  标签位置
     * @param {string} tag  标签对应的是哪个对象 uuid
     * @param {number} type 标签颜色0是黄色 1是红色
     */
    CreateTips(num, position, tag, type) {
        this.imageTagsArr.push(new dasImgTags({
            obj3D: this._scene,
            moveRange: 1,
            scale: 2,
            scaleRange: 1,
            text: num,
            position: position,
            typeNum: type, //0是黄色， 1 是红色
            tag: tag//用于记录绑定于哪个对象,可以删除
        }))
    }


    /**
     * 创建广告牌
     * @param {array} labelRendererArr 保存广告牌的数组
     * @param {Vector3} position  广告牌位置
     * @param {string} htmlStr  html 拼接字符串
     */
    CreateBillboard(labelRendererArr, position, htmlStr) {
        //  var obj3d = new THREE.Object3D(); //存储对象

        const chinaDiv = document.createElement('div');
        // chinaDiv.className = "";
        // chinaDiv.id = "pop-box";
        chinaDiv.innerHTML = htmlStr;
        var chinaLabel = new CSS2DObject(chinaDiv);
        chinaLabel.position.set(position.x - 2, position.y + 0, position.z);//三维位置xyz


        const lineEndPosition = new THREE.Vector3(-3, -25, 0); // 根据需要调整坐标
        const lineGeometry = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-3, -3, 0), lineEndPosition]);
        const lineMaterial = new THREE.LineBasicMaterial({color: 0xffffff});
        const line = new THREE.Line(lineGeometry, lineMaterial);

        // 将 line 添加到 chinaLabel 中
        // chinaLabel.add(line);


        this.LabelObj3d.add(chinaLabel)


        labelRendererArr.push(this.labelRenderer);
        return chinaLabel
    }

    /**
     * 删除所有广告牌
     */
    deleteBillboard() {
        this.LabelObj3d.clear();
    }

    /**
     * 创建墙
     */
    createWall() {
        var dasWall = new dasWalllib({height: 0.2});
        this.wallCustMaterial = dasWall.custMaterial1; //帧渲染的时候做动画用
        var positions = this.FloorPanelMesh.geometry.attributes.position.array;
        var GeometryPoints = dasWall.getGeometryPosition(positions, this.FloorPanelMesh.position)
        this.wallMesh = dasWall.addShape(GeometryPoints);
        this.wallMesh.p_name = "wall";
        this.wallMesh.systemId = this._id;
        this.wallMesh.systemName = this._name;
        this.systemGroup.add(this.wallMesh)
    }

    /**
     * 删除墙
     */
    deleteWall() {
        if (this.wallCustMaterial) {
            this.wallCustMaterial.dispose();
            if (this.wallCustMaterial.map) {
                this.wallCustMaterial.map.dispose();
            }
        }

        this.systemGroup.remove(this.wallMesh);
        this.wallMesh = null;

        this.wallCustMaterial = null
    }

    /**
     * 热源类型
     * */
    hotSourceTypeInfo(type) {
        if (type === 0) {
            return {
                offsetX: -21,
                offsetY: 0.8,
                offsetZ: 0,
                rotationY: -0.5,
                name: 'model10'
            }
        } else if (type === 1) {
            return {
                offsetX: -21,
                offsetY: 0.5,
                offsetZ: -1,
                rotationY: 1,
                name: 'model6'
            }
        } else if (type === 2) {
            return {
                offsetX: -23,
                offsetY: 0.5,
                offsetZ: -1.5,
                rotationY: -0.5,
                name: 'model4'
            }
        }
    }


    animate(that) {
        if (typeof that.wallCustMaterial !== 'undefined' && that.wallCustMaterial != null) {
            that.wallCustMaterial.uniforms.time.value += 0.015;
        }
        if (that.RollMatArr.length > 0) {
            for (var i = 0; i < that.RollMatArr.length; i++) {
                that.RollMatArr[i].uniforms.time.value += 0.005;
                that.RollMatArr[i].uniforms.time.value = performance.now() / 1000; // 使用时间控制呼吸灯效果
                that.RollMatArr[i].uniforms.resolution.value.x = window.innerWidth;
                that.RollMatArr[i].uniforms.resolution.value.y = window.innerHeight;
            }
        }
        if (that.labelRendererArr) {
            for (var i = 0; i < that.labelRendererArr.length; i++) {
                that.labelRendererArr[i].render(that._scene, that._camera);
            }
        }
    }

    /**  以下是辅助函数 */
    //生成随机数
    guid() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    defaultValue(a, b) {
        if (a !== undefined && a !== null) {
            return a;
        }
        return b;
    }

    defined(value) {
        return value !== undefined && value !== null;
    }
}

export default heatingSystem;
