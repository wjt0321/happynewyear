import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import { weChatLogin, checkLoginStatus, clearLoginStatus, saveUserInfo, getUserInfo } from '@/utils/auth'
import type { UserInfo, WeChatLoginResult } from '@/types'

// 配置常量
const USER_CONFIG = {
  COOLDOWN_DURATION: 10, // 秒
  AUTO_LOGIN_RETRY_COUNT: 3,
  SESSION_CHECK_INTERVAL: 5 * 60 * 1000, // 5分钟
  STORAGE_KEYS: {
    USER_OPENID: 'user_openid',
    USER_INFO: 'user_info',
    LAST_DRAW_TIME: 'last_draw_time'
  }
} as const

// 错误处理器
class UserErrorHandler {
  static handleLoginError(error: unknown): string {
    if (error instanceof Error) {
      return error.message
    }
    if (typeof error === 'string') {
      return error
    }
    return '登录过程中发生未知错误'
  }
  
  static logError(context: string, error: unknown): void {
    console.error(`[UserStore:${context}]`, error)
  }
  
  static logInfo(context: string, message: string, data?: any): void {
    console.log(`[UserStore:${context}] ${message}`, data || '')
  }
}

// 本地存储管理器
class UserStorageManager {
  static save(key: string, value: any): void {
    try {
      uni.setStorageSync(key, value)
    } catch (error) {
      UserErrorHandler.logError('Storage', `保存数据失败: ${key}`)
    }
  }
  
  static load<T>(key: string, defaultValue: T): T {
    try {
      const value = uni.getStorageSync(key)
      return value !== undefined && value !== null ? value : defaultValue
    } catch (error) {
      UserErrorHandler.logError('Storage', `读取数据失败: ${key}`)
      return defaultValue
    }
  }
  
  static remove(key: string): void {
    try {
      uni.removeStorageSync(key)
    } catch (error) {
      UserErrorHandler.logError('Storage', `删除数据失败: ${key}`)
    }
  }
  
  static batchSave(data: Record<string, any>): void {
    Object.entries(data).forEach(([key, value]) => {
      this.save(key, value)
    })
  }
  
  static clearUserData(): void {
    Object.values(USER_CONFIG.STORAGE_KEYS).forEach(key => {
      this.remove(key)
    })
  }
}

// 冷却时间管理器
class CooldownManager {
  private lastDrawTime = ref<number | null>(null)
  
  constructor() {
    // 从本地存储恢复冷却时间
    this.restoreFromStorage()
  }
  
  get remaining(): number {
    if (!this.lastDrawTime.value) return 0
    
    const now = Date.now()
    const elapsed = Math.floor((now - this.lastDrawTime.value) / 1000)
    return Math.max(0, USER_CONFIG.COOLDOWN_DURATION - elapsed)
  }
  
  get isActive(): boolean {
    return this.remaining > 0
  }
  
  start(): void {
    const now = Date.now()
    this.lastDrawTime.value = now
    UserStorageManager.save(USER_CONFIG.STORAGE_KEYS.LAST_DRAW_TIME, now)
    UserErrorHandler.logInfo('Cooldown', '开始冷却期')
  }
  
  set(seconds: number): void {
    const now = Date.now()
    this.lastDrawTime.value = now - (USER_CONFIG.COOLDOWN_DURATION - seconds) * 1000
    UserStorageManager.save(USER_CONFIG.STORAGE_KEYS.LAST_DRAW_TIME, this.lastDrawTime.value)
    UserErrorHandler.logInfo('Cooldown', `设置冷却时间: ${seconds}秒`)
  }
  
  clear(): void {
    this.lastDrawTime.value = null
    UserStorageManager.remove(USER_CONFIG.STORAGE_KEYS.LAST_DRAW_TIME)
  }
  
  private restoreFromStorage(): void {
    const savedTime = UserStorageManager.load<number | null>(
      USER_CONFIG.STORAGE_KEYS.LAST_DRAW_TIME, 
      null
    )
    
    if (savedTime && typeof savedTime === 'number') {
      this.lastDrawTime.value = savedTime
      UserErrorHandler.logInfo('Cooldown', '从本地存储恢复冷却时间', new Date(savedTime).toLocaleString())
    }
  }
  
  getLastDrawTime(): number | null {
    return this.lastDrawTime.value
  }
}

