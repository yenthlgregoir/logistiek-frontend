<template>
  <div class="agenda-parent-container">

    <BoekingList
      :boekingen="store.boekingen"
      :archief="true"
      @openBoeking="openBoekingModal"
      @addBoeking="showCreateModal = true"
      v-model:search="store.search"
      v-model:dateRange="store.dateRange"
    />

    <BoekingModal
      v-if="showBoekingModal"
      :boekingId="selectedBoekingId"
      @close="showBoekingModal = false"
      @update="() => store.loadBoekingen(true)"
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

// WATCH FILTERS
watch([() => store.search, () => store.dateRange], () => {
  
  store.setViewMode('archief')

  store.loadBoekingen(true) 
})

// MODAL FUNCTIONS
function openBoekingModal(boekingId) {
  selectedBoekingId.value = boekingId
  showBoekingModal.value = true
}

async function openVrijeToestellenModal(boekingId) {
  await store.openVrijeToestellen(boekingId)
  showVrijeToestellenModal.value = true
}

async function assignToestel(toestel) {
  await store.assignToestel(toestel)
  showVrijeToestellenModal.value = false
}

async function deleteBoeking(boekingId) {
  await store.deleteBoeking(boekingId)
  showBoekingModal.value = false
}

async function saveComment(boeking) {
  await store.saveComment(selectedBoekingId.value, boeking.comment)
  showBoekingModal.value = false
}

// INIT
onMounted(() => {
  store.setViewMode('archief')
  store.loadBoekingen(true)
  store.loadTypes()
})
</script>

<style scoped>
.agenda-parent-container {
  font-family: Arial, sans-serif;
  padding: 1rem;
}
</style>