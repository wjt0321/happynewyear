// Jest测试环境设置文件

// 全局模拟uni-app API
const mockUni = {
  // 网络请求
  request: jest.fn(),
  
  // 数据存储
  setStorageSync: jest.fn(),
  getStorageSync: jest.fn(),
  removeStorageSync: jest.fn(),
  
  // 页面导航
  navigateTo: jest.fn(),
  navigateBack: jest.fn(),
  redirectTo: jest.fn(),
  switchTab: jest.fn(),
  
  // 界面交互
  showToast: jest.fn(),
  showModal: jest.fn(),
  showLoading: jest.fn(),
  hideLoading: jest.fn(),
  
  // 设备信息
  getSystemInfo: jest.fn(),
  getNetworkType: jest.fn(),
  
  // 网络状态监听
  onNetworkStatusChange: jest.fn(),
  offNetworkStatusChange: jest.fn(),
  
  // 微信小程序API模拟
  login: jest.fn(),
  getUserProfile: jest.fn(),
  checkSession: jest.fn(),
  shareAppMessage: jest.fn()
}

// 全局模拟wx API（微信小程序）
const mockWx = {
  login: jest.fn(),
  getUserProfile: jest.fn(),
  checkSession: jest.fn(),
  shareAppMessage: jest.fn(),
  getSystemInfo: jest.fn(),
  request: jest.fn()
}

// 将模拟对象挂载到全局
global.uni = mockUni
global.wx = mockWx

// 模拟getCurrentPages
global.getCurrentPages = jest.fn(() => [
  {
    options: {},
    route: 'pages/index/index'
  }
])

// Vue Test Utils全局配置
// config.global.mocks = {
//   $uni: mockUni,
//   $wx: mockWx
// }

// 模拟console方法以减少测试输出噪音
const originalConsoleError = console.error
const originalConsoleWarn = console.warn

beforeAll(() => {
  console.error = jest.fn()
  console.warn = jest.fn()
})

afterAll(() => {
  console.error = originalConsoleError
  console.warn = originalConsoleWarn
})

// 每个测试前重置所有模拟
beforeEach(() => {
  jest.clearAllMocks()
  
  // 重置uni API模拟的默认行为
  mockUni.getStorageSync.mockReturnValue(null)
  mockUni.request.mockResolvedValue({
    statusCode: 200,
    data: { success: true }
  })
  
  // 重置wx API模拟的默认行为
  mockWx.login.mockResolvedValue({
    code: 'mock_code_123'
  })
  mockWx.checkSession.mockResolvedValue({})
})

// 模拟window对象的一些属性
Object.defineProperty(window, 'location', {
  value: {
    href: 'http://localhost:3000',
    origin: 'http://localhost:3000'
  },
  writable: true
})

// 模拟IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  observe() {}
  unobserve() {}
  disconnect() {}
}

// 模拟ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  observe() {}
  unobserve() {}
  disconnect() {}
}

// 导出模拟对象供测试使用
export { mockUni, mockWx }