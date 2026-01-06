// 用户状态管理测试

import { setActivePinia, createPinia } from 'pinia'
import { useUserStore } from '@/stores/user'
import { mockUni, mockWx } from '../setup'

describe('用户状态管理 (User Store)', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    jest.clearAllMocks()
  })

  describe('初始状态', () => {
    it('应该有正确的初始状态', () => {
      const userStore = useUserStore()
      
      expect(userStore.openid).toBeNull()
      expect(userStore.isLoggedIn).toBe(false)
      expect(userStore.lastDrawTime).toBeNull()
      expect(userStore.cooldownRemaining).toBe(0)
    })
  })

  describe('登录功能', () => {
    it('应该能够成功登录', async () => {
      const userStore = useUserStore()
      
      // 模拟微信登录成功
      mockWx.login.mockImplementation((options: any) => {
        options.success({ code: 'test_code_123' })
      })
      
      await userStore.login()
      
      expect(userStore.isLoggedIn).toBe(true)
      expect(userStore.openid).toBeTruthy()
      expect(mockUni.setStorageSync).toHaveBeenCalledWith('user_openid', expect.any(String))
    })

    it('应该处理登录失败', async () => {
      const userStore = useUserStore()
      
      // 模拟微信登录失败
      mockWx.login.mockImplementation((options: any) => {
        options.fail({ errMsg: '登录失败' })
      })
      
      await expect(userStore.login()).rejects.toThrow()
      expect(userStore.isLoggedIn).toBe(false)
      expect(userStore.openid).toBeNull()
    })
  })

  describe('登出功能', () => {
    it('应该能够正确登出', async () => {
      const userStore = useUserStore()
      
      // 先登录
      mockWx.login.mockImplementation((options: any) => {
        options.success({ code: 'test_code_123' })
      })
      await userStore.login()
      
      // 然后登出
      userStore.logout()
      
      expect(userStore.openid).toBeNull()
      expect(userStore.isLoggedIn).toBe(false)
      expect(userStore.lastDrawTime).toBeNull()
      expect(mockUni.removeStorageSync).toHaveBeenCalledWith('user_openid')
    })
  })

  describe('冷却机制', () => {
    it('应该正确计算冷却剩余时间', () => {
      const userStore = useUserStore()
      
      // 设置5秒前的抽签时间
      const fiveSecondsAgo = Date.now() - 5000
      userStore.setLastDrawTime(fiveSecondsAgo)
      
      // 应该还有5秒冷却时间
      expect(userStore.cooldownRemaining).toBe(5)
    })

    it('冷却时间过期后应该返回0', () => {
      const userStore = useUserStore()
      
      // 设置15秒前的抽签时间（超过10秒冷却期）
      const fifteenSecondsAgo = Date.now() - 15000
      userStore.setLastDrawTime(fifteenSecondsAgo)
      
      expect(userStore.cooldownRemaining).toBe(0)
    })

    it('应该能够设置冷却时间', () => {
      const userStore = useUserStore()
      
      userStore.setCooldown(8)
      
      expect(userStore.cooldownRemaining).toBe(8)
      expect(mockUni.setStorageSync).toHaveBeenCalledWith('last_draw_time', expect.any(Number))
    })
  })

  describe('用户初始化', () => {
    it('应该从本地存储恢复用户状态', async () => {
      const savedOpenid = 'saved_openid_123'
      const savedDrawTime = Date.now() - 3000
      
      // 模拟本地存储数据
      mockUni.getStorageSync.mockImplementation((key: string) => {
        if (key === 'user_openid') return savedOpenid
        if (key === 'last_draw_time') return savedDrawTime
        return null
      })
      
      const userStore = useUserStore()
      await userStore.initializeUser()
      
      expect(userStore.openid).toBe(savedOpenid)
      expect(userStore.isLoggedIn).toBe(true)
      expect(userStore.lastDrawTime).toBe(savedDrawTime)
    })

    it('没有本地存储时应该自动登录', async () => {
      // 模拟没有本地存储
      mockUni.getStorageSync.mockReturnValue(null)
      
      // 模拟微信登录成功
      mockWx.login.mockImplementation((options: any) => {
        options.success({ code: 'auto_login_code' })
      })
      
      const userStore = useUserStore()
      await userStore.initializeUser()
      
      expect(userStore.isLoggedIn).toBe(true)
      expect(userStore.openid).toBeTruthy()
    })
  })
})