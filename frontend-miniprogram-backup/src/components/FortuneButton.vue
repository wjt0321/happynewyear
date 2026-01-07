<template>
  <view class="fortune-button-container">
    <button 
      class="fortune-button"
      :class="{ 
        'disabled': disabled,
        'drawing': isDrawing,
        'cooldown': cooldown > 0
      }"
      @click="handleClick"
      :disabled="disabled"
    >
      <!-- 按钮背景装饰 -->
      <view class="button-decoration">
        <!-- 旋转装饰环 -->
        <view class="decoration-ring outer-ring"></view>
        <view class="decoration-ring inner-ring"></view>
        
        <!-- 闪烁星星动画 -->
        <view class="decoration-sparkles">
          <text class="sparkle star-1">✨</text>
          <text class="sparkle star-2">⭐</text>
          <text class="sparkle star-3">💫</text>
          <text class="sparkle star-4">🌟</text>
          <text class="sparkle star-5">✨</text>
          <text class="sparkle star-6">⭐</text>
        </view>
        
        <!-- 金光效果 -->
        <view class="golden-rays"></view>
      </view>
      
      <!-- 按钮内容 -->
      <view class="button-content">
        <!-- 冷却状态 -->
        <view v-if="cooldown > 0" class="cooldown-content">
          <CountdownTimer :seconds="cooldown" />
        </view>
        
        <!-- 抽签中状态 -->
        <view v-else-if="isDrawing" class="drawing-content">
          <text class="drawing-text">抽签中...</text>
          <view class="loading-dots">
            <view class="dot dot-1"></view>
            <view class="dot dot-2"></view>
            <view class="dot dot-3"></view>
          </view>
        </view>
        
        <!-- 正常状态 -->
        <view v-else class="normal-content">
          <text class="button-text">🎲 抽 签 🎲</text>
          <text class="button-subtext">点击获取新年运势</text>
        </view>
      </view>
    </button>
  </view>
</template>

<script setup lang="ts">
import CountdownTimer from './CountdownTimer.vue'

interface Props {
  disabled?: boolean
  cooldown?: number
  isDrawing?: boolean
}

interface Emits {
  (e: 'click'): void
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false,
  cooldown: 0,
  isDrawing: false
})

const emit = defineEmits<Emits>()

function handleClick() {
  if (!props.disabled && props.cooldown <= 0 && !props.isDrawing) {
    emit('click')
  }
}
</script>

<style lang="scss" scoped>
@import '../styles/theme.scss';

.fortune-button-container {
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
}

