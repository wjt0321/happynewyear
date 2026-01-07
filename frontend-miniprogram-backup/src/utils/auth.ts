// 改进版微信登录相关工具函数
import type { WeChatLoginResult, UserInfo } from '@/types'

// 后端API基础URL（从环境变量或配置文件获取）
const API_BASE_URL = process.env.NODE_ENV === 'development' 
  ? 'http://localhost:3000' 
  : 'https://your-api-domain.com'

// 微信小程序API类型定义
declare global {
  const wx: WechatMiniprogram.Wx
}

// 微信登录响应类型
interface WxLoginResponse {
  code: string
  errMsg: string
}

// 微信用户信息响应类型
interface WxUserProfileResponse {
  userInfo: WechatMiniprogram.UserInfo
  rawData: string
  signature: string
  encryptedData: string
  iv: string
  errMsg: string
}

// 登录状态存储键
const STORAGE_KEYS = {
  OPENID: 'user_openid',
  USER_INFO: 'user_info',
  LAST_DRAW_TIME: 'last_draw_time',
  LOGIN_TIMESTAMP: 'login_timestamp'
} as const

// 登录会话有效期（24小时）
const SESSION_VALIDITY_HOURS = 24

/**
 * 用微信code换取openid
 */
async function exchangeCodeForOpenid(code: string): Promise<WeChatLoginResult> {
  try {
    console.log('正在用code换取openid...')
    
    const response = await uni.request({
      url: `${API_BASE_URL}/api/auth/login`,
      method: 'POST',
      data: { code },
      timeout: 10000,
      header: {
        'Content-Type': 'application/json'
      }
    })
    
    if (response.statusCode === 200 && response.data) {
      const data = response.data as any
      if (data.success && data.openid) {
        return {
          openid: data.openid,
          success: true
        }
      } else {
        return {
          openid: '',
          success: false,
          error: data.error || '服务器返回错误'
        }
      }
    } else {
      // 尝试从响应数据中获取错误信息
      const data = response.data as any
      const errorMessage = data?.error || `服务器错误: ${response.statusCode}`
      return {
        openid: '',
        success: false,
        error: errorMessage
      }
    }
  } catch (error) {
    console.error('网络请求失败:', error)
    return {
      openid: '',
      success: false,
      error: '网络连接失败，请检查网络设置'
    }
  }
}

/**
 * 微信小程序登录
 */
export function weChatLogin(): Promise<WeChatLoginResult> {
  return new Promise((resolve) => {
    console.log('开始微信登录流程...')
    
    // #ifdef MP-WEIXIN
    wx.login({
      success: (loginRes: WxLoginResponse) => {
        if (loginRes.code) {
          console.log('微信登录成功，获取到code:', loginRes.code)
          
          // 调用后端API，用code换取openid
          exchangeCodeForOpenid(loginRes.code)
            .then((result) => {
              if (result.success && result.openid) {
                console.log('获取openid成功:', result.openid)
                
                // 保存登录时间戳
                uni.setStorageSync(STORAGE_KEYS.LOGIN_TIMESTAMP, Date.now())
                
                resolve({
                  openid: result.openid,
                  success: true
                })
              } else {
                console.error('获取openid失败:', result.error)
                resolve({
                  openid: '',
                  success: false,
                  error: result.error || '获取用户标识失败'
                })
              }
            })
            .catch((error) => {
              console.error('调用后端API失败:', error)
              resolve({
                openid: '',
                success: false,
                error: handleLoginError(error)
              })
            })
        } else {
          const errorMsg = loginRes.errMsg || '获取登录凭证失败'
          console.error('微信登录失败:', errorMsg)
          resolve({
            openid: '',
            success: false,
            error: errorMsg
          })
        }
      },
      fail: (error: any) => {
        const errorMsg = handleLoginError(error)
        console.error('微信登录调用失败:', errorMsg)
        resolve({
          openid: '',
          success: false,
          error: errorMsg
        })
      }
    })
    // #endif
    
    // #ifndef MP-WEIXIN
    // 非微信环境的模拟登录（开发测试用）
    console.log('非微信环境，使用模拟登录')
    const mockOpenid = `mock_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`
    setTimeout(() => {
      // 保存登录时间戳
      uni.setStorageSync(STORAGE_KEYS.LOGIN_TIMESTAMP, Date.now())
      
      resolve({
        openid: mockOpenid,
        success: true
      })
    }, 500) // 模拟网络延迟
    // #endif
  })
}

/**
 * 获取用户信息（需要用户授权）
 */
