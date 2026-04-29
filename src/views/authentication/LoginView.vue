<template>
  <div class="login-page">
    <!-- LEFT PANEL -->
    <div class="login-left">
      <div class="left-content">
        <img src="@/assets/logo_ops.png" alt="OPS Platform" class="logo" />
      </div>
    </div>

    <!-- RIGHT PANEL -->
    <div class="login-right">
      <div class="login-card">
        <h2>Sign in</h2>

        <div class="form-group">
          <input v-model="email" type="email" placeholder="Email" />
        </div>

        <div class="form-group">
          <input v-model="password" type="password" placeholder="Wachtwoord" />
        </div>

        <button type="button" @click="handleLogin" :disabled="loading">
          {{ loading ? 'Bezig...' : 'Login' }}
        </button>

        <p v-if="error" class="error">{{ error }}</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/authentication/auth.store.js'

const email = ref('')
const password = ref('')
const error = ref(null)
const loading = ref(false)

const router = useRouter()
const auth = useAuthStore()

const handleLogin = async () => {
  error.value = null

  if (!email.value || !password.value) {
    error.value = 'Email en wachtwoord zijn verplicht'
    return
  }

  try {
    loading.value = true

    await auth.login(email.value, password.value)

    console.log('voor')

    router.push({ name: 'home' })

    console.log('na')
  } catch (err) {
    console.error(err)

    const backendError = err?.response?.data

    if (backendError?.message) {
      error.value = backendError.message.replace(/^Error:\s*/, '')
    } else {
      error.value = 'Login mislukt'
    }
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-page {
  display: flex;
  height: 100vh;
  font-family: 'Inter', sans-serif;
}
h1 {
  margin: 0;
}
/* LEFT SIDE */
.login-left {
  flex: 1;
  background: linear-gradient(180deg, #5a89ff, #3553f2);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
}

.left-content {
  max-width: 550px;
}

.logo {
  width: 100%;
}

.left-content h1 {
  font-size: 42px;
  margin-bottom: 14px;
}

.left-content p {
  font-size: 18px;
  opacity: 0.9;
}

/* RIGHT SIDE */
.login-right {
  flex: 0.5;
  background: #f1f5f9;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* CARD */
.login-card {
  width: 80%;
  padding: 40px;
}

.login-card h2 {
  margin-bottom: 28px;
  font-size: 26px;
  color: #0f172a;
}

/* INPUTS */
.form-group {
  margin-bottom: 16px;
}

input {
  background-color: transparent;
  width: 100%;
  padding: 14px;
  border-radius: 10px;
  border: 1px solid #cbd5e1;
  font-size: 14px;
}

input:focus {
  outline: none;
  border-color: #5a89ff;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.15);
}

/* BUTTON */
button {
  width: 100%;
  padding: 14px;
  border-radius: 10px;
  border: none;
  background: linear-gradient(180deg, #5a89ff, #3553f2);
  color: white;
  font-weight: 600;
  margin-top: 10px;
  cursor: pointer;
}

button:hover {
  background: linear-gradient(180deg, #3553f2, #5a89ff);
}

button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.error {
  margin-top: 14px;
  color: #dc2626;
  font-size: 14px;
}
/* =========================
   MOBILE RESPONSIVE
   ========================= */
@media (max-width: 768px) {
  .login-page {
    flex-direction: column;
  }

  /* Verberg linker paneel */
  .login-left {
    display: none;
  }

  /* Right wordt full screen */
  .login-right {
    flex: 1;
    width: 100%;
    min-height: 100vh;
    padding: 20px;
  }

  /* Card beter gecentreerd */
  .login-card {
    width: 100%;
    max-width: 420px;
    padding: 30px 20px;
  }
}
</style>
