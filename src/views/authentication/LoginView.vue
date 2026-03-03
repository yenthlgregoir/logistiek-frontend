<template>
  <div class="login-wrapper">
    <div class="login-card">
      <h2>Login</h2>

      <div class="form-group">
        <input v-model="email" type="email" placeholder="Email" />
      </div>

      <div class="form-group">
        <input v-model="password" type="password" placeholder="Password" />
      </div>

      <button @click="handleLogin">Login</button>

      <p v-if="error" class="error">{{ error }}</p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { loginApi } from '@/api/login.js'

const email = ref('')
const password = ref('')
const error = ref(null)
const router = useRouter()

const handleLogin = async () => {
  try {
    const response = await loginApi.login(email.value, password.value)
    localStorage.setItem('token', response.token)
    router.push({ name: 'home' })
  } catch (err) {
    console.error(err)
    error.value = 'Login mislukt'
  }
}
</script>

<style scoped>
.login-wrapper {
  min-height: 92vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #f5f7fa, #e4e8f0);
}

.login-card {
  background: white;
  padding: 40px;
  width: 100%;
  max-width: 400px;
  border-radius: 12px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.08);
  text-align: center;
}

h2 {
  margin-bottom: 25px;
  font-weight: 600;
  color: #333;
}

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

button:hover {
  background-color: #3e5de0;
}

button:active {
  transform: scale(0.98);
}

.error {
  margin-top: 15px;
  color: #e53935;
  font-size: 14px;
}
</style>
