## 贴花几何体

`DecalGeometry` 贴花几何体

```javascript
const position = intersections[0].point;
const orientation = new THREE.Euler();
const size = new THREE.Vector3(100, 100, 100);
const geometry =  new DecalGeometry( mesh, position, orientation, size );
const material = new THREE.MeshBasicMaterial( { color: 0x00ff00 } );
const mesh = new THREE.Mesh( geometry, material );
scene.add( mesh );
```
