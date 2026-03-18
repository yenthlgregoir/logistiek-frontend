<script setup>
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { loginApi } from '@/api/login'

const route = useRoute()
const router = useRouter()

const password = ref('')
const confirmPassword = ref('')
const message = ref('')
const loading = ref(false)

const token = route.params.token

async function setPassword() {
  if (!password.value || !confirmPassword.value) {
    message.value = 'Please fill in all fields'
    return
  }

  if (password.value !== confirmPassword.value) {
    message.value = 'Passwords do not match'
    return
  }

  if (password.value.length < 6) {
    message.value = 'Password must be at least 6 characters'
    return
  }

  loading.value = true
  message.value = ''

  try {
    await loginApi.setPassword(token, password.value)
    message.value = 'Password updated successfully'

    router.push('/login')
  } catch (err) {
    message.value = err.response?.data?.message || 'Server error'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="login-wrapper">
    <div class="login-card">
      <h2>Reset Password</h2>

      <div class="form-group">
        <input type="password" v-model="password" placeholder="New Password" />
      </div>

      <div class="form-group">
        <input type="password" v-model="confirmPassword" placeholder="Confirm Password" />
      </div>

      <button @click="setPassword" :disabled="loading">
        {{ loading ? 'Updating...' : 'Set Password' }}
      </button>

      <p v-if="message" class="message">{{ message }}</p>
    </div>
  </div>
</template>

<style scoped>
/* Wrapper & background */
.login-wrapper {
  min-height: 92vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #f5f7fa, #e4e8f0);
  padding: 20px;
}

/* Card */
.login-card {
  background: white;
  padding: 40px 30px;
  width: 100%;
  max-width: 400px;
  border-radius: 12px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.08);
  text-align: center;
}

/* Typography */
h2 {
  margin-bottom: 25px;
  font-weight: 600;
  color: #333;
}

/* Form groups */
.form-group {
  margin-bottom: 15px;
}

input {
  width: 100%;
  padding: 12px 14px;
  border-radius: 8px;
  border: 1px solid #ddd;
  font-size: 14px;
  transition: all 0.2s ease;
}

input:focus {
  outline: none;
  border-color: #4f73ff;
  box-shadow: 0 0 0 3px rgba(79, 115, 255, 0.15);
}

/* Button */
button {
  width: 100%;
  padding: 12px;
  border: none;
  border-radius: 8px;
  background-color: #4f73ff;
  color: white;
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  margin-top: 10px;
}

button:hover:not(:disabled) {
  background-color: #3e5de0;
}

button:active:not(:disabled) {
  transform: scale(0.98);
}

button:disabled {
  background-color: #a3a0ff;
  cursor: not-allowed;
}

/* Message */
.message {
  margin-top: 15px;
  color: #4f73ff;
  font-size: 14px;
}
</style>
