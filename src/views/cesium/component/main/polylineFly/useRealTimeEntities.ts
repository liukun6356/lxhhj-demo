import { ref, reactive, onUnmounted, Ref } from 'vue'
import * as Cesium from 'cesium'

// 实体状态类型
enum EntityStatus {
  IDLE = 'idle', // 空闲
  MOVING = 'moving', // 移动中
  PAUSED = 'paused', // 暂停
  ERROR = 'error', // 错误
}

// 坐标点类型
type Coordinates = [number, number, number] // [longitude, latitude, altitude]

// 配置选项接口
interface EntityOptions {
  name?: string
  modelUrl?: string
  iconUrl?: string
  speed?: number
  duration?: number // 新增：固定移动持续时间（秒）
  modelScale?: number
  modelCorrection?: ModelCorrection
  pathColor?: string
  pathWidth?: number
  showPath?: boolean
  useFixedDuration?: boolean // 新增：是否使用固定持续时间模式
}

// 模型修正接口
interface ModelCorrection {
  heading: number
  pitch: number
  roll: number
}

// 插值信息接口
interface InterpolationInfo {
  startPosition: Cesium.Cartesian3
  endPosition: Cesium.Cartesian3
  startTime: number
  duration: number
  startAltitude: number
  endAltitude: number
}

// 位置信息接口
interface PositionInfo {
  longitude: number
  latitude: number
  altitude: number
}

// 实体状态信息接口
interface EntityStatusInfo {
  id: number
  name: string
  status: EntityStatus
  heading: number
  altitude: number
  position: PositionInfo
  hasWaypoints: boolean
  waypointsCount: number
}

// 实体数据类
class EntityData {
  id: number
  name: string
  modelUrl: string
  iconUrl: string
  speed: number
  modelScale: number
  modelCorrection: ModelCorrection
  pathColor: string
  pathWidth: number
  showPath: boolean

  entity: Cesium.Entity | null
  pathEntity: Cesium.Entity | null
  positions: Cesium.Cartesian3[]
  currentPosition: Cesium.Cartesian3 | null
  targetPosition: Cesium.Cartesian3 | null
  heading: number
  nextWaypoints: Cesium.Cartesian3[]
  status: EntityStatus
  altitude: number
  interpolationInfo: InterpolationInfo | null
  pausedInfo: InterpolationInfo | null
  lastRecordedFraction?: number
  lastRecordedTime?: number
  duration: number
  useFixedDuration: boolean

  constructor(
    id: number,
    name: string,
    options: EntityOptions = {},
    defaultConfig: EntityOptions,
  ) {
    this.id = id
    this.name = name || `实体${id}`
    this.modelUrl = options.modelUrl || defaultConfig.modelUrl || ''
    this.iconUrl = options.iconUrl || defaultConfig.iconUrl || ''
    this.speed = options.speed || defaultConfig.speed || 10
    this.duration = options.duration || defaultConfig.duration || 2
    this.useFixedDuration =
      options.useFixedDuration !== undefined
        ? options.useFixedDuration
        : defaultConfig.useFixedDuration !== undefined
          ? defaultConfig.useFixedDuration
          : false
    this.modelScale = options.modelScale || defaultConfig.modelScale || 1
    this.modelCorrection = {
      ...defaultConfig.modelCorrection,
      ...options.modelCorrection,
    } as ModelCorrection
    this.pathColor = options.pathColor || defaultConfig.pathColor || '#4FC3F7'
    this.pathWidth = options.pathWidth || defaultConfig.pathWidth || 2
    this.showPath =
      options.showPath !== undefined
        ? options.showPath
        : defaultConfig.showPath !== undefined
          ? defaultConfig.showPath
          : true

    // 状态数据
    this.entity = null
    this.pathEntity = null
    this.positions = [] // 历史位置
    this.currentPosition = null
    this.targetPosition = null
    this.heading = 0
    this.nextWaypoints = [] // 等待移动的航点队列
    this.status = EntityStatus.IDLE
    this.altitude = 0
    this.interpolationInfo = null // 插值信息
    this.pausedInfo = null // 暂停时的信息
  }
}

