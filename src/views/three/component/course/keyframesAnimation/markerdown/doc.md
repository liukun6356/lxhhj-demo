## 关键帧动画和模型动画播放

关键帧动画使用分为以下步骤
1. track 轨迹，通过THREE.KeyframeTrack 实例化
2. clip 动画，通过HREE.AnimationClip 传递动画名称，持续时间，动画轨迹数组
3. mixer 动画播放器，通过 THREE.AnimationMixer 传递 Mesh 对象
4. clipAction 获取动画动作，通过mixer.clipAction(clip)
5. 播放动画clipAction.play()，设置播放速度clipAction.timeScale ，停止播放clipAction.paused
