<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../stores/user'
import { useFortuneStore } from '../stores/fortune'
import LoginModal from '../components/LoginModal.vue'

const router = useRouter()
const userStore = useUserStore()
const fortuneStore = useFortuneStore()

const showLoginModal = ref(false)
const isDrawing = ref(false)
const cooldownRemaining = ref(0)
let cooldownTimer: number | null = null

onMounted(() => {
  userStore.checkSession()
  if (!userStore.isLoggedIn()) {
    showLoginModal.value = true
  } else {
    fortuneStore.loadFromStorage()
    startCooldownTimer()
  }
})

const remainingCount = computed(() => fortuneStore.getRemainingCount())

const startCooldownTimer = () => {
  if (cooldownTimer) {
    clearInterval(cooldownTimer)
  }

  const updateCooldown = () => {
    cooldownRemaining.value = userStore.getCooldownRemaining()
    if (cooldownRemaining.value <= 0) {
      if (cooldownTimer) {
        clearInterval(cooldownTimer)
        cooldownTimer = null
      }
    }
  }

  updateCooldown()
  cooldownTimer = setInterval(updateCooldown, 1000) as unknown as number
}

const handleDraw = async () => {
  if (isDrawing.value) return
  if (!userStore.isLoggedIn()) {
    showLoginModal.value = true
    return
  }
  if (userStore.isInCooldown()) {
    return
  }
  if (!fortuneStore.canDraw()) {
    alert('您已经抽完所有运势啦！')
    return
  }

  isDrawing.value = true

  try {
    const result = await fortuneStore.drawFortune(userStore.userInfo!.id)
    if (result && result.data) {
      userStore.updateLastDrawTime()
      startCooldownTimer()
      router.push({
        name: 'Result',
        query: {
          fortuneId: result.data.id,
          fortuneText: result.data.text,
          category: result.data.category || 'general',
          isNew: 'true'
        }
      })
    }
  } catch (error) {
    console.error('Draw error:', error)
    alert('抽签失败，请重试')
  } finally {
    isDrawing.value = false
  }
}

const handleLoginSuccess = () => {
  showLoginModal.value = false
  fortuneStore.loadFromStorage()
  startCooldownTimer()
}
</script>

<template>
  <div class="home-container">
    <div class="header">
      <h1 class="title">🎊 新年抽签 🎊</h1>
      <p class="subtitle">2026 新年运势大揭秘</p>
    </div>

    <div class="stats-bar">
      <div class="stat-item">
        <span class="stat-label">剩余运势</span>
        <span class="stat-value">{{ remainingCount }}/50</span>
      </div>
      <div v-if="userStore.userInfo" class="stat-item">
        <span class="stat-label">用户</span>
        <span class="stat-value">{{ userStore.userInfo.nickname }}</span>
      </div>
    </div>

    <div class="main-content">
      <div class="fortune-card">
        <div class="card-icon">🎲</div>
        <h2 class="card-title">点击下方按钮抽签</h2>
        <p class="card-description">揭开您2026年的新年运势</p>
      </div>

      <button
        class="draw-button"
        :class="{
          'drawing': isDrawing,
          'cooldown': cooldownRemaining > 0
        }"
        :disabled="isDrawing || cooldownRemaining > 0 || !fortuneStore.canDraw()"
        @click="handleDraw"
      >
        <span v-if="isDrawing" class="button-icon">⏳</span>
        <span v-else-if="cooldownRemaining > 0" class="button-icon">⏰</span>
        <span v-else class="button-icon">🎲</span>

        <span v-if="isDrawing">抽签中...</span>
        <span v-else-if="cooldownRemaining > 0">
          冷却中 {{ cooldownRemaining }}秒
        </span>
        <span v-else>开始抽签</span>
      </button>

      <div v-if="!fortuneStore.canDraw()" class="completed-message">
        <p>🎉 您已经抽完所有运势啦！</p>
        <p class="completed-subtitle">祝您2026年新年快乐！</p>
      </div>
    </div>

    <div class="features">
      <div class="feature-card">
        <div class="feature-icon">✨</div>
        <div class="feature-text">
          <h3>50条精选运势</h3>
          <p>精心挑选的新年运势内容</p>
        </div>
      </div>
      <div class="feature-card">
        <div class="feature-icon">🎯</div>
        <div class="feature-text">
          <h3>防重复机制</h3>
          <p>确保每次都是新的运势</p>
        </div>
      </div>
      <div class="feature-card">
        <div class="feature-icon">⏱️</div>
        <div class="feature-text">
          <h3>智能冷却</h3>
          <p>10秒冷却时间，理性抽签</p>
        </div>
      </div>
    </div>

    <LoginModal
      v-if="showLoginModal"
      @close="handleLoginSuccess"
    />
  </div>
