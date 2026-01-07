<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ChevronLeft, RotateCcw, Copy, Sparkles } from 'lucide-vue-next'

const router = useRouter()
const route = useRoute()

const fortuneText = ref('')
const isNew = ref(false)

onMounted(() => {
  fortuneText.value = (route.query.fortuneText as string) || ''
  isNew.value = (route.query.isNew as string) === 'true'
})

const handleDrawAgain = () => {
  router.push('/')
}

const handleCopy = async () => {
  try {
    await navigator.clipboard.writeText(`2026新年运势\n\n${fortuneText.value}`)
    alert('已复制到剪贴板！')
  } catch (error) {
    alert('复制失败，请手动复制')
  }
}
</script>

<template>
  <div class="result-container">
    <div class="header">
      <button class="back-button" @click="handleDrawAgain">
        <ChevronLeft :size="20" :stroke-width="2" />
        返回
      </button>
      <h1 class="title">抽签结果</h1>
    </div>

    <div class="fortune-card">
      <div v-if="isNew" class="new-badge">
        <Sparkles :size="14" :stroke-width="2" />
        新运势
      </div>
      <div class="fortune-icon">
        <Sparkles :size="72" :stroke-width="1.5" />
      </div>
      <div class="fortune-content">{{ fortuneText }}</div>
    </div>

    <div class="action-buttons">
      <button class="action-button primary" @click="handleDrawAgain">
        <RotateCcw :size="24" :stroke-width="2" />
        再次抽签
      </button>
      <button class="action-button secondary" @click="handleCopy">
        <Copy :size="24" :stroke-width="2" />
        复制分享
      </button>
    </div>
  </div>
</template>

<style scoped>
.result-container {
  min-height: 100vh;
  padding: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.header {
  width: 100%;
  max-width: 600px;
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 30px;
  margin-top: 20px;
}

.back-button {
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: white;
  padding: 10px 20px;
  border-radius: 12px;
  cursor: pointer;
  font-size: 16px;
  font-weight: 500;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  gap: 8px;
}

.back-button:hover {
  background: rgba(255, 255, 255, 0.3);
}

.title {
  font-size: 32px;
  font-weight: 700;
  color: white;
  text-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  letter-spacing: -0.5px;
}

.fortune-card {
  background: linear-gradient(135deg, #fff5f5 0%, #ffe8e8 50%, #fff0f0 100%);
  border-radius: 24px;
  padding: 50px 40px;
  width: 100%;
  max-width: 600px;
  text-align: center;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.12);
  position: relative;
  margin-bottom: 30px;
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.5);
}

.new-badge {
  position: absolute;
  top: 20px;
  right: 20px;
  background: linear-gradient(135deg, #ffd700 0%, #ffb347 100%);
  color: white;
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: bold;
  display: flex;
  align-items: center;
  gap: 4px;
}

.fortune-icon {
  color: #ff4757;
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.fortune-content {
  font-size: 24px;
  color: #333;
  line-height: 1.6;
  font-weight: bold;
}

.action-buttons {
  width: 100%;
  max-width: 600px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 15px;
}

.action-button {
  padding: 16px 24px;
  border: none;
  border-radius: 16px;
  font-size: 18px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.action-button.primary {
  background: linear-gradient(135deg, #ff4757 0%, #ff6b81 100%);
  color: white;
  box-shadow: 0 6px 20px rgba(255, 71, 87, 0.3);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.action-button.primary:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(255, 71, 87, 0.4);
}

.action-button.primary:active {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(255, 71, 87, 0.3);
}

.action-button.secondary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.3);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.action-button.secondary:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(102, 126, 234, 0.4);
}

.action-button.secondary:active {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(102, 126, 234, 0.3);
}

@media (max-width: 768px) {
  .title { font-size: 24px; }
  .fortune-card { padding: 40px 30px; }
  .fortune-icon { font-size: 56px; }
  .fortune-content { font-size: 20px; }
  .action-buttons { grid-template-columns: 1fr; }
}
</style>
