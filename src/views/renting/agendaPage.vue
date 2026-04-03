<template>
  <div class="page-content">
    <div class="agenda-parent-container">
      
      <!-- Agenda -->
      <Agenda
        v-if="showAgenda"
        :boekingen="store.boekingen"
        @openBoeking="openBoekingModal"
        @addBoeking="showCreateModal = true"
      />

      <!-- Lijst -->
      <BoekingList
        v-else
        :boekingen="store.boekingen"
        v-model:search="store.search"
        v-model:dateRange="store.dateRange"
        @openBoeking="openBoekingModal"
        @addBoeking="showCreateModal = true"
      />

      <!-- Modals -->
      <CreateBoekingModal
        v-if="showCreateModal"
        :types="store.types"
        @close="showCreateModal = false"
        @update="store.loadBoekingen"
      />

      <BoekingModal
        v-if="showBoekingModal"
        :boekingId="selectedBoekingId"
        @close="showBoekingModal = false"
        @update="store.loadBoekingen"
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
  </div>
</template>
<script setup>
import { ref, onMounted, watch, computed } from 'vue'
import { useRoute } from 'vue-router'
import { useBoekingenStore } from '@/stores/renting/boekingen.store.js'

import Agenda from '@/components/renting/agenda/AgendaComponent.vue'
import BoekingList from '@/components/renting/agenda/BoekingList.vue'
import CreateBoekingModal from '@/components/renting/agenda/CreateBoekingModal.vue'
import BoekingModal from '@/components/renting/agenda/BoekingModal.vue'
import VrijToestellenModal from '@/components/renting/agenda/VrijToestellenModal.vue'

// STORE
const store = useBoekingenStore()

// ROUTE bepaalt view
const route = useRoute()
const showAgenda = computed(() => route.path.includes('/planning'))

// MODALS
const showCreateModal = ref(false)
const showBoekingModal = ref(false)
const showVrijeToestellenModal = ref(false)
const selectedBoekingId = ref(null)

// WATCHERS
watch([() => store.search, () => store.dateRange], () => {
  store.loadBoekingen()
})

watch(() => showAgenda.value, (newVal) => {
  if (newVal) {
    store.search = ''
    store.dateRange = [null, null]
  }
  store.loadBoekingen()
})

// MODAL FUNCTIONS
function openBoekingModal(id) {
  selectedBoekingId.value = id
  showBoekingModal.value = true
}

async function openVrijeToestellenModal(id) {
  await store.openVrijeToestellen(id)
  showVrijeToestellenModal.value = true
}

async function assignToestel(toestel) {
  await store.assignToestel(toestel)
  showVrijeToestellenModal.value = false
  showBoekingModal.value = false
}

async function deleteBoeking(id) {
  await store.deleteBoeking(id)
  await store.loadBoekingen();
  showBoekingModal.value = false
}

async function saveComment(boeking) {
  await store.saveComment(selectedBoekingId.value, boeking.comment)
  showBoekingModal.value = false
}

// INIT
onMounted(() => {
  store.loadBoekingen()
  store.loadTypes()
})
</script>

<style scoped>
.agenda-parent-container {
  font-family: Arial, sans-serif;
  padding: 1rem;
}
</style>