import type { FortuneRequest, FortuneResponse, HealthResponse, RequestConfig, AppError } from '@/types'

// API基础配置
const API_BASE_URL = process.env.NODE_ENV === 'development' 
  ? 'http://localhost:5000' 
  : 'https://ny.wxbfnnas.com'

const API_TIMEOUT = 10000 // 10秒超时
const MAX_RETRIES = 3 // 最大重试次数
const RETRY_DELAY = 1000 // 重试延迟（毫秒）

// 请求拦截器类型
interface RequestInterceptor {
  onRequest?: (config: RequestConfig) => RequestConfig | Promise<RequestConfig>
  onResponse?: <T>(response: T) => T | Promise<T>
  onError?: (error: AppError) => AppError | Promise<AppError>
}

// API客户端类
class APIClient {
  private baseURL: string
  private timeout: number
  private interceptors: RequestInterceptor[] = []

  constructor(baseURL: string = API_BASE_URL, timeout: number = API_TIMEOUT) {
    this.baseURL = baseURL
    this.timeout = timeout
  }

  // 添加请求拦截器
  addInterceptor(interceptor: RequestInterceptor): void {
    this.interceptors.push(interceptor)
  }

  // 应用请求拦截器
  private async applyRequestInterceptors(config: RequestConfig): Promise<RequestConfig> {
    let finalConfig = config
    
    for (const interceptor of this.interceptors) {
      if (interceptor.onRequest) {
        finalConfig = await interceptor.onRequest(finalConfig)
      }
    }
    
    return finalConfig
  }

  // 应用响应拦截器
  private async applyResponseInterceptors<T>(response: T): Promise<T> {
    let finalResponse = response
    
    for (const interceptor of this.interceptors) {
      if (interceptor.onResponse) {
        finalResponse = await interceptor.onResponse(finalResponse)
      }
    }
    
    return finalResponse
  }

  // 应用错误拦截器
  private async applyErrorInterceptors(error: AppError): Promise<AppError> {
    let finalError = error
    
    for (const interceptor of this.interceptors) {
      if (interceptor.onError) {
        finalError = await interceptor.onError(finalError)
      }
    }
    
    return finalError
  }

  // 统一的HTTP请求方法
  async request<T = any>(config: RequestConfig): Promise<T> {
    try {
      // 应用请求拦截器
      const finalConfig = await this.applyRequestInterceptors({
        ...config,
        url: config.url.startsWith('http') ? config.url : `${this.baseURL}${config.url}`,
        timeout: config.timeout || this.timeout,
        header: {
          'Content-Type': 'application/json',
          ...config.header
        }
      })

      return new Promise(async (resolve, reject) => {
        uni.request({
          url: finalConfig.url,
          method: finalConfig.method || 'GET',
          data: finalConfig.data,
          header: finalConfig.header,
          timeout: finalConfig.timeout,
          success: async (response) => {
            try {
              const { statusCode, data } = response
              
              if (statusCode >= 200 && statusCode < 300) {
                // 应用响应拦截器
                const finalResponse = await this.applyResponseInterceptors(data as T)
                resolve(finalResponse)
              } else {
                const error: AppError = {
                  code: `HTTP_${statusCode}`,
                  message: (data as any)?.error || '服务器错误',
                  details: { statusCode, data }
                }
                
                const finalError = await this.applyErrorInterceptors(error)
                reject(new Error(finalError.message))
              }
            } catch (interceptorError) {
              reject(interceptorError)
            }
          },
          fail: async (error) => {
            try {
              console.error('请求失败:', error)
              
              let appError: AppError
              
              // 处理不同类型的网络错误
              if (error.errMsg?.includes('timeout')) {
                appError = {
                  code: 'NETWORK_TIMEOUT',
                  message: '网络超时，请检查网络连接',
                  details: error
                }
              } else if (error.errMsg?.includes('fail')) {
                appError = {
                  code: 'NETWORK_FAIL',
                  message: '网络连接失败，请稍后重试',
                  details: error
                }
              } else {
                appError = {
                  code: 'NETWORK_ERROR',
                  message: '网络错误，请重试',
                  details: error
                }
              }
              
              const finalError = await this.applyErrorInterceptors(appError)
              reject(new Error(finalError.message))
            } catch (interceptorError) {
              reject(interceptorError)
            }
          }
        })
      })
    } catch (error) {
      throw error instanceof Error ? error : new Error('请求配置错误')
    }
  }

  // GET请求
  async get<T = any>(url: string, config?: Partial<RequestConfig>): Promise<T> {
    return this.request<T>({ ...config, url, method: 'GET' })
  }

  // POST请求
  async post<T = any>(url: string, data?: any, config?: Partial<RequestConfig>): Promise<T> {
    return this.request<T>({ ...config, url, method: 'POST', data })
  }

  // PUT请求
  async put<T = any>(url: string, data?: any, config?: Partial<RequestConfig>): Promise<T> {
    return this.request<T>({ ...config, url, method: 'PUT', data })
  }

