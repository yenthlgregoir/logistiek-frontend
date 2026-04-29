<template>
  <div class="agenda-parent-container">
    <h1>Archief</h1>

    <BoekingList
      :boekingen="store.boekingen"
      v-model:search="store.search"
      v-model:dateRange="store.dateRange"
      @openBoeking="openBoekingModal"
      @addBoeking="openCreateModal"
    />

    <BoekingModal
      v-if="showBoekingModal"
      :boekingId="selectedBoekingId"
      @close="showBoekingModal = false"
      @update="refreshBoekingen"
      @assignToestel="openVrijeToestellenModal"
      @verwijderen="deleteBoeking"
      @save="saveComment"
    />

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

import BoekingList from '@/components/renting/agenda/BoekingList.vue'
import BoekingModal from '@/components/renting/agenda/BoekingModal.vue'
import VrijToestellenModal from '@/components/renting/agenda/VrijToestellenModal.vue'

const store = useBoekingenStore()

const showBoekingModal = ref(false)
const showVrijeToestellenModal = ref(false)
const selectedBoekingId = ref(null)

/**
 * 🔥 SINGLE SOURCE OF TRUTH FOR LOAD
 */
const reload = useDebounceFn(() => {
  store.resetFilters()
  store.loadBoekingen()
}, 250)

/**
 * ⚠️ ONLY WATCH FILTERS, NOT MANUAL LOADS ANYWHERE ELSE
 */
watch(
  () => [store.search, store.dateRange],
  () => {
    reload()
  },
  { deep: true },
)

/**
 * MODALS
 */
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

/**
 * INIT
 */
onMounted(async () => {
  // ❌ NIET meer loadBoekingen dubbel callen
  store.resetFilters()
  store.currentViewMode = 'archief'

  await store.loadTypes()
  await store.loadBoekingen()
})
</script>

<style scoped>
.agenda-parent-container {
  font-family: Arial, sans-serif;
  padding: 1rem;
  width: 100%;
}
</style>
