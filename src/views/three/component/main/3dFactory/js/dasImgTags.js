import * as THREE from 'three';
import u2890Svg from "@/assets/images/3dFactory/u2890.svg"
import u2891Svg from "@/assets/images/3dFactory/u2891.svg"

class dasImgTags {

    constructor(options) {
        this._obj3D = options.obj3D || scene;
        this.moveZ = options.moveZ || false
        this.width = options.width;
        this.height = options.height;
        this._position = options.position;
        this.textureLoader = new THREE.TextureLoader();
        this._typeNum = options.typeNum || 0;   //0:黄色 1 红色
        this.textColor = "white"; //文字颜色
        this._text = options.text || 50;
        if (this._typeNum == 0) {
            this.circleImageUrl = u2890Svg;
            this.textColor = "black";
            // this._position.x = this._position.x + 5;
            // this._text = "";
        } else {
            this.circleImageUrl = u2891Svg;
            // this._position.x = this._position.x + 1;
        }

        this.circleImageUrl = options.url || this.circleImageUrl;
        this._fontSize = options.fontSize || 14;
        this._scale = options.scale || 1;
        this._moveRange = options.moveRange || 3;
        this._scaleRange = options.scaleRange || 1
        this._tag = options.tag;
        this.sprite;
        this.initialScale = this._scale;
        this.targetScale = this._scale * this._scaleRange;
        this.duration = 1500; // 动画持续时间（毫秒）
        this.maxYPosition = this._position.y + this._moveRange;
        this.minYPosition = this._position.y;
        this.startTime = Date.now();
        this.isGoingUp = true;
        this.sprite = this.createImgTags();
        this.yPosition = this.minYPosition;
        this.scale = this.initialScale;
        this._render;
        return this.sprite;
    }

    get tag() {
        return this._tag;
    }

    createImgTags() {
        var that = this;
        this.textureLoader.load(this.circleImageUrl, (circleTexture) => {

            circleTexture.colorSpace = THREE.sRGBEncoding;

            circleTexture.flipY = false;

            // 创建一个Canvas，大小与圆形图片一致
            const canvas = document.createElement("canvas");
            const context = canvas.getContext("2d");
            canvas.width = that.width || circleTexture.image.width;
            canvas.height = that.height || circleTexture.image.height;
            // 将圆形图片绘制到Canvas上
            context.drawImage(circleTexture.image, 0, 0, canvas.width, canvas.height);
            // 设置文字样式
            // const fontSize = 12;
            context.font = `${that._fontSize}px Arial`;
            context.fillStyle = that.textColor;
            context.textAlign = "center";
            context.textBaseline = "middle";

            // 插入数字到Canvas的中间位置
            const centerX = canvas.width / 2;
            const centerY = canvas.height / 2;
            context.fillText((that._text).toString(), centerX, centerY);

            // 将Canvas转换为纹理
            const updatedTexture = new THREE.Texture(canvas, THREE.RGBAFormat);
            updatedTexture.needsUpdate = true;

            // 创建一个精灵
            const spriteMaterial = new THREE.SpriteMaterial({
                map: updatedTexture,
                depthTest: true,
                blending: THREE.NormalBlending, // 禁用混合模式
                transparent: true, // 开启透明度
            });
            that.sprite = new THREE.Sprite(spriteMaterial);
            // 设置精灵的大小（根据需要调整）
            that.sprite.position.set(this._position.x, that.moveZ ? 0 : this._position.y, this._position.z); //设置位置
            // that.sprite.position.set(this._position.x, this._position.y, this._position.z); //设置位置
            that.sprite.scale.set(this._scale, this._scale, this._scale); //设置精灵大小
            that.sprite.center.set(0.5, 0); //设置位置点处于精灵的最下方中间位置
            // that.startTime=Date.now();

            ImgTagsUpdate(this);

            this._obj3D.add(this.sprite);

            return this.sprite;
        })


    }

    delete() {
        if (this.sprite) {
            this.sprite.parent?.remove(this.sprite)
        }
        cancelAnimationFrame(this._render)
    }

    start() {
        if (this.sprite) {
            this._obj3D.add(this.sprite);
        }
        ImgTagsUpdate(this);
    }
}

function ImgTagsUpdate(that) {
    that._render = requestAnimationFrame(function () {
        ImgTagsUpdate(that)
    });
    // 计算动画进度
    const currentTime = Date.now();
    let progress = (currentTime - that.startTime) / that.duration;

    // 根据当前状态和进度计算yPosition和scale
    if (that.isGoingUp) {
        that.yPosition = that.minYPosition + (that.maxYPosition - that.minYPosition) * progress;
        that.scale = that.initialScale + (that.targetScale - that.initialScale) * progress * progress; // 使用平方进度实现缓慢的缩放
    } else {
        that.yPosition = that.maxYPosition - (that.maxYPosition - that.minYPosition) * progress;
        that.scale = that.targetScale + (that.initialScale - that.targetScale) * progress * progress; // 使用平方进度实现缓慢的缩放
    }

    // 如果动画完成了一次，切换状态并重置开始时间
    if (progress >= 1) {
        that.isGoingUp = !that.isGoingUp; // 切换状态
        that.startTime = currentTime; // 重置开始时间
    }
    // 更新精灵的大小和位置
    that.sprite.scale.set(that.scale, that.scale, that.scale);
    if (!that.moveZ) {
        that.sprite.position.y = that.yPosition;
    } else {
        that.sprite.position.z = that.yPosition;
    }
}

export {dasImgTags};
