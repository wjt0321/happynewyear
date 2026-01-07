<template>
  <view class="home-container">
    <!-- 动画背景层 -->
    <AnimatedBackground />
    
    <!-- 新年装饰层 -->
    <NewYearDecoration />
    
    <!-- 主内容区 -->
    <view class="main-content">
      <!-- 顶部标题区 -->
      <view class="header-section">
        <text class="app-title">🧧 新年抽签 🧧</text>
        <text class="app-subtitle">2026龙年大吉 · 好运连连</text>
      </view>
      
      <!-- 中央抽签区 -->
      <view class="fortune-section">
        <view class="fortune-container">
          <!-- 装饰性元素 -->
          <view class="decoration-top">
            <text class="decoration-text">🎊 恭喜发财 🎊</text>
          </view>
          
          <!-- 抽签按钮 -->
          <FortuneButton 
            :disabled="isDrawing || cooldownRemaining > 0"
            :cooldown="cooldownRemaining"
            :is-drawing="isDrawing"
            @click="handleDraw"
          />
          
          <!-- 装饰性元素 -->
          <view class="decoration-bottom">
            <text class="decoration-text">🎉 万事如意 🎉</text>
          </view>
        </view>
      </view>
      
      <!-- 底部信息区 -->
      <view class="info-section">
        <text class="info-text">轻触上方按钮，抽取您的新年运势</text>
        <text class="info-subtext">每人限抽50次 · 好运不重样</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useUserStore } from '@/stores/user'
import { useFortuneStore } from '@/stores/fortune'
import AnimatedBackground from '@/components/AnimatedBackground.vue'
import NewYearDecoration from '@/components/NewYearDecoration.vue'
import FortuneButton from '@/components/FortuneButton.vue'

// 状态管理
const userStore = useUserStore()
const fortuneStore = useFortuneStore()

// 本地状态
const isDrawing = ref(false)
const cooldownTimer = ref<number | null>(null)

// 计算属性
const cooldownRemaining = computed(() => userStore.cooldownRemaining)

// 页面加载时初始化
onMounted(() => {
  initializePage()
})

// 页面卸载时清理
onUnmounted(() => {
  console.log('页面卸载，清理资源')
  stopCooldownTimer()
})

// 添加页面生命周期处理
// 注意：在uni-app中，需要使用onShow和onHide来处理页面显示/隐藏
// 但在setup语法中，我们使用onMounted和onUnmounted
// 实际的页面显示/隐藏会通过uni-app的页面生命周期自动处理

// 初始化页面
async function initializePage() {
  try {
    console.log('开始初始化首页...')
    
    // 显示初始化加载
    uni.showLoading({
      title: '初始化中...',
      mask: true
    })
    
    // 并行初始化用户状态和抽签状态
    await Promise.all([
      userStore.initializeUser(),
      fortuneStore.initializeFortune()
    ])
    
    // 隐藏加载提示
    uni.hideLoading()
    
    // 检查登录状态
    if (!userStore.isLoggedIn) {
      console.log('用户未登录，显示登录提示')
      
      // 延迟显示登录提示，避免与加载提示冲突
      setTimeout(() => {
        uni.showModal({
          title: '欢迎使用新年抽签',
          content: '请先登录微信账号以使用抽签功能，每人可抽取50条不重复的新年运势！',
          showCancel: true,
          confirmText: '立即登录',
          cancelText: '稍后再说',
          success: async (res) => {
            if (res.confirm) {
              try {
                const result = await userStore.manualLogin()
                if (!result.success) {
                  console.error('手动登录失败:', result.error)
                  // 登录失败时显示友好提示
                  uni.showToast({
                    title: '登录失败，可稍后重试',
                    icon: 'none',
                    duration: 2000
                  })
                } else {
                  console.log('登录成功，用户可以开始抽签')
                  uni.showToast({
                    title: '登录成功！',
                    icon: 'success',
                    duration: 1500
                  })
                }
              } catch (error) {
                console.error('登录过程异常:', error)
                uni.showToast({
                  title: '登录异常，请稍后重试',
                  icon: 'none',
                  duration: 2000
                })
              }
            } else {
              console.log('用户选择稍后登录')
            }
          }
        })
      }, 500)
    } else {
      console.log('用户已登录，openid:', userStore.openid)
      
      // 显示欢迎信息
      uni.showToast({
        title: '欢迎回来！',
        icon: 'success',
        duration: 1500
      })
    }
    
    // 启动冷却倒计时
    startCooldownTimer()
    
    // 显示可用运势数量
    if (fortuneStore.availableCount < 50) {
      console.log(`用户还可抽取 ${fortuneStore.availableCount} 条运势`)
    }
    
    console.log('首页初始化完成')
    
  } catch (error) {
    console.error('页面初始化失败:', error)
    
    // 隐藏加载提示
    uni.hideLoading()
    
    // 显示用户友好的错误信息
    const errorMessage = userStore.loginError || '初始化失败，请重试'
    
    uni.showModal({
      title: '初始化失败',
      content: errorMessage,
      showCancel: true,
      confirmText: '重试',
      cancelText: '取消',
      success: (res) => {
        if (res.confirm) {
          // 重新初始化
          setTimeout(() => initializePage(), 500)
        } else {
          console.log('用户取消重试，但页面仍可使用')
        }
      }
    })
  }
}

