// 改进版微信登录工具测试

import { 
  weChatLogin, 
  getUserProfile, 
  checkLoginStatus, 
  clearLoginStatus, 
  saveUserInfo, 
  getUserInfo, 
  validateOpenid, 
  handleLoginError, 
  retryLogin, 
  showLoginError, 
  checkAndRefreshLogin, 
  silentLogin, 
  manualLogin 
} from '@/utils/auth.improved'
import { mockUni, mockWx } from '../setup'

// 模拟网络请求
const mockRequest = jest.fn()
mockUni.request = mockRequest

describe('改进版微信登录工具 (Auth Improved)', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    
    // 重置默认模拟行为
    mockRequest.mockResolvedValue({
      statusCode: 200,
      data: {
        success: true,
        openid: 'mock_openid_123'
      }
    })
    
    mockWx.login.mockImplementation((options: any) => {
      options.success({ code: 'mock_code_123', errMsg: 'login:ok' })
    })
    
    mockWx.checkSession.mockImplementation((options: any) => {
      options.success()
    })
    
    mockUni.getStorageSync.mockReturnValue(null)
  })

  describe('微信登录功能', () => {
    it('应该成功进行微信登录', async () => {
      const result = await weChatLogin()
      
      expect(result.success).toBe(true)
      expect(result.openid).toBe('mock_openid_123')
      expect(mockWx.login).toHaveBeenCalled()
      expect(mockRequest).toHaveBeenCalledWith({
        url: expect.stringContaining('/api/auth/login'),
        method: 'POST',
        data: { code: 'mock_code_123' },
        timeout: 10000,
        header: {
          'Content-Type': 'application/json'
        }
      })
    })

    it('应该处理微信登录失败', async () => {
      mockWx.login.mockImplementation((options: any) => {
        options.fail({ errMsg: 'login:fail' })
      })
      
      const result = await weChatLogin()
      
      expect(result.success).toBe(false)
      expect(result.error).toContain('login:fail')
    })

    it('应该处理后端API错误', async () => {
      mockRequest.mockResolvedValue({
        statusCode: 400,
        data: {
          success: false,
          error: '登录凭证无效'
        }
      })
      
      const result = await weChatLogin()
      
      expect(result.success).toBe(false)
      expect(result.error).toBe('登录凭证无效')
    })

    it('应该处理网络错误', async () => {
      mockRequest.mockRejectedValue(new Error('网络连接失败'))
      
      const result = await weChatLogin()
      
      expect(result.success).toBe(false)
      expect(result.error).toContain('网络连接失败')
    })
  })

  describe('用户信息获取', () => {
    it('应该成功获取用户信息', async () => {
      const mockUserInfo = {
        nickName: '测试用户',
        avatarUrl: 'https://example.com/avatar.jpg',
        gender: 1,
        country: '中国',
        province: '北京',
        city: '北京'
      }
      
      mockWx.getUserProfile.mockImplementation((options: any) => {
        options.success({
          userInfo: mockUserInfo,
          rawData: JSON.stringify(mockUserInfo),
          signature: 'mock_signature',
          encryptedData: 'mock_encrypted_data',
          iv: 'mock_iv',
          errMsg: 'getUserProfile:ok'
        })
      })
      
      const result = await getUserProfile()
      
      expect(result).toEqual(mockUserInfo)
      expect(mockWx.getUserProfile).toHaveBeenCalledWith({
        desc: '用于完善用户资料',
        success: expect.any(Function),
        fail: expect.any(Function)
      })
    })

    it('应该处理用户拒绝授权', async () => {
      mockWx.getUserProfile.mockImplementation((options: any) => {
        options.fail({ errMsg: 'getUserProfile:fail auth deny' })
      })
      
      await expect(getUserProfile()).rejects.toThrow('getUserProfile:fail auth deny')
    })
  })

  describe('登录状态检查', () => {
    it('应该检查登录状态有效', async () => {
      // 模拟有效的登录时间戳（1小时前）
      const oneHourAgo = Date.now() - 60 * 60 * 1000
      mockUni.getStorageSync.mockImplementation((key: string) => {
        if (key === 'login_timestamp') return oneHourAgo
        return null
      })
      
      const result = await checkLoginStatus()
      
      expect(result).toBe(true)
      expect(mockWx.checkSession).toHaveBeenCalled()
    })

    it('应该检测到登录状态过期', async () => {
      // 模拟过期的登录时间戳（25小时前）
      const twentyFiveHoursAgo = Date.now() - 25 * 60 * 60 * 1000
      mockUni.getStorageSync.mockImplementation((key: string) => {
        if (key === 'login_timestamp') return twentyFiveHoursAgo
        return null
      })
      
      const result = await checkLoginStatus()
      
      expect(result).toBe(false)
      expect(mockUni.removeStorageSync).toHaveBeenCalled()
    })

    it('应该处理微信会话失效', async () => {
      const oneHourAgo = Date.now() - 60 * 60 * 1000
      mockUni.getStorageSync.mockImplementation((key: string) => {
        if (key === 'login_timestamp') return oneHourAgo
        return null
      })
      
      mockWx.checkSession.mockImplementation((options: any) => {
        options.fail()
      })
      
      const result = await checkLoginStatus()
      
      expect(result).toBe(false)
    })
  })

  describe('本地存储管理', () => {
    it('应该正确保存用户信息', () => {
      const openid = 'test_openid_123'
      const userInfo = {
        nickName: '测试用户',
        avatarUrl: 'https://example.com/avatar.jpg'
      }
      
      saveUserInfo(openid, userInfo)
      
      expect(mockUni.setStorageSync).toHaveBeenCalledWith('user_openid', openid)
      expect(mockUni.setStorageSync).toHaveBeenCalledWith('user_info', userInfo)
    })

    it('应该正确获取用户信息', () => {
      const openid = 'stored_openid_123'
      const userInfo = { nickName: '存储用户', avatarUrl: 'stored_avatar.jpg' }
      
      mockUni.getStorageSync.mockImplementation((key: string) => {
        if (key === 'user_openid') return openid
        if (key === 'user_info') return userInfo
        return null
      })
      
      const result = getUserInfo()
      
      expect(result.openid).toBe(openid)
      expect(result.userInfo).toEqual(userInfo)
    })

    it('应该正确清除登录状态', () => {
      clearLoginStatus()
      
      expect(mockUni.removeStorageSync).toHaveBeenCalledWith('user_openid')
      expect(mockUni.removeStorageSync).toHaveBeenCalledWith('user_info')
      expect(mockUni.removeStorageSync).toHaveBeenCalledWith('last_draw_time')
      expect(mockUni.removeStorageSync).toHaveBeenCalledWith('login_timestamp')
    })
  })

  describe('openid验证', () => {
    it('应该验证有效的openid', () => {
      expect(validateOpenid('valid_openid_123456')).toBe(true)
      expect(validateOpenid('mock_openid_abcdef')).toBe(true)
      expect(validateOpenid('user-id-with-dash')).toBe(true)
    })

    it('应该拒绝无效的openid', () => {
      expect(validateOpenid('')).toBe(false)
      expect(validateOpenid('short')).toBe(false)
      expect(validateOpenid('invalid@openid')).toBe(false)
      expect(validateOpenid(null as any)).toBe(false)
      expect(validateOpenid(undefined as any)).toBe(false)
    })
  })

  describe('错误处理', () => {
    it('应该正确处理字符串错误', () => {
      const error = '网络连接失败'
      const result = handleLoginError(error)
      expect(result).toBe(error)
    })

    it('应该处理微信API错误', () => {
      const error = { errMsg: 'login:fail auth deny' }
      const result = handleLoginError(error)
      expect(result).toBe('用户拒绝授权')
    })

    it('应该处理Error对象', () => {
      const error = new Error('测试错误')
      const result = handleLoginError(error)
      expect(result).toBe('测试错误')
    })

    it('应该处理未知错误', () => {
      const error = { unknown: 'error' }
      const result = handleLoginError(error)
      expect(result).toBe('登录过程中发生未知错误')
    })
  })

  describe('重试机制', () => {
    it('应该在第一次尝试成功时返回结果', async () => {
      const result = await retryLogin(3)
      
      expect(result.success).toBe(true)
      expect(mockWx.login).toHaveBeenCalledTimes(1)
    })

    it('应该在网络错误时重试', async () => {
      let attemptCount = 0
      mockRequest.mockImplementation(() => {
        attemptCount++
        if (attemptCount < 3) {
          return Promise.reject(new Error('网络连接失败'))
        }
        return Promise.resolve({
          statusCode: 200,
          data: { success: true, openid: 'retry_success_openid' }
        })
      })
      
      const result = await retryLogin(3)
      
      expect(result.success).toBe(true)
      expect(result.openid).toBe('retry_success_openid')
      expect(mockWx.login).toHaveBeenCalledTimes(3)
    })

    it('应该在达到最大重试次数后失败', async () => {
      mockRequest.mockRejectedValue(new Error('持续网络错误'))
      
      const result = await retryLogin(2)
      
      expect(result.success).toBe(false)
      expect(result.error).toContain('已重试 2 次')
      expect(mockWx.login).toHaveBeenCalledTimes(2)
    })
  })

  describe('错误提示显示', () => {
    it('应该显示登录错误提示', async () => {
      mockUni.showModal.mockImplementation((options: any) => {
        options.success({ confirm: true })
      })
      
      const result = await showLoginError('测试错误')
      
      expect(result).toBe(true)
      expect(mockUni.showModal).toHaveBeenCalledWith({
        title: '登录失败',
        content: '测试错误',
        showCancel: true,
        cancelText: '取消',
        confirmText: '重试',
        success: expect.any(Function)
      })
    })

    it('应该根据错误类型定制提示信息', async () => {
      mockUni.showModal.mockImplementation((options: any) => {
        options.success({ confirm: false })
      })
      
      await showLoginError('用户拒绝授权')
      
      expect(mockUni.showModal).toHaveBeenCalledWith(
        expect.objectContaining({
          title: '需要授权',
          content: '请允许小程序获取您的微信信息以正常使用功能'
        })
      )
    })
  })

  describe('登录状态刷新', () => {
    it('应该在登录状态有效时返回true', async () => {
      mockUni.getStorageSync.mockImplementation((key: string) => {
        if (key === 'user_openid') return 'valid_openid'
        if (key === 'login_timestamp') return Date.now() - 60 * 60 * 1000 // 1小时前
        return null
      })
      
      const result = await checkAndRefreshLogin()
      
      expect(result).toBe(true)
    })

    it('应该在没有本地登录信息时返回false', async () => {
      mockUni.getStorageSync.mockReturnValue(null)
      
      const result = await checkAndRefreshLogin()
      
      expect(result).toBe(false)
    })
  })

  describe('静默登录', () => {
    it('应该使用现有有效登录状态', async () => {
      mockUni.getStorageSync.mockImplementation((key: string) => {
        if (key === 'user_openid') return 'existing_openid'
        if (key === 'login_timestamp') return Date.now() - 60 * 60 * 1000
        return null
      })
      
      const result = await silentLogin()
      
      expect(result.success).toBe(true)
      expect(result.openid).toBe('existing_openid')
      expect(mockWx.login).not.toHaveBeenCalled()
    })

    it('应该在没有有效登录状态时进行新登录', async () => {
      mockUni.getStorageSync.mockReturnValue(null)
      
      const result = await silentLogin()
      
      expect(result.success).toBe(true)
      expect(mockWx.login).toHaveBeenCalled()
      expect(mockUni.setStorageSync).toHaveBeenCalledWith('user_openid', 'mock_openid_123')
    })
  })

  describe('手动登录', () => {
    it('应该显示加载提示并成功登录', async () => {
      const result = await manualLogin()
      
      expect(result.success).toBe(true)
      expect(mockUni.showLoading).toHaveBeenCalledWith({
        title: '登录中...',
        mask: true
      })
      expect(mockUni.hideLoading).toHaveBeenCalled()
      expect(mockUni.showToast).toHaveBeenCalledWith({
        title: '登录成功',
        icon: 'success',
        duration: 1500
      })
    })

    it('应该在登录失败时显示错误提示', async () => {
      mockRequest.mockRejectedValue(new Error('登录失败'))
      mockUni.showModal.mockImplementation((options: any) => {
        options.success({ confirm: false }) // 用户选择不重试
      })
      
      const result = await manualLogin()
      
      expect(result.success).toBe(false)
      expect(mockUni.showLoading).toHaveBeenCalled()
      expect(mockUni.hideLoading).toHaveBeenCalled()
      expect(mockUni.showModal).toHaveBeenCalled()
    })
  })
})