// Hook配置选项接口
interface HookOptions {
  modelUrl?: string
  iconUrl?: string
  speed?: number
  updateInterval?: number
  modelScale?: number
  modelCorrection?: ModelCorrection
  pathColor?: string
  pathWidth?: number
  showPath?: boolean
  duration?: number // 添加默认持续时间配置
  useFixedDuration?: boolean // 是否默认使用固定持续时间
}

// Hook返回接口
interface UseRealTimeEntitiesReturn {
  entities: EntityData[]
  isRunning: Ref<boolean>
  createEntity: (options?: EntityOptions) => number
  updateEntityPosition: (entityId: number, coordinates: Coordinates) => void
  removeEntity: (entityId: number) => void
  clearAllEntities: () => void
  pauseAllEntities: () => void
  resumeAllEntities: () => void
  getEntityStatus: (entityId: number) => EntityStatusInfo | null
  getAllEntitiesStatus: () => EntityStatusInfo[]
  focusOnEntity: (
    entityId: number,
    options?: { pitch?: number; range?: number; duration?: number },
  ) => void
  viewAllEntities: () => void
  toggleMovementMode: (entityId: number, useFixedDuration: boolean) => void
  setEntityDuration: (entityId: number, duration: number) => void
}

/**
 * 实体实时移动Hook
 * @param viewer - Cesium查看器实例
 * @param options - 配置选项
 * @returns 实体控制对象和状态
 */
