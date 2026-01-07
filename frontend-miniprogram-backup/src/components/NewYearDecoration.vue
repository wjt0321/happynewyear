<template>
  <view class="new-year-decoration">
    <!-- 顶部装饰条 -->
    <view class="top-decoration">
      <view class="decoration-item">🎊</view>
      <view class="decoration-item">🧧</view>
      <view class="decoration-item">🎉</view>
      <view class="decoration-item">🏮</view>
      <view class="decoration-item">🎊</view>
    </view>
    
    <!-- 左侧装饰 -->
    <view class="side-decoration left">
      <view class="decoration-item">🐉</view>
      <view class="decoration-item">🪙</view>
      <view class="decoration-item">🎋</view>
    </view>
    
    <!-- 右侧装饰 -->
    <view class="side-decoration right">
      <view class="decoration-item">🎆</view>
      <view class="decoration-item">🧨</view>
      <view class="decoration-item">🎭</view>
    </view>
    
    <!-- 底部装饰条 -->
    <view class="bottom-decoration">
      <view class="decoration-item">🌸</view>
      <view class="decoration-item">🎀</view>
      <view class="decoration-item">🎗️</view>
      <view class="decoration-item">🌺</view>
      <view class="decoration-item">🌸</view>
    </view>
    
    <!-- 角落装饰 -->
    <view class="corner-decoration top-left">
      <text class="corner-text">恭</text>
    </view>
    <view class="corner-decoration top-right">
      <text class="corner-text">喜</text>
    </view>
    <view class="corner-decoration bottom-left">
      <text class="corner-text">发</text>
    </view>
    <view class="corner-decoration bottom-right">
      <text class="corner-text">财</text>
    </view>
  </view>
</template>

<script setup lang="ts">
// 纯装饰组件，无需逻辑
</script>

<style lang="scss" scoped>
.new-year-decoration {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 2;
}

.top-decoration,
.bottom-decoration {
  position: absolute;
  left: 0;
  width: 100%;
  display: flex;
  justify-content: space-around;
  align-items: center;
  padding: 20rpx 40rpx;
  
  .decoration-item {
    font-size: 40rpx;
    animation: bounce 2s ease-in-out infinite;
    
    &:nth-child(1) { animation-delay: 0s; }
    &:nth-child(2) { animation-delay: 0.2s; }
    &:nth-child(3) { animation-delay: 0.4s; }
    &:nth-child(4) { animation-delay: 0.6s; }
    &:nth-child(5) { animation-delay: 0.8s; }
  }
}

.top-decoration {
  top: 0;
}

.bottom-decoration {
  bottom: 0;
}

.side-decoration {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  flex-direction: column;
  gap: 80rpx;
  padding: 40rpx 20rpx;
  
  .decoration-item {
    font-size: 36rpx;
    animation: sway 3s ease-in-out infinite;
    
    &:nth-child(1) { animation-delay: 0s; }
    &:nth-child(2) { animation-delay: 1s; }
    &:nth-child(3) { animation-delay: 2s; }
  }
  
  &.left {
    left: 0;
  }
  
  &.right {
    right: 0;
  }
}

.corner-decoration {
  position: absolute;
  width: 80rpx;
  height: 80rpx;
  background: linear-gradient(135deg, #FF4757 0%, #FFD700 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 16px rgba(255, 71, 87, 0.3);
  animation: pulse 2s ease-in-out infinite;
  
  .corner-text {
    font-size: 32rpx;
    font-weight: bold;
    color: white;
    font-family: 'STKaiti', 'KaiTi', serif;
  }
  
  &.top-left {
    top: 40rpx;
    left: 40rpx;
    animation-delay: 0s;
  }
  
  &.top-right {
    top: 40rpx;
    right: 40rpx;
    animation-delay: 0.5s;
  }
  
  &.bottom-left {
    bottom: 40rpx;
    left: 40rpx;
    animation-delay: 1s;
  }
  
  &.bottom-right {
    bottom: 40rpx;
    right: 40rpx;
    animation-delay: 1.5s;
  }
}

// 动画定义
@keyframes bounce {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10rpx);
  }
}

@keyframes sway {
  0%, 100% {
    transform: rotate(0deg);
  }
  25% {
    transform: rotate(5deg);
  }
  75% {
    transform: rotate(-5deg);
  }
}

@keyframes pulse {
  0%, 100% {
    transform: scale(1);
    box-shadow: 0 4px 16px rgba(255, 71, 87, 0.3);
  }
  50% {
    transform: scale(1.1);
    box-shadow: 0 6px 20px rgba(255, 71, 87, 0.5);
  }
}
</style>