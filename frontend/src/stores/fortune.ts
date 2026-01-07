import { defineStore } from 'pinia'
import { ref } from 'vue'
import axios from 'axios'

interface Fortune {
  id: string
  text: string
  category: string
}

interface FortuneDrawResponse {
  success: boolean
  data?: Fortune
  error?: string
  cooldown?: number
}

export const useFortuneStore = defineStore('fortune', () => {
  const currentFortune = ref<Fortune | null>(null)
  const isCurrentNew = ref(false)
  const history = ref<Fortune[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const drawnCount = ref(0)

  const STORAGE_KEY = 'fortune_history'
  const COUNT_KEY = 'fortune_drawn_count'
  const MAX_FORTUNES = 50

  const loadFromStorage = () => {
    try {
      const historyData = localStorage.getItem(STORAGE_KEY)
      const countData = localStorage.getItem(COUNT_KEY)
      if (historyData) {
        history.value = JSON.parse(historyData)
      }
      if (countData) {
        drawnCount.value = parseInt(countData, 10)
      }
    } catch (error) {
      console.error('Failed to load fortune data:', error)
    }
  }

  const saveToStorage = () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(history.value))
      localStorage.setItem(COUNT_KEY, drawnCount.value.toString())
    } catch (error) {
      console.error('Failed to save fortune data:', error)
    }
  }

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'

  const drawFortune = async (openid: string): Promise<FortuneDrawResponse | null> => {
    loading.value = true
    error.value = null

    try {
      const response = await axios.post<FortuneDrawResponse>(
        `${API_BASE_URL}/fortune`,
        { openid }
      )

      if (response.data.success && response.data.data) {
        currentFortune.value = response.data.data
        isCurrentNew.value = true

        if (!history.value.find(f => f.id === currentFortune.value!.id)) {
          history.value.unshift(currentFortune.value)
          drawnCount.value++
          saveToStorage()
        }

        return response.data
      } else {
        error.value = response.data.error || '抽签失败'
        return response.data
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || err.message || '抽签失败，请重试'
      error.value = errorMsg
      console.error('Draw fortune error:', err)
      return null
    } finally {
      loading.value = false
    }
  }

  const canDraw = () => {
    return drawnCount.value < MAX_FORTUNES
  }

  const getRemainingCount = () => {
    return Math.max(0, MAX_FORTUNES - drawnCount.value)
  }

  const clearHistory = () => {
    history.value = []
    drawnCount.value = 0
    currentFortune.value = null
    localStorage.removeItem(STORAGE_KEY)
    localStorage.removeItem(COUNT_KEY)
  }

  const getHistoryByCategory = (category: string) => {
    return history.value.filter(f => f.category === category)
  }

  return {
    currentFortune,
    isCurrentNew,
    history,
    loading,
    error,
    drawnCount,
    MAX_FORTUNES,
    loadFromStorage,
    drawFortune,
    canDraw,
    getRemainingCount,
    clearHistory,
    getHistoryByCategory
  }
})
