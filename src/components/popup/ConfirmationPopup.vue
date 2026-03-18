<script setup>
const props = defineProps({
  title: {
    type: String,
    default: 'Confirmation',
  },
  message: {
    type: String,
    required: true,
  },
})

const emit = defineEmits(['confirm', 'cancel'])
</script>

<template>
  <div class="overlay">
    <div class="dialog">
      <h2 class="title">{{ title }}</h2>

      <p class="message">{{ message }}</p>

      <div class="buttons">
        <button class="btn cancel" @click="emit('cancel')">Nee</button>

        <button class="btn confirm" @click="emit('confirm')">Ja</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.35);
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(3px);
  z-index: 1000;
}

.dialog {
  background: white;
  padding: 24px 28px;
  border-radius: 12px;
  width: 380px;
  max-width: 90%;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
  animation: popup 0.2s ease;
}

.title {
  margin: 0 0 10px;
  font-size: 20px;
  font-weight: 600;
  color: #222;
}

.message {
  margin: 0 0 20px;
  color: #666;
  line-height: 1.5;
}

.buttons {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.btn {
  border: none;
  padding: 9px 16px;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.cancel {
  background: #f3f4f6;
  color: #444;
}

.cancel:hover {
  background: #e5e7eb;
}

.confirm {
  background: #4f6df5;
  color: white;
}

.confirm:hover {
  background: #3f5ae0;
}

@keyframes popup {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}
</style>
