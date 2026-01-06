// 改进版用户状态管理测试

import { setActivePinia, createPinia } from 'pinia'
import { useUserStore } from '@/stores/user'
import { mockUni, mockWx } from '../setup'

// 模拟auth模块
jest.mock('@/utils/auth', () => ({
  weChatLogin: jest.fn(),
  getUserProfile: jest.fn(),
  checkLoginStatus: jest.fn(),
  clearLoginStatus: jest.fn(),
  saveUserInfo: jest.fn(),
  getUserInfo: jest.fn(),
  validateOpenid: jest.fn(),
  handleLoginError: jest.fn(),
  retryLogin: jest.fn(),
  showLoginError: jest.fn(),
  checkAndRefreshLogin: jest.fn()
}))

import * as auth from '@/utils/auth'

describe('改进版用户状态管理 (User Store Improved)', () => {
  let userStore: ReturnType<typeof useUserStore>

  beforeEach(() => {
    setActivePinia(createPinia())
    userStore = useUserStore()
    jest.clearAllMocks()
    
    // 设置默认模拟行为
    ;(auth.validateOpenid as jest.Mock).mockReturnValue(true)
    ;(auth.getUserInfo as jest.Mock).mockReturnValue({
      openid: null,
      userInfo: null
    })
    ;(auth.retryLogin as jest.Mock).mockResolvedValue({
      success: true,
      openid: 'mock_openid_123'
    })
    ;(auth.checkAndRefreshLogin as jest.Mock).mockResolvedValue(true)
  })

  describe('初始状态', () => {
    it('应该有正确的初始状态', () => {
      expect(userStore.openid).toBeNull()
      expect(userStore.isLoggedIn).toBe(false)
      expect(userStore.lastDrawTime).toBeNull()
      expect(userStore.cooldownSeconds).toBe(0)
      expect(userStore.userInfo).toBeNull()
      expect(userStore.loginError).toBeNull()
    })

    it('应该正确计算派生状态', () => {
      expect(userStore.cooldownRemaining).toBe(0)
      expect(userStore.isInCooldown).toBe(false)
      expect(userStore.canDraw).toBe(false) // 因为未登录
    })
  })

  describe('登录功能', () => {
    it('应该成功登录并更新状态', async () => {
      const mockResult = {
        success: true,
        openid: 'test_openid_123'
      }
      ;(auth.retryLogin as jest.Mock).mockResolvedValue(mockResult)
      
      const result = await userStore.login()
      
      expect(result.success).toBe(true)
      expect(userStore.openid).toBe('test_openid_123')
      expect(userStore.isLoggedIn).toBe(true)
      expect(userStore.loginError).toBeNull()
      expect(auth.saveUserInfo).toHaveBeenCalledWith('test_openid_123')
      expect(mockUni.showToast).toHaveBeenCalledWith({
        title: '登录成功',
        icon: 'success',
        duration: 1500
      })
    })

    it('应该处理登录失败', async () => {
      const mockResult = {
        success: false,
        openid: '',
        error: '网络连接失败'
      }
      ;(auth.retryLogin as jest.Mock).mockResolvedValue(mockResult)
      ;(auth.showLoginError as jest.Mock).mockResolvedValue(false)
      
      const result = await userStore.login()
      
      expect(result.success).toBe(false)
      expect(userStore.openid).toBeNull()
      expect(userStore.isLoggedIn).toBe(false)
      expect(userStore.loginError).toBe('网络连接失败')
      expect(auth.showLoginError).toHaveBeenCalledWith('网络连接失败')
    })

    it('应该处理无效的openid', async () => {
      const mockResult = {
        success: true,
        openid: 'invalid'
      }
      ;(auth.retryLogin as jest.Mock).mockResolvedValue(mockResult)
      ;(auth.validateOpenid as jest.Mock).mockReturnValue(false)
      
      const result = await userStore.login()
      
      expect(result.success).toBe(false)
      expect(result.error).toBe('openid格式无效')
      expect(userStore.isLoggedIn).toBe(false)
    })

    it('应该处理登录异常', async () => {
      const error = new Error('登录异常')
      ;(auth.retryLogin as jest.Mock).mockRejectedValue(error)
      ;(auth.handleLoginError as jest.Mock).mockReturnValue('登录异常')
      ;(auth.showLoginError as jest.Mock).mockResolvedValue(false)
      
      const result = await userStore.login()
      
      expect(result.success).toBe(false)
      expect(userStore.loginError).toBe('登录异常')
      expect(auth.handleLoginError).toHaveBeenCalledWith(error)
    })
  })

  describe('手动登录功能', () => {
    it('应该显示加载提示并调用登录', async () => {
      const mockResult = {
        success: true,
        openid: 'manual_login_openid'
      }
      ;(auth.retryLogin as jest.Mock).mockResolvedValue(mockResult)
      
      const result = await userStore.manualLogin()
      
      expect(mockUni.showLoading).toHaveBeenCalledWith({
        title: '登录中...',
        mask: true
      })
      expect(mockUni.hideLoading).toHaveBeenCalled()
      expect(result.success).toBe(true)
    })

    it('应该在异常时隐藏加载提示', async () => {
      ;(auth.retryLogin as jest.Mock).mockRejectedValue(new Error('登录失败'))
      ;(auth.handleLoginError as jest.Mock).mockReturnValue('登录失败')
      ;(auth.showLoginError as jest.Mock).mockResolvedValue(false)
      
      await userStore.manualLogin()
      
      expect(mockUni.showLoading).toHaveBeenCalled()
      expect(mockUni.hideLoading).toHaveBeenCalled()
    })
  })

  describe('登出功能', () => {
    it('应该正确清除所有状态', () => {
      // 先设置一些状态
      userStore.openid = 'test_openid'
      userStore.isLoggedIn = true
      userStore.lastDrawTime = Date.now()
      userStore.userInfo = { nickName: '测试用户', avatarUrl: 'test.jpg' }
      userStore.loginError = '之前的错误'
      
      userStore.logout()
      
      expect(userStore.openid).toBeNull()
      expect(userStore.isLoggedIn).toBe(false)
      expect(userStore.lastDrawTime).toBeNull()
      expect(userStore.cooldownSeconds).toBe(0)
      expect(userStore.userInfo).toBeNull()
      expect(userStore.loginError).toBeNull()
      expect(auth.clearLoginStatus).toHaveBeenCalled()
    })
  })

  describe('冷却机制', () => {
    it('应该正确设置最后抽签时间', () => {
      const timestamp = Date.now()
      
      userStore.setLastDrawTime(timestamp)
      
      expect(userStore.lastDrawTime).toBe(timestamp)
      expect(mockUni.setStorageSync).toHaveBeenCalledWith('last_draw_time', timestamp)
    })

    it('应该正确设置冷却时间', () => {
      userStore.setCooldown(5)
      
      expect(userStore.cooldownSeconds).toBe(5)
      expect(userStore.lastDrawTime).toBeTruthy()
      expect(mockUni.setStorageSync).toHaveBeenCalledWith('last_draw_time', expect.any(Number))
    })

    it('应该正确开始冷却期', () => {
      const beforeTime = Date.now()
      
      userStore.startCooldown()
      
      const afterTime = Date.now()
      expect(userStore.lastDrawTime).toBeGreaterThanOrEqual(beforeTime)
      expect(userStore.lastDrawTime).toBeLessThanOrEqual(afterTime)
    })

    it('应该正确计算冷却剩余时间', () => {
      // 设置5秒前的抽签时间
      const fiveSecondsAgo = Date.now() - 5000
      userStore.setLastDrawTime(fiveSecondsAgo)
      
      expect(userStore.cooldownRemaining).toBe(5)
      expect(userStore.isInCooldown).toBe(true)
    })

    it('冷却时间过期后应该返回0', () => {
      // 设置15秒前的抽签时间（超过10秒冷却期）
      const fifteenSecondsAgo = Date.now() - 15000
      userStore.setLastDrawTime(fifteenSecondsAgo)
      
      expect(userStore.cooldownRemaining).toBe(0)
      expect(userStore.isInCooldown).toBe(false)
    })
  })

  describe('用户会话检查', () => {
    it('应该检查并恢复有效会话', async () => {
      ;(auth.checkLoginStatus as jest.Mock).mockResolvedValue(true)
      
      const result = await userStore.checkAndRestoreSession()
      
      expect(result).toBe(true)
      expect(auth.checkLoginStatus).toHaveBeenCalled()
    })

    it('应该在会话失效时清除登录状态', async () => {
      // 先设置登录状态
      userStore.openid = 'test_openid'
      userStore.isLoggedIn = true
      
      ;(auth.checkLoginStatus as jest.Mock).mockResolvedValue(false)
      
      const result = await userStore.checkAndRestoreSession()
      
      expect(result).toBe(false)
      expect(userStore.openid).toBeNull()
      expect(userStore.isLoggedIn).toBe(false)
    })

    it('应该处理会话检查异常', async () => {
      ;(auth.checkLoginStatus as jest.Mock).mockRejectedValue(new Error('检查失败'))
      
      const result = await userStore.checkAndRestoreSession()
      
      expect(result).toBe(false)
    })
  })

  describe('计算属性', () => {
    it('应该正确计算canDraw状态', () => {
      // 未登录时不能抽签
      expect(userStore.canDraw).toBe(false)
      
      // 登录但在冷却期时不能抽签
      userStore.isLoggedIn = true
      userStore.setLastDrawTime(Date.now() - 5000) // 5秒前
      expect(userStore.canDraw).toBe(false)
      
      // 登录且不在冷却期时可以抽签
      userStore.setLastDrawTime(Date.now() - 15000) // 15秒前
      expect(userStore.canDraw).toBe(true)
    })
  })

  describe('状态持久化', () => {
    it('应该在设置抽签时间时保存到本地存储', () => {
      const timestamp = Date.now()
      
      userStore.setLastDrawTime(timestamp)
      
      expect(mockUni.setStorageSync).toHaveBeenCalledWith('last_draw_time', timestamp)
    })

    it('应该在设置冷却时间时计算并保存抽签时间', () => {
      const beforeTime = Date.now()
      
      userStore.setCooldown(3)
      
      const afterTime = Date.now()
      expect(mockUni.setStorageSync).toHaveBeenCalledWith('last_draw_time', expect.any(Number))
      
      // 验证计算的时间戳是合理的（应该是当前时间减去7秒）
      const savedTime = (mockUni.setStorageSync as jest.Mock).mock.calls
        .find(call => call[0] === 'last_draw_time')[1]
      const expectedTime = Date.now() - 7000 // 10 - 3 = 7秒前
      expect(savedTime).toBeGreaterThanOrEqual(beforeTime - 7000)
      expect(savedTime).toBeLessThanOrEqual(afterTime - 7000)
    })
  })
})