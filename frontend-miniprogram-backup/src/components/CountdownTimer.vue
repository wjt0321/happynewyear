<template>
  <view class="countdown-timer">
    <view class="countdown-display">
      <text class="countdown-number">{{ displaySeconds }}</text>
      <text class="countdown-text">秒后可再抽</text>
    </view>
    
    <!-- 进度环 -->
    <view class="progress-ring">
      <svg class="progress-svg" viewBox="0 0 120 120">
        <!-- 背景圆环 -->
        <circle
          class="progress-bg"
          cx="60"
          cy="60"
          r="54"
          fill="none"
          stroke="rgba(255, 255, 255, 0.2)"
          stroke-width="8"
        />
        <!-- 进度圆环 -->
        <circle
          class="progress-bar"
          cx="60"
          cy="60"
          r="54"
          fill="none"
          stroke="rgba(255, 255, 255, 0.8)"
          stroke-width="8"
          stroke-linecap="round"
          :stroke-dasharray="circumference"
          :stroke-dashoffset="strokeDashoffset"
          transform="rotate(-90 60 60)"
        />
      </svg>
    </view>
    
    <!-- 装饰效果 -->
    <view class="timer-decoration">
      <text class="decoration-icon">⏰</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'

interface Props {
  seconds: number
}

interface Emits {
  (e: 'finished'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const displaySeconds = ref(props.seconds)
const initialSeconds = ref(props.seconds)
let timer: NodeJS.Timeout | null = null

// 圆环相关计算
const radius = 54
const circumference = 2 * Math.PI * radius

const strokeDashoffset = computed(() => {
  if (initialSeconds.value === 0) return 0
  const progress = displaySeconds.value / initialSeconds.value
  return circumference * (1 - progress)
})

// 启动倒计时
function startCountdown() {
  if (timer) {
    clearInterval(timer)
  }
  
  timer = setInterval(() => {
    if (displaySeconds.value > 0) {
      displaySeconds.value--
    } else {
      stopCountdown()
      emit('finished')
    }
  }, 1000)
}

// 停止倒计时
function stopCountdown() {
  if (timer) {
    clearInterval(timer)
    timer = null
  }
}

// 重置倒计时
function resetCountdown(newSeconds: number) {
  stopCountdown()
  displaySeconds.value = newSeconds
  initialSeconds.value = newSeconds
  if (newSeconds > 0) {
    startCountdown()
  }
}

// 监听props变化
watch(() => props.seconds, (newSeconds) => {
  resetCountdown(newSeconds)
}, { immediate: true })

onMounted(() => {
  if (props.seconds > 0) {
    startCountdown()
  }
})

onUnmounted(() => {
  stopCountdown()
})

// 暴露方法给父组件
defineExpose({
  reset: resetCountdown,
  stop: stopCountdown
})
</script>

<style lang="scss" scoped>
@import '../styles/theme.scss';

.countdown-timer {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
}

.countdown-display {
  text-align: center;
  z-index: 3;
  position: relative;
  
  .countdown-number {
    font-size: 64rpx;
    font-weight: $theme-font-weight-bold;
    display: block;
    color: #fff;
    text-shadow: $theme-text-shadow-heavy;
    font-family: $theme-font-primary;
    line-height: 1;
    margin-bottom: 8rpx;
  }
  
  .countdown-text {
    font-size: $theme-font-body;
    color: rgba(255, 255, 255, 0.9);
    text-shadow: $theme-text-shadow-light;
    font-weight: $theme-font-weight-medium;
  }
}

.progress-ring {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 240rpx;
  height: 240rpx;
  z-index: 1;
  
  .progress-svg {
    width: 100%;
    height: 100%;
    transform: rotate(-90deg);
  }
  
  .progress-bar {
    transition: stroke-dashoffset 1s ease-in-out;
    filter: drop-shadow(0 0 8rpx rgba(255, 255, 255, 0.5));
  }
}

.timer-decoration {
  position: absolute;
  bottom: -10rpx;
  right: -10rpx;
  z-index: 2;
  
  .decoration-icon {
    font-size: 32rpx;
    animation: bounce-gentle 2s ease-in-out infinite;
    filter: drop-shadow(0 0 8rpx rgba(255, 215, 0, 0.6));
  }
}

// 动画定义
@keyframes bounce-gentle {
  0%, 100% {
    transform: translateY(0px) rotate(0deg);
  }
  50% {
    transform: translateY(-8rpx) rotate(5deg);
  }
}

// 数字变化动画
.countdown-number {
  animation: number-pulse 1s ease-in-out infinite;
}

@keyframes number-pulse {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
}

// 响应式适配
@include respond-to('sm') {
  .countdown-display .countdown-number {
    font-size: 56rpx;
  }
  
  .progress-ring {
    width: 200rpx;
    height: 200rpx;
  }
}

@include respond-to('lg') {
  .countdown-display .countdown-number {
    font-size: 72rpx;
  }
  
  .progress-ring {
    width: 280rpx;
    height: 280rpx;
  }
}
</style>