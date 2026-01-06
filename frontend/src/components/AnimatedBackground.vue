<template>
  <view class="animated-background">
    <!-- 飘雪效果 -->
    <view class="snow-container">
      <view 
        v-for="(snow, index) in snowflakes" 
        :key="`snow-${index}`"
        class="snowflake"
        :style="snow.style"
      >
        {{ snow.symbol }}
      </view>
    </view>
    
    <!-- 烟花效果 -->
    <view class="fireworks-container">
      <view 
        v-for="(firework, index) in fireworks"
        :key="`firework-${index}`"
        class="firework"
        :style="firework.style"
      >
        <view class="firework-spark"></view>
        <view class="firework-particles">
          <view 
            v-for="particle in 6" 
            :key="`particle-${index}-${particle}`"
            class="particle"
            :style="getParticleStyle(particle)"
          ></view>
        </view>
      </view>
    </view>
    
    <!-- 浮动装饰元素 -->
    <view class="floating-decorations">
      <view class="decoration lantern" :style="getDecorationStyle(0)">🏮</view>
      <view class="decoration coin" :style="getDecorationStyle(1)">🪙</view>
      <view class="decoration dragon" :style="getDecorationStyle(2)">🐉</view>
      <view class="decoration blessing" :style="getDecorationStyle(3)">福</view>
      <view class="decoration firecracker" :style="getDecorationStyle(4)">🧨</view>
      <view class="decoration plum-blossom" :style="getDecorationStyle(5)">🌸</view>
    </view>
    
    <!-- 金光射线背景 -->
    <view class="golden-rays">
      <view 
        v-for="ray in 8" 
        :key="`ray-${ray}`"
        class="ray"
        :style="getRayStyle(ray)"
      ></view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

interface Snowflake {
  symbol: string
  style: Record<string, string>
}

interface Firework {
  style: Record<string, string>
}

const snowflakes = ref<Snowflake[]>([])
const fireworks = ref<Firework[]>([])
let animationTimer: number | null = null

// 雪花符号池 - 新年主题
const snowSymbols = ['❄️', '⭐', '✨', '🌟', '💫', '🎊', '🎉']

// 创建雪花
function createSnowflake(): Snowflake {
  const symbol = snowSymbols[Math.floor(Math.random() * snowSymbols.length)]
  const left = Math.random() * 100
  const animationDuration = 4 + Math.random() * 6 // 4-10秒，更慢更优雅
  const size = 0.6 + Math.random() * 0.8 // 0.6-1.4倍，更多变化
  const opacity = 0.6 + Math.random() * 0.4 // 0.6-1.0透明度
  
  return {
    symbol,
    style: {
      left: `${left}%`,
      animationDuration: `${animationDuration}s`,
      fontSize: `${20 * size}rpx`,
      animationDelay: `${Math.random() * 3}s`,
      opacity: opacity.toString(),
      '--rotation-speed': `${8 + Math.random() * 16}s` // 8-24秒旋转周期
    }
  }
}

// 创建烟花
function createFirework(): Firework {
  const left = 10 + Math.random() * 80 // 避免边缘
  const top = 20 + Math.random() * 50 // 上半部分
  const delay = Math.random() * 5 // 0-5秒延迟
  const duration = 2 + Math.random() * 2 // 2-4秒持续时间
  
  return {
    style: {
      left: `${left}%`,
      top: `${top}%`,
      animationDelay: `${delay}s`,
      animationDuration: `${duration}s`
    }
  }
}

// 获取烟花粒子样式
function getParticleStyle(index: number): Record<string, string> {
  const angle = (index * 60) // 每60度一个粒子
  const distance = 30 + Math.random() * 20 // 30-50rpx距离
  const duration = 1 + Math.random() * 0.5 // 1-1.5秒
  
  return {
    '--angle': `${angle}deg`,
    '--distance': `${distance}rpx`,
    animationDuration: `${duration}s`,
    animationDelay: `${Math.random() * 0.5}s`
  }
}

