## 如何画各种曲线

- 椭圆曲线 `EllipseCurve`：画椭圆、圆曲线
```javascript
arc = new THREE.EllipseCurve(0, 0, 100, 50, 0, Math.PI / 2);
// 椭圆中心是 0,0，长短半轴长分别是 100、50, 0°到90°
```

- 样式曲线 `SplineCurve`：画经过一些点的曲线

```javascript
 const arr = [new THREE.Vector2(-100, 0), new THREE.Vector2(-50, 50), new THREE.Vector2(0, 0), new THREE.Vector2(50, -50), new THREE.Vector2(100, 0)];
curve = new THREE.SplineCurve(arr);
```

- 二次贝塞尔曲线 `QuadraticBezierCurve`：可以通过控制点调节曲率，有一个控制点
```javascript
p1 = new THREE.Vector2(0, 0);
p2 = new THREE.Vector2(50, 100);
p3 = new THREE.Vector2(100, 0);
curve = new THREE.QuadraticBezierCurve(p1, p2, p3);
pointsArr = curve.getPoints(20);
```

- 三次贝塞尔曲线 `CubicBezierCurve3`：可以画三维曲线，通过控制点调节曲率，有两个控制点
```javascript
p1 = new THREE.Vector3(-100, 0, 0);
p2 = new THREE.Vector3(50, 100, 0);
p3 = new THREE.Vector3(100, 0, 100);
p4 = new THREE.Vector3(100, 0, 0);
curve = new THREE.CubicBezierCurve3(p1, p2, p3, p4);
```

- 直线 `LineCurve`：直线是曲线的一种特殊情况，传入两个端点
```javascript
p1 = new THREE.Vector2(0, 0);
p2 = new THREE.Vector2(100, 100);
const line1 = new THREE.LineCurve(p1, p2);
```
- 曲线路径 `CurvePath`：可以传入多条曲线，组合起来
```javascript
p1 = new THREE.Vector2(0, 0);
p2 = new THREE.Vector2(100, 100);
const line1 = new THREE.LineCurve(p1, p2);
arc = new THREE.EllipseCurve(0, 100, 100, 100, 0, Math.PI);
p3 = new THREE.Vector2(-100, 100);
p4 = new THREE.Vector2(0, 0);
line2 = new THREE.LineCurve(p3, p4);
const curvePath = new THREE.CurvePath();
curvePath.add(line1);
curvePath.add(arc);
curvePath.add(line2);
```
