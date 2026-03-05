<template>
  <div class="modal-overlay" @click.self="close">
    <div class="modal">
      <div class="modal-header">
        <h2>Kies Leveradres</h2>
        <button class="close-btn" @click="close">✕</button>
      </div>

      <input
        type="text"
        v-model="search"
        placeholder="Zoek adres..."
        class="search-input"
      />

      <ul class="adres-list">
        <li
          v-for="adres in gefilterdeAdressen"
          :key="adres._id"
          @click="selectAdres(adres)"
          class="adres-item"
        >
          <div class="adres-title">{{ adres.naam || 'Onbekend' }}</div>
          <div class="adres-sub">
            {{ adres.straat }} {{ adres.huisnummer || '' }}, {{ adres.postcode }} {{ adres.stad }}
          </div>
        </li>
      </ul>

      <div class="modal-footer">
        <button class="btn-cancel" @click="close">Annuleren</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  adressen: { type: Array, required: true },
})

const emit = defineEmits(['select', 'close'])
const search = ref('')

const gefilterdeAdressen = computed(() => {
  if (!search.value) return props.adressen

  const query = search.value.toLowerCase()
  return props.adressen.filter((a) => {
    return (
      (a.naam && a.naam.toLowerCase().includes(query)) ||
      (a.straat && a.straat.toLowerCase().includes(query)) ||
      (a.stad && a.stad.toLowerCase().includes(query))
    )
  })
})

function selectAdres(adres) {
  emit('select', adres)
  close()
}

function close() {
  emit('close')
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.45);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 2000;
}

.modal {
  background: #fff;
  border-radius: 14px;
  width: 95%;
  max-width: 420px;
  padding: 1.8rem;
  box-shadow: 0 16px 40px rgba(0,0,0,0.15);
  display: flex;
  flex-direction: column;
  gap: 1rem;
  transition: all 0.2s ease;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.modal-header h2 {
  font-size: 20px;
  font-weight: 600;
  color: #111827;
}

.close-btn {
  background: transparent;
  border: none;
  font-size: 18px;
  color: #6b7280;
  cursor: pointer;
}
.close-btn:hover {
  color: #111827;
}

.search-input {
  width: 100%;
  padding: 0.6rem 0.8rem;
  border-radius: 10px;
  border: 1px solid #e5e7eb;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s ease;
}
.search-input:focus {
  outline: none;
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.2);
}

.adres-list {
  max-height: 280px;
  overflow-y: auto;
  padding: 0;
  margin: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

/* Modern card style per adres */
.adres-item {
  padding: 12px 16px;
  border-radius: 10px;
  background: #f9fafb;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  transition: all 0.2s ease;
  border: 1px solid #ececec;
}

.adres-item:hover {
  background: #ffffff;
  box-shadow: 0 4px 12px rgba(0,0,0,0.08);
  border-color: #d1d5db;
}

.adres-title {
  font-weight: 600;
  font-size: 14px;
  color: #111827;
}

.adres-sub {
  font-size: 13px;
  color: #6b7280;
  margin-top: 2px;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  margin-top: 0.5rem;
}

.btn-cancel {
  background: #f3f4f6;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 10px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}
.btn-cancel:hover {
  background: #e5e7eb;
}
</style>