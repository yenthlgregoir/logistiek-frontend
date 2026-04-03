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
      :machineTypes="machineTypes"
      :werven="werven"
      :projectleiders="projectleiders"
      :error="error"
      :loading="loading"
      @close="closeDrawer"
      @edit="updateVerhuur"
      @delete="deleteVerhuur"
    />

    <!-- Verhuur drawer voor nieuwe boeking -->
    <AddVerhuurDrawer
      v-if="showAddDrawer"
      :show="showAddDrawer"
      :verhuur="selectedBoeking"
      :machineTypes="machineTypes"
      :werven="werven"
      :projectleiders="projectleiders"
      :error="error"
      @close="closeAddDrawer"
      @save="createVerhuur"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import SchaarliftenAgenda from '@/components/Logistics/Schaarliften/SchaarliftenAgenda.vue'
import VerhuurDrawer from '@/components/Logistics/Schaarliften/VerhuurDrawer.vue'
import AddVerhuurDrawer from '@/components/Logistics/Schaarliften/AddVerhuurDrawer.vue'

import { verhuurApi } from '@/api/verhuur.js'
import { schaarliftenApi } from '@/api/schaarliften.js'
import { werfApi } from '@/api/werf.js'
import { leiderApi } from '@/api/projectLeider.js'

// --- Reactive state ---
const boekingen = ref([])
const selectedVerhuur = ref(null)
const selectedBoeking = ref(null)
const showDrawer = ref(false)
const showAddDrawer = ref(false)
const machineTypes = ref([])
const werven = ref([])
const projectleiders = ref([])
const error = ref('')
const loading = ref(false)
const filters = ref({
  type: '',
})

// --- Computed helpers ---
const filteredBoekingen = computed(() => {
  if (!filters.value.type) return boekingen.value
  return boekingen.value.filter((b) => b.machineType?._id === filters.value.type)
})

// --- Load data ---
async function loadData() {
  try {
    loading.value = true
    const [typesRes, werfRes, plRes, boekingenRes] = await Promise.all([
      schaarliftenApi.getTypes(),
      werfApi.list(),
      leiderApi.list(),
      verhuurApi.list(filters.value),
    ])

    machineTypes.value = typesRes || []
    werven.value = werfRes || []
    projectleiders.value = plRes || []
    boekingen.value = Array.isArray(boekingenRes) ? boekingenRes : boekingenRes.data || []
  } catch (err) {
    console.error('Fout bij laden data', err)
    error.value = 'Fout bij laden data'
  } finally {
    loading.value = false
  }
}

// --- Filter ---
function onFilterType(typeId) {
  filters.value.type = typeId
  loadData()
}

// --- Drawer events ---
function openBoeking(id) {
  error.value = ''
  const boek = boekingen.value.find((b) => b._id === id)
  if (boek) {
    selectedVerhuur.value = boek
    showDrawer.value = true
    showAddDrawer.value = false
  }
}

function nieuweBoeking() {
  error.value = ''
  selectedBoeking.value = null
  showAddDrawer.value = true
  showDrawer.value = false
}

function closeDrawer() {
  showDrawer.value = false
  showAddDrawer.value = false
  selectedVerhuur.value = null
  selectedBoeking.value = null
  error.value = ''
}

function closeAddDrawer() {
  showAddDrawer.value = false
  selectedBoeking.value = null
  error.value = ''
}

// --- CRUD operations ---
async function updateVerhuur(data) {
  try {
    error.value = ''
    await verhuurApi.update(data._id, cleanPayload(data))
    await loadData()
    closeDrawer()
  } catch (err) {
    error.value = parseApiError(err)
    throw err
  }
}

async function deleteVerhuur(id) {
  try {
    error.value = ''
    await verhuurApi.remove(id)
    await loadData()
    closeDrawer()
  } catch (err) {
    error.value = parseApiError(err)
  }
}

async function createVerhuur(data) {
  try {
    error.value = ''
    await verhuurApi.create(cleanPayload(data))
    await loadData()
    closeAddDrawer()
  } catch (err) {
    error.value = parseApiError(err)
    throw err
  }
}

// --- Helpers ---
function cleanPayload(v) {
  return {
    ...v,
    machineType: v.machineType?._id || v.machineType,
    werf: v.werf?._id || v.werf,
    projectleider: v.projectleider?._id || v.projectleider,
    assetModel: v.assetModel?._id || v.assetModel || null,
  }
}

function parseApiError(err) {
  try {
    return JSON.parse(err?.response?.data?.message || err.message || 'Fout bij API')
  } catch {
    return err.message || 'Fout bij API'
  }
}

// --- Lifecycle ---
onMounted(loadData)
</script>

<style scoped>
.planning-page {
  padding: 20px;
}
</style>