export const useUserStore = defineStore('user', () => {
  // 状态
  const openid = ref<string | null>(null)
  const isLoggedIn = ref<boolean>(false)
  const userInfo = ref<UserInfo | null>(null)
  const loginError = ref<string | null>(null)
  const isInitializing = ref<boolean>(false)
  
  // 冷却管理器
  const cooldownManager = new CooldownManager()
  
  // 计算属性
  const cooldownRemaining = computed(() => cooldownManager.remaining)
  const isInCooldown = computed(() => cooldownManager.isActive)
  const canDraw = computed(() => isLoggedIn.value && !isInCooldown.value)
  const lastDrawTime = computed(() => cooldownManager.getLastDrawTime())
  
  // 监听登录状态变化，自动保存到本地存储
  watch([openid, userInfo], ([newOpenid, newUserInfo]) => {
    if (newOpenid) {
      UserStorageManager.batchSave({
        [USER_CONFIG.STORAGE_KEYS.USER_OPENID]: newOpenid,
        [USER_CONFIG.STORAGE_KEYS.USER_INFO]: newUserInfo
      })
    }
  })
  
  // 认证相关方法
  async function login(): Promise<WeChatLoginResult> {
    try {
      loginError.value = null
      UserErrorHandler.logInfo('Login', '开始微信登录')
      
      const result = await weChatLogin()
      
      if (result.success && result.openid) {
        openid.value = result.openid
        isLoggedIn.value = true
        
        UserErrorHandler.logInfo('Login', '微信登录成功', result.openid)
        return result
      } else {
        const errorMsg = result.error || '登录失败'
        loginError.value = errorMsg
        UserErrorHandler.logError('Login', errorMsg)
        return result
      }
    } catch (error) {
      const errorMessage = UserErrorHandler.handleLoginError(error)
      loginError.value = errorMessage
      UserErrorHandler.logError('Login', error)
      
      return {
        openid: '',
        success: false,
        error: errorMessage
      }
    }
  }
  
  function logout(): void {
    UserErrorHandler.logInfo('Logout', '用户登出')
    
    // 清除状态
    openid.value = null
    isLoggedIn.value = false
    userInfo.value = null
    loginError.value = null
    cooldownManager.clear()
    
    // 清除本地存储
    UserStorageManager.clearUserData()
    clearLoginStatus()
  }
  
  async function checkAndRestoreSession(): Promise<boolean> {
    try {
      const isValid = await checkLoginStatus()
      if (!isValid && isLoggedIn.value) {
        UserErrorHandler.logInfo('Session', '会话已失效，清除登录状态')
        logout()
        return false
      }
      return isValid
    } catch (error) {
      UserErrorHandler.logError('Session', error)
      return false
    }
  }
  
  // 冷却相关方法
  function startCooldown(): void {
    cooldownManager.start()
  }
  
  function setCooldown(seconds: number): void {
    if (seconds < 0 || seconds > USER_CONFIG.COOLDOWN_DURATION) {
      UserErrorHandler.logError('Cooldown', `无效的冷却时间: ${seconds}`)
      return
    }
    cooldownManager.set(seconds)
  }
  
  function setLastDrawTime(timestamp: number): void {
    if (timestamp <= 0) {
      UserErrorHandler.logError('DrawTime', `无效的时间戳: ${timestamp}`)
      return
    }
    
    cooldownManager.start()
    UserErrorHandler.logInfo('DrawTime', '更新最后抽签时间', new Date(timestamp).toLocaleString())
  }
  
  // 初始化方法
  async function initializeUser(): Promise<void> {
    if (isInitializing.value) {
      UserErrorHandler.logInfo('Init', '初始化已在进行中，跳过重复调用')
      return
    }
    
    try {
      isInitializing.value = true
      UserErrorHandler.logInfo('Init', '开始初始化用户状态')
      
      // 从本地存储恢复用户状态
      await restoreUserState()
      
      // 检查会话有效性
      if (isLoggedIn.value) {
        const isSessionValid = await checkAndRestoreSession()
        if (!isSessionValid) {
          UserErrorHandler.logInfo('Init', '会话已失效，尝试自动登录')
          await attemptAutoLogin()
        }
      } else {
        UserErrorHandler.logInfo('Init', '未找到登录状态，尝试自动登录')
        await attemptAutoLogin()
      }
      
      UserErrorHandler.logInfo('Init', '用户状态初始化完成')
      
    } catch (error) {
      const errorMessage = UserErrorHandler.handleLoginError(error)
      loginError.value = errorMessage
      UserErrorHandler.logError('Init', error)
      throw error
    } finally {
      isInitializing.value = false
    }
  }
  
  // 私有辅助方法
  async function restoreUserState(): Promise<void> {
    const { openid: savedOpenid, userInfo: savedUserInfo } = getUserInfo()
    
    if (savedOpenid) {
      openid.value = savedOpenid
      isLoggedIn.value = true
      userInfo.value = savedUserInfo
      UserErrorHandler.logInfo('Restore', '从本地存储恢复用户状态', savedOpenid)
    }
  }
  
  async function attemptAutoLogin(): Promise<void> {
    let retryCount = 0
    
    while (retryCount < USER_CONFIG.AUTO_LOGIN_RETRY_COUNT) {
      try {
        const result = await login()
        if (result.success) {
          UserErrorHandler.logInfo('AutoLogin', '自动登录成功')
          return
        }
        
        retryCount++
        UserErrorHandler.logInfo('AutoLogin', `自动登录失败，重试 ${retryCount}/${USER_CONFIG.AUTO_LOGIN_RETRY_COUNT}`)
        
        if (retryCount < USER_CONFIG.AUTO_LOGIN_RETRY_COUNT) {
          // 等待1秒后重试
          await new Promise(resolve => setTimeout(resolve, 1000))
        }
      } catch (error) {
        retryCount++
        UserErrorHandler.logError('AutoLogin', `自动登录异常，重试 ${retryCount}/${USER_CONFIG.AUTO_LOGIN_RETRY_COUNT}`)
        
        if (retryCount >= USER_CONFIG.AUTO_LOGIN_RETRY_COUNT) {
          throw error
        }
      }
    }
    
    UserErrorHandler.logError('AutoLogin', '自动登录失败，已达到最大重试次数')
  }
  
  // 调试和监控方法
  function getDebugInfo() {
    return {
      openid: openid.value,
      isLoggedIn: isLoggedIn.value,
      isInCooldown: isInCooldown.value,
      cooldownRemaining: cooldownRemaining.value,
      lastDrawTime: lastDrawTime.value,
      loginError: loginError.value,
      isInitializing: isInitializing.value
    }
  }
  
  return {
    // 状态
    openid: readonly(openid),
    isLoggedIn: readonly(isLoggedIn),
    userInfo: readonly(userInfo),
    loginError: readonly(loginError),
    isInitializing: readonly(isInitializing),
    
    // 计算属性
    cooldownRemaining,
    isInCooldown,
    canDraw,
    lastDrawTime,
    
    // 方法
    login,
    logout,
    setLastDrawTime,
    setCooldown,
    startCooldown,
    checkAndRestoreSession,
    initializeUser,
    getDebugInfo
  }
})