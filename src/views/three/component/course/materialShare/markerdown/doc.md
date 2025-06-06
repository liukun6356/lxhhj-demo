## 几何体材质共用和 clone、copy

- `clone` 是创建一个新的对象
- `copy` 是把传入的对象的值复制给当前对象

### mesh 的 geometry 和 material 共用的问题

> 使用 mesh 共用是会相互影响的，因为是同一个对象
> 解决方法：不共用mesh，而共用 clone 一份新的 geometry 或者 material 就好了


> 想复制值的时候，可以直接用 copy 方法,如 rotation.copy、position.copy
```javascript
  mesh2.rotation.copy(mesh.rotation);
```
