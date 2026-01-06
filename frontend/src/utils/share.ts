/**
 * 分享工具类
 * 处理微信小程序和H5环境下的分享功能
 * 使用策略模式优化不同平台的分享逻辑
 */

export interface ShareOptions {
  title: string
  content: string
  imageUrl?: string
  path?: string
}

export interface ShareResult {
  success: boolean
  message: string
}

/**
 * 分享策略接口
 */
interface ShareStrategy {
  shareToFriend(options: ShareOptions): Promise<ShareResult>
  shareToTimeline?(options: ShareOptions): Promise<ShareResult>
  shareNative?(options: ShareOptions): Promise<ShareResult>
  copyToClipboard(options: ShareOptions): Promise<ShareResult>
}

/**
 * 微信小程序分享策略
 */
class WeChatMiniProgramShareStrategy implements ShareStrategy {
  async shareToFriend(options: ShareOptions): Promise<ShareResult> {
    return new Promise((resolve) => {
      try {
        wx.shareAppMessage({
          title: options.title,
          path: options.path || '/pages/index/index',
          imageUrl: options.imageUrl || '/static/share-image.png',
          success: () => resolve({ success: true, message: '分享成功！' }),
          fail: (error: any) => {
            console.error('微信分享失败:', error)
            resolve({ success: false, message: '分享失败，请重试' })
          }
        })
      } catch (error) {
        console.error('微信分享异常:', error)
        resolve({ success: false, message: '分享功能异常' })
      }
    })
  }

  async shareToTimeline(options: ShareOptions): Promise<ShareResult> {
    return new Promise((resolve) => {
      try {
        wx.shareTimeline({
          title: options.title,
          imageUrl: options.imageUrl || '/static/share-image.png',
          success: () => resolve({ success: true, message: '分享到朋友圈成功！' }),
          fail: (error: any) => {
            console.error('朋友圈分享失败:', error)
            resolve({ success: false, message: '分享到朋友圈失败' })
          }
        })
      } catch (error) {
        console.error('朋友圈分享异常:', error)
        resolve({ success: false, message: '分享功能异常' })
      }
    })
  }

  async copyToClipboard(options: ShareOptions): Promise<ShareResult> {
    const shareText = `${options.title}\n${options.content}\n\n来自新年抽签小程序`
    
    return new Promise((resolve) => {
      uni.setClipboardData({
        data: shareText,
        success: () => resolve({ success: true, message: '已复制到剪贴板，快去分享给好友吧！' }),
        fail: () => resolve({ success: false, message: '复制失败，请手动复制分享内容' })
      })
    })
  }
}

/**
 * H5分享策略
 */
class H5ShareStrategy implements ShareStrategy {
  async shareToFriend(options: ShareOptions): Promise<ShareResult> {
    return this.shareNative(options)
  }

  async shareNative(options: ShareOptions): Promise<ShareResult> {
    return new Promise((resolve) => {
      if (navigator.share) {
        navigator.share({
          title: options.title,
          text: options.content,
          url: window.location.href
        }).then(() => {
          resolve({ success: true, message: '分享成功！' })
        }).catch((error) => {
          console.error('原生分享失败:', error)
          this.copyToClipboard(options).then(resolve)
        })
      } else {
        this.copyToClipboard(options).then(resolve)
      }
    })
  }

  async copyToClipboard(options: ShareOptions): Promise<ShareResult> {
    const shareText = `${options.title}\n${options.content}\n\n来自新年抽签小程序`
    
    return new Promise((resolve) => {
      if (navigator.clipboard) {
        navigator.clipboard.writeText(shareText).then(() => {
          resolve({ success: true, message: '已复制到剪贴板，快去分享给好友吧！' })
        }).catch(() => {
          this.fallbackCopyToClipboard(shareText).then(resolve)
        })
      } else {
        this.fallbackCopyToClipboard(shareText).then(resolve)
      }
    })
  }

  private fallbackCopyToClipboard(text: string): Promise<ShareResult> {
    return new Promise((resolve) => {
      try {
        const textArea = document.createElement('textarea')
        textArea.value = text
        textArea.style.position = 'fixed'
        textArea.style.left = '-999999px'
        textArea.style.top = '-999999px'
        document.body.appendChild(textArea)
        textArea.focus()
        textArea.select()
        
        const successful = document.execCommand('copy')
        document.body.removeChild(textArea)
        
        resolve({
          success: successful,
          message: successful ? '已复制到剪贴板，快去分享给好友吧！' : '复制失败，请手动复制分享内容'
        })
      } catch (error) {
        console.error('复制到剪贴板失败:', error)
        resolve({ success: false, message: '复制失败，请手动复制分享内容' })
      }
    })
  }
}

/**
 * 分享管理器 - 使用策略模式管理不同平台的分享逻辑
 */
class ShareManager {
  private strategy: ShareStrategy

  constructor() {
    this.strategy = this.createStrategy()
  }

  private createStrategy(): ShareStrategy {
    // #ifdef MP-WEIXIN
    return new WeChatMiniProgramShareStrategy()
    // #endif
    
    // #ifdef H5
    return new H5ShareStrategy()
    // #endif
    
    // 默认策略（其他平台）
    return new H5ShareStrategy()
  }

  async shareToFriend(options: ShareOptions): Promise<ShareResult> {
    return this.strategy.shareToFriend(options)
  }

  async shareToTimeline(options: ShareOptions): Promise<ShareResult> {
    if (this.strategy.shareToTimeline) {
      return this.strategy.shareToTimeline(options)
    }
    return { success: false, message: '当前平台不支持朋友圈分享' }
  }

