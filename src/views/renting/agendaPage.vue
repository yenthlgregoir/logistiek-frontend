<template>
  <div class="page-content">
    <div class="agenda-parent-container">
      <h1>Planning</h1>

      <!-- Loading -->
      <div v-if="store.loading.list" class="loading-screen">
  <div class="loader-card">
    <div class="spinner"></div>
    <h2>Planning laden</h2>
    <p>Even geduld, we halen de data op...</p>
  </div>
</div>
      <!-- Agenda -->
      <Agenda
        v-else-if="showAgenda"
        :items="toestellen"
        :bookings="bookingsWithToestel"
        :typeOptions="store.types"
        item-label="Toestel"
        :get-item-id="t => t._id"
        :get-booking-start="b => new Date(b.beginDatum)"
        :get-booking-end="b => new Date(b.eindDatum)"
        :get-booking-title="b => b.leverAdresDetails?.naam || b.klant?.naam"
        @addBoeking="showCreateModal = true"
        @openBoeking="openBoekingModal"
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
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useDebounceFn } from '@vueuse/core'

import { useBoekingenStore } from '@/stores/renting/boekingen.store.js'

import Agenda from '@/components/agenda/AgendaComponent.vue'
import BoekingList from '@/components/renting/agenda/BoekingList.vue'
import CreateBoekingModal from '@/components/renting/agenda/CreateBoekingModal.vue'
import BoekingModal from '@/components/renting/agenda/BoekingModal.vue'
import VrijToestellenModal from '@/components/renting/agenda/VrijToestellenModal.vue'

// STORE
const store = useBoekingenStore()

// ROUTE
const route = useRoute()
const showAgenda = computed(() => route.path.includes('/planning'))

// MODALS
const showCreateModal = ref(false)
const showBoekingModal = ref(false)
const showVrijeToestellenModal = ref(false)
const selectedBoekingId = ref(null)


const bookingsWithToestel = computed(() =>
  store.boekingen.filter(b => b.toestel)
)

const toestellen = computed(() =>
  bookingsWithToestel.value.map(b => b.toestel)
)

const reload = useDebounceFn(() => {
  store.loadBoekingen()
}, 300)

watch(
  [() => store.search, () => store.dateRange],
  reload
)

watch(showAgenda, (val) => {
  if (val) {
    store.search = ''
    store.dateRange = [null, null]
  }
})

// =========================
// UI ACTIONS ONLY
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

function closeModals() {
  showVrijeToestellenModal.value = false
  showBoekingModal.value = false
}

// =========================
// INIT
// =========================
onMounted(async () => {
  store.currentViewMode = 'actief'
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


.loading-screen {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  animation: fadeIn 0.3s ease;
}

.loader-card {
  background: white;
  padding: 2.5rem 3rem;
  border-radius: 18px;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.08);
  text-align: center;
  width: 280px;
  animation: float 1.5s ease-in-out infinite;
}

.loader-card h2 {
  margin: 1rem 0 0.5rem;
  font-size: 1.3rem;
  color: #1f2a44;
}

.loader-card p {
  font-size: 0.9rem;
  color: #6b7280;
}

/* SPINNER */
.spinner {
  width: 48px;
  height: 48px;
  border: 4px solid #e5e7eb;
  border-top: 4px solid #3b82f6;
  border-radius: 50%;
  margin: 0 auto;
  animation: spin 0.9s linear infinite;
}

/* ANIMATIONS */
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@keyframes float {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-6px);
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
</style>