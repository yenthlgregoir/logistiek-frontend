<script setup>
import { ref } from 'vue'
import { loginApi } from '@/api/login'

const email = ref('')
const role = ref('purchase')
const message = ref('')
const loading = ref(false)

async function createUser() {
  try {
    loading.value = true
    message.value = ''

    await loginApi.createUser(email.value, role.value)

    message.value = 'User created successfully'
    email.value = ''
    role.value = 'purchase'
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
      <h2>Create User</h2>

      <div class="form-group">
        <input v-model="email" type="email" placeholder="Email" />
      </div>

      <div class="form-group">
        <select v-model="role">
          <option value="purchase">Purchase</option>
          <option value="renting">Renting</option>
          <option value="admin">Admin</option>
        </select>
      </div>

      <button type="button" @click="createUser" :disabled="loading">
        {{ loading ? 'Creating...' : 'Create User' }}
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

input,
select {
  width: 100%;
  padding: 12px 14px;
  border-radius: 8px;
  border: 1px solid #ddd;
  font-size: 14px;
  transition: all 0.2s ease;
}

input:focus,
select:focus {
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

/* Messages */
.message {
  margin-top: 15px;
  color: #4f73ff;
  font-size: 14px;
}
</style>