  async shareNative(options: ShareOptions): Promise<ShareResult> {
    if (this.strategy.shareNative) {
      return this.strategy.shareNative(options)
    }
    return this.strategy.copyToClipboard(options)
  }

  async copyToClipboard(options: ShareOptions): Promise<ShareResult> {
    return this.strategy.copyToClipboard(options)
  }
}

// 创建全局分享管理器实例
const shareManager = new ShareManager()

/**
 * 微信小程序分享给好友
 */
export function shareToFriend(options: ShareOptions): Promise<ShareResult> {
  return shareManager.shareToFriend(options)
}

/**
 * 微信小程序分享到朋友圈
 */
export function shareToTimeline(options: ShareOptions): Promise<ShareResult> {
  return shareManager.shareToTimeline(options)
}

/**
 * H5环境下的原生分享
 */
export function shareNative(options: ShareOptions): Promise<ShareResult> {
  return shareManager.shareNative(options)
}

/**
 * 复制分享内容到剪贴板
 */
export function copyToClipboard(options: ShareOptions): Promise<ShareResult> {
  return shareManager.copyToClipboard(options)
}

/**
 * 智能分享 - 根据环境自动选择最佳分享方式
 */
export async function smartShare(options: ShareOptions): Promise<ShareResult> {
  // #ifdef MP-WEIXIN
  return shareManager.shareToFriend(options)
  // #endif
  
  // #ifdef H5
  return shareManager.shareNative(options)
  // #endif
  
  // #ifndef MP-WEIXIN || H5
  return shareManager.copyToClipboard(options)
  // #endif
}

/**
 * 生成运势分享内容
 */
export function generateFortuneShareContent(fortuneText: string, isNew: boolean = false): ShareOptions {
  const newBadge = isNew ? '【新运势】' : ''
  
  return {
    title: `${newBadge}我抽到了新年好运势！`,
    content: `${fortuneText}\n\n愿您新年快乐，好运连连！`,
    imageUrl: '/static/share-image.png',
    path: '/pages/index/index'
  }
}

/**
 * 显示分享结果提示
 */
export function showShareResult(result: ShareResult): void {
  uni.showToast({
    title: result.message,
    icon: result.success ? 'success' : 'none',
    duration: 2000
  })
}
/**
 * 分享配置管理器 - 统一管理分享相关配置
 */
class ShareConfig {
  private static instance: ShareConfig
  
  private readonly defaultImageUrl = '/static/share-image.png'
  private readonly defaultPath = '/pages/index/index'
  private readonly appName = '新年抽签小程序'
  
  static getInstance(): ShareConfig {
    if (!ShareConfig.instance) {
      ShareConfig.instance = new ShareConfig()
    }
    return ShareConfig.instance
  }
  
  getDefaultImageUrl(): string {
    return this.defaultImageUrl
  }
  
  getDefaultPath(): string {
    return this.defaultPath
  }
  
  getAppName(): string {
    return this.appName
  }
  
  /**
   * 标准化分享选项 - 确保必要字段有默认值
   */
  normalizeShareOptions(options: ShareOptions): Required<ShareOptions> {
    return {
      title: options.title,
      content: options.content,
      imageUrl: options.imageUrl || this.defaultImageUrl,
      path: options.path || this.defaultPath
    }
  }
  
  /**
   * 生成分享文本 - 统一格式
   */
  generateShareText(options: ShareOptions): string {
    return `${options.title}\n${options.content}\n\n来自${this.appName}`
  }
}

/**
 * 分享结果处理器 - 统一处理分享结果和用户反馈
 */
class ShareResultHandler {
  /**
   * 处理分享成功
   */
  static handleSuccess(message: string = '分享成功！'): ShareResult {
    return { success: true, message }
  }
  
  /**
   * 处理分享失败
   */
  static handleError(error: any, defaultMessage: string = '分享失败，请重试'): ShareResult {
    console.error('分享操作失败:', error)
    
    // 根据错误类型提供更具体的错误信息
    if (error?.errMsg) {
      if (error.errMsg.includes('cancel')) {
        return { success: false, message: '分享已取消' }
      }
      if (error.errMsg.includes('deny')) {
        return { success: false, message: '分享被拒绝，请检查权限设置' }
      }
    }
    
    return { success: false, message: defaultMessage }
  }
  
  /**
   * 处理平台不支持的情况
   */
  static handleUnsupported(feature: string): ShareResult {
    return { 
      success: false, 
      message: `当前平台不支持${feature}功能` 
    }
  }
}

/**
 * 分享性能监控器 - 监控分享操作的性能和成功率
 */
class SharePerformanceMonitor {
  private static metrics = {
    totalShares: 0,
    successfulShares: 0,
    failedShares: 0,
    averageResponseTime: 0
  }
  
  /**
   * 记录分享操作开始
   */
  static startShare(): number {
    return Date.now()
  }
  
  /**
   * 记录分享操作完成
   */
  static endShare(startTime: number, success: boolean): void {
    const duration = Date.now() - startTime
    
    this.metrics.totalShares++
    if (success) {
      this.metrics.successfulShares++
    } else {
      this.metrics.failedShares++
    }
    
    // 计算平均响应时间
    this.metrics.averageResponseTime = 
      (this.metrics.averageResponseTime * (this.metrics.totalShares - 1) + duration) / 
      this.metrics.totalShares
  }
  
  /**
   * 获取分享统计信息
   */
  static getMetrics() {
    return {
      ...this.metrics,
      successRate: this.metrics.totalShares > 0 
        ? (this.metrics.successfulShares / this.metrics.totalShares * 100).toFixed(2) + '%'
        : '0%'
    }
  }
}

// 获取配置实例
const shareConfig = ShareConfig.getInstance()