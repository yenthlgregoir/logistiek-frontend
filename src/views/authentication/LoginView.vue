<template>
  <div class="login-page">
    <div class="login-left">
      <div class="left-content">
        <img
          src="@/assets/logo_ops.png"
          alt="OPS Platform"
          class="logo"
        />
      </div>
    </div>

    <div class="login-right">
      <div class="login-card">
        <h2>Sign in</h2>

        <p>Meld je aan met je Microsoft-werkaccount.</p>

        <button
  type="button"
  class="microsoft-button"
  :disabled="loading"
  :aria-busy="loading"
  @click="handleLogin"
>
  <svg
    class="microsoft-logo"
    width="21"
    height="21"
    viewBox="0 0 21 21"
    aria-hidden="true"
  >
    <path fill="#f25022" d="M0 0h10v10H0z" />
    <path fill="#7fba00" d="M11 0h10v10H11z" />
    <path fill="#00a4ef" d="M0 11h10v10H0z" />
    <path fill="#ffb900" d="M11 11h10v10H11z" />
  </svg>

  <span>
    {{ loading ? 'Doorsturen…' : 'Aanmelden met Microsoft' }}
  </span>
</button>

        <p v-if="auth.error" class="error">
          {{ auth.error }}
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useAuthStore } from '@/stores/authentication/auth.store.js'

const auth = useAuthStore()
const loading = ref(false)

function handleLogin() {
  loading.value = true
  auth.login()
}
</script>

<style scoped>
.login-page {
  display: flex;
  height: 100vh;
  font-family: 'Inter', sans-serif;
}
h1{
  margin:0
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
.microsoft-button {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  width: 100%;
  min-height: 50px;
  margin-top: 20px;
  padding: 14px 20px;

  background: #fff;
  border: 1px solid #cbd5e1;
  border-radius: 10px;
  box-shadow: 0 2px 4px rgb(15 23 42 / 5%);

  color: #334155;
  font-family: 'Segoe UI', 'Inter', sans-serif;
  font-size: 15px;
  font-weight: 600;
  line-height: 1.4;

  cursor: pointer;
  transition:
    background-color 160ms ease,
    border-color 160ms ease,
    box-shadow 160ms ease;
}

.microsoft-logo {
  flex-shrink: 0;
}

.microsoft-button:hover:not(:disabled) {
  background: #f8fafc;
  border-color: #94a3b8;
  box-shadow: 0 4px 10px rgb(15 23 42 / 8%);
}

.microsoft-button:active:not(:disabled) {
  background: #f1f5f9;
  box-shadow: none;
}

.microsoft-button:focus-visible {
  outline: 3px solid #3553f2;
  outline-offset: 3px;
}

.microsoft-button:disabled {
  opacity: 0.6;
  cursor: wait;
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