<!-- BaseModal.vue -->
<template>
  <div class="modal-overlay" @click.self="close">
    <div class="modal">
      <!-- HEADER -->
      <div class="modal-header">
        <slot name="header">
          <h2>Titel</h2>
        </slot>

        <button class="close-btn" @click="close">✕</button>
      </div>

      <!-- BODY -->
      <div class="modal-body">
        <slot />
      </div>

      <!-- FOOTER -->
      <div class="modal-footer">
        <slot name="footer">
          <button class="btn-cancel" @click="close">Annuleren</button>
        </slot>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, onUnmounted } from 'vue'

const emit = defineEmits(['close'])

function close() {
  emit('close')
}

function handleKey(e) {
  if (e.key === 'Escape') close()
}

onMounted(() => {
  window.addEventListener('keydown', handleKey)
})
onUnmounted(() => {
  window.removeEventListener('keydown', handleKey)
})
</script>

<style scoped>
/* =========================================
   OVERLAY
========================================= */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.55);
  backdrop-filter: blur(8px);
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 1.5rem;
  z-index: 9999;
  animation: fadeIn 0.25s ease-out;
}

/* =========================================
   MODAL CONTAINER
========================================= */
.modal {
  width: 95%;
  max-width: 480px;
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(14px);
  border-radius: 22px;
  padding: 28px;
  box-shadow:
    0 12px 38px rgba(0, 0, 0, 0.18),
    0 4px 12px rgba(0, 0, 0, 0.08);
  animation: slideUp 0.3s ease-out;
  font-family: 'Inter', sans-serif;
}

/* =========================================
   HEADER
========================================= */
.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 12px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
  margin-bottom: 20px;
}

.modal-header h2 {
  font-size: 22px;
  font-weight: 700;
  color: #0f172a;
  margin: 0;
}

/* Close Button */
.close-btn {
  width: 38px;
  height: 38px;
  border: none;
  background: rgba(0, 0, 0, 0.06);
  border-radius: 12px;
  cursor: pointer;
  font-size: 18px;
  color: #475569;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: 0.25s ease;
}

.close-btn:hover {
  background: #ef4444;
  color: #ffffff;
}

/* =========================================
   SEARCH INPUT
========================================= */
.search-input {
  width: 100%;
  padding: 12px 14px;
  border-radius: 12px;
  border: 1px solid #d1d5db;
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(6px);
  font-size: 14px;
  font-weight: 500;
  transition: 0.25s ease;
}

.search-input:focus {
  outline: none;
  border-color: #4f73ff;
  background: white;
  box-shadow: 0 0 0 4px rgba(79, 115, 255, 0.2);
}

::v-deep(.list) {
  max-height: 420px;
  overflow-y: auto;
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 12px;
}

/* High-end toestel card */
::v-deep(.list-item) {
  padding: 14px 16px;
  background: rgba(248, 250, 252, 0.85);
  border-radius: 14px;
  border: 1px solid #e2e8f0;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  transition: 0.25s ease;
  box-shadow:
    0 1px 2px rgba(0, 0, 0, 0.04),
    0 2px 6px rgba(0, 0, 0, 0.05);
}

::v-deep(.list-item:hover) {
  transform: translateY(-2px);
  background: white;
  box-shadow:
    0 6px 18px rgba(0, 0, 0, 0.12),
    0 3px 8px rgba(0, 0, 0, 0.08);
  border-color: #cbd5e1;
}

::v-deep(.item-title) {
  font-size: 15px;
  font-weight: 700;
  color: #111827;
}
::v-deep(.search) {
  position: relative;
  flex: 1;
  max-width: 300px;
}

::v-deep(.search input) {
  padding: 8px 12px 8px 32px;
  border-radius: 6px;
  border: none;
  background: transparent;
}

::v-deep(.search i) {
  position: absolute;
  left: 10px;
  top: 50%;
  transform: translateY(-50%);

  color: #1b4965;
}

/* =========================================
   FOOTER
========================================= */
.modal-footer {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
}

/* Cancel button */
.btn-cancel {
  background: rgba(0, 0, 0, 0.06);
  border: none;
  padding: 10px 18px;
  border-radius: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: 0.25s ease;
  color: #374151;
}

.btn-cancel:hover {
  background: rgba(0, 0, 0, 0.12);
}

/* =========================================
   ANIMATIONS
========================================= */
@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(25px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
