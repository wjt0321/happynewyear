<template>
  <view class="result-container">
    <!-- 背景效果 -->
    <view class="result-background">
      <!-- 金光射线效果 -->
      <view class="golden-rays">
        <view class="ray" v-for="i in 8" :key="i" :style="getRayStyle(i)"></view>
      </view>
      
      <!-- 庆祝粒子动画 -->
      <view class="celebration-particles">
        <view v-for="i in 20" :key="i" class="particle" :style="getParticleStyle(i)">
          {{ getParticleSymbol(i) }}
        </view>
      </view>
      
      <!-- 浮动装饰元素 -->
      <view class="floating-decorations">
        <view class="decoration lantern">🏮</view>
        <view class="decoration coin">🪙</view>
        <view class="decoration dragon">🐉</view>
        <view class="decoration blessing">福</view>
        <view class="decoration firework">🎆</view>
        <view class="decoration star">⭐</view>
      </view>
    </view>
    
    <!-- 主内容 -->
    <view class="result-content">
      <!-- 顶部装饰 -->
      <view class="result-header">
        <text class="result-title">🎊 恭喜您 🎊</text>
        <text class="result-subtitle">获得新年好运势</text>
      </view>
      
      <!-- 运势卡片 -->
      <view class="fortune-card" :class="{ 'card-glow': isNew }">
        <!-- 卡片光环效果 -->
        <view class="card-aura" v-if="isNew"></view>
        
        <view class="card-decoration-top">
          <text class="decoration-symbol sparkle-1">🌟</text>
          <text class="decoration-symbol sparkle-2">✨</text>
          <text class="decoration-symbol sparkle-3">🌟</text>
        </view>
        
        <view class="fortune-content">
          <text class="fortune-text">{{ fortuneText }}</text>
        </view>
        
        <view class="card-decoration-bottom">
          <text class="blessing-text">龙年大吉 · 万事如意</text>
        </view>
        
        <!-- 新运势标识 -->
        <view class="new-fortune-badge" v-if="isNew">
          <text class="badge-text">新运势</text>
        </view>
      </view>
      
      <!-- 操作按钮区 -->
      <view class="action-buttons">
        <button class="share-button" @click="handleShare">
          <text class="button-icon">📤</text>
          <text class="button-text">分享好友</text>
        </button>
        
        <button 
          class="draw-again-button" 
          :class="{ disabled: cooldownRemaining > 0 }"
          @click="handleDrawAgain"
          :disabled="cooldownRemaining > 0"
        >
          <view v-if="cooldownRemaining > 0" class="cooldown-content">
            <text class="cooldown-number">{{ cooldownRemaining }}</text>
            <text class="cooldown-text">秒后可再抽</text>
          </view>
          <view v-else class="normal-content">
            <text class="button-icon">🎲</text>
            <text class="button-text">再抽一次</text>
          </view>
        </button>
      </view>
      
      <!-- 底部信息 -->
      <view class="result-footer">
        <text class="footer-text">愿您新年快乐，好运连连！</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useUserStore } from '@/stores/user'
import { smartShare, generateFortuneShareContent, showShareResult } from '@/utils/share'

// 状态管理
const userStore = useUserStore()

// 页面参数
const fortuneId = ref<number>(0)
const fortuneText = ref<string>('')
const isNew = ref<boolean>(false)

// 定时器
const cooldownTimer = ref<number | null>(null)

// 计算属性
const cooldownRemaining = computed(() => userStore.cooldownRemaining)

// 页面加载时获取参数
onMounted(() => {
  const pages = getCurrentPages()
  const currentPage = pages[pages.length - 1]
  const options = currentPage.options as any
  
  fortuneId.value = parseInt(options.fortuneId || '0')
  fortuneText.value = decodeURIComponent(options.fortuneText || '')
  isNew.value = options.isNew === 'true'
  
  // 如果是新运势，播放庆祝动画
  if (isNew.value) {
    triggerCelebrationAnimation()
  }
  
  // 启动冷却倒计时
  startCooldownTimer()
})

// 页面卸载时清理定时器
onUnmounted(() => {
  stopCooldownTimer()
})

// 启动冷却倒计时
function startCooldownTimer() {
  // 清除现有定时器
  if (cooldownTimer.value) {
    clearInterval(cooldownTimer.value)
    cooldownTimer.value = null
  }
  
  // 如果有冷却时间，启动定时器
  if (cooldownRemaining.value > 0) {
    cooldownTimer.value = setInterval(() => {
      userStore.updateCooldown()
      
      // 如果冷却时间结束，清除定时器
      if (cooldownRemaining.value <= 0 && cooldownTimer.value) {
        clearInterval(cooldownTimer.value)
        cooldownTimer.value = null
        
        // 显示可以再次抽签的提示
        uni.showToast({
          title: '可以再次抽签了！',
          icon: 'success',
          duration: 1500
        })
      }
    }, 1000) as unknown as number
  }
}

