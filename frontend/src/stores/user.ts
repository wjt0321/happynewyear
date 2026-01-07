import { defineStore } from 'pinia'
import { ref } from 'vue'

interface UserInfo {
  id: string
  nickname?: string
  avatar?: string
}

export const useUserStore = defineStore('user', () => {
  const userInfo = ref<UserInfo | null>(null)
  const lastDrawTime = ref<number>(0)
  const loginTimestamp = ref<number>(0)
  const COOLDOWN_TIME = 10 * 1000

  const STORAGE_KEY = 'fortune_user_data'

  const loadFromStorage = () => {
    try {
      const data = localStorage.getItem(STORAGE_KEY)
      if (data) {
        const parsed = JSON.parse(data)
        userInfo.value = parsed.userInfo
        lastDrawTime.value = parsed.lastDrawTime || 0
        loginTimestamp.value = parsed.loginTimestamp || 0
      }
    } catch (error) {
      console.error('Failed to load user data:', error)
    }
  }

  const saveToStorage = () => {
    try {
      const data = {
        userInfo: userInfo.value,
        lastDrawTime: lastDrawTime.value,
        loginTimestamp: loginTimestamp.value
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    } catch (error) {
      console.error('Failed to save user data:', error)
    }
  }

  const login = (nickname: string) => {
    userInfo.value = {
      id: Date.now().toString(),
      nickname
    }
    loginTimestamp.value = Date.now()
    saveToStorage()
  }

  const logout = () => {
    userInfo.value = null
    lastDrawTime.value = 0
    loginTimestamp.value = 0
    localStorage.removeItem(STORAGE_KEY)
  }

  const updateLastDrawTime = () => {
    lastDrawTime.value = Date.now()
    saveToStorage()
  }

  const isInCooldown = () => {
    const now = Date.now()
    return now - lastDrawTime.value < COOLDOWN_TIME
  }

  const getCooldownRemaining = () => {
    const now = Date.now()
    const elapsed = now - lastDrawTime.value
    const remaining = COOLDOWN_TIME - elapsed
    return Math.max(0, Math.ceil(remaining / 1000))
  }

  const isLoggedIn = () => {
    return userInfo.value !== null
  }

  const isSessionValid = () => {
    if (!loginTimestamp.value) return false
    const SESSION_DURATION = 24 * 60 * 60 * 1000
    return Date.now() - loginTimestamp.value < SESSION_DURATION
  }

  const checkSession = () => {
    loadFromStorage()
    if (!isSessionValid()) {
      logout()
    }
  }

  return {
    userInfo,
    lastDrawTime,
    login,
    logout,
    updateLastDrawTime,
    isInCooldown,
    getCooldownRemaining,
    isLoggedIn,
    checkSession,
    isSessionValid
  }
})
