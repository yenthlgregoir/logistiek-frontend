<template>
  <BaseModal @close="close">
    <!-- HEADER -->
    <template #header>
      <h2>Kies Toestel</h2>
    </template>

    <!-- BODY -->
    <input type="text" v-model="search" placeholder="Zoek toestel..." class="search-input" />

    <ul class="toestel-list">
      <li
        v-for="toestel in gefilterdeToestellen"
        :key="toestel._id"
        @click="selectToestel(toestel)"
        class="toestel-item"
      >
        <div class="toestel-title">
          {{ toestel.Ref }}
        </div>
      </li>
    </ul>

    <!-- FOOTER -->
    <template #footer>
      <button class="btn-cancel" @click="close">Annuleren</button>
    </template>
  </BaseModal>
</template>

<script setup>
import { ref, computed } from 'vue'
import BaseModal from '@/components/base/BaseModal.vue'

const props = defineProps({
  toestellen: { type: Array, required: true },
})

const emit = defineEmits(['select', 'close'])

const search = ref('')

const gefilterdeToestellen = computed(() => {
  if (!search.value) return props.toestellen

  const q = search.value.toLowerCase()

  return props.toestellen.filter((t) => t.Ref?.toLowerCase().includes(q))
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
/* ✅ AL JE ORIGINELE CSS BLIJFT WERKEN */

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

/* =========================================
   TOESTELLEN LIST
========================================= */
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

/* High-end toestel card */
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

/* =========================================
   FOOTER
========================================= */
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
</style>
