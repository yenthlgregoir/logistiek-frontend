<template>
  <div class="agenda-parent-container">
    <h1>Archief</h1>

    <!-- Lijst -->
    <BoekingList
      :boekingen="store.boekingen"
      v-model:search="store.search"
      v-model:dateRange="store.dateRange"
      @openBoeking="openBoekingModal"
      @addBoeking="openCreateModal"
    />

  

    <!-- Detail -->
    <BoekingModal
      v-if="showBoekingModal"
      :boekingId="selectedBoekingId"
      @close="showBoekingModal = false"
      @update="refreshBoekingen"
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
import { ref, watch, onMounted } from 'vue'
import { useDebounceFn } from '@vueuse/core'

import { useBoekingenStore } from '@/stores/renting/boekingen.store.js'

import BoekingList from '@/components/renting/agenda/BoekingList.vue'
import BoekingModal from '@/components/renting/agenda/BoekingModal.vue'
import VrijToestellenModal from '@/components/renting/agenda/VrijToestellenModal.vue'

const store = useBoekingenStore()

// MODALS
const showCreateModal = ref(false)
const showBoekingModal = ref(false)
const showVrijeToestellenModal = ref(false)
const selectedBoekingId = ref(null)

/**
 * ✅ ONLY ONE RELOAD SOURCE (BELANGRIJK)
 * Geen dubbele loadBoekingen calls meer
 */
const reload = useDebounceFn(() => {
  store.loadBoekingen()
}, 300)

/**
 * FIX: wacht op UI state changes
 */
watch(
  () => [store.search, store.dateRange],
  () => {
    reload()
  },
  { deep: true }
)

/**
 * TYPE FILTER (archief gebruikt dit niet, maar safe)
 */
function openBoekingModal(id) {
  selectedBoekingId.value = id
  showBoekingModal.value = true
}

function openCreateModal() {
  showCreateModal.value = true
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

async function refreshBoekingen() {
  await store.loadBoekingen()
}

/**
 * INIT ARCHIEF
 */
onMounted(async () => {
  store.currentViewMode = 'archief'

  // ❗ BELANGRIJK: geen resetFilters hier!
  await store.loadBoekingen()
  await store.loadTypes()
})
</script>

<style scoped>
.agenda-parent-container {
  font-family: Arial, sans-serif;
  padding: 1rem;
  width: 100%;
}
</style>