// 停止冷却倒计时
function stopCooldownTimer() {
  if (cooldownTimer.value) {
    clearInterval(cooldownTimer.value)
    cooldownTimer.value = null
  }
}

// 触发庆祝动画
function triggerCelebrationAnimation() {
  // 延迟显示新运势徽章
  setTimeout(() => {
    const badge = document.querySelector('.new-fortune-badge')
    if (badge) {
      badge.classList.add('show')
    }
  }, 1000)
}

// 获取射线样式
function getRayStyle(index: number) {
  const angle = (index * 45) % 360
  return {
    transform: `rotate(${angle}deg)`,
    animationDelay: `${index * 0.2}s`
  }
}

// 获取粒子样式
function getParticleStyle(index: number) {
  const angle = (index * 18) % 360
  const radius = 120 + Math.random() * 150
  const x = Math.cos(angle * Math.PI / 180) * radius
  const y = Math.sin(angle * Math.PI / 180) * radius
  
  return {
    left: `calc(50% + ${x}rpx)`,
    top: `calc(50% + ${y}rpx)`,
    animationDelay: `${index * 0.1}s`,
    animationDuration: `${2 + Math.random() * 2}s`
  }
}

// 获取粒子符号
function getParticleSymbol(index: number) {
  const symbols = ['🎊', '🎉', '✨', '🌟', '💫', '⭐', '🎆', '🎇', '💥', '🔥']
  return symbols[index % symbols.length]
}

// 处理分享
async function handleShare() {
  const shareOptions = generateFortuneShareContent(fortuneText.value, isNew.value)
  
  try {
    const result = await smartShare(shareOptions)
    showShareResult(result)
  } catch (error) {
    console.error('分享失败:', error)
    uni.showToast({
      title: '分享失败，请重试',
      icon: 'none',
      duration: 2000
    })
  }
}

// 处理再次抽签
function handleDrawAgain() {
  if (cooldownRemaining.value > 0) {
    uni.showModal({
      title: '抽签冷却中',
      content: `请等待 ${cooldownRemaining.value} 秒后再次抽签`,
      showCancel: false,
      confirmText: '知道了'
    })
    return
  }
  
  // 显示确认对话框
  uni.showModal({
    title: '再抽一次',
    content: '确定要返回首页再抽一次吗？',
    confirmText: '确定',
    cancelText: '取消',
    success: (res) => {
      if (res.confirm) {
        // 返回首页
        uni.navigateBack({
          delta: 1,
          success: () => {
            console.log('成功返回首页')
            // 显示提示
            setTimeout(() => {
              uni.showToast({
                title: '可以再次抽签了！',
                icon: 'success',
                duration: 1500
              })
            }, 500)
          },
          fail: (error) => {
            console.error('返回首页失败:', error)
            // 如果返回失败，尝试重定向到首页
            uni.reLaunch({
              url: '/pages/index/index'
            })
          }
        })
      }
    }
  })
}
</script>

<style lang="scss" scoped>
@import '@/styles/theme.scss';

.result-container {
  @include theme-background-main;
  padding-top: constant(safe-area-inset-top);
  padding-top: env(safe-area-inset-top);
  padding-bottom: constant(safe-area-inset-bottom);
  padding-bottom: env(safe-area-inset-bottom);
}

.result-background {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  
  .golden-rays {
    position: absolute;
    top: 50%;
    left: 50%;
    width: 800rpx;
    height: 800rpx;
    transform: translate(-50%, -50%);
    
    .ray {
      position: absolute;
      top: 50%;
      left: 50%;
      width: 4rpx;
      height: 400rpx;
      background: linear-gradient(to bottom, 
        rgba(255, 215, 0, 0.8) 0%, 
        rgba(255, 215, 0, 0.4) 50%, 
        transparent 100%);
      transform-origin: center bottom;
      animation: rayPulse 3s ease-in-out infinite;
    }
  }
  
  .celebration-particles {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    
    .particle {
      position: absolute;
      font-size: 32rpx;
      animation: particleCelebrate 3s ease-in-out infinite;
      text-shadow: 0 0 10rpx rgba(255, 215, 0, 0.8);
    }
  }
  
  .floating-decorations {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    
    .decoration {
      position: absolute;
      font-size: 48rpx;
      animation: decorationFloat 8s ease-in-out infinite;
      
      &.lantern {
        top: 10%;
        left: 8%;
        animation-delay: 0s;
      }
      
      &.coin {
        top: 20%;
        right: 12%;
        animation-delay: 1s;
      }
      
      &.dragon {
        bottom: 35%;
        left: 5%;
        animation-delay: 2s;
      }
      
      &.blessing {
        bottom: 25%;
        right: 10%;
        color: $theme-primary;
        font-weight: bold;
        font-family: $theme-font-decorative;
        animation-delay: 3s;
      }
      
      &.firework {
        top: 30%;
        left: 15%;
        animation-delay: 4s;
      }
      
      &.star {
        top: 60%;
        right: 20%;
        animation-delay: 5s;
      }
    }
  }
}

