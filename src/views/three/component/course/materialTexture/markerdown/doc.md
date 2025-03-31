## 材质纹理

### 点模型
> 

### 线模型
线模型想要渲染集合体，需要先用`EdgesGeometry`包裹处理顶点
> 1. `LineBasicMaterial`  实线
> 2. `LineDashedMaterial`  虚线
> -  画虚线 line.`computeLineDistances()` 做相关计算

### 网格模型
#### 材质
主要是与光照有关，可以设置 color、map，transparent、opacity 等属性
1.color
```javascript
console.log(material.color.getHexString(),"hex")// 
console.log(material.color.getStyle(),"css")// 获取css样式
material.color.setStyle("rgb(255,255,0)")// 可以设置css样式
```
#### 纹理贴图
> 用`TextureLoader`加载纹理图片
 ```javascript
const loader = new THREE.TextureLoader();
texture = loader.load(diqiuJPG);
texture.wrapS = THREE.RepeatWrapping // 设置在水平（wrapS）方向重复
texture.wrapT = THREE.RepeatWrapping// 设置在竖直（wrapT）方向重复
texture.repeat.set(4, 4);//设置重复次数
texture.colorSpace = THREE.SRGBColorSpace // 使颜色和原图贴合
```

1. `map` 颜色贴图
```javascript
material = new THREE.MeshBasicMaterial({
  map: texture,
  aoMap: texture,// 受环境光的凹凸不平感,基于光线对贴图的影响来做一次计算
});
```
2. `aoMap` 基于环境对贴图的影响做计算，加上凹凸感