export function useRealTimeEntities(
  viewer: Cesium.Viewer,
  options: HookOptions = {},
): UseRealTimeEntitiesReturn {
  if (!viewer) {
    console.error('Cesium Viewer is required')
    throw new Error('Cesium Viewer is required')
  }

  // 默认选项
  const defaultOptions: HookOptions = {
    modelUrl: `${import.meta.env.VITE_API_DOMAIN}/models/tb2.glb`, // 默认使用模型
    iconUrl: '',
    speed: 10,
    duration: 2, // 默认移动持续时间为2秒
    useFixedDuration: false, // 默认不使用固定持续时间
    updateInterval: 50,
    modelScale: 2,
    modelCorrection: {
      heading: -90,
      pitch: 0,
      roll: 0,
    },
    pathColor: '#4FC3F7',
    pathWidth: 2,
    showPath: true,
  }

  // 合并配置选项
  const config: HookOptions = { ...defaultOptions, ...options }

  // 保存所有实体
  const entities = reactive<EntityData[]>([])

  // 动画定时器
  let animationTimer: number | null = null

  // 是否正在运行
  const isRunning = ref(false)

  /**
   * 创建新实体
   * @param options - 实体选项
   * @returns 新创建的实体ID
   */
  const createEntity = (options: EntityOptions = {}): number => {
    const id = entities.length + 1
    const name = options.name || `实体${id}`

    const entity = new EntityData(id, name, options, config)

    // 创建Cesium实体
    createCesiumEntity(entity)

    // 添加到实体列表
    entities.push(entity)

    // 如果定时器未运行，启动定时器
    startAnimationTimer()

    return id
  }

  /**
   * 创建Cesium实体
   * @param entityData - 实体数据
   */
  const createCesiumEntity = (entityData: EntityData): void => {
    // 基本实体选项
    const entityOptions: Cesium.Entity.ConstructorOptions = {
      id: `entity-${entityData.id}`,
      name: entityData.name,
      position: new Cesium.CallbackProperty(() => {
        return (
          entityData.currentPosition || Cesium.Cartesian3.fromDegrees(0, 0, 0)
        )
      }, false),
      orientation: new Cesium.CallbackProperty(() => {
        if (!entityData.currentPosition) return undefined

        // 基础朝向
        const heading = Cesium.Math.toRadians(entityData.heading || 0)

        // 使用模型时应用修正
        if (entityData.modelUrl) {
          const correctedHeading =
            heading + Cesium.Math.toRadians(entityData.modelCorrection.heading)
          const correctedPitch = Cesium.Math.toRadians(
            entityData.modelCorrection.pitch,
          )
          const correctedRoll = Cesium.Math.toRadians(
            entityData.modelCorrection.roll,
          )

          return Cesium.Transforms.headingPitchRollQuaternion(
            entityData.currentPosition,
            new Cesium.HeadingPitchRoll(
              correctedHeading,
              correctedPitch,
              correctedRoll,
            ),
          )
        } else {
          // 图标模式不需要额外修正
          return Cesium.Transforms.headingPitchRollQuaternion(
            entityData.currentPosition,
            new Cesium.HeadingPitchRoll(heading, 0, 0),
          )
        }
      }, false),
      label: {
        text: new Cesium.CallbackProperty(() => {
          return `${entityData.name}`
        }, false),
        font: '14px sans-serif',
        style: Cesium.LabelStyle.FILL_AND_OUTLINE,
        outlineWidth: 2,
        verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
        pixelOffset: new Cesium.Cartesian2(0, -30),
        showBackground: true,
        backgroundColor: Cesium.Color.BLACK.withAlpha(0.7),
      },
    }

    // 根据配置选择使用3D模型还是图标
    if (entityData.modelUrl) {
      // 使用GLB模型
      entityOptions.model = {
        uri: entityData.modelUrl,
        minimumPixelSize: 32,
        // maximumScale: 1.0,
        scale: entityData.modelScale,
        runAnimations: false,
      }
    } else {
      // 使用图标
      entityOptions.billboard = {
        image: entityData.iconUrl,
        scale: 0.3,
        verticalOrigin: Cesium.VerticalOrigin.CENTER,
        heightReference: Cesium.HeightReference.NONE,
      }
    }

    // 创建实体
    entityData.entity = viewer.entities.add(entityOptions)

    // 如果显示轨迹，创建轨迹线实体
    if (entityData.showPath) {
      const pathColor = Cesium.Color.fromCssColorString(entityData.pathColor)

      entityData.pathEntity = viewer.entities.add({
        id: `entity-path-${entityData.id}`,
        polyline: {
          positions: new Cesium.CallbackProperty(() => {
            return entityData.positions
          }, false),
          width: entityData.pathWidth,
          material: new Cesium.PolylineGlowMaterialProperty({
            glowPower: 0.2,
            color: pathColor,
          }),
          clampToGround: false,
        },
      })
    }
  }

  /**
   * 更新实体位置
   * @param entityId - 实体ID
   * @param coordinates - 经纬度高度坐标 [longitude, latitude, altitude]
   */
  const updateEntityPosition = (
    entityId: number,
    coordinates: Coordinates,
  ): void => {
    const entity = entities.find(e => e.id === entityId)
    if (!entity) {
      console.warn(`实体 ID ${entityId} 不存在`)
      return
    }

    // 提取坐标
    const [longitude, latitude, altitude] = coordinates

    // 构建目标位置
    const targetPosition = Cesium.Cartesian3.fromDegrees(
      longitude,
      latitude,
      altitude,
    )

    // 将新位置添加到等待队列
    entity.nextWaypoints.push(targetPosition)

    // 如果实体处于空闲状态，立即开始移动
    if (entity.status === EntityStatus.IDLE) {
      startEntityMovement(entity)
    }

    // 确保动画定时器已经启动
    startAnimationTimer()
  }

  /**
   * 开始实体移动到下一个点
   * @param entity - 实体数据
   */
  const startEntityMovement = (entity: EntityData): void => {
    // 如果没有下一个目标点，无法开始移动
    if (entity.nextWaypoints.length === 0) {
      entity.status = EntityStatus.IDLE
      return
    }

    // 获取下一个目标点
    const nextPosition = entity.nextWaypoints.shift()
    if (!nextPosition) {
      entity.status = EntityStatus.IDLE
      return
    }

    // 如果当前没有位置，直接设置到目标位置
    if (!entity.currentPosition) {
      entity.currentPosition = nextPosition
      entity.positions.push(nextPosition)

      // 提取高度信息
      const cartographic = Cesium.Cartographic.fromCartesian(nextPosition)
      entity.altitude = cartographic.height

      // 如果还有下一个点，继续移动
      if (entity.nextWaypoints.length > 0) {
        startEntityMovement(entity)
      } else {
        entity.status = EntityStatus.IDLE
      }
      return
    }

    // 计算目标朝向和距离
    const startCartographic = Cesium.Cartographic.fromCartesian(
      entity.currentPosition,
    )
    const endCartographic = Cesium.Cartographic.fromCartesian(nextPosition)

    // 计算朝向角度
    const heading = calculateHeading(
      Cesium.Math.toDegrees(startCartographic.longitude),
      Cesium.Math.toDegrees(startCartographic.latitude),
      Cesium.Math.toDegrees(endCartographic.longitude),
      Cesium.Math.toDegrees(endCartographic.latitude),
    )
    entity.heading = heading

    // 计算距离
    const distance = calculateDistance(
      Cesium.Math.toDegrees(startCartographic.longitude),
      Cesium.Math.toDegrees(startCartographic.latitude),
      Cesium.Math.toDegrees(endCartographic.longitude),
      Cesium.Math.toDegrees(endCartographic.latitude),
    )

    // 计算移动时间（秒）- 根据模式选择计算方式
    let moveTime: number

    if (entity.useFixedDuration) {
      // 固定持续时间模式
      moveTime = entity.duration

      // 可以记录当前速度用于显示（可选）
      // const currentSpeed = distance / moveTime
      // 如果需要，可以将当前速度保存到entity对象中
      // entity.currentSpeed = currentSpeed
    } else {
      // 恒定速度模式（原有逻辑）
      moveTime = distance / entity.speed
    }

    // 设置插值信息
    entity.interpolationInfo = {
      startPosition: entity.currentPosition,
      endPosition: nextPosition,
      startTime: Date.now(),
      duration: moveTime * 1000, // 转换为毫秒
      startAltitude: startCartographic.height,
      endAltitude: endCartographic.height,
    }

    // 设置状态为移动中
    entity.status = EntityStatus.MOVING
    entity.targetPosition = nextPosition
  }

  /**
   * 更新实体移动动画
   */
  const updateEntityAnimation = (): void => {
    // 遍历并更新每个实体
    entities.forEach(entity => {
      if (entity.status !== EntityStatus.MOVING || !entity.interpolationInfo)
        return

      const now = Date.now()
      const {
        startPosition,
        endPosition,
        startTime,
        duration,
        startAltitude,
        endAltitude,
      } = entity.interpolationInfo

      // 计算当前插值比例
      const fraction = (now - startTime) / duration

      // 如果动画已完成
      if (fraction >= 1) {
        // 完成动画，设置到终点位置
        entity.currentPosition = endPosition
        entity.positions.push(endPosition)
        entity.altitude = endAltitude

        // 限制历史位置数量
        if (entity.positions.length > 500) {
          entity.positions = entity.positions.slice(-500)
        }

        // 清除插值信息
        entity.interpolationInfo = null

        // 如果还有下一个点，继续移动，否则设为空闲
        if (entity.nextWaypoints.length > 0) {
          startEntityMovement(entity)
        } else {
          entity.status = EntityStatus.IDLE
        }

        return
      }

      // 执行插值计算
      const position = Cesium.Cartesian3.lerp(
        startPosition,
        endPosition,
        fraction,
        new Cesium.Cartesian3(),
      )
      entity.currentPosition = position

      // 不需要每一帧都记录位置，这会生成太多点
      // 每0.1的比例或至少每秒记录一次位置（用于绘制轨迹）
      if (
        fraction - (entity.lastRecordedFraction || 0) > 0.1 ||
        now - (entity.lastRecordedTime || 0) > 1000
      ) {
        entity.positions.push(position)
        entity.lastRecordedFraction = fraction
        entity.lastRecordedTime = now
      }

      // 更新高度
      entity.altitude = startAltitude + fraction * (endAltitude - startAltitude)
    })
  }

  /**
   * 启动动画定时器
   */
  const startAnimationTimer = (): void => {
    if (animationTimer !== null || isRunning.value) return

    isRunning.value = true
    animationTimer = window.setInterval(() => {
      updateEntityAnimation()
    }, config.updateInterval)
  }

  /**
   * 停止动画定时器
   */
  const stopAnimationTimer = (): void => {
    if (animationTimer !== null) {
      clearInterval(animationTimer)
      animationTimer = null
    }
    isRunning.value = false
  }

  /**
   * 暂停所有实体
   */
  const pauseAllEntities = (): void => {
    entities.forEach(entity => {
      if (entity.status === EntityStatus.MOVING) {
        entity.status = EntityStatus.PAUSED
        entity.pausedInfo = { ...entity.interpolationInfo } as InterpolationInfo
        entity.interpolationInfo = null
      }
    })

    stopAnimationTimer()
  }

  /**
   * 恢复所有实体
   */
  const resumeAllEntities = (): void => {
    let hasActiveEntities = false

    entities.forEach(entity => {
      if (entity.status === EntityStatus.PAUSED && entity.pausedInfo) {
        // 更新开始时间以保持相对进度
        const elapsed =
          entity.pausedInfo.duration *
          ((Date.now() - entity.pausedInfo.startTime) /
            entity.pausedInfo.duration)

        entity.interpolationInfo = {
          ...entity.pausedInfo,
          startTime: Date.now() - elapsed,
        }

        entity.status = EntityStatus.MOVING
        entity.pausedInfo = null
        hasActiveEntities = true
      } else if (entity.status === EntityStatus.MOVING) {
        hasActiveEntities = true
      }
    })

    if (hasActiveEntities) {
      startAnimationTimer()
    }
  }

  /**
   * 移除指定实体
   * @param entityId - 实体ID
   */
  const removeEntity = (entityId: number): void => {
    const index = entities.findIndex(e => e.id === entityId)
    if (index === -1) return

    const entity = entities[index]

    // 移除Cesium实体
    if (entity.entity) {
      viewer.entities.remove(entity.entity)
    }
    if (entity.pathEntity) {
      viewer.entities.remove(entity.pathEntity)
    }

    // 从数组中移除
    entities.splice(index, 1)

    // 如果没有实体，停止定时器
    if (entities.length === 0) {
      stopAnimationTimer()
    }
  }

  /**
   * 清除所有实体
   */
  const clearAllEntities = (): void => {
    // 移除所有Cesium实体
    entities.forEach(entity => {
      if (entity.entity) {
        viewer.entities.remove(entity.entity)
      }
      if (entity.pathEntity) {
        viewer.entities.remove(entity.pathEntity)
      }
    })

    // 清空数组
    entities.splice(0, entities.length)

    // 停止定时器
    stopAnimationTimer()
  }

  /**
   * 获取实体状态
   * @param entityId - 实体ID
   * @returns 实体状态
   */
  const getEntityStatus = (entityId: number): EntityStatusInfo | null => {
    const entity = entities.find(e => e.id === entityId)
    if (!entity) return null

    // 提取位置信息
    let longitude = 0
    let latitude = 0
    const altitude = entity.altitude

    if (entity.currentPosition) {
      const cartographic = Cesium.Cartographic.fromCartesian(
        entity.currentPosition,
      )
      longitude = Cesium.Math.toDegrees(cartographic.longitude)
      latitude = Cesium.Math.toDegrees(cartographic.latitude)
    }

    return {
      id: entity.id,
      name: entity.name,
      status: entity.status,
      heading: entity.heading,
      altitude: altitude,
      position: {
        longitude,
        latitude,
        altitude,
      },
      hasWaypoints: entity.nextWaypoints.length > 0,
      waypointsCount: entity.nextWaypoints.length,
    }
  }

  /**
   * 获取所有实体状态
   * @returns 所有实体状态数组
   */
  const getAllEntitiesStatus = (): EntityStatusInfo[] => {
    return entities
      .map(entity => getEntityStatus(entity.id))
      .filter((s): s is EntityStatusInfo => s !== null)
  }
  // 添加一个新的方法来切换移动模式
  const toggleMovementMode = (
    entityId: number,
    useFixedDuration: boolean,
  ): void => {
    const entity = entities.find(e => e.id === entityId)
    if (!entity) {
      console.warn(`实体 ID ${entityId} 不存在`)
      return
    }

    entity.useFixedDuration = useFixedDuration
  }

  // 添加一个方法来设置持续时间
  const setEntityDuration = (entityId: number, duration: number): void => {
    if (duration <= 0) {
      console.warn('持续时间必须大于0秒')
      return
    }

    const entity = entities.find(e => e.id === entityId)
    if (!entity) {
      console.warn(`实体 ID ${entityId} 不存在`)
      return
    }

    entity.duration = duration
  }

  /**
   * 计算两点之间的朝向角度
   * @param startLon - 起点经度
   * @param startLat - 起点纬度
   * @param endLon - 终点经度
   * @param endLat - 终点纬度
   * @returns 朝向角度（度数）
   */
  const calculateHeading = (
    startLon: number,
    startLat: number,
    endLon: number,
    endLat: number,
  ): number => {
    // 转换为弧度
    const startLonRad = Cesium.Math.toRadians(startLon)
    const startLatRad = Cesium.Math.toRadians(startLat)
    const endLonRad = Cesium.Math.toRadians(endLon)
    const endLatRad = Cesium.Math.toRadians(endLat)

    // 计算y和x差值
    const y = Math.sin(endLonRad - startLonRad) * Math.cos(endLatRad)
    const x =
      Math.cos(startLatRad) * Math.sin(endLatRad) -
      Math.sin(startLatRad) *
        Math.cos(endLatRad) *
        Math.cos(endLonRad - startLonRad)

    // 计算方位角并转换为度数
    const heading = Cesium.Math.toDegrees(Math.atan2(y, x))

    // 确保结果在0-360范围内
    return (heading + 360) % 360
  }

  /**
   * 计算两点之间的距离（米）
   * @param startLon - 起点经度
   * @param startLat - 起点纬度
   * @param endLon - 终点经度
   * @param endLat - 终点纬度
   * @returns 距离（米）
   */
  const calculateDistance = (
    startLon: number,
    startLat: number,
    endLon: number,
    endLat: number,
  ): number => {
    const earthRadius = 6371000 // 地球半径，单位米

    // 转换为弧度
    const startLonRad = Cesium.Math.toRadians(startLon)
    const startLatRad = Cesium.Math.toRadians(startLat)
    const endLonRad = Cesium.Math.toRadians(endLon)
    const endLatRad = Cesium.Math.toRadians(endLat)

    // 使用Haversine公式
    const dLat = endLatRad - startLatRad
    const dLon = endLonRad - startLonRad
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(startLatRad) *
        Math.cos(endLatRad) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

    return earthRadius * c
  }

  /**
   * 聚焦于指定实体
   * @param entityId - 实体ID
   * @param options - 相机选项
   */
  const focusOnEntity = (
    entityId: number,
    options: { pitch?: number; range?: number; duration?: number } = {},
  ): void => {
    const entity = entities.find(e => e.id === entityId)
    if (!entity || !entity.currentPosition) return

    const defaultOptions = {
      pitch: -30, // 俯视角度
      range: 300, // 视距(米)
      duration: 1.5, // 飞行时间(秒)
    }

    const cameraOptions = { ...defaultOptions, ...options }

    viewer.camera.flyTo({
      destination: entity.currentPosition,
      orientation: {
        heading: Cesium.Math.toRadians(entity.heading || 0),
        pitch: Cesium.Math.toRadians(cameraOptions.pitch),
        roll: 0,
      },
      duration: cameraOptions.duration,
    })
  }

  /**
   * 查看所有实体
   */
  const viewAllEntities = (): void => {
    if (entities.length === 0) return

    // 只聚焦于有位置的实体
    const validEntities = entities
      .filter(e => e.entity && e.currentPosition)
      .map(e => e.entity) as Cesium.Entity[]

    if (validEntities.length > 0) {
      viewer.flyTo(validEntities, {
        duration: 1.5,
        offset: new Cesium.HeadingPitchRange(
          0,
          Cesium.Math.toRadians(-60),
          1500,
        ),
      })
    }
  }

  // 在组件卸载时清理资源
  onUnmounted(() => {
    stopAnimationTimer()
    clearAllEntities()
  })

  // 返回公共API
  return {
    entities,
    isRunning,
    createEntity,
    updateEntityPosition,
    removeEntity,
    clearAllEntities,
    pauseAllEntities,
    resumeAllEntities,
    getEntityStatus,
    getAllEntitiesStatus,
    focusOnEntity,
    viewAllEntities,
    toggleMovementMode, // 新增：切换移动模式
    setEntityDuration, // 新增：设置持续时间
  }
}
