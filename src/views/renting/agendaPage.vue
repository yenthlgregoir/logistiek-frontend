<template>
  <div class="page-content">
    <div class="agenda-parent-container">
      <h1>Planning</h1>

      <!-- Agenda -->
      <Agenda
        v-if="showAgenda"
        :items="toestellen"
        :bookings="store.filteredBoekingen"
        :typeOptions="store.types"
        item-label="Toestel"
        :get-item-id="(t) => t.id"
        :get-booking-start="(b) => new Date(b.beginDatum)"
        :get-booking-end="(b) => new Date(b.eindDatum)"
        :get-booking-title="(b) => b.leverAdresDetails?.naam || b.klant?.naam"
        @addBoeking="openCreateModal"
        @openBoeking="openBoekingModal"
        @filterType="onFilterType"
      />

      <!-- Lijst -->
      <BoekingList
        v-else
        :boekingen="store.boekingen"
        v-model:search="store.search"
        v-model:dateRange="store.dateRange"
        v-model:klant="store.selectedKlant"
        v-model:status="store.selectedStatus"
        v-model:type="store.selectedType"
        @openBoeking="openBoekingModal"
        @addBoeking="openCreateModal"
      />

      <!-- Create -->
      <CreateBoekingModal
        v-if="showCreateModal"
        :types="store.types"
        @close="showCreateModal = false"
        @update="handleBoekingCreated"
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
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useDebounceFn } from '@vueuse/core'

import { useBoekingenStore } from '@/stores/renting/boekingen.store.js'

import Agenda from '@/components/agenda/AgendaComponent.vue'
import BoekingList from '@/components/renting/agenda/BoekingList.vue'
import CreateBoekingModal from '@/components/renting/agenda/CreateBoekingModal.vue'
import BoekingModal from '@/components/renting/agenda/BoekingModal.vue'
import VrijToestellenModal from '@/components/renting/agenda/VrijToestellenModal.vue'

// =========================
// STORE + ROUTE
// =========================
const store = useBoekingenStore()
const route = useRoute()
const router = useRouter()

const showAgenda = computed(() => route.path.includes('/planning'))

// =========================
// STATE
// =========================
const showCreateModal = ref(false)
const showBoekingModal = ref(false)
const showVrijeToestellenModal = ref(false)
const selectedBoekingId = ref(null)

// =========================
// COMPUTED
// =========================
const toestellen = computed(() => {
  const map = new Map()

  store.filteredBoekingen.forEach((b) => {
    if (b.toestel?.id) {
      map.set(b.toestel.id, b.toestel)
    }
  })

  return [...map.values()]
})

// =========================
// FILTER HANDLING
// =========================
function onFilterType(type) {
  store.setType(type)
  store.loadBoekingen()
}

/** Alle filters leeg, inclusief de chips uit BoekingList. */
function resetAllFilters() {
  store.resetFilters()
  store.selectedKlant = null
  store.selectedStatus = null
  store.selectedType = null
  store.dateRange = [null, null]
}

// =========================
// FILTER RELOAD (search, periode + chips)
// =========================
const reload = useDebounceFn(() => {
  store.loadBoekingen()
}, 300)

watch(
  () => [
    store.search,
    store.dateRange,
    store.selectedKlant,
    store.selectedStatus,
    store.selectedType,
  ],
  () => reload(),
  { deep: true }
)

// =========================
// RESET WHEN SWITCHING VIEW
// =========================
watch(showAgenda, () => {
  resetAllFilters()
  store.loadBoekingen()
})

// =========================
// UI ACTIONS
// =========================
function openCreateModal() {
  showCreateModal.value = true
}

function handleBoekingCreated(booking) {
  openBoekingModal(booking.id ?? booking._id)
}

function openBoekingModal(id) {
  selectedBoekingId.value = id
  showBoekingModal.value = true
}

watch(() => route.query.boeking, id => {
  if (typeof id === 'string' && id) openBoekingModal(id)
}, { immediate: true })
watch(showBoekingModal, open => {
  if (!open && route.query.boeking) {
    const query = { ...route.query }; delete query.boeking
    router.replace({ query })
  }
})

async function openVrijeToestellenModal(id) {
  selectedBoekingId.value = id
  await store.openVrijeToestellen(id)
  showVrijeToestellenModal.value = true
}

function closeModals() {
  showCreateModal.value = false
  showBoekingModal.value = false
  showVrijeToestellenModal.value = false
}

// =========================
// STORE ACTION WRAPPERS
// =========================
async function refreshBoekingen() {
  await store.loadBoekingen()
}

async function assignToestel(toestel) {
  await store.assignToestel(toestel)
  closeModals()
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
  store.currentViewMode = 'actief'
  resetAllFilters()
  await store.loadBoekingen()
  await store.loadTypes()
})
</script>

<style scoped>
.agenda-parent-container {
  font-family: Arial, sans-serif;
  padding: 1rem;
  margin: 0 auto;
  width: 100%;
}

@media (max-width: 768px) {
  .agenda-parent-container {
    padding: 0.5rem;
  }
}
</style>