</template>

<style scoped>
.home-container {
  min-height: 100vh;
  padding: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.header {
  text-align: center;
  margin-bottom: 30px;
  margin-top: 40px;
}

.title {
  font-size: 42px;
  font-weight: bold;
  color: white;
  text-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  margin-bottom: 12px;
}

.subtitle {
  font-size: 18px;
  color: rgba(255, 255, 255, 0.9);
  font-weight: 500;
}

.stats-bar {
  display: flex;
  gap: 20px;
  margin-bottom: 40px;
  flex-wrap: wrap;
  justify-content: center;
}

.stat-item {
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(10px);
  border-radius: 12px;
  padding: 12px 24px;
  display: flex;
  align-items: center;
  gap: 8px;
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.3);
}

.stat-label {
  font-size: 14px;
  opacity: 0.9;
}

.stat-value {
  font-size: 18px;
  font-weight: bold;
}

.main-content {
  width: 100%;
  max-width: 600px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 30px;
  margin-bottom: 40px;
}

.fortune-card {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 24px;
  padding: 40px;
  width: 100%;
  text-align: center;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  animation: fadeInUp 0.6s ease-out;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.card-icon {
  font-size: 64px;
  margin-bottom: 20px;
}

.card-title {
  font-size: 24px;
  color: #333;
  margin-bottom: 12px;
  font-weight: bold;
}

.card-description {
  font-size: 16px;
  color: #666;
}

.draw-button {
  width: 100%;
  padding: 24px;
  background: linear-gradient(135deg, #ff4757 0%, #ff6b81 100%);
  color: white;
  border: none;
  border-radius: 20px;
  font-size: 24px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s;
  box-shadow: 0 8px 24px rgba(255, 71, 87, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  position: relative;
  overflow: hidden;
}

.draw-button:hover:not(:disabled) {
  transform: translateY(-4px);
  box-shadow: 0 12px 32px rgba(255, 71, 87, 0.5);
}

.draw-button:active:not(:disabled) {
  transform: translateY(-2px);
}

.draw-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.draw-button.drawing {
  background: linear-gradient(135deg, #ffa502 0%, #ff6348 100%);
}

.draw-button.cooldown {
  background: linear-gradient(135deg, #747d8c 0%, #57606f 100%);
}

.button-icon {
  font-size: 28px;
  animation: pulse 1s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.1);
  }
}

.completed-message {
  text-align: center;
  color: white;
  animation: bounceIn 0.6s ease-out;
}

@keyframes bounceIn {
  0% {
    opacity: 0;
    transform: scale(0.3);
  }
  50% {
    transform: scale(1.05);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
}

.completed-message p {
  font-size: 20px;
  margin-bottom: 8px;
  font-weight: bold;
}

.completed-subtitle {
  font-size: 16px !important;
  font-weight: normal !important;
  opacity: 0.9;
}

.features {
  width: 100%;
  max-width: 900px;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-top: 20px;
}

.feature-card {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 16px;
  padding: 24px;
  display: flex;
  align-items: flex-start;
  gap: 16px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  transition: all 0.3s;
  animation: slideUp 0.5s ease-out backwards;
}

.feature-card:nth-child(1) {
  animation-delay: 0.1s;
}

.feature-card:nth-child(2) {
  animation-delay: 0.2s;
}

.feature-card:nth-child(3) {
  animation-delay: 0.3s;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.feature-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
}

.feature-icon {
  font-size: 32px;
  flex-shrink: 0;
}

.feature-text h3 {
  font-size: 16px;
  color: #333;
  margin-bottom: 4px;
  font-weight: bold;
}

.feature-text p {
  font-size: 14px;
  color: #666;
  line-height: 1.4;
}

@media (max-width: 768px) {
  .title {
    font-size: 32px;
  }

  .subtitle {
    font-size: 16px;
  }

  .fortune-card {
    padding: 30px;
  }

  .card-icon {
    font-size: 48px;
  }

  .draw-button {
    padding: 20px;
    font-size: 20px;
  }

  .features {
    grid-template-columns: 1fr;
  }
}
</style>