export function getUserProfile(): Promise<UserInfo> {
  return new Promise((resolve, reject) => {
    // #ifdef MP-WEIXIN
    wx.getUserProfile({
      desc: '用于完善用户资料',
      success: (res: WxUserProfileResponse) => {
        console.log('获取用户信息成功:', res.userInfo)
        // 转换微信用户信息格式到我们的UserInfo类型
        const userInfo: UserInfo = {
          nickName: res.userInfo.nickName,
          avatarUrl: res.userInfo.avatarUrl,
          gender: res.userInfo.gender,
          country: res.userInfo.country,
          province: res.userInfo.province,
          city: res.userInfo.city
        }
        resolve(userInfo)
      },
      fail: (error: any) => {
        console.error('获取用户信息失败:', error)
        reject(new Error(error.errMsg || '获取用户信息失败'))
      }
    })
    // #endif
    
    // #ifndef MP-WEIXIN
    // 非微信环境返回模拟用户信息
    console.log('非微信环境，返回模拟用户信息')
    resolve({
      nickName: '测试用户',
      avatarUrl: '/static/default-avatar.png'
    })
    // #endif
  })
}

/**
 * 检查登录状态
 */
export function checkLoginStatus(): Promise<boolean> {
  return new Promise((resolve) => {
    // 首先检查本地登录时间戳
    const loginTimestamp = uni.getStorageSync(STORAGE_KEYS.LOGIN_TIMESTAMP)
    if (!loginTimestamp) {
      console.log('无本地登录记录')
      resolve(false)
      return
    }
    
    // 检查登录是否过期
    const now = Date.now()
    const sessionAge = now - loginTimestamp
    const maxAge = SESSION_VALIDITY_HOURS * 60 * 60 * 1000 // 转换为毫秒
    
    if (sessionAge > maxAge) {
      console.log('登录会话已过期')
      clearLoginStatus()
      resolve(false)
      return
    }
    
    // #ifdef MP-WEIXIN
    wx.checkSession({
      success: () => {
        console.log('微信会话有效')
        resolve(true)
      },
      fail: () => {
        console.log('微信会话已失效')
        clearLoginStatus()
        resolve(false)
      }
    })
    // #endif
    
    // #ifndef MP-WEIXIN
    // 非微信环境检查本地存储
    const openid = uni.getStorageSync(STORAGE_KEYS.OPENID)
    const isValid = !!openid
    console.log('非微信环境登录状态检查:', isValid)
    resolve(isValid)
    // #endif
  })
}

/**
 * 清除登录状态
 */
export function clearLoginStatus(): void {
  console.log('清除登录状态')
  uni.removeStorageSync(STORAGE_KEYS.OPENID)
  uni.removeStorageSync(STORAGE_KEYS.USER_INFO)
  uni.removeStorageSync(STORAGE_KEYS.LAST_DRAW_TIME)
  uni.removeStorageSync(STORAGE_KEYS.LOGIN_TIMESTAMP)
}

/**
 * 保存用户信息到本地
 */
export function saveUserInfo(openid: string, userInfo?: UserInfo): void {
  console.log('保存用户信息到本地存储:', openid)
  uni.setStorageSync(STORAGE_KEYS.OPENID, openid)
  if (userInfo) {
    uni.setStorageSync(STORAGE_KEYS.USER_INFO, userInfo)
  }
}

/**
 * 从本地获取用户信息
 */
export function getUserInfo(): { openid: string | null; userInfo: UserInfo | null } {
  const openid = uni.getStorageSync(STORAGE_KEYS.OPENID)
  const userInfo = uni.getStorageSync(STORAGE_KEYS.USER_INFO)
  
  return {
    openid: openid || null,
    userInfo: userInfo || null
  }
}

/**
 * 验证openid格式
 */
export function validateOpenid(openid: string): boolean {
  if (!openid || typeof openid !== 'string') {
    return false
  }
  
  // 简单的格式验证：长度应该大于10，包含字母数字下划线
  return openid.length > 10 && /^[a-zA-Z0-9_-]+$/.test(openid)
}

/**
 * 处理登录错误
 */
export function handleLoginError(error: any): string {
  console.error('处理登录错误:', error)
  
  if (typeof error === 'string') {
    return error
  }
  
  if (error && error.errMsg) {
    // 微信API错误信息处理
    const errMsg = error.errMsg
    if (errMsg.includes('auth deny')) {
      return '用户拒绝授权'
    } else if (errMsg.includes('system error')) {
      return '系统错误，请稍后重试'
    } else if (errMsg.includes('network')) {
      return '网络连接失败，请检查网络设置'
    } else if (errMsg.includes('timeout')) {
      return '请求超时，请重试'
    }
    return errMsg
  }
  
  if (error instanceof Error) {
    return error.message
  }
  
  return '登录过程中发生未知错误'
}

