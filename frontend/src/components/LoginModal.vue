<script setup lang="ts">
import { ref } from 'vue'
import { useUserStore } from '../stores/user'

const emit = defineEmits<{
  close: []
}>()

const userStore = useUserStore()
const nickname = ref('')
const isSubmitting = ref(false)
const error = ref('')

const handleLogin = () => {
  if (!nickname.value.trim()) {
    error.value = '请输入昵称'
    return
  }

  if (nickname.value.trim().length < 2) {
    error.value = '昵称至少需要2个字符'
    return
  }

  if (nickname.value.trim().length > 20) {
    error.value = '昵称不能超过20个字符'
    return
  }

  isSubmitting.value = true
  error.value = ''

  try {
    userStore.login(nickname.value.trim())
    emit('close')
  } catch (err) {
    error.value = '登录失败，请重试'
  } finally {
    isSubmitting.value = false
  }
}

const handleKeyPress = (e: KeyboardEvent) => {
  if (e.key === 'Enter') {
    handleLogin()
  }
}
</script>

<template>
  <div class="modal-overlay" @click.self="emit('close')">
    <div class="modal-content">
      <h2 class="modal-title">🎊 新年抽签 🎊</h2>
      <p class="modal-subtitle">请输入您的昵称开始抽签</p>

      <div class="form-group">
        <input
          v-model="nickname"
          type="text"
          placeholder="请输入昵称"
          class="nickname-input"
          maxlength="20"
          @keypress="handleKeyPress"
          :disabled="isSubmitting"
          autocomplete="off"
        />
        <p v-if="error" class="error-message">{{ error }}</p>
      </div>

      <button
        class="login-button"
        @click="handleLogin"
        :disabled="isSubmitting"
      >
        {{ isSubmitting ? '登录中...' : '开始抽签' }}
      </button>

      <div class="features">
        <div class="feature-item">✨ 50条精选运势</div>
        <div class="feature-item">🎯 防重复机制</div>
        <div class="feature-item">🎨 精美动画效果</div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  backdrop-filter: blur(4px);
}

.modal-content {
  background: linear-gradient(135deg, #fff5f5 0%, #ffe4e4 100%);
  border-radius: 20px;
  padding: 40px;
  width: 90%;
  max-width: 400px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  animation: modalIn 0.3s ease-out;
}

@keyframes modalIn {
  from {
    opacity: 0;
    transform: scale(0.9) translateY(-20px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

.modal-title {
  font-size: 28px;
  font-weight: bold;
  color: #ff4757;
  text-align: center;
  margin-bottom: 8px;
}

.modal-subtitle {
  font-size: 14px;
  color: #666;
  text-align: center;
  margin-bottom: 30px;
}

.form-group {
  margin-bottom: 20px;
}

.nickname-input {
  width: 100%;
  padding: 15px 20px;
  border: 2px solid #e8e8e8;
  border-radius: 12px;
  font-size: 16px;
  color: #333;
  transition: all 0.3s;
  outline: none;
  background: white;
  box-sizing: border-box;
}

.nickname-input::placeholder {
  color: #999;
}

.nickname-input:focus {
  border-color: #ff4757;
  box-shadow: 0 0 0 3px rgba(255, 71, 87, 0.1);
}

.nickname-input:disabled {
  background: #f5f5f5;
  cursor: not-allowed;
  color: #999;
}

.error-message {
  color: #ff4757;
  font-size: 14px;
  margin-top: 8px;
  animation: shake 0.5s;
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-5px); }
  75% { transform: translateX(5px); }
}

.login-button {
  width: 100%;
  padding: 15px;
  background: linear-gradient(135deg, #ff4757 0%, #ff6b81 100%);
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 18px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s;
  box-shadow: 0 4px 15px rgba(255, 71, 87, 0.3);
}

.login-button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(255, 71, 87, 0.4);
}

.login-button:active:not(:disabled) {
  transform: translateY(0);
}

.login-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.features {
  margin-top: 30px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.feature-item {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 14px;
  color: #666;
  padding: 10px 15px;
  background: rgba(255, 71, 87, 0.1);
  border-radius: 8px;
  transition: all 0.3s;
}

.feature-item:hover {
  background: rgba(255, 71, 87, 0.2);
  transform: translateX(5px);
}
</style>