  // DELETE请求
  async delete<T = any>(url: string, config?: Partial<RequestConfig>): Promise<T> {
    return this.request<T>({ ...config, url, method: 'DELETE' })
  }
}

// 创建默认API客户端实例
const apiClient = new APIClient()

// 添加默认拦截器
apiClient.addInterceptor({
  onRequest: (config) => {
    console.log('发起请求:', config.url)
    return config
  },
  onResponse: (response) => {
    console.log('收到响应:', response)
    return response
  },
  onError: (error) => {
    console.error('请求错误:', error)
    return error
  }
})

// 导出API客户端实例
export { apiClient }

// 抽签API调用
export async function callFortuneAPI(openid: string): Promise<FortuneResponse> {
  try {
    const requestData: FortuneRequest = { openid }
    
    const response = await apiClient.post<FortuneResponse>('/api/fortune', requestData)
    
    return response
  } catch (error) {
    console.error('抽签API调用失败:', error)
    
    return {
      success: false,
      error: error instanceof Error ? error.message : '未知错误'
    }
  }
}

// 健康检查API
export async function checkHealth(): Promise<HealthResponse> {
  try {
    const response = await apiClient.get<HealthResponse>('/api/health')
    return response
  } catch (error) {
    console.error('健康检查失败:', error)
    throw error
  }
}

// 带智能重试机制的抽签API调用
export async function callFortuneAPIWithSmartRetry(openid: string): Promise<FortuneResponse> {
  try {
    return await smartRetry(
      () => callFortuneAPI(openid),
      {
        maxRetries: 3,
        baseDelay: 1000,
        maxDelay: 5000,
        backoffFactor: 1.5,
        checkNetwork: true
      }
    )
  } catch (error) {
    console.error('智能重试抽签API失败:', error)
    
    // 显示用户友好的错误提示
    NetworkErrorHandler.showNetworkError(error instanceof Error ? error : new Error('未知错误'))
    
    return {
      success: false,
      error: error instanceof Error ? error.message : '网络请求失败，请重试'
    }
  }
}

// 带用户交互的抽签API调用
export async function callFortuneAPIWithUserInteraction(openid: string): Promise<FortuneResponse> {
  try {
    // 先检查网络状态
    const isConnected = await checkNetworkStatus()
    if (!isConnected) {
      NetworkErrorHandler.showNetworkError(new Error('网络未连接'))
      return {
        success: false,
        error: '网络未连接，请检查网络设置'
      }
    }
    
    // 显示网络状态
    await NetworkErrorHandler.showNetworkStatus()
    
    // 调用API
    return await callFortuneAPIWithSmartRetry(openid)
  } catch (error) {
    console.error('用户交互抽签API失败:', error)
    
    return new Promise((resolve) => {
      NetworkErrorHandler.showRetryPrompt(
        error instanceof Error ? error : new Error('未知错误'),
        async () => {
          // 用户选择重试
          const retryResult = await callFortuneAPIWithSmartRetry(openid)
          resolve(retryResult)
        }
      )
      
      // 如果用户不重试，返回失败结果
      setTimeout(() => {
        resolve({
          success: false,
          error: '用户取消重试'
        })
      }, 100)
    })
  }
}

// 请求重试机制
export async function requestWithRetry<T>(
  requestFn: () => Promise<T>,
  maxRetries: number = MAX_RETRIES,
  delay: number = RETRY_DELAY
): Promise<T> {
  let lastError: Error
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await requestFn()
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('未知错误')
      
      // 检查是否应该重试
      if (!shouldRetry(lastError, i + 1, maxRetries)) {
        break
      }
      
      if (i < maxRetries - 1) {
        console.log(`请求失败，${delay * (i + 1)}ms后进行第${i + 2}次重试...`)
        // 指数退避策略
        await new Promise(resolve => setTimeout(resolve, delay * (i + 1)))
      }
    }
  }
  
  throw lastError!
}

// 判断是否应该重试
function shouldRetry(error: Error, currentAttempt: number, maxRetries: number): boolean {
  // 已达到最大重试次数
  if (currentAttempt >= maxRetries) {
    return false
  }
  
  // 网络相关错误可以重试
  const retryableErrors = [
    'NETWORK_TIMEOUT',
    'NETWORK_FAIL',
    'NETWORK_ERROR',
    'HTTP_500',
    'HTTP_502',
    'HTTP_503',
    'HTTP_504'
  ]
  
  return retryableErrors.some(code => error.message.includes(code))
}

// 网络状态检查
export function checkNetworkStatus(): Promise<boolean> {
  return new Promise((resolve) => {
    uni.getNetworkType({
      success: (res) => {
        resolve(res.networkType !== 'none')
      },
      fail: () => {
        resolve(false)
      }
    })
  })
}

