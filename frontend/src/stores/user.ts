import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { checkLoginStatus, clearLoginStatus, saveUserInfo, getUserInfo, validateOpenid, handleLoginError, showLoginError, retryLogin, checkAndRefreshLogin } from '@/utils/auth'
import type { UserInfo, WeChatLoginResult } from '@/types'

export const useUserStore = defineStore('user', () => {
  // 状态
  const openid = ref<string | null>(null)
  const isLoggedIn = ref<boolean>(false)
  const lastDrawTime = ref<number | null>(null)
  const cooldownSeconds = ref<number>(0)
  const userInfo = ref<UserInfo | null>(null)
  const loginError = ref<string | null>(null)
  
  // 计算属性
  const cooldownRemaining = computed(() => {
    if (!lastDrawTime.value) return 0
    
    const now = Date.now()
    const elapsed = Math.floor((now - lastDrawTime.value) / 1000)
    const remaining = Math.max(0, 10 - elapsed) // 10秒冷却期
    
    return remaining
  })

  const isInCooldown = computed(() => cooldownRemaining.value > 0)
  
  const canDraw = computed(() => isLoggedIn.value && !isInCooldown.value)
  
  // 方法
  async function login(): Promise<WeChatLoginResult> {
    try {
      console.log('开始用户登录流程...')
      loginError.value = null
      
      // 使用重试机制进行登录
      const result = await retryLogin(3)
      
      if (result.success && result.openid) {
        // 验证openid格式
        if (!validateOpenid(result.openid)) {
          const errorMsg = 'openid格式无效'
          loginError.value = errorMsg
          console.error(errorMsg, result.openid)
          return {
            openid: '',
            success: false,
            error: errorMsg
          }
        }
        
        openid.value = result.openid
        isLoggedIn.value = true
        
        // 保存到本地存储
        saveUserInfo(result.openid)
        
        console.log('用户登录成功, openid:', result.openid)
        
        // 显示登录成功提示
        uni.showToast({
          title: '登录成功',
          icon: 'success',
          duration: 1500
        })
        
        return result
      } else {
        loginError.value = result.error || '登录失败'
        console.error('用户登录失败:', result.error)
        
        // 显示错误提示
        showLoginError(loginError.value)
        
        return result
      }
    } catch (error) {
      const errorMessage = handleLoginError(error)
      loginError.value = errorMessage
      console.error('登录过程异常:', error)
      
      // 显示错误提示
      showLoginError(errorMessage)
      
      return {
        openid: '',
        success: false,
        error: errorMessage
      }
    }
  }
  
  function logout(): void {
    openid.value = null
    isLoggedIn.value = false
    lastDrawTime.value = null
    cooldownSeconds.value = 0
    userInfo.value = null
    loginError.value = null
    
    // 清除本地存储
    clearLoginStatus()
    
    console.log('用户已登出')
  }
  
  function setLastDrawTime(timestamp: number): void {
    lastDrawTime.value = timestamp
    uni.setStorageSync('last_draw_time', timestamp)
    console.log('更新最后抽签时间:', new Date(timestamp).toLocaleString())
  }
  
  function setCooldown(seconds: number): void {
    cooldownSeconds.value = seconds
    // 设置冷却时间时，同时更新最后抽签时间
    const now = Date.now()
    lastDrawTime.value = now - (10 - seconds) * 1000
    uni.setStorageSync('last_draw_time', lastDrawTime.value)
    console.log(`设置冷却时间: ${seconds}秒`)
  }
  
  function startCooldown(): void {
    // 开始10秒冷却期
    setLastDrawTime(Date.now())
  }
  
  function updateCooldown(): void {
    // 这个方法由定时器调用，用于更新冷却倒计时
    // 实际的计算在 cooldownRemaining 计算属性中完成
    // 可以在这里触发UI更新或其他副作用
  }
  
  async function checkAndRestoreSession(): Promise<boolean> {
    try {
      const isValid = await checkLoginStatus()
      if (!isValid && isLoggedIn.value) {
        // 会话已失效，清除登录状态
        logout()
        return false
      }
      return isValid
    } catch (error) {
      console.error('检查登录状态失败:', error)
      return false
    }
  }
  
  async function initializeUser(): Promise<void> {
    try {
      console.log('开始初始化用户状态...')
      
      // 从本地存储恢复用户状态
      const { openid: savedOpenid, userInfo: savedUserInfo } = getUserInfo()
      const savedLastDrawTime = uni.getStorageSync('last_draw_time')
      
      if (savedOpenid) {
        console.log('从本地存储恢复用户状态:', savedOpenid)
        
        // 检查登录状态并自动刷新
        const isLoginValid = await checkAndRefreshLogin()
        
        if (isLoginValid) {
          openid.value = savedOpenid
          isLoggedIn.value = true
          userInfo.value = savedUserInfo
          console.log('用户登录状态有效')
        } else {
          console.log('用户登录状态已失效，需要重新登录')
          // 清除无效的本地状态
          logout()
        }
      }
      
      if (savedLastDrawTime && typeof savedLastDrawTime === 'number') {
        lastDrawTime.value = savedLastDrawTime
        console.log('恢复最后抽签时间:', new Date(savedLastDrawTime).toLocaleString())
      }
      
      // 如果没有有效的登录状态，尝试自动登录
      if (!isLoggedIn.value) {
        console.log('未找到有效登录状态，尝试自动登录...')
        const result = await login()
        if (!result.success) {
          console.warn('自动登录失败，用户需要手动登录:', result.error)
          // 不显示错误提示，让用户在需要时手动登录
        }
      }
      
      console.log('用户状态初始化完成')
      
    } catch (error) {
      console.error('用户初始化失败:', error)
      loginError.value = handleLoginError(error)
      
      // 初始化失败时清除可能的无效状态
      logout()
      
      throw error
    }
  }
  
  // 手动登录（供UI调用）
  async function manualLogin(): Promise<WeChatLoginResult> {
    console.log('用户手动触发登录')
    
    // 显示登录中提示
    uni.showLoading({
      title: '登录中...',
      mask: true
    })
    
    try {
      const result = await login()
      return result
    } finally {
      uni.hideLoading()
    }
  }
  
  return {
    // 状态
    openid,
    isLoggedIn,
    lastDrawTime,
    cooldownSeconds,
    userInfo,
    loginError,
    
    // 计算属性
    cooldownRemaining,
    isInCooldown,
    canDraw,
    
    // 方法
    login,
    manualLogin,
    logout,
    setLastDrawTime,
    setCooldown,
    startCooldown,
    updateCooldown,
    checkAndRestoreSession,
    initializeUser
  }
})