// 获取装饰元素样式
function getDecorationStyle(index: number): Record<string, string> {
  const positions = [
    { top: '15%', left: '8%' },   // 灯笼
    { top: '25%', right: '12%' }, // 金币
    { bottom: '35%', left: '5%' }, // 龙
    { bottom: '20%', right: '8%' }, // 福字
    { top: '40%', left: '15%' },  // 鞭炮
    { top: '60%', right: '20%' }  // 梅花
  ]
  
  const pos = positions[index] || positions[0]
  const animationDelay = index * 1.2 // 错开动画时间
  const floatDuration = 5 + Math.random() * 3 // 5-8秒浮动周期
  
  return {
    ...pos,
    animationDelay: `${animationDelay}s`,
    animationDuration: `${floatDuration}s`
  }
}

// 获取金光射线样式
function getRayStyle(index: number): Record<string, string> {
  const angle = index * 45 // 每45度一条射线
  const length = 200 + Math.random() * 100 // 200-300rpx长度
  const opacity = 0.1 + Math.random() * 0.1 // 0.1-0.2透明度
  const animationDelay = index * 0.5 // 错开动画
  
  return {
    transform: `rotate(${angle}deg)`,
    height: `${length}rpx`,
    opacity: opacity.toString(),
    animationDelay: `${animationDelay}s`
  }
}

// 初始化动画
function initAnimations() {
  // 创建雪花 - 增加数量让效果更丰富
  snowflakes.value = []
  for (let i = 0; i < 25; i++) {
    snowflakes.value.push(createSnowflake())
  }
  
  // 创建烟花 - 适量减少避免过于繁杂
  fireworks.value = []
  for (let i = 0; i < 6; i++) {
    fireworks.value.push(createFirework())
  }
}

// 定期刷新动画元素，保持动态效果
function refreshAnimations() {
  // 每30秒刷新一次雪花
  animationTimer = window.setInterval(() => {
    // 随机替换几个雪花
    const replaceCount = Math.floor(Math.random() * 5) + 2 // 2-6个
    for (let i = 0; i < replaceCount; i++) {
      const randomIndex = Math.floor(Math.random() * snowflakes.value.length)
      snowflakes.value[randomIndex] = createSnowflake()
    }
    
    // 随机替换一个烟花
    const fireworkIndex = Math.floor(Math.random() * fireworks.value.length)
    fireworks.value[fireworkIndex] = createFirework()
  }, 30000)
}

onMounted(() => {
  initAnimations()
  refreshAnimations()
})

onUnmounted(() => {
  if (animationTimer) {
    clearInterval(animationTimer)
    animationTimer = null
  }
})
</script>

<style lang="scss" scoped>
@import '@/styles/theme.scss';

.animated-background {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 1;
  overflow: hidden;
}

// ==================== 金光射线背景 ====================
.golden-rays {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 100%;
  height: 100%;
  
  .ray {
    position: absolute;
    top: 50%;
    left: 50%;
    width: 4rpx;
    background: linear-gradient(to bottom, 
      transparent 0%, 
      rgba(255, 215, 0, 0.3) 20%, 
      rgba(255, 215, 0, 0.1) 80%, 
      transparent 100%);
    transform-origin: top center;
    animation: ray-pulse 8s ease-in-out infinite;
  }
}

// ==================== 飘雪效果 ====================
.snow-container {
  position: absolute;
  top: -100rpx;
  left: 0;
  width: 100%;
  height: calc(100% + 200rpx);
  
  .snowflake {
    position: absolute;
    top: -80rpx;
    color: rgba(255, 255, 255, 0.9);
    animation: snowfall linear infinite;
    text-shadow: 0 0 15rpx rgba(255, 255, 255, 0.6);
    will-change: transform, opacity;
    
    // 添加轻微的旋转动画
    &::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      animation: gentle-rotate var(--rotation-speed, 12s) linear infinite;
    }
  }
}

