## 点线网格模型
### 点模型
> 本质就是顶点，但不是用顶点构成三角形，而是直接渲染点模型 Points
> 材质用点模型的专属材质 PointsMaterial
```javascript
// ...
material = new THREE.PointsMaterial({
  color: new THREE.Color('orange'),
  size: 10
});
mesh = new THREE.Points(geometry, material);
```
业务场景
![img_4.png](img_4.png)
![img_5.png](img_5.png)

### 线模型
> 本质就是每个顶点连成线
> 线模型有 Line、LineLoop、LineSegments 三种

```javascript
// ...
material = new THREE.LineBasicMaterial({
    color: new THREE.Color('red')
});
mesh = new THREE.Line(geometry, material);
mesh = new THREE.LineLoop(geometry, material); // 首尾相连
mesh = new THREE.LineSegments(geometry, material); // 每两个点练成一条线段
```

### 网格模型
> 每 3 个顶点连成的三角形
```javascript
mesh = new THREE.Mesh(geometry, material)
```

### mesh的正反面概念
> Mesh 的三角形是有正反面的概念的
> 从相机的角度看过去，顶点是逆时针连接的就是正面，反之是反面，默认只显示正面，也可以在材质里设置双面可见
```javascript
material = new THREE.MeshBasicMaterial({
  color: new THREE.Color('orange'),
  side: THREE.DoubleSide // 双面可见,从相机看过去的方向，如果一个三角形是逆时针连接的顶点，就是正面，顺时针就是反面
})
```

### 集合体分段
> 几何体还支持分段，也就是分成几段再细分三角形，分段越多顶点和三角形越多，渲染越精细
> 顶点越多，性能也会变差
> 
```javascript
geometry = new THREE.CylinderGeometry(50, 50, 80,32)
// radiusSegments 默认为32 ，分段越大越圆，其实默认的分段数 32 就已经很圆了
```
