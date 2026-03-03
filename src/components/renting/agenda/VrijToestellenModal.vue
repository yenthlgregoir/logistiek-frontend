<template>
  <div class="modal-overlay" @click.self="close">
    <div class="modal">
      <div class="modal-header">
        <h2>Kies Vrij Toestel</h2>
        <button class="close-btn" @click="close">✕</button>
      </div>

      <input
        type="text"
        v-model="search"
        placeholder="Zoek toestel (Ref / Naam / Nrplaat)..."
        class="search-input"
      />

      <ul class="toestel-list">
        <li
          v-for="toestel in gefilterdeToestellen"
          :key="toestel._id"
          @click="selectToestel(toestel)"
          class="toestel-item"
        >
          {{ toestel.Ref }} - {{ toestel.naam }} 
          <span v-if="toestel.nrplaat">({{ toestel.nrplaat }})</span>
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
  toestellen: { type: Array, required: true }
})

const emit = defineEmits(['select', 'close'])

const search = ref('')

// 🔹 Filter op Ref, Naam, of nummerplaat
const gefilterdeToestellen = computed(() => {
  if (!search.value) return props.toestellen

  const query = search.value.toLowerCase()
  return props.toestellen.filter(t => {
    return (
      (t.Ref && t.Ref.toLowerCase().includes(query)) ||
      (t.naam && t.naam.toLowerCase().includes(query)) ||
      (t.nrplaat && t.nrplaat.toLowerCase().includes(query))
    )
  })
})

function selectToestel(toestel) {
  emit('select', toestel)
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

.toestel-list {
  max-height: 250px;
  overflow-y: auto;
  padding: 0;
  margin: 0;
  list-style: none;
}

.toestel-item {
  padding: 0.6rem;
  border-bottom: 1px solid #eee;
  cursor: pointer;
}

.toestel-item:hover {
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