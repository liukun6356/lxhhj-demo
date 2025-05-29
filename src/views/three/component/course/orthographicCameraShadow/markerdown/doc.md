## 正投影相机和三种灯光的阴影

### 正投影相机
> `透视投影相机`:近大远小效果
> `正投影相机`:是远近一样大

### 阴影
6 种灯光里只有点光源、聚光灯、平行光可以产生阴影
- `DirectionalLight`  平行光  ->阴影相机是正投影相机
- `PointLight`  点光源  ->阴影相机是透视投影相机
- `SpotLight`  聚光灯  ->阴影相机是透视投影相机

##### 阴影产生步骤
1. 需要在 renderer 开启阴影 `shadowMap.enabled`
2. 在灯光处开启阴影 `castShadow`
3. 在产生阴影的物体设置阴影 `castShadow`
4. 在接收阴影的物体设置 `receiveShadow`
