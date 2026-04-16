<template>
  <div v-if="loading.isLoading" class="global-loading">
    <div class="card">
      <div class="spinner"></div>
      <h2>Laden...</h2>
      <p>Even geduld</p>
    </div>
  </div>
</template>

<script setup>
import { useLoadingStore } from '@/stores/LoadingStore.ts'
const loading = useLoadingStore()
</script>

<style scoped>
.global-loading {
  position: fixed;
  inset: 0;
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(6px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 99999;
}

.card {
  background: white;
  padding: 2rem;
  border-radius: 16px;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.1);
  text-align: center;
  min-width: 220px;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #e5e7eb;
  border-top: 4px solid #3b82f6;
  border-radius: 50%;
  margin: 0 auto 1rem;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>