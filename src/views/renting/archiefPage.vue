<template>
  <div class="agenda-parent-container">
    
    <!-- Loading -->
    <div v-if="store.loading.list">Laden...</div>

    <!-- Lijst -->
    <BoekingList
      v-else
      :boekingen="store.boekingen"
      :archief="true"
      v-model:search="store.search"
      v-model:dateRange="store.dateRange"
      @openBoeking="openBoekingModal"
      @addBoeking="showCreateModal = true"
    />

    <!-- Boeking modal -->
    <BoekingModal
      v-if="showBoekingModal"
      :boekingId="selectedBoekingId"
      @close="showBoekingModal = false"
      @update="store.loadBoekingen"
      @assignToestel="openVrijeToestellenModal"
      @verwijderen="deleteBoeking"
      @save="saveComment"
    />

    <!-- Vrije toestellen -->
    <VrijToestellenModal
      v-if="showVrijeToestellenModal"
      :toestellen="store.vrijeToestellen"
      @select="assignToestel"
      @close="showVrijeToestellenModal = false"
    />

  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { useDebounceFn } from '@vueuse/core'

import { useBoekingenStore } from '@/stores/renting/boekingen.store.js'

import BoekingModal from '@/components/renting/agenda/BoekingModal.vue'
import BoekingList from '@/components/renting/agenda/BoekingList.vue'
import VrijToestellenModal from '@/components/renting/agenda/VrijToestellenModal.vue'

// STORE
const store = useBoekingenStore()

// MODALS
const showCreateModal = ref(false)
const showBoekingModal = ref(false)
const showVrijeToestellenModal = ref(false)
const selectedBoekingId = ref(null)

// =========================
// ✅ WATCHERS (debounced)
// =========================
const reload = useDebounceFn(() => {
  store.loadBoekingen()
}, 300)

watch(
  [() => store.search, () => store.dateRange],
  reload
)

// =========================
// UI ACTIONS
// =========================
function openBoekingModal(id) {
  selectedBoekingId.value = id
  showBoekingModal.value = true
}

async function openVrijeToestellenModal(id) {
  selectedBoekingId.value = id
  await store.openVrijeToestellen(id)
  showVrijeToestellenModal.value = true
}

async function assignToestel(toestel) {
  await store.assignToestel(toestel)
  showVrijeToestellenModal.value = false
}

async function deleteBoeking() {
  await store.deleteBoeking()
  showBoekingModal.value = false
}

async function saveComment(payload) {
  await store.saveComment(selectedBoekingId.value, payload.comment)
  showBoekingModal.value = false
}

// =========================
// INIT
// =========================
onMounted(async () => {
  store.currentViewMode = 'archief'
  await store.loadBoekingen()
  await store.loadTypes()
})
</script>

<style scoped>
.agenda-parent-container {
  font-family: Arial, sans-serif;
  padding: 1rem;
}
</style>