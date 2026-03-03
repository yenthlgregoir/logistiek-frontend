<template>
  <div class="modal-overlay" @click.self="close">
    <div class="modal">
      <div class="modal-header">
        <h2>Kies Toestel</h2>
        <button class="close-btn" @click="close">✕</button>
      </div>

      <input type="text" v-model="search" placeholder="Zoek toestel..." class="search-input" />

      <ul class="toestel-list">
        <li
          v-for="toestel in gefilterdeToestellen"
          :key="toestel._id"
          @click="selectToestel(toestel)"
          class="toestel-item"
        >
          {{ toestel.Ref }} - {{ toestel.type }} - {{ toestel.status }}
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
  toestellen: { type: Array, required: true },
})

const emit = defineEmits(['select', 'close'])

const search = ref('')

const gefilterdeToestellen = computed(() => {
  let lijst = props.toestellen

  if (search.value) {
    const query = search.value.toLowerCase()
    lijst = lijst.filter(
      (t) =>
        (t.Ref && t.Ref.toLowerCase().includes(query)) ||
        (t.type && t.type.toLowerCase().includes(query)) ||
        (t.status && t.status.toLowerCase().includes(query)),
    )
  }

  return lijst
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
  max-width: 450px;
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
  max-height: 420px; /* ongeveer 10 items zichtbaar */
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
  background-color: #f3f4f6;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  cursor: pointer;
  margin-top: 1rem;
}
</style>