.fortune-button {
  width: 320rpx;
  height: 320rpx;
  border-radius: 50%;
  border: none;
  background: $theme-gradient-button;
  box-shadow: $theme-shadow-golden;
  position: relative;
  overflow: hidden;
  transition: all $theme-animation-normal ease;
  cursor: pointer;
  
  &:not(.disabled):active {
    transform: scale(0.95);
    box-shadow: $theme-shadow-light;
  }
  
  &.disabled {
    opacity: 0.6;
    transform: none !important;
    cursor: not-allowed;
  }
  
  &.drawing {
    animation: pulse $theme-animation-celebration infinite;
    box-shadow: $theme-glow-golden;
  }
  
  &.cooldown {
    background: linear-gradient(135deg, #95A5A6 0%, #7F8C8D 100%);
    box-shadow: 0 8px 32px rgba(127, 140, 141, 0.3);
  }
}

.button-decoration {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  
  // 旋转装饰环
  .decoration-ring {
    position: absolute;
    border-radius: 50%;
    border-style: solid;
    
    &.outer-ring {
      top: 15rpx;
      left: 15rpx;
      right: 15rpx;
      bottom: 15rpx;
      border: 6rpx solid rgba(255, 255, 255, 0.4);
      animation: rotate 12s linear infinite;
    }
    
    &.inner-ring {
      top: 35rpx;
      left: 35rpx;
      right: 35rpx;
      bottom: 35rpx;
      border: 3rpx solid rgba(255, 215, 0, 0.6);
      animation: rotate 8s linear infinite reverse;
    }
  }
  
  // 金光效果
  .golden-rays {
    position: absolute;
    top: 50%;
    left: 50%;
    width: 400rpx;
    height: 400rpx;
    transform: translate(-50%, -50%);
    background: radial-gradient(circle, 
      rgba(255, 215, 0, 0.2) 0%, 
      rgba(255, 215, 0, 0.1) 40%, 
      transparent 70%);
    animation: rotate 20s linear infinite;
    pointer-events: none;
  }
  
  // 闪烁星星
  .decoration-sparkles {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    
    .sparkle {
      position: absolute;
      font-size: 28rpx;
      animation: sparkle 2s ease-in-out infinite;
      text-shadow: $theme-glow-celebration;
      
      &.star-1 {
        top: 10rpx;
        left: 50%;
        transform: translateX(-50%);
        animation-delay: 0s;
      }
      
      &.star-2 {
        top: 25%;
        right: 10rpx;
        transform: translateY(-50%);
        animation-delay: 0.3s;
      }
      
      &.star-3 {
        bottom: 10rpx;
        left: 50%;
        transform: translateX(-50%);
        animation-delay: 0.6s;
      }
      
      &.star-4 {
        top: 25%;
        left: 10rpx;
        transform: translateY(-50%);
        animation-delay: 0.9s;
      }
      
      &.star-5 {
        top: 75%;
        right: 25%;
        animation-delay: 1.2s;
      }
      
      &.star-6 {
        top: 75%;
        left: 25%;
        animation-delay: 1.5s;
      }
    }
  }
}

.button-content {
  position: relative;
  z-index: 2;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: $theme-text-primary;
}

.normal-content {
  text-align: center;
  
  .button-text {
    font-size: $theme-font-title;
    font-weight: $theme-font-weight-bold;
    display: block;
    margin-bottom: 12rpx;
    font-family: $theme-font-decorative;
    text-shadow: $theme-text-shadow-medium;
  }
  
  .button-subtext {
    font-size: $theme-font-body;
    opacity: 0.8;
    font-weight: $theme-font-weight-medium;
  }
}

.drawing-content {
  text-align: center;
  
  .drawing-text {
    font-size: $theme-font-title;
    font-weight: $theme-font-weight-bold;
    display: block;
    margin-bottom: 20rpx;
    font-family: $theme-font-decorative;
    text-shadow: $theme-text-shadow-medium;
  }
  
  .loading-dots {
    display: flex;
    gap: 8rpx;
    justify-content: center;
    
    .dot {
      width: 12rpx;
      height: 12rpx;
      border-radius: 50%;
      background: $theme-text-primary;
      animation: bounce 1.4s ease-in-out infinite both;
      
      &.dot-1 { animation-delay: -0.32s; }
      &.dot-2 { animation-delay: -0.16s; }
      &.dot-3 { animation-delay: 0s; }
    }
  }
}

.cooldown-content {
  text-align: center;
  width: 100%;
}

// 动画定义
@keyframes pulse {
  0%, 100% { 
    transform: scale(1); 
    box-shadow: $theme-shadow-golden;
  }
  50% { 
    transform: scale(1.05); 
    box-shadow: $theme-glow-golden;
  }
}

@keyframes rotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@keyframes sparkle {
  0%, 100% { 
    opacity: 0.4; 
    transform: scale(1); 
  }
  50% { 
    opacity: 1; 
    transform: scale(1.3); 
  }
}

@keyframes bounce {
  0%, 80%, 100% { 
    transform: scale(0); 
    opacity: 0.5;
  }
  40% { 
    transform: scale(1); 
    opacity: 1;
  }
}

// 响应式适配
@include respond-to('sm') {
  .fortune-button {
    width: 280rpx;
    height: 280rpx;
  }
  
  .normal-content .button-text {
    font-size: 32rpx;
  }
  
  .drawing-content .drawing-text {
    font-size: 32rpx;
  }
}

@include respond-to('lg') {
  .fortune-button {
    width: 360rpx;
    height: 360rpx;
  }
  
  .normal-content .button-text {
    font-size: 40rpx;
  }
  
  .drawing-content .drawing-text {
    font-size: 40rpx;
  }
}
</style>