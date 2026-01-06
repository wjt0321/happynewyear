// 抽签状态管理测试

import { setActivePinia, createPinia } from 'pinia'
import { useFortuneStore } from '@/stores/fortune'
import { mockUni } from '../setup'

// 辅助函数
function createMockApiResponse(overrides: any = {}) {
  return {
    success: true,
    data: {
      id: 1,
      text: '新年快乐，万事如意！',
      isNew: true
    },
    ...overrides
  }
}

function mockUniRequestSuccess(data: any) {
  const mockUniInstance = mockUni as any
  mockUniInstance.request.mockImplementation((options: any) => {
    options.success?.({
      statusCode: 200,
      data
    })
  })
}

function mockUniRequestFail(error: any) {
  const mockUniInstance = mockUni as any
  mockUniInstance.request.mockImplementation((options: any) => {
    options.fail?.(error)
  })
}

describe('抽签状态管理 (Fortune Store)', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    jest.clearAllMocks()
  })

  describe('初始状态', () => {
    it('应该有正确的初始状态', () => {
      const fortuneStore = useFortuneStore()
      
      expect(fortuneStore.currentFortune).toBeNull()
      expect(fortuneStore.isDrawing).toBe(false)
      expect(fortuneStore.drawHistory).toEqual([])
      expect(fortuneStore.availableCount).toBe(50)
    })
  })

  describe('抽签功能', () => {
    it('应该能够成功抽签', async () => {
      const fortuneStore = useFortuneStore()
      const mockResponse = createMockApiResponse({
        data: {
          id: 1,
          text: '新年快乐，万事如意！',
          isNew: true
        }
      })
      
      // 模拟API成功响应
      mockUniRequestSuccess(mockResponse)
      
      const result = await fortuneStore.drawFortune('test_openid')
      
      expect(result.success).toBe(true)
      expect(fortuneStore.currentFortune).toBeTruthy()
      expect(fortuneStore.currentFortune?.text).toBe('新年快乐，万事如意！')
      expect(fortuneStore.drawHistory).toHaveLength(1)
      expect(fortuneStore.availableCount).toBe(49)
    })

    it('应该处理抽签失败', async () => {
      const fortuneStore = useFortuneStore()
      
      // 模拟API失败响应
      mockUniRequestFail({ errMsg: '网络错误' })
      
      const result = await fortuneStore.drawFortune('test_openid')
      
      expect(result.success).toBe(false)
      expect(result.error).toBeTruthy()
      expect(fortuneStore.currentFortune).toBeNull()
    })

    it('正在抽签时应该拒绝新的抽签请求', async () => {
      const fortuneStore = useFortuneStore()
      
      // 设置正在抽签状态
      fortuneStore.isDrawing = true
      
      const result = await fortuneStore.drawFortune('test_openid')
      
      expect(result.success).toBe(false)
      expect(result.error).toContain('正在抽签中')
    })

    it('重复抽签不应该增加历史记录', async () => {
      const fortuneStore = useFortuneStore()
      const mockResponse = createMockApiResponse({
        data: {
          id: 1,
          text: '新年快乐，万事如意！',
          isNew: false // 不是新抽签
        }
      })
      
      mockUniRequestSuccess(mockResponse)
      
      await fortuneStore.drawFortune('test_openid')
      
      expect(fortuneStore.drawHistory).toHaveLength(0)
      expect(fortuneStore.availableCount).toBe(50) // 数量不变
    })
  })

  describe('历史记录管理', () => {
    it('应该能够添加到历史记录', () => {
      const fortuneStore = useFortuneStore()
      const fortune = {
        id: 1,
        text: '测试运势',
        category: 'general',
        isNew: true,
        timestamp: Date.now()
      }
      
      fortuneStore.addToHistory(fortune)
      
      expect(fortuneStore.drawHistory).toHaveLength(1)
      expect(fortuneStore.drawHistory[0]).toEqual(fortune)
    })

    it('不应该添加重复的历史记录', () => {
      const fortuneStore = useFortuneStore()
      const fortune = {
        id: 1,
        text: '测试运势',
        category: 'general',
        isNew: true,
        timestamp: Date.now()
      }
      
      fortuneStore.addToHistory(fortune)
      fortuneStore.addToHistory(fortune) // 重复添加
      
      expect(fortuneStore.drawHistory).toHaveLength(1)
    })

    it('应该能够清除历史记录', () => {
      const fortuneStore = useFortuneStore()
      
      // 先添加一些历史记录
      fortuneStore.addToHistory({
        id: 1,
        text: '测试运势1',
        category: 'general',
        isNew: true,
        timestamp: Date.now()
      })
      
      fortuneStore.clearHistory()
      
      expect(fortuneStore.drawHistory).toHaveLength(0)
      expect(fortuneStore.availableCount).toBe(50)
      expect(mockUni.removeStorageSync).toHaveBeenCalledWith('draw_history')
    })
  })

  describe('本地存储', () => {
    it('应该保存历史记录到本地存储', () => {
      const fortuneStore = useFortuneStore()
      const fortune = {
        id: 1,
        text: '测试运势',
        category: 'general',
        isNew: true,
        timestamp: Date.now()
      }
      
      fortuneStore.addToHistory(fortune)
      
      expect(mockUni.setStorageSync).toHaveBeenCalledWith('draw_history', [fortune])
      expect(mockUni.setStorageSync).toHaveBeenCalledWith('available_count', 50)
    })

    it('应该从本地存储加载历史记录', () => {
      const savedHistory = [
        {
          id: 1,
          text: '保存的运势',
          category: 'general',
          isNew: true,
          timestamp: Date.now()
        }
      ]
      const savedCount = 49
      
      // 模拟本地存储数据
      mockUni.getStorageSync.mockImplementation((key: string) => {
        if (key === 'draw_history') return savedHistory
        if (key === 'available_count') return savedCount
        return null
      })
      
      const fortuneStore = useFortuneStore()
      fortuneStore.loadDrawHistory()
      
      expect(fortuneStore.drawHistory).toEqual(savedHistory)
      expect(fortuneStore.availableCount).toBe(savedCount)
    })
  })

  describe('初始化', () => {
    it('应该正确初始化抽签状态', async () => {
      const savedHistory = [
        {
          id: 1,
          text: '保存的运势',
          category: 'general',
          isNew: true,
          timestamp: Date.now()
        }
      ]
      
      mockUni.getStorageSync.mockImplementation((key: string) => {
        if (key === 'draw_history') return savedHistory
        if (key === 'available_count') return 49
        return null
      })
      
      const fortuneStore = useFortuneStore()
      await fortuneStore.initializeFortune()
      
      expect(fortuneStore.drawHistory).toEqual(savedHistory)
      expect(fortuneStore.availableCount).toBe(49)
    })
  })
})