// 获取详细网络信息
export function getNetworkInfo(): Promise<{
  isConnected: boolean
  networkType: string
  isWifi: boolean
  isMobile: boolean
}> {
  return new Promise((resolve) => {
    uni.getNetworkType({
      success: (res) => {
        const networkType = res.networkType
        resolve({
          isConnected: networkType !== 'none',
          networkType,
          isWifi: networkType === 'wifi',
          isMobile: ['2g', '3g', '4g', '5g'].includes(networkType)
        })
      },
      fail: () => {
        resolve({
          isConnected: false,
          networkType: 'unknown',
          isWifi: false,
          isMobile: false
        })
      }
    })
  })
}

// 网络错误处理工具类
export class NetworkErrorHandler {
  // 显示网络错误提示
  static showNetworkError(error: Error): void {
    let title = '网络错误'
    let content = '请检查网络连接后重试'
    
    if (error.message.includes('timeout')) {
      title = '连接超时'
      content = '网络连接超时，请检查网络状态'
    } else if (error.message.includes('fail')) {
      title = '连接失败'
      content = '无法连接到服务器，请稍后重试'
    } else if (error.message.includes('500')) {
      title = '服务器错误'
      content = '服务器暂时无法处理请求，请稍后重试'
    }
    
    uni.showModal({
      title,
      content,
      showCancel: false,
      confirmText: '确定'
    })
  }
  
  // 显示重试提示
  static showRetryPrompt(error: Error, onRetry: () => void): void {
    uni.showModal({
      title: '请求失败',
      content: error.message || '网络请求失败，是否重试？',
      confirmText: '重试',
      cancelText: '取消',
      success: (res) => {
        if (res.confirm) {
          onRetry()
        }
      }
    })
  }
  
  // 显示网络状态提示
  static async showNetworkStatus(): Promise<void> {
    const networkInfo = await getNetworkInfo()
    
    if (!networkInfo.isConnected) {
      uni.showToast({
        title: '网络未连接',
        icon: 'none',
        duration: 2000
      })
    } else if (networkInfo.isMobile) {
      uni.showToast({
        title: `当前使用${networkInfo.networkType.toUpperCase()}网络`,
        icon: 'none',
        duration: 1500
      })
    }
  }
}

// 网络监听器
export class NetworkMonitor {
  private listeners: Array<(isConnected: boolean) => void> = []
  private isMonitoring = false
  
  // 开始监听网络状态
  startMonitoring(): void {
    if (this.isMonitoring) return
    
    this.isMonitoring = true
    
    uni.onNetworkStatusChange((res) => {
      console.log('网络状态变化:', res)
      this.notifyListeners(res.isConnected)
      
      if (!res.isConnected) {
        uni.showToast({
          title: '网络连接已断开',
          icon: 'none',
          duration: 2000
        })
      } else {
        uni.showToast({
          title: '网络连接已恢复',
          icon: 'success',
          duration: 1500
        })
      }
    })
  }
  
  // 停止监听
  stopMonitoring(): void {
    this.isMonitoring = false
    // uni.offNetworkStatusChange() // 注释掉，因为uni-app可能不支持此方法
  }
  
  // 添加监听器
  addListener(listener: (isConnected: boolean) => void): void {
    this.listeners.push(listener)
  }
  
  // 移除监听器
  removeListener(listener: (isConnected: boolean) => void): void {
    const index = this.listeners.indexOf(listener)
    if (index > -1) {
      this.listeners.splice(index, 1)
    }
  }
  
  // 通知所有监听器
  private notifyListeners(isConnected: boolean): void {
    this.listeners.forEach(listener => {
      try {
        listener(isConnected)
      } catch (error) {
        console.error('网络状态监听器执行错误:', error)
      }
    })
  }
}

// 创建全局网络监听器实例
export const networkMonitor = new NetworkMonitor()

// 智能重试策略
export async function smartRetry<T>(
  requestFn: () => Promise<T>,
  options: {
    maxRetries?: number
    baseDelay?: number
    maxDelay?: number
    backoffFactor?: number
    checkNetwork?: boolean
  } = {}
): Promise<T> {
  const {
    maxRetries = 3,
    baseDelay = 1000,
    maxDelay = 10000,
    backoffFactor = 2,
    checkNetwork = true
  } = options
  
  let lastError: Error
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      // 检查网络状态
      if (checkNetwork && !(await checkNetworkStatus())) {
        throw new Error('网络未连接，请检查网络设置')
      }
      
      return await requestFn()
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('未知错误')
      
      // 检查是否应该重试
      if (!shouldRetry(lastError, i + 1, maxRetries)) {
        break
      }
      
      if (i < maxRetries - 1) {
        // 计算延迟时间（指数退避 + 随机抖动）
        const delay = Math.min(
          baseDelay * Math.pow(backoffFactor, i) + Math.random() * 1000,
          maxDelay
        )
        
        console.log(`智能重试: ${delay}ms后进行第${i + 2}次重试...`)
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }
  }
  
  throw lastError!
}