## pbr材质

### `MeshStandardMaterial`  标准网格材质
- `roughness` 粗糙度
- `metalness` 金属度
- `envMap` 环境贴图
> 可以实现逼真的`金属`、`塑料`、`磨砂`等材质效果

### `MeshPhysicalMaterial`  物理网格材质
- `metalness`  金属度
- `roughness `  粗糙度
- `clearcoat `  清漆度
- `clearcoatRoughness`  清漆层粗糙度
- `transmission`   透光度
- `sheen`  光泽层强度
- `sheenRoughness`  光泽层的粗糙度
- `sheenColor`  光泽层的颜色
- `sheenColorMap`  光泽层颜色贴图
- `iridescence`  虹彩层
- `iridescenceIOR`  虹彩层折射率
- `reflectivity`  反射率

> 可以实现逼真的`玻璃`、`宝石`、`喷漆`、`毛绒`、`虹彩`等材质效果

### `MeshMatcapMaterial`  纹理捕捉材质
> 不计算灯光，但可以通过提前渲染好的光泽球图片根据顶点法线来计算光照
> 换上不同的光泽球图片，就可以实现各种材质的光照效果
> 性能特别好

## 全景图

### cubeTextureLoader
> 分割成 6 张图后再用 CubeTextureLoader 加载
```javascript
textureCube = cubeTextureLoader.load([pxPng, nxPng, pyPng, nyPng, pzPng, nzPng]);
scene.background = hdrTexture;
```
### hdr
> hdr 文件能够存储范围更广的亮度信息，作为全景图更加真实
```javascript
hdrTexture = await rgbeloader.loadAsync(import.meta.env.VITE_APP_MODELVIEW + "/pic.hdr")
hdrTexture.mapping = THREE.EquirectangularReflectionMapping;
scene.background = hdrTexture;
```