// ==================== 烟花效果 ====================
.fireworks-container {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  
  .firework {
    position: absolute;
    width: 16rpx;
    height: 16rpx;
    
    .firework-spark {
      position: absolute;
      top: 50%;
      left: 50%;
      width: 12rpx;
      height: 12rpx;
      transform: translate(-50%, -50%);
      background: radial-gradient(circle, $decoration-gold 0%, $celebration-sparkle 50%, transparent 80%);
      border-radius: 50%;
      animation: firework-explosion 3s ease-out infinite;
      box-shadow: 0 0 20rpx rgba(255, 215, 0, 0.8);
    }
    
    .firework-particles {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      
      .particle {
        position: absolute;
        width: 6rpx;
        height: 6rpx;
        background: radial-gradient(circle, $decoration-orange 0%, transparent 70%);
        border-radius: 50%;
        animation: particle-burst 1.5s ease-out infinite;
        transform-origin: center;
      }
    }
  }
}

// ==================== 浮动装饰元素 ====================
.floating-decorations {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  
  .decoration {
    position: absolute;
    font-size: 40rpx;
    animation: float-gentle 6s ease-in-out infinite;
    text-shadow: 0 0 10rpx rgba(255, 215, 0, 0.5);
    will-change: transform;
    
    &.lantern {
      font-size: 48rpx;
      filter: drop-shadow(0 0 8rpx rgba(255, 71, 87, 0.6));
    }
    
    &.coin {
      font-size: 36rpx;
      animation: coin-spin 8s linear infinite;
      filter: drop-shadow(0 0 8rpx rgba(255, 215, 0, 0.6));
    }
    
    &.dragon {
      font-size: 52rpx;
      animation: dragon-dance 10s ease-in-out infinite;
      filter: drop-shadow(0 0 12rpx rgba(255, 107, 53, 0.6));
    }
    
    &.blessing {
      font-size: 44rpx;
      color: $decoration-red;
      font-weight: bold;
      font-family: $theme-font-decorative;
      animation: blessing-glow 4s ease-in-out infinite;
      text-shadow: 0 0 15rpx rgba(255, 71, 87, 0.8);
    }
    
    &.firecracker {
      font-size: 32rpx;
      animation: firecracker-bounce 3s ease-in-out infinite;
      filter: drop-shadow(0 0 6rpx rgba(255, 107, 53, 0.6));
    }
    
    &.plum-blossom {
      font-size: 38rpx;
      animation: blossom-sway 7s ease-in-out infinite;
      filter: drop-shadow(0 0 8rpx rgba(255, 192, 203, 0.6));
    }
  }
}

// ==================== 动画关键帧 ====================

// 金光射线脉冲
@keyframes ray-pulse {
  0%, 100% {
    opacity: 0.1;
    transform: scaleY(0.8);
  }
  50% {
    opacity: 0.3;
    transform: scaleY(1.2);
  }
}

// 雪花飘落
@keyframes snowfall {
  0% {
    transform: translateY(-100rpx) translateX(0) rotate(0deg);
    opacity: 0;
  }
  10% {
    opacity: 1;
  }
  90% {
    opacity: 1;
  }
  100% {
    transform: translateY(calc(100vh + 200rpx)) translateX(100rpx) rotate(360deg);
    opacity: 0;
  }
}

// 轻柔旋转
@keyframes gentle-rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

// 烟花爆炸
@keyframes firework-explosion {
  0% {
    transform: translate(-50%, -50%) scale(0);
    opacity: 1;
  }
  20% {
    transform: translate(-50%, -50%) scale(0.5);
    opacity: 1;
  }
  50% {
    transform: translate(-50%, -50%) scale(1);
    opacity: 0.8;
  }
  100% {
    transform: translate(-50%, -50%) scale(2.5);
    opacity: 0;
  }
}

