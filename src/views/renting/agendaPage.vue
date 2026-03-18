<template>
  <div class="page-content">
    <div class="agenda-parent-container">
      
      <!-- Agenda -->
      <Agenda
        v-if="showAgenda"
        :boekingen="boekingen"
        @openBoeking="openBoekingModal"
        @addBoeking="openCreateModal"
      />

      <!-- Lijst -->
      <BoekingList
        v-else
        :boekingen="boekingen"
        v-model:search="search"
        v-model:dateRange="dateRange"
        @openBoeking="openBoekingModal"
        @addBoeking="openCreateModal"
        @update:search="search = $event"
        @update:dateRange="dateRange = $event"
      />

      <!-- Modals -->
      <CreateBoekingModal
        v-if="showCreateModal"
        :types="types"
        @close="closeBoekingModal"
        @update="loadBoekingen"
      />

      <BoekingModal
        v-if="showBoekingModal"
        :boekingId="selectedBoekingId"
        @close="showBoekingModal = false"
        @update="loadBoekingen"
        @assignToestel="openVrijeToestellenModal"
        @verwijderen="deleteBoeking"
        @save="saveComment"
      />

      <VrijToestellenModal
        v-if="showVrijeToestellenModal"
        :toestellen="vrijeToestellen"
        @select="assignToestel"
        @close="showVrijeToestellenModal = false"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, computed } from 'vue'
import { useRoute } from 'vue-router'

import Agenda from '@/components/renting/agenda/AgendaComponent.vue'
import BoekingList from '@/components/renting/agenda/BoekingList.vue'
import CreateBoekingModal from '@/components/renting/agenda/CreateBoekingModal.vue'
import BoekingModal from '@/components/renting/agenda/BoekingModal.vue'
import VrijToestellenModal from '@/components/renting/agenda/VrijToestellenModal.vue'

import { boekingApi } from '@/api/boeking'
import { toestelApi } from '@/api/toestel'

const route = useRoute()

// 🔥 ROUTE bepaalt view
const showAgenda = computed(() => {
  return route.path.includes('/planning')
})

// STATE
const showCreateModal = ref(false)
const showBoekingModal = ref(false)
const showVrijeToestellenModal = ref(false)
const selectedBoekingId = ref(null)
const huidigeBoekingId = ref(null)

const vrijeToestellen = ref([])
const boekingen = ref([])
const types = ref([])

const search = ref('')
const dateRange = ref([null, null])

// 🔥 FILTER WATCH (ongewijzigd)
watch([search, dateRange], () => {
  loadBoekingen()
})

// 🔥 BELANGRIJK: reageer op switch tussen planning/lijst
watch(() => showAgenda.value, (newVal) => {
  if (newVal) {
    search.value = ''
    dateRange.value = [null, null]
  }
  loadBoekingen()
})

// API
async function loadBoekingen() {
  try {
    const res = await boekingApi.list({
      search: search.value,
      startDatum: dateRange.value[0],
      eindDatum: dateRange.value[1],
      archief: false
    })
    boekingen.value = res
  } catch (err) {
    console.log(err)
  }
}

async function loadTypes() {
  try {
    const res = await toestelApi.getTypes()
    types.value = res.types || []
  } catch (err) {
    console.log(err)
  }
}

// MODALS
function openBoekingModal(id) {
  selectedBoekingId.value = id
  showBoekingModal.value = true
}

function openCreateModal() {
  showCreateModal.value = true
}

function closeBoekingModal() {
  showCreateModal.value = false
}

async function openVrijeToestellenModal(id) {
  const boeking = boekingen.value.find(b => b._id === id)
  if (!boeking) return

  huidigeBoekingId.value = id

  vrijeToestellen.value = await boekingApi.vrijeToestellen({
    beginDatum: boeking.beginDatum,
    eindDatum: boeking.eindDatum,
    toestelType: boeking.toestelType?._id,
  })

  showVrijeToestellenModal.value = true
}

async function assignToestel(toestel) {
  if (!huidigeBoekingId.value) return

  await boekingApi.assignToestel(huidigeBoekingId.value, toestel._id)

  const refreshed = await boekingApi.get(huidigeBoekingId.value)
  const index = boekingen.value.findIndex(b => b._id === huidigeBoekingId.value)

  if (index !== -1) {
    boekingen.value[index] = refreshed
  }

  showVrijeToestellenModal.value = false
  showBoekingModal.value = false
}

async function deleteBoeking(id) {
  await boekingApi.remove(id)
  loadBoekingen()
  showBoekingModal.value = false
}

async function saveComment(boeking) {
  await boekingApi.update(selectedBoekingId.value, {
    comment: boeking.value.comment
  })

  const refreshed = await boekingApi.get(selectedBoekingId.value)
  const index = boekingen.value.findIndex(b => b._id === selectedBoekingId.value)

  if (index !== -1) {
    boekingen.value[index] = refreshed
  }

  showBoekingModal.value = false
}

// INIT
onMounted(() => {
  loadBoekingen()
  loadTypes()
})
</script>

<style scoped>

.agenda-parent-container {
  font-family: Arial, sans-serif;
  padding: 1rem;
}
</style>