/**
 * 重试登录机制
 */
export async function retryLogin(maxRetries: number = 3): Promise<WeChatLoginResult> {
  let lastError: string = ''
  
  for (let i = 0; i < maxRetries; i++) {
    console.log(`尝试登录，第 ${i + 1} 次...`)
    
    try {
      const result = await weChatLogin()
      if (result.success) {
        console.log('登录成功')
        return result
      } else {
        lastError = result.error || '登录失败'
        console.warn(`第 ${i + 1} 次登录失败:`, lastError)
        
        // 如果不是网络错误，不需要重试
        if (!lastError.includes('网络') && !lastError.includes('超时')) {
          break
        }
        
        // 等待一段时间后重试
        if (i < maxRetries - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)))
        }
      }
    } catch (error) {
      lastError = handleLoginError(error)
      console.error(`第 ${i + 1} 次登录异常:`, lastError)
      
      if (i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)))
      }
    }
  }
  
  return {
    openid: '',
    success: false,
    error: `登录失败，已重试 ${maxRetries} 次: ${lastError}`
  }
}

/**
 * 显示登录错误提示
 */
export function showLoginError(error: string): Promise<boolean> {
  return new Promise((resolve) => {
    console.error('显示登录错误:', error)
    
    let title = '登录失败'
    let content = error
    
    // 根据错误类型定制提示信息
    if (error.includes('拒绝授权')) {
      title = '需要授权'
      content = '请允许小程序获取您的微信信息以正常使用功能'
    } else if (error.includes('网络')) {
      title = '网络错误'
      content = '网络连接失败，请检查网络设置后重试'
    } else if (error.includes('超时')) {
      title = '请求超时'
      content = '网络请求超时，请重试'
    } else if (error.includes('登录凭证')) {
      title = '登录凭证无效'
      content = '登录凭证已过期，请重新登录'
    }
    
    uni.showModal({
      title,
      content,
      showCancel: true,
      cancelText: '取消',
      confirmText: '重试',
      success: (res) => {
        resolve(res.confirm)
      }
    })
  })
}

/**
 * 检查登录状态并自动刷新
 */
export async function checkAndRefreshLogin(): Promise<boolean> {
  try {
    console.log('检查登录状态...')
    
    // 首先检查本地是否有openid
    const { openid } = getUserInfo()
    if (!openid) {
      console.log('本地无登录信息')
      return false
    }
    
    // 检查微信会话状态
    const isSessionValid = await checkLoginStatus()
    if (!isSessionValid) {
      console.log('微信会话已失效，需要重新登录')
      // 清除本地登录信息
      clearLoginStatus()
      return false
    }
    
    console.log('登录状态有效')
    return true
    
  } catch (error) {
    console.error('检查登录状态失败:', error)
    return false
  }
}

/**
 * 自动登录（静默登录，不显示错误提示）
 */
export async function silentLogin(): Promise<WeChatLoginResult> {
  try {
    console.log('开始静默登录...')
    
    // 首先检查现有登录状态
    const isValid = await checkAndRefreshLogin()
    if (isValid) {
      const { openid } = getUserInfo()
      if (openid) {
        console.log('使用现有登录状态')
        return {
          openid,
          success: true
        }
      }
    }
    
    // 尝试新的登录
    const result = await weChatLogin()
    if (result.success && result.openid) {
      // 保存登录信息
      saveUserInfo(result.openid)
      console.log('静默登录成功')
    }
    
    return result
  } catch (error) {
    console.error('静默登录失败:', error)
    return {
      openid: '',
      success: false,
      error: handleLoginError(error)
    }
  }
}

/**
 * 手动登录（显示加载提示和错误信息）
 */
export async function manualLogin(): Promise<WeChatLoginResult> {
  console.log('用户手动触发登录')
  
  // 显示登录中提示
  uni.showLoading({
    title: '登录中...',
    mask: true
  })
  
  try {
    const result = await retryLogin(3)
    
    if (result.success && result.openid) {
      // 保存登录信息
      saveUserInfo(result.openid)
      
      // 显示成功提示
      uni.showToast({
        title: '登录成功',
        icon: 'success',
        duration: 1500
      })
    } else {
      // 显示错误提示并询问是否重试
      const shouldRetry = await showLoginError(result.error || '登录失败')
      if (shouldRetry) {
        // 用户选择重试，递归调用
        return await manualLogin()
      }
    }
    
    return result
  } finally {
    uni.hideLoading()
  }
}