// 烟花粒子爆发
@keyframes particle-burst {
  0% {
    transform: translate(0, 0) scale(1);
    opacity: 1;
  }
  100% {
    transform: translate(
      calc(cos(var(--angle)) * var(--distance)), 
      calc(sin(var(--angle)) * var(--distance))
    ) scale(0);
    opacity: 0;
  }
}

// 轻柔浮动
@keyframes float-gentle {
  0%, 100% {
    transform: translateY(0px) rotate(0deg);
  }
  25% {
    transform: translateY(-15rpx) rotate(2deg);
  }
  50% {
    transform: translateY(-8rpx) rotate(0deg);
  }
  75% {
    transform: translateY(-20rpx) rotate(-2deg);
  }
}

// 金币旋转
@keyframes coin-spin {
  0% {
    transform: rotateY(0deg) translateY(0px);
  }
  25% {
    transform: rotateY(90deg) translateY(-10rpx);
  }
  50% {
    transform: rotateY(180deg) translateY(0px);
  }
  75% {
    transform: rotateY(270deg) translateY(-10rpx);
  }
  100% {
    transform: rotateY(360deg) translateY(0px);
  }
}

// 龙舞动画
@keyframes dragon-dance {
  0%, 100% {
    transform: translateY(0px) rotate(0deg) scale(1);
  }
  20% {
    transform: translateY(-25rpx) rotate(5deg) scale(1.05);
  }
  40% {
    transform: translateY(-10rpx) rotate(-3deg) scale(0.98);
  }
  60% {
    transform: translateY(-30rpx) rotate(8deg) scale(1.08);
  }
  80% {
    transform: translateY(-5rpx) rotate(-5deg) scale(0.95);
  }
}

// 福字发光
@keyframes blessing-glow {
  0%, 100% {
    transform: scale(1);
    text-shadow: 0 0 15rpx rgba(255, 71, 87, 0.8);
  }
  50% {
    transform: scale(1.1);
    text-shadow: 0 0 25rpx rgba(255, 71, 87, 1), 0 0 35rpx rgba(255, 215, 0, 0.6);
  }
}

// 鞭炮弹跳
@keyframes firecracker-bounce {
  0%, 100% {
    transform: translateY(0px) rotate(0deg);
  }
  25% {
    transform: translateY(-20rpx) rotate(5deg);
  }
  50% {
    transform: translateY(-35rpx) rotate(0deg);
  }
  75% {
    transform: translateY(-15rpx) rotate(-5deg);
  }
}

// 梅花摇摆
@keyframes blossom-sway {
  0%, 100% {
    transform: rotate(0deg) translateY(0px);
  }
  25% {
    transform: rotate(3deg) translateY(-8rpx);
  }
  50% {
    transform: rotate(0deg) translateY(-15rpx);
  }
  75% {
    transform: rotate(-3deg) translateY(-8rpx);
  }
}

// ==================== 响应式适配 ====================

// 小屏幕优化
@media screen and (max-width: 375px) {
  .floating-decorations .decoration {
    font-size: 32rpx;
    
    &.dragon {
      font-size: 42rpx;
    }
    
    &.lantern {
      font-size: 38rpx;
    }
  }
  
  .snow-container .snowflake {
    font-size: 16rpx;
  }
}

// 大屏幕优化
@media screen and (min-width: 480px) {
  .floating-decorations .decoration {
    font-size: 48rpx;
    
    &.dragon {
      font-size: 60rpx;
    }
    
    &.lantern {
      font-size: 56rpx;
    }
  }
}

// 性能优化：减少不必要的重绘
.animated-background * {
  backface-visibility: hidden;
  perspective: 1000px;
}

// 暗色模式适配（如果需要）
@media (prefers-color-scheme: dark) {
  .snow-container .snowflake {
    color: rgba(255, 255, 255, 0.7);
    text-shadow: 0 0 10rpx rgba(255, 255, 255, 0.4);
  }
}
</style>