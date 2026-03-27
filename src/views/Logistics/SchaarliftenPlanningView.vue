<template>
  <div class="planning-page">
    <!-- Agenda met boekingen -->
    <SchaarliftenAgenda
      :boekingen="boekingen"
      :types="machineTypes"
      @openBoeking="openBoeking"
      @addBoeking="nieuweBoeking"
      @filterType="onFilterType" 
    />

    <!-- Verhuur drawer voor bestaande boeking -->
    <VerhuurDrawer
      v-if="showDrawer"
      :show="showDrawer"
      :verhuur="selectedVerhuur"
      :loading="loading"
      :error="error"
      @close="closeDrawer"
      @edit="updateVerhuur"
      @delete="onDelete"
    />

    <!-- Verhuur drawer voor nieuwe verhuur -->
    <AddVerhuurDrawer :show="showAddDrawer" :verhuur="selectedBoeking" :machineTypes="machineTypes" :werven="werven" :projectleiders="projectleiders" :error="error" @close="closeDrawer" @save="createVerhuur" @edit="updateVerhuur" @delete="deleteVerhuur" />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import SchaarliftenAgenda from '@/components/Logistics/Schaarliften/SchaarliftenAgenda.vue'
import VerhuurDrawer from '@/components/Logistics/Schaarliften/VerhuurDrawer.vue'

import { verhuurApi } from '@/api/verhuur.js'
import { schaarliftenApi } from '@/api/schaarliften.js'
import { werfApi } from '@/api/werf.js'
import { leiderApi } from '@/api/projectLeider.js'
import AddVerhuurDrawer from '@/components/Logistics/Schaarliften/AddVerhuurDrawer.vue'

// --- Reactive state ---
const boekingen = ref([])
const selectedVerhuur = ref(null)
const showDrawer = ref(false)
const showAddDrawer = ref(false)
const machineTypes = ref([])
const werven = ref([])
const projectleiders = ref([])
const error = ref('')
const loading = ref(false)
const filters = ref({
  type: ''
})// --- Load data ---
async function loadData() {
  try {
    loading.value = true

    const [typesRes, werfRes, plRes, boekingenRes] = await Promise.all([
      schaarliftenApi.getTypes(),
      werfApi.list(),
      leiderApi.list(),
      verhuurApi.list(filters.value) // ✅ volledig query object
    ])

    machineTypes.value = typesRes || []
    werven.value = werfRes || []
    projectleiders.value = plRes || []
    boekingen.value = boekingenRes || []

  } catch (err) {
    console.error('Fout bij laden data', err)
  } finally {
    loading.value = false
  }
}
function onFilterType(typeId) {
  filters.value.type = typeId
  loadData()
}
// --- Events ---
function openBoeking(id) {
  error.value = ''
  const boek = boekingen.value.find(b => b._id === id)
  if (boek) {
    selectedVerhuur.value = boek
    showDrawer.value = true
    showAddDrawer.value = false;
  }
}

function nieuweBoeking() {
  error.value = ''
  selectedVerhuur.value = null
  showAddDrawer.value = true
}

function closeDrawer() {
  showDrawer.value = false
  showAddDrawer.value = false;
  selectedVerhuur.value = null
  error.value = ''
}

function closeAddDrawer() {
  showAddDrawer.value = false
  error.value = ''
}

// --- CRUD ---
async function updateVerhuur(data) {
  try {
    error.value = ''
    await verhuurApi.update(data._id, cleanPayload(data))
    await loadData()
    closeDrawer()
  } catch (err) {
    error.value = JSON.parse(err?.response?.data?.message || err.message || 'Fout bij updaten')
    throw err
  }
}

async function onDelete(id) {
  try {
    error.value = ''
    await verhuurApi.remove(id)
    await loadData()
    closeDrawer()
  } catch (err) {
    error.value = JSON.parse(err?.response?.data?.message || err.message || 'Fout bij verwijderen')
  }
}

async function createVerhuur(data) {
  try {
    error.value = ''
    await verhuurApi.create(cleanPayload(data))
    await loadData()
    closeAddDrawer()
  } catch (err) {
    error.value = JSON.parse(err?.response?.data?.message || err.message || 'Fout bij aanmaken')
    throw err
  }
}

// --- Helper ---
function cleanPayload(v) {
  return {
    ...v,
    machineType: v.machineType?._id || v.machineType,
    werf: v.werf?._id || v.werf,
    projectleider: v.projectleider?._id || v.projectleider,
    toestel: v.toestel?._id || v.toestel || null,
  }
}

// --- Mount ---
onMounted(loadData)
</script>

<style scoped>
.planning-page {
  padding: 20px;
}
</style>