.result-content {
  position: relative;
  z-index: 10;
  padding: 80rpx 40rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  min-height: 100vh;
}

.result-header {
  text-align: center;
  margin-bottom: 80rpx;
  
  .result-title {
    @include theme-title-hero;
    display: block;
    margin-bottom: 20rpx;
    animation: titleGlow 2s ease-in-out infinite alternate;
  }
  
  .result-subtitle {
    font-size: $theme-font-title;
    color: rgba(255, 255, 255, 0.9);
    text-shadow: $theme-text-shadow-medium;
  }
}

.fortune-card {
  @include theme-card;
  margin-bottom: 80rpx;
  position: relative;
  animation: cardEntrance 1s ease-out;
  
  &.card-glow {
    animation: cardGlow 2s ease-in-out infinite alternate;
  }
  
  .card-aura {
    position: absolute;
    top: -20rpx;
    left: -20rpx;
    right: -20rpx;
    bottom: -20rpx;
    background: radial-gradient(circle, 
      rgba(255, 215, 0, 0.3) 0%, 
      rgba(255, 215, 0, 0.1) 50%, 
      transparent 70%);
    border-radius: $border-radius-xl;
    animation: auraGlow 3s ease-in-out infinite;
    z-index: -1;
  }
  
  .card-decoration-top {
    text-align: center;
    margin-bottom: 40rpx;
    
    .decoration-symbol {
      font-size: 40rpx;
      margin: 0 20rpx;
      display: inline-block;
      
      &.sparkle-1 {
        animation: sparkle 1.5s ease-in-out infinite;
        animation-delay: 0s;
      }
      
      &.sparkle-2 {
        animation: sparkle 1.5s ease-in-out infinite;
        animation-delay: 0.5s;
      }
      
      &.sparkle-3 {
        animation: sparkle 1.5s ease-in-out infinite;
        animation-delay: 1s;
      }
    }
  }
  
  .fortune-content {
    text-align: center;
    margin: 40rpx 0;
    
    .fortune-text {
      @include theme-title-page;
      line-height: 1.6;
      animation: textGlow 3s ease-in-out infinite alternate;
    }
  }
  
  .card-decoration-bottom {
    text-align: center;
    margin-top: 40rpx;
    
    .blessing-text {
      @include theme-text-decorative;
      font-size: $theme-font-subtitle;
    }
  }
  
  .new-fortune-badge {
    position: absolute;
    top: -10rpx;
    right: -10rpx;
    background: linear-gradient(135deg, #FF4757 0%, #FF6B35 100%);
    color: white;
    padding: 8rpx 16rpx;
    border-radius: 20rpx;
    font-size: 20rpx;
    font-weight: bold;
    box-shadow: 0 4px 12px rgba(255, 71, 87, 0.4);
    transform: scale(0);
    animation: badgeShow 0.5s ease-out 1s forwards;
    
    .badge-text {
      text-shadow: none;
    }
  }
}

.action-buttons {
  display: flex;
  gap: 40rpx;
  margin-bottom: 60rpx;
  width: 100%;
  max-width: 600rpx;
  
  button {
    flex: 1;
    height: 100rpx;
    border-radius: 50rpx;
    border: none;
    font-size: $theme-font-subtitle;
    font-weight: bold;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 16rpx;
    transition: all $theme-animation-normal ease;
    position: relative;
    overflow: hidden;
    
    &::before {
      content: '';
      position: absolute;
      top: 50%;
      left: 50%;
      width: 0;
      height: 0;
      background: rgba(255, 255, 255, 0.3);
      border-radius: 50%;
      transform: translate(-50%, -50%);
      transition: all 0.6s ease;
    }
    
    &:active:not(.disabled) {
      transform: scale(0.95);
      
      &::before {
        width: 300rpx;
        height: 300rpx;
      }
    }
    
    .button-icon {
      font-size: $theme-font-title;
    }
  }
  
  .share-button {
    @include theme-button-secondary;
    animation: buttonPulse 2s ease-in-out infinite;
  }
  
  .draw-again-button {
    @include theme-button-primary;
    
    &.disabled {
      background: linear-gradient(135deg, #BDC3C7 0%, #95A5A6 100%);
      color: #7F8C8D;
      box-shadow: none;
      animation: none;
    }
    
    .cooldown-content {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4rpx;
      
      .cooldown-number {
        font-size: 48rpx;
        font-weight: bold;
        color: #fff;
        text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
      }
      
      .cooldown-text {
        font-size: 20rpx;
        color: rgba(255, 255, 255, 0.8);
      }
    }
    
    .normal-content {
      display: flex;
      align-items: center;
      gap: 8rpx;
    }
  }
}

.result-footer {
  text-align: center;
  margin-top: auto;
  
  .footer-text {
    @include theme-text-decorative;
    font-size: $theme-font-subtitle;
    color: rgba(255, 255, 255, 0.8);
  }
}

// ==================== 动画定义 ====================

@keyframes cardEntrance {
  0% {
    opacity: 0;
    transform: translateY(100rpx) scale(0.8);
  }
  100% {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@keyframes cardGlow {
  0% { 
    box-shadow: $theme-shadow-heavy;
    border-color: $theme-secondary;
  }
  100% { 
    box-shadow: $theme-glow-golden;
    border-color: $celebration-sparkle;
  }
}

@keyframes auraGlow {
  0%, 100% {
    opacity: 0.3;
    transform: scale(1);
  }
  50% {
    opacity: 0.6;
    transform: scale(1.1);
  }
}

@keyframes titleGlow {
  0% { 
    text-shadow: $theme-text-shadow-heavy;
  }
  100% { 
    text-shadow: $theme-text-shadow-heavy, $theme-glow-golden;
  }
}

@keyframes textGlow {
  0% { 
    color: $theme-text-primary;
    text-shadow: $theme-text-shadow-medium;
  }
  100% { 
    color: $decoration-gold;
    text-shadow: $theme-text-shadow-medium, 0 0 20rpx rgba(255, 215, 0, 0.6);
  }
}

@keyframes rayPulse {
  0%, 100% {
    opacity: 0.3;
    transform: scaleY(0.8);
  }
  50% {
    opacity: 0.8;
    transform: scaleY(1.2);
  }
}

@keyframes particleCelebrate {
  0%, 100% {
    transform: translateY(0) rotate(0deg) scale(1);
    opacity: 0.7;
  }
  25% {
    transform: translateY(-20rpx) rotate(90deg) scale(1.2);
    opacity: 1;
  }
  50% {
    transform: translateY(-40rpx) rotate(180deg) scale(0.8);
    opacity: 0.8;
  }
  75% {
    transform: translateY(-20rpx) rotate(270deg) scale(1.1);
    opacity: 0.9;
  }
}

@keyframes decorationFloat {
  0%, 100% {
    transform: translateY(0px) rotate(0deg);
    opacity: 0.8;
  }
  25% {
    transform: translateY(-15rpx) rotate(5deg);
    opacity: 1;
  }
  50% {
    transform: translateY(-30rpx) rotate(0deg);
    opacity: 0.9;
  }
  75% {
    transform: translateY(-15rpx) rotate(-5deg);
    opacity: 1;
  }
}

@keyframes badgeShow {
  0% {
    transform: scale(0) rotate(-180deg);
    opacity: 0;
  }
  50% {
    transform: scale(1.2) rotate(-90deg);
    opacity: 1;
  }
  100% {
    transform: scale(1) rotate(0deg);
    opacity: 1;
  }
}

@keyframes buttonPulse {
  0%, 100% {
    box-shadow: $theme-shadow-medium;
  }
  50% {
    box-shadow: $theme-shadow-medium, 0 0 20rpx rgba(255, 71, 87, 0.4);
  }
}

// ==================== 响应式适配 ====================

// 小屏幕适配
@media screen and (max-width: 375px) {
  .result-content {
    padding: 60rpx 30rpx;
  }
  
  .fortune-card {
    padding: 50rpx 30rpx;
  }
  
  .action-buttons {
    gap: 30rpx;
    
    button {
      height: 90rpx;
      font-size: 24rpx;
    }
  }
}

// 大屏幕适配
@media screen and (min-width: 480px) {
  .result-content {
    max-width: 750rpx;
    margin: 0 auto;
  }
  
  .fortune-card {
    max-width: 600rpx;
  }
}
</style>