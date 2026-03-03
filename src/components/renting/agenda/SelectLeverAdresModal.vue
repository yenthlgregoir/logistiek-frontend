<template>
  <div class="modal-overlay" @click.self="close">
    <div class="modal">
      <div class="modal-header">
        <h2>Kies Leveradres</h2>
        <button class="close-btn" @click="close">✕</button>
      </div>

      <input type="text" v-model="search" placeholder="Zoek adres..." class="search-input" />

      <ul class="adres-list">
        <li
          v-for="adres in gefilterdeAdressen"
          :key="adres._id"
          @click="selectAdres(adres)"
          class="adres-item"
        >
          {{ adres.naam }} - {{ adres.straat }}, {{ adres.postcode }} {{ adres.stad }}
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
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 2000;
}

.modal {
  background: #fff;
  padding: 1.5rem;
  border-radius: 12px;
  width: 90%;
  max-width: 400px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.search-input {
  width: 100%;
  padding: 0.5rem;
  margin-bottom: 1rem;
  border-radius: 8px;
  border: 1px solid #ddd;
}

.adres-list {
  max-height: 250px;
  overflow-y: auto;
  padding: 0;
  margin: 0;
  list-style: none;
}

.adres-item {
  padding: 0.6rem;
  border-bottom: 1px solid #eee;
  cursor: pointer;
}

.adres-item:hover {
  background: #f3f4f6;
}

.btn-cancel {
  margin-top: 10px;
  background-color: #f3f4f6;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  cursor: pointer;
}
</style>
