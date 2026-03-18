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

      <button type="button" @click="handleLogin">Login</button>

      <p v-if="error" class="error">{{ error }}</p>
    </div>
  </div>
</template>
<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { loginApi } from '@/api/login.js'
import { jwtDecode } from 'jwt-decode' // ✅ frontend compatible

const email = ref('')
const password = ref('')
const error = ref(null)
const router = useRouter()
const handleLogin = async () => {
  try {
    const response = await loginApi.login(email.value, password.value)
    const token = response.token
    localStorage.setItem('token', token)

    const decoded = jwtDecode(token)
    localStorage.setItem('role', decoded.role)

    router.push({ name: 'home' })
  } catch (err) {
    console.error(err)
    error.value = 'Login mislukt'
  }
}
</script>

<style scoped>
/* Wrapper with soft gradient and subtle animation */
.login-wrapper {
  min-height: 92vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #f1f5ff, #e8eeff);
  font-family: 'Inter', sans-serif;
  overflow: hidden;
}

/* Card with glassmorphism effect */
.login-card {
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(12px);
  padding: 50px 40px;
  width: 100%;
  max-width: 420px;
  border-radius: 20px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
  text-align: center;
  transition:
    transform 0.3s ease,
    box-shadow 0.3s ease;
}

.login-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.2);
}

h2 {
  margin-bottom: 30px;
  font-weight: 700;
  font-size: 28px;
  color: #2c3e50;
}

/* Input styling with smooth hover/focus */
.form-group {
  margin-bottom: 20px;
}

input {
  width: 100%;
  padding: 14px 16px;
  border-radius: 12px;
  border: 1px solid #cbd5e1;
  font-size: 15px;
  color: #333;
  background: rgba(255, 255, 255, 0.9);
  transition: all 0.3s ease;
}

input:focus {
  outline: none;
  border-color: #4f73ff;
  box-shadow: 0 0 0 4px rgba(79, 115, 255, 0.15);
  background: rgba(255, 255, 255, 1);
}

/* Button with gradient and depth */
button {
  width: 100%;
  padding: 14px;
  border: none;
  border-radius: 12px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-top: 15px;
  box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4);
}

button:hover {
  background: linear-gradient(135deg, #5a67d8, #6b46c1);
  box-shadow: 0 8px 20px rgba(102, 126, 234, 0.5);
}

button:active {
  transform: scale(0.97);
}

/* Error text */
.error {
  margin-top: 15px;
  color: #e53e3e;
  font-size: 14px;
  font-weight: 500;
  letter-spacing: 0.5px;
}

/* Subtle floating animation for card */
@keyframes floatCard {
  0%,
  100% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-5px);
  }
}

.login-card {
  animation: floatCard 6s ease-in-out infinite;
}
</style>
