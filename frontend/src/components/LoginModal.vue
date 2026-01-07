<script setup lang="ts">
import { ref } from 'vue'
import { useUserStore } from '../stores/user'
import { Sparkles, Shield, Palette, User } from 'lucide-vue-next'

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
      <div class="modal-header">
        <div class="header-icon">
          <Sparkles :size="40" :stroke-width="1.5" />
        </div>
        <h2 class="modal-title">新年抽签</h2>
      </div>
      <p class="modal-subtitle">请输入您的昵称开始抽签</p>

      <div class="form-group">
        <div class="input-wrapper">
          <User class="input-icon" :size="20" :stroke-width="2" />
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
        </div>
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
        <div class="feature-item">
          <Sparkles :size="18" :stroke-width="2" />
          <span>50条精选运势</span>
        </div>
        <div class="feature-item">
          <Shield :size="18" :stroke-width="2" />
          <span>防重复机制</span>
        </div>
        <div class="feature-item">
          <Palette :size="18" :stroke-width="2" />
          <span>精美动画效果</span>
        </div>
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
  background: rgba(255, 255, 255, 0.98);
  border-radius: 24px;
  padding: 40px;
  width: 90%;
  max-width: 400px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.25);
  animation: modalIn 0.3s ease-out;
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.3);
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

.modal-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 8px;
}

.header-icon {
  color: #ff4757;
  margin-bottom: 12px;
}

.modal-title {
  font-size: 28px;
  font-weight: 700;
  color: #ff4757;
  text-align: center;
  letter-spacing: -0.5px;
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

.input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.input-icon {
  position: absolute;
  left: 16px;
  color: #999;
  pointer-events: none;
}

.nickname-input {
  width: 100%;
  padding: 15px 20px 15px 48px;
  border: 2px solid #e8e8e8;
  border-radius: 12px;
  font-size: 16px;
  color: #333;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
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

.input-wrapper:focus-within .input-icon {
  color: #ff4757;
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
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 4px 15px rgba(255, 71, 87, 0.3);
}

.login-button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(255, 71, 87, 0.4);
}

.login-button:active:not(:disabled) {
  transform: translateY(0);
  box-shadow: 0 4px 12px rgba(255, 71, 87, 0.3);
}

.login-button:disabled {
  opacity: 0.7;
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
  padding: 12px 15px;
  background: rgba(255, 71, 87, 0.08);
  border-radius: 10px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  font-weight: 500;
}

.feature-item:hover {
  background: rgba(255, 71, 87, 0.15);
  transform: translateX(5px);
}

.feature-item svg {
  flex-shrink: 0;
  color: #ff4757;
}

@media (max-width: 480px) {
  .modal-content {
    padding: 30px 24px;
  }

  .modal-title {
    font-size: 24px;
  }

  .header-icon {
    margin-bottom: 10px;
  }

  .modal-subtitle {
    font-size: 13px;
    margin-bottom: 24px;
  }

  .nickname-input {
    padding: 14px 18px 14px 44px;
    font-size: 15px;
  }

  .login-button {
    padding: 14px;
    font-size: 16px;
  }

  .feature-item {
    font-size: 13px;
    padding: 10px 12px;
  }
}
</style>
