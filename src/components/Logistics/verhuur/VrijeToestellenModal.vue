<template>
  <div class="modal-overlay" @click.self="close">
    <div class="modal">
      <div class="modal-header">
        <h2>Kies Schaarlift</h2>
        <button class="close-btn" @click="close">✕</button>
      </div>

      <input
        ref="inputRef"
        v-model="search"
        type="text"
        placeholder="Zoek toestel..."
        class="search-input"
      />

      <div class="filter-toggle">
        <button
          type="button"
          :class="{ active: !filterOpWerkhoogte }"
          @click="setFilterOpWerkhoogte(false)"
        >
          Alle vrije toestellen
        </button>

        <button
          type="button"
          :class="{ active: filterOpWerkhoogte }"
          @click="setFilterOpWerkhoogte(true)"
        >
          Op werkhoogte
        </button>
      </div>

      <ul class="toestel-list">
        <li
          v-for="toestel in gefilterdeToestellen"
          :key="toestel._id"
          @click="selectToestel(toestel)"
          class="toestel-item"
        >
          <div class="toestel-title">{{ toestel.nummer }}</div>
          <div class="toestel-subtitle">
            {{ toestel.Type?.naam || '-' }} - Werkhoogte:
            {{ toestel.werkhoogte || '-' }}m
          </div>
        </li>

        <li v-if="!gefilterdeToestellen.length" class="no-results">
          Geen toestellen gevonden
        </li>
      </ul>

      <div class="modal-footer">
        <button class="btn-cancel" @click="close">Annuleren</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'

const props = defineProps({
  toestellen: {
    type: Array,
    required: true,
  },
  selectedToestel: Object,
})

const emit = defineEmits(['select', 'close', 'filter-change'])

const search = ref('')
const inputRef = ref(null)
const localToestel = ref(props.selectedToestel || null)

// standaard: filter op werkhoogte
const filterOpWerkhoogte = ref(true)

const gefilterdeToestellen = computed(() => {
  if (!search.value) return props.toestellen

  const q = search.value.toLowerCase()

  return props.toestellen.filter(
    (t) =>
      t.nummer?.toLowerCase().includes(q) ||
      t.Type?.naam?.toLowerCase().includes(q),
  )
})

function setFilterOpWerkhoogte(value) {
  filterOpWerkhoogte.value = value

  emit('filter-change', {
    gebruikWerkhoogte: value,
    werkhoogte: value ? undefined : 0,
  })
}

function selectToestel(toestel) {
  localToestel.value = toestel
  emit('select', localToestel.value)
  close()
}

function close() {
  emit('close')
}

function handleKey(e) {
  if (e.key === 'Escape') close()
}

onMounted(() => {
  inputRef.value?.focus()
  window.addEventListener('keydown', handleKey)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKey)
})

watch(
  () => props.selectedToestel,
  (v) => {
    localToestel.value = v || null
  },
)
</script>

<style scoped>
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

.filter-toggle {
  display: flex;
  gap: 8px;
  margin-top: 12px;
  margin-bottom: 12px;
  background: rgba(241, 245, 249, 0.9);
  padding: 6px;
  border-radius: 14px;
}

.filter-toggle button {
  flex: 1;
  border: none;
  padding: 10px 12px;
  border-radius: 10px;
  background: transparent;
  cursor: pointer;
  font-weight: 700;
  color: #64748b;
  transition: 0.25s ease;
}

.filter-toggle button:hover {
  background: rgba(255, 255, 255, 0.7);
}

.filter-toggle button.active {
  background: white;
  color: #1d4ed8;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.toestel-list {
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

.toestel-item {
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

.toestel-item:hover {
  transform: translateY(-2px);
  background: white;
  box-shadow:
    0 6px 18px rgba(0, 0, 0, 0.12),
    0 3px 8px rgba(0, 0, 0, 0.08);
  border-color: #cbd5e1;
}

.toestel-title {
  font-size: 15px;
  font-weight: 700;
  color: #111827;
}

.toestel-subtitle {
  margin-top: 4px;
  font-size: 13px;
  color: #64748b;
}

.no-results {
  padding: 16px;
  text-align: center;
  color: #64748b;
  font-weight: 600;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
}

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