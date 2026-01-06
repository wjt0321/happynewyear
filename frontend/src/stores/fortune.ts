import { defineStore } from 'pinia'
import { ref } from 'vue'
import { callFortuneAPI } from '@/utils/api'
import type { Fortune, FortuneResponse } from '@/types'

export const useFortuneStore = defineStore('fortune', () => {
  // 状态
  const currentFortune = ref<Fortune | null>(null)
  const isDrawing = ref<boolean>(false)
  const drawHistory = ref<Fortune[]>([])
  const availableCount = ref<number>(50)
  
  // 方法
  async function drawFortune(openid: string): Promise<FortuneResponse> {
    if (isDrawing.value) {
      return {
        success: false,
        error: '正在抽签中，请稍候'
      }
    }
    
    try {
      isDrawing.value = true
      
      // 调用后端API
      const response = await callFortuneAPI(openid)
      
      if (response.success && response.data) {
        // 创建Fortune对象
        const fortune: Fortune = {
          id: response.data.id,
          text: response.data.text,
          category: 'general', // 后端暂时没有分类，使用默认值
          isNew: response.data.isNew,
          timestamp: Date.now()
        }
        
        // 更新当前运势
        currentFortune.value = fortune
        
        // 添加到历史记录
        if (response.data.isNew) {
          drawHistory.value.unshift(fortune)
          availableCount.value = Math.max(0, availableCount.value - 1)
          
          // 保存到本地存储
          saveDrawHistory()
        }
        
        return response
      } else {
        return response
      }
      
    } catch (error) {
      console.error('抽签失败:', error)
      return {
        success: false,
        error: '网络错误，请重试'
      }
    } finally {
      isDrawing.value = false
    }
  }
  
  function setCurrentFortune(fortune: Fortune | null): void {
    currentFortune.value = fortune
  }
  
  function addToHistory(fortune: Fortune): void {
    // 检查是否已存在
    const exists = drawHistory.value.some(f => f.id === fortune.id)
    if (!exists) {
      drawHistory.value.unshift(fortune)
      saveDrawHistory()
    }
  }
  
  function clearHistory(): void {
    drawHistory.value = []
    availableCount.value = 50
    uni.removeStorageSync('draw_history')
    uni.removeStorageSync('available_count')
  }
  
  function saveDrawHistory(): void {
    try {
      uni.setStorageSync('draw_history', drawHistory.value)
      uni.setStorageSync('available_count', availableCount.value)
    } catch (error) {
      console.error('保存抽签历史失败:', error)
    }
  }
  
  function loadDrawHistory(): void {
    try {
      const savedHistory = uni.getStorageSync('draw_history')
      const savedCount = uni.getStorageSync('available_count')
      
      if (savedHistory && Array.isArray(savedHistory)) {
        drawHistory.value = savedHistory
      }
      
      if (typeof savedCount === 'number') {
        availableCount.value = savedCount
      }
      
      console.log('加载抽签历史:', drawHistory.value.length, '条记录')
    } catch (error) {
      console.error('加载抽签历史失败:', error)
    }
  }
  
  async function initializeFortune(): Promise<void> {
    try {
      // 从本地存储加载历史记录
      loadDrawHistory()
      
      console.log('抽签状态初始化完成')
    } catch (error) {
      console.error('抽签状态初始化失败:', error)
      throw error
    }
  }
  
  return {
    // 状态
    currentFortune,
    isDrawing,
    drawHistory,
    availableCount,
    
    // 方法
    drawFortune,
    setCurrentFortune,
    addToHistory,
    clearHistory,
    saveDrawHistory,
    loadDrawHistory,
    initializeFortune
  }
})