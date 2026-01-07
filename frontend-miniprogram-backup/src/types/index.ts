// 全局类型定义

// 用户相关类型
export interface UserState {
  openid: string | null
  isLoggedIn: boolean
  lastDrawTime: number | null
  cooldownRemaining: number
}

export interface UserInfo {
  nickName: string
  avatarUrl: string
  gender?: number
  country?: string
  province?: string
  city?: string
}

// 运势相关类型
export interface Fortune {
  id: number
  text: string
  category: string
  isNew: boolean
  timestamp: number
}

export interface FortuneState {
  currentFortune: Fortune | null
  isDrawing: boolean
  drawHistory: Fortune[]
  availableCount: number
}

// API请求和响应类型
export interface FortuneRequest {
  openid: string
}

export interface FortuneResponse {
  success: boolean
  data?: {
    id: number
    text: string
    isNew: boolean
  }
  error?: string
  cooldown?: number
}

export interface HealthResponse {
  status: 'ok'
  timestamp: string
  database: 'connected' | 'error'
}

// 微信登录相关类型
export interface WeChatLoginResult {
  openid: string
  success: boolean
  error?: string
}

// 动画相关类型
export interface Snowflake {
  symbol: string
  style: Record<string, string>
}

export interface Firework {
  style: Record<string, string>
}

export interface AnimationParticle {
  id: number
  symbol: string
  x: number
  y: number
  delay: number
}

// 组件Props类型
export interface FortuneButtonProps {
  disabled?: boolean
  cooldown?: number
  isDrawing?: boolean
}

export interface AnimatedBackgroundProps {
  snowflakeCount?: number
  fireworkCount?: number
}

// 页面参数类型
export interface ResultPageOptions {
  fortuneId: string
  fortuneText: string
  isNew: string
}

// 错误类型
export interface AppError {
  code: string
  message: string
  details?: any
}

// 网络请求配置类型
export interface RequestConfig {
  url: string
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
  data?: any
  header?: Record<string, string>
  timeout?: number
}

// 本地存储数据类型
export interface StorageData {
  userOpenid?: string
  userInfo?: UserInfo
  lastDrawTime?: number
  drawHistory?: Fortune[]
  availableCount?: number
}

// 主题配置类型
export interface ThemeConfig {
  primaryColor: string
  secondaryColor: string
  backgroundColor: string
  textColor: string
  fontSize: {
    hero: string
    large: string
    medium: string
    small: string
    mini: string
  }
}

// 运势分类类型
export type FortuneCategory = 'wealth' | 'career' | 'love' | 'health' | 'study' | 'general'

// 页面状态类型
export type PageStatus = 'loading' | 'ready' | 'error'

// 抽签状态类型
export type DrawStatus = 'idle' | 'drawing' | 'cooldown' | 'completed'

// 网络状态类型
export type NetworkStatus = 'wifi' | '2g' | '3g' | '4g' | '5g' | 'none' | 'unknown'

// 设备信息类型
export interface DeviceInfo {
  brand: string
  model: string
  system: string
  platform: string
  screenWidth: number
  screenHeight: number
  windowWidth: number
  windowHeight: number
  safeArea: {
    top: number
    bottom: number
    left: number
    right: number
  }
}

// 分享配置类型
export interface ShareConfig {
  title: string
  path: string
  imageUrl?: string
}

// 事件类型
export interface AppEvent {
  type: string
  data?: any
  timestamp: number
}

// 统计数据类型
export interface Statistics {
  totalDraws: number
  uniqueUsers: number
  popularFortunes: Array<{
    id: number
    text: string
    count: number
  }>
}