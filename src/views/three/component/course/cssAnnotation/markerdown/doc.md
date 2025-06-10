## 标签

### HTML元素
- `CSS2DRender` 渲染HTML元素
> `CSS2DObject`:使用dom，正对屏幕，不随着3D场景缩放
- `CSS3DRender` 渲染HTML元素
> `CSS3DObject`:使用dom，随着3D场景旋转，缩放
- `CSS2DObject`
### 模型对象
- 精灵模型`Sprite`
> 图片作为纹理
> 可以用canvas画布作为纹理，添加文字
- 网格模型`Mesh`
> 矩形平面：地面导航标注案例
> 菱锥等符号：城市，地球，地图案例
> 
- `THREE.SpriteMaterial`:使用canvas，正对屏幕，随着3D场景缩放，canvas画图复杂
> `SpriteText`:字体库，用于生成字体canvas