// 处理抽签点击
async function handleDraw() {
  // 防止重复点击
  if (isDrawing.value || cooldownRemaining.value > 0) {
    if (cooldownRemaining.value > 0) {
      uni.showToast({
        title: `请等待 ${cooldownRemaining.value} 秒后再抽签`,
        icon: 'none',
        duration: 2000
      })
    }
    return
  }
  
  // 检查登录状态
  if (!userStore.isLoggedIn || !userStore.openid) {
    console.log('用户未登录，显示登录提示')
    uni.showModal({
      title: '需要登录',
      content: '请先登录微信账号以使用抽签功能',
      showCancel: false,
      confirmText: '立即登录',
      success: async () => {
        try {
          const result = await userStore.manualLogin()
          if (result.success) {
            // 登录成功后自动执行抽签
            setTimeout(() => handleDraw(), 500)
          } else {
            console.error('登录失败:', result.error)
            uni.showToast({
              title: result.error || '登录失败',
              icon: 'error',
              duration: 2000
            })
          }
        } catch (error) {
          console.error('登录过程异常:', error)
          uni.showToast({
            title: '登录失败，请重试',
            icon: 'error',
            duration: 2000
          })
        }
      }
    })
    return
  }
  
  try {
    isDrawing.value = true
    console.log('开始抽签，用户openid:', userStore.openid)
    
    // 显示抽签中提示
    uni.showLoading({
      title: '抽签中...',
      mask: true
    })
    
    // 初始化抽签状态（如果还没有初始化）
    if (!fortuneStore.availableCount) {
      await fortuneStore.initializeFortune()
    }
    
    // 调用抽签API
    const result = await fortuneStore.drawFortune(userStore.openid!)
    
    // 隐藏加载提示
    uni.hideLoading()
    
    if (result.success && result.data) {
      console.log('抽签成功:', result.data)
      
      // 更新用户的抽签时间
      userStore.startCooldown()
      
      // 显示抽签成功提示
      uni.showToast({
        title: result.data.isNew ? '抽到新运势！' : '抽签成功！',
        icon: 'success',
        duration: 1500
      })
      
      // 延迟跳转到结果页，让用户看到成功提示
      setTimeout(() => {
        uni.navigateTo({
          url: `/pages/result/result?fortuneId=${result.data!.id}&fortuneText=${encodeURIComponent(result.data!.text)}&isNew=${result.data!.isNew}`,
          success: () => {
            console.log('成功跳转到结果页')
          },
          fail: (error) => {
            console.error('跳转结果页失败:', error)
            uni.showToast({
              title: '页面跳转失败',
              icon: 'error',
              duration: 2000
            })
          }
        })
      }, 1500)
      
    } else {
      // 处理抽签失败
      const errorMessage = result.error || '抽签失败，请重试'
      console.error('抽签失败:', errorMessage)
      
      // 根据错误类型显示不同的提示
      if (result.cooldown && result.cooldown > 0) {
        // 冷却期错误
        userStore.setCooldown(result.cooldown)
        uni.showModal({
          title: '抽签冷却中',
          content: `请等待 ${result.cooldown} 秒后再次抽签`,
          showCancel: false,
          confirmText: '知道了'
        })
      } else if (errorMessage.includes('已经抽完')) {
        // 运势池耗尽
        uni.showModal({
          title: '恭喜您！',
          content: '您已经抽完了所有50条运势！真是太幸运了！',
          showCancel: false,
          confirmText: '太棒了'
        })
      } else if (errorMessage.includes('网络')) {
        // 网络错误
        uni.showModal({
          title: '网络错误',
          content: '网络连接异常，请检查网络后重试',
          confirmText: '重试',
          cancelText: '取消',
          success: (res) => {
            if (res.confirm) {
              // 用户选择重试
              setTimeout(() => handleDraw(), 500)
            }
          }
        })
      } else {
        // 其他错误
        uni.showToast({
          title: errorMessage,
          icon: 'error',
          duration: 2000
        })
      }
    }
    
  } catch (error) {
    console.error('抽签异常:', error)
    
    // 隐藏加载提示
    uni.hideLoading()
    
    // 显示网络错误提示
    uni.showModal({
      title: '网络异常',
      content: '网络连接异常，请检查网络连接后重试',
      confirmText: '重试',
      cancelText: '取消',
      success: (res) => {
        if (res.confirm) {
          // 用户选择重试
          setTimeout(() => handleDraw(), 500)
        }
      }
    })
  } finally {
    isDrawing.value = false
  }
}

