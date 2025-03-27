# ybPanl 预报进度面板
预报时间轴进度面板
> 1. 当前时间轴滑块拖动变化当前时间
> 2. 传入数据时间区间(必传)，自动获取时段
> 3. 可默认当前时间为开始时间，若不合规，则取第一个时间点

# 组件文档

## Attributes

| 参数     | 说明     | 类型 | 可选值 |默认值 |
| --- | --- | --- |--- |--- |
| selTimeRang| 数据时间区间 | {start: number,end: number} |--- |--- |
| class| 类目 | string|--- |--- |
| timeType | 需反应时间点类型 | string|"h" ,"m" , "s" |"h"|
| defaultRange| 默认时段数 | number|--- |24|
| defaultStartTime| 默认开始时间戳| number|--- |---|

## Events

| 事件名称     | 说明     |回调参数|
| --- | --- |--- |
| timeChange | 时间段变化 关闭的回调 | timestamp |

# <img src="https://profile-avatar.csdnimg.cn/0b75e2e590014770956b95dd23ef9a41_hr_beginner.jpg!1" width="50" height="50" alt="描述图片的文字" style="position:relative;top:15px"> 柳晓黑胡椒
