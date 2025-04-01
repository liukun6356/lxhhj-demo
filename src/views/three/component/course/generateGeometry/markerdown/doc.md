## 按照规律生成各种几何体
### LatheGeometry
- 车削缓冲几何体 `LatheGeometry `：创建具有轴对称性的网格
```javascript
pointsArr = [
  new THREE.Vector2(0, 0),
  new THREE.Vector2(50, 50),
  new THREE.Vector2(20, 80),
  new THREE.Vector2(0, 150),
];
geometry = new THREE.LatheGeometry(pointsArr, 32) // 车削缓冲几何体
```
### TubeGeometry
- 管道缓冲几何体 `TubeGeometry `：创建沿着三维曲线延伸的管道

```javascript
const p1 = new THREE.Vector3(-100, 0, 0);
const p2 = new THREE.Vector3(50, 100, 0);
const p3 = new THREE.Vector3(100, 0, 100);
const p4 = new THREE.Vector3(100, 0, 0);
curve = new THREE.CubicBezierCurve3(p1, p2, p3, p4);
geometry = new THREE.TubeGeometry(curve, 50, 20, 20)// 管道缓冲几何体
```
### ShapeGeometry
- 形状缓冲几何体 `ShapeGeometry `：从一个或多个路径形状中创建单面多边形几何体
#### 方式1：传入点
```javascript
pointsArr = [
  new THREE.Vector2(100, 0),
  new THREE.Vector2(50, 20),
  new THREE.Vector2(0, 0),
  new THREE.Vector2(0, 50),
  new THREE.Vector2(50, 100),
];
const shape = new THREE.Shape(pointsArr)
```
#### 方式2：通过 api 来画
```javascript
shape = new THREE.Shape();
shape.moveTo(100, 0);
shape.lineTo(50, 20);
shape.lineTo(0, 0);
shape.lineTo(0, 50);
shape.lineTo(80, 100);
path = new THREE.Path();
path.arc(30, 30, 10, 0, 2 * Math.PI);
shape.holes.push(path);
geometry = new THREE.ShapeGeometry(shape)
```

### ExtrudeGeometry
- 挤压缓冲几何体 `ExtrudeGeometry `：通过 Shape 拉伸形成几何体
```javascript
shape = new THREE.Shape();
shape.moveTo(100, 0);
shape.lineTo(50, 20);
shape.lineTo(0, 0);
shape.lineTo(0, 50);
shape.lineTo(80, 100);
path = new THREE.Path();
path.arc(30, 30, 10, 0, 2 * Math.PI);
shape.holes.push(path);
geometry = new THREE.ExtrudeGeometry(shape,{depth:100}) // 挤压缓冲几何体
```