// 启动冷却倒计时
function startCooldownTimer() {
  // 清除现有定时器
  if (cooldownTimer.value) {
    clearInterval(cooldownTimer.value)
    cooldownTimer.value = null
  }
  
  // 启动新的定时器
  cooldownTimer.value = setInterval(() => {
    userStore.updateCooldown()
    
    // 如果冷却时间结束，清除定时器
    if (cooldownRemaining.value <= 0 && cooldownTimer.value) {
      clearInterval(cooldownTimer.value)
      cooldownTimer.value = null
    }
  }, 1000) as unknown as number
  
  console.log('冷却倒计时已启动')
}

// 停止冷却倒计时
function stopCooldownTimer() {
  if (cooldownTimer.value) {
    clearInterval(cooldownTimer.value)
    cooldownTimer.value = null
    console.log('冷却倒计时已停止')
  }
}

// 页面显示时重新启动定时器
function onPageShow() {
  console.log('页面显示，重新启动定时器')
  startCooldownTimer()
}

// 页面隐藏时停止定时器
function onPageHide() {
  console.log('页面隐藏，停止定时器')
  stopCooldownTimer()
}
</script>

<style lang="scss" scoped>
@import '@/styles/theme.scss';

.home-container {
  @include theme-background-main;
  
  // 添加安全区域适配
  padding-top: constant(safe-area-inset-top);
  padding-top: env(safe-area-inset-top);
  padding-bottom: constant(safe-area-inset-bottom);
  padding-bottom: env(safe-area-inset-bottom);
  
  // 添加背景叠加效果
  &::before {
    @include theme-background-overlay;
    content: '';
  }
}

.main-content {
  position: relative;
  z-index: 10;
  padding: 80rpx 40rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  min-height: 100vh;
  
  // 响应式调整
  @include respond-width('sm') {
    padding: 60rpx 30rpx;
  }
  
  @include respond-width('lg') {
    max-width: 750rpx;
    margin: 0 auto;
    padding: 100rpx 40rpx;
  }
}

.header-section {
  text-align: center;
  margin-bottom: 120rpx;
  animation: fadeInDown 1s ease-out;
  
  .app-title {
    @include theme-title-hero;
    display: block;
    margin-bottom: 20rpx;
    animation: sparkle 2s ease-in-out infinite;
  }
  
  .app-subtitle {
    font-size: $theme-font-subtitle;
    color: $theme-text-light;
    text-shadow: $theme-text-shadow-light;
    opacity: 0.95;
    font-family: $theme-font-decorative;
  }
  
  // 响应式字体调整
  @include respond-width('sm') {
    margin-bottom: 80rpx;
    
    .app-title {
      font-size: 40rpx;
    }
    
    .app-subtitle {
      font-size: 24rpx;
    }
  }
}

.fortune-section {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: fadeInUp 1s ease-out 0.3s both;
}

.fortune-container {
  position: relative;
  padding: 60rpx;
  
  .decoration-top,
  .decoration-bottom {
    text-align: center;
    margin: 40rpx 0;
    
    .decoration-text {
      @include theme-text-decorative;
      font-size: $theme-font-title;
      font-weight: $theme-font-weight-bold;
      text-shadow: $theme-text-shadow-medium;
      animation: celebrate 3s ease-in-out infinite;
      
      // 错开动画时间
      .decoration-top & {
        animation-delay: 0s;
      }
      
      .decoration-bottom & {
        animation-delay: 1.5s;
      }
    }
  }
  
  // 响应式调整
  @include respond-width('sm') {
    padding: 40rpx;
    
    .decoration-text {
      font-size: 30rpx;
    }
  }
}

.info-section {
  text-align: center;
  margin-top: 80rpx;
  animation: fadeInUp 1s ease-out 0.6s both;
  
  .info-text {
    font-size: $theme-font-subtitle;
    color: $theme-text-light;
    display: block;
    margin-bottom: 16rpx;
    opacity: 0.9;
    font-weight: $theme-font-weight-medium;
  }
  
  .info-subtext {
    font-size: $theme-font-body;
    color: $theme-text-light;
    opacity: 0.7;
    font-family: $theme-font-decorative;
  }
  
  // 响应式调整
  @include respond-width('sm') {
    margin-top: 60rpx;
    
    .info-text {
      font-size: 24rpx;
    }
    
    .info-subtext {
      font-size: 20rpx;
    }
  }
}

// ==================== 页面进入动画 ====================

@keyframes fadeInDown {
  0% {
    opacity: 0;
    transform: translateY(-30rpx);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fadeInUp {
  0% {
    opacity: 0;
    transform: translateY(30rpx);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
}

// ==================== 加载状态优化 ====================

.home-container {
  // 防止内容闪烁
  opacity: 0;
  animation: pageLoad 0.5s ease-out 0.1s forwards;
}

@keyframes pageLoad {
  to {
    opacity: 1;
  }
}

// ==================== 性能优化 ====================

// 启用硬件加速
.main-content,
.header-section,
.fortune-section,
.info-section {
  will-change: transform, opacity;
  backface-visibility: hidden;
  perspective: 1000px;
}

// 减少重绘
.decoration-text {
  contain: layout style paint;
}
</style>