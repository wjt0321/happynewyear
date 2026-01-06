<template>
  <view id="app">
    <!-- 全局加载状态 -->
    <view v-if="isLoading" class="global-loading">
      <view class="loading-content">
        <view class="loading-spinner"></view>
        <text class="loading-text">加载中...</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onLaunch, onShow, onHide } from 'vue'
import { useUserStore } from '@/stores/user'
import { useFortuneStore } from '@/stores/fortune'

// 全局状态
const isLoading = ref(false)

// 状态管理
const userStore = useUserStore()
const fortuneStore = useFortuneStore()

// 应用启动时的初始化
onLaunch(() => {
  console.log('应用启动')
  initializeApp()
})

// 应用显示时
onShow(() => {
  console.log('应用显示')
})

// 应用隐藏时
onHide(() => {
  console.log('应用隐藏')
})

// 初始化应用
async function initializeApp() {
  try {
    isLoading.value = true
    
    // 初始化用户状态
    await userStore.initializeUser()
    
    // 初始化抽签状态
    await fortuneStore.initializeFortune()
    
  } catch (error) {
    console.error('应用初始化失败:', error)
    uni.showToast({
      title: '初始化失败',
      icon: 'error',
      duration: 2000
    })
  } finally {
    isLoading.value = false
  }
}
</script>

<style lang="scss">
/* 全局样式重置 */
* {
  box-sizing: border-box;
}

page {
  background: linear-gradient(180deg, #FF4757 0%, #FF6B35 50%, #FFD700 100%);
  min-height: 100vh;
  font-family: 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
}

/* 全局加载状态样式 */
.global-loading {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100vh;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  
  .loading-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 32rpx;
    
    .loading-spinner {
      width: 80rpx;
      height: 80rpx;
      border: 6rpx solid rgba(255, 255, 255, 0.3);
      border-top: 6rpx solid #FFD700;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }
    
    .loading-text {
      color: white;
      font-size: 28rpx;
    }
  }
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* 全局工具类 */
.text-center {
  text-align: center;
}

.flex-center {
  display: flex;
  align-items: center;
  justify-content: center;
}

.flex-column {
  display: flex;
  flex-direction: column;
}

.full-width {
  width: 100%;
}

.full-height {
  height: 100%;
}
</style>