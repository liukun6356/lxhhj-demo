## 包围盒Box3 
- `Box3Helper`：可视化 Box3 包围盒
- `setFromObject`：和 expandByObject 一样，计算对象和子对象的包围盒
- `getSize`：计算包围盒大小，不用自己计算
- `expandByScalar`：扩展包围盒
- `intersectsBox`：检测包围盒是否相交，可用来做碰撞检测
- `intersect`：计算相交部分大小
- `union`：计算并集大小
- `getCenter`：获取包围盒中心位置坐标

> 注意 intersect，union 计算完，会改变原先包围盒的大小
