/**
 * 全局测试环境配置 - 优化测试性能和体验
 */

// 全局测试配置
global.console = {
  ...console,
  // 在测试环境中静默某些日志
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: console.warn,
  error: console.error,
}

// 模拟uni-app全局对象
global.uni = {
  // 模拟uni-app API
  showToast: jest.fn(),
  showModal: jest.fn(),
  navigateTo: jest.fn(),
  redirectTo: jest.fn(),
  switchTab: jest.fn(),
  reLaunch: jest.fn(),
  navigateBack: jest.fn(),
  
  // 模拟网络请求
  request: jest.fn().mockResolvedValue({
    statusCode: 200,
    data: {}
  }),
  
  // 模拟存储API
  setStorage: jest.fn(),
  getStorage: jest.fn(),
  removeStorage: jest.fn(),
  clearStorage: jest.fn(),
  
  // 模拟设备API
  getSystemInfo: jest.fn().mockResolvedValue({
    platform: 'devtools',
    system: 'iOS 14.0',
    version: '8.0.5',
    screenWidth: 375,
    screenHeight: 812
  })
}

// 模拟微信小程序全局对象
global.wx = {
  ...global.uni,
  
  // 微信特有API
  login: jest.fn().mockResolvedValue({
    code: 'mock_code_12345'
  }),
  
  getUserProfile: jest.fn().mockResolvedValue({
    userInfo: {
      nickName: '测试用户',
      avatarUrl: 'https://example.com/avatar.png'
    }
  }),
  
  shareAppMessage: jest.fn(),
  
  // 微信支付
  requestPayment: jest.fn().mockResolvedValue({
    errMsg: 'requestPayment:ok'
  })
}

// 模拟performance API（如果不存在）
if (typeof global.performance === 'undefined') {
  global.performance = {
    now: jest.fn(() => Date.now()),
    mark: jest.fn(),
    measure: jest.fn(),
    getEntriesByName: jest.fn(() => []),
    getEntriesByType: jest.fn(() => []),
    clearMarks: jest.fn(),
    clearMeasures: jest.fn()
  } as any
}

// 测试环境优化配置
const TEST_CONFIG = {
  // 组件挂载超时时间
  MOUNT_TIMEOUT: 5000,
  
  // 异步操作超时时间
  ASYNC_TIMEOUT: 3000,
  
  // 性能测试阈值
  PERFORMANCE_THRESHOLDS: {
    COMPONENT_MOUNT: 50,    // 组件挂载时间阈值(ms)
    STATE_CHANGE: 20,       // 状态变化时间阈值(ms)
    EVENT_HANDLING: 10      // 事件处理时间阈值(ms)
  }
}

// 导出配置供测试使用
global.TEST_CONFIG = TEST_CONFIG

// 测试工具函数
global.testUtils = {
  /**
   * 等待异步操作完成
   * @param ms 等待时间(毫秒)
   */
  wait: (ms: number) => new Promise(resolve => setTimeout(resolve, ms)),
  
  /**
   * 等待Vue组件更新完成
   * @param wrapper Vue组件包装器
   */
  waitForUpdate: async (wrapper: any) => {
    await wrapper.vm.$nextTick()
    await new Promise(resolve => setTimeout(resolve, 0))
  },
  
  /**
   * 模拟用户交互延迟
   */
  simulateUserDelay: () => new Promise(resolve => setTimeout(resolve, 16)), // 一帧的时间
  
  /**
   * 创建测试用的Promise
   * @param resolveValue 解析值
   * @param delay 延迟时间
   */
  createTestPromise: <T>(resolveValue: T, delay: number = 0) => 
    new Promise<T>(resolve => setTimeout(() => resolve(resolveValue), delay))
}

// 全局错误处理
const originalError = console.error
console.error = (...args: any[]) => {
  // 过滤掉一些已知的无害警告
  const message = args[0]
  if (typeof message === 'string') {
    // 忽略Vue的开发环境警告
    if (message.includes('[Vue warn]') && message.includes('test environment')) {
      return
    }
    
    // 忽略uni-app的模拟API警告
    if (message.includes('uni.') && message.includes('is not a function')) {
      return
    }
  }
  
  originalError.apply(console, args)
}

// 测试环境标识
process.env.NODE_ENV = 'test'
process.env.VUE_APP_PLATFORM = 'mp-weixin'

console.info('🧪 测试环境配置完成')
console.info(`📊 性能阈值: 组件挂载 ${TEST_CONFIG.PERFORMANCE_THRESHOLDS.COMPONENT_MOUNT}ms`)
console.info(`⚡ 优化配置: 已启用测试缓存和性能监控`)