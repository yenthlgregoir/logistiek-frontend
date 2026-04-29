<template>
  <div class="planning-page">
    <h2>Planning {{ assetModel.toLowerCase() }}</h2>

    <!-- Agenda -->
    <VerhuurAgenda
      :boekingen="boekingen"
      :types="machineTypes"
      @openBoeking="openBoeking"
      @addBoeking="nieuweBoeking"
      @filterType="onFilterType"
    />

    <!-- Edit drawer -->
    <VerhuurDrawer
      v-if="showDrawer"
      :show="showDrawer"
      :verhuur="selectedVerhuur"
      :assets="machineTypes"
      :assetModel="assetModel"
      :werven="werven"
      :projectleiders="projectleiders"
      :entiteiten="entiteiten"
      :error="error"
      @close="closeDrawer"
      @edit="updateVerhuur"
      @delete="deleteVerhuur"
    />

    <!-- Create drawer -->
    <AddVerhuurDrawer
      v-if="showAddDrawer"
      :show="showAddDrawer"
      :verhuur="selectedBoeking"
      :assets="machineTypes"
      :assetModel="assetModel"
      :werven="werven"
      :projectleiders="projectleiders"
      :entiteiten="entiteiten"
      :error="error"
      :succes="saveSuccess"
      @close="closeAddDrawer"
      @save="createVerhuur"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'

import VerhuurAgenda from '@/components/Logistics/verhuur/VerhuurAgenda.vue'
import VerhuurDrawer from '@/components/Logistics/verhuur/VerhuurDrawer.vue'
import AddVerhuurDrawer from '@/components/Logistics/verhuur/AddVerhuurDrawer.vue'

import { verhuurApi } from '@/api/verhuur.js'
import { werfApi } from '@/api/werf.js'
import { leiderApi } from '@/api/projectLeider.js'
import { werfcontainerApi } from '@/api/werfcontainer'
import { entiteitApi } from '@/api/entiteit'

// 🔥 prop vanuit router
const props = defineProps({
  assetModel: {
    type: String,
    required: true,
  },
})

// --- state ---
const boekingen = ref([])
const selectedVerhuur = ref(null)
const selectedBoeking = ref(null)

const showDrawer = ref(false)
const showAddDrawer = ref(false)

const machineTypes = ref([])
const werven = ref([])
const projectleiders = ref([])
const entiteiten = ref([])

const error = ref('')
const loading = ref(false)
const saveSuccess = ref(false)

const filters = ref({
  type: '',
  assetModel: props.assetModel,
})

// --- reload bij route switch ---
watch(
  () => props.assetModel,
  async () => {
    filters.value.assetModel = props.assetModel
    await loadData()
  },
  { immediate: true },
)

// --- load data ---
async function loadData() {
  try {
    loading.value = true

    const [werfRes, plRes, boekingenRes] = await Promise.all([
      werfApi.list(),
      leiderApi.list(),
      verhuurApi.list(filters.value),
    ])

    // 🔥 types + extra data
    if (props.assetModel === 'WerfContainer') {
      machineTypes.value = await werfcontainerApi.getTypes()
      entiteiten.value = await entiteitApi.getEntiteiten()
    } else {
      machineTypes.value = [
        { type: 'Schaarlift', naam: 'Schaarlift' },
        { type: 'Knikarm', naam: 'Knikarm' },
      ]
      entiteiten.value = []
    }

    werven.value = werfRes || []
    projectleiders.value = plRes || []
    boekingen.value = boekingenRes || []
  } catch (err) {
    console.error('Fout bij laden data', err)
    error.value = 'Fout bij laden data'
  } finally {
    loading.value = false
  }
}

// --- filters ---
async function onFilterType(type) {
  filters.value.type = type.naam
  await loadData()
}

// --- open bestaande ---
function openBoeking(id) {
  error.value = ''
  const boek = boekingen.value.find((b) => b._id === id)

  if (boek) {
    selectedVerhuur.value = boek
    showDrawer.value = true
    showAddDrawer.value = false
  }
}

// --- nieuwe ---
function nieuweBoeking() {
  error.value = ''
  selectedBoeking.value = null
  showAddDrawer.value = true
  showDrawer.value = false
}

// --- close ---
function closeDrawer() {
  showDrawer.value = false
  selectedVerhuur.value = null
  error.value = ''
}

function closeAddDrawer() {
  showAddDrawer.value = false
  selectedBoeking.value = null
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
    saveSuccess.value = true
    closeAddDrawer()
  } catch (err) {
    error.value = parseApiError(err)
    saveSuccess.value = false
    throw err
  }
}

// --- helpers ---
function cleanPayload(v) {
  return {
    ...v,
    assetType: v.assetType,
    werf: v.werf?._id || v.werf,
    projectleider: v.projectleider?._id || v.projectleider,
    entiteit: v.entiteit?._id || v.entiteit,
    assetModel: v.assetModel || props.assetModel,
  }
}

function parseApiError(err) {
  try {
    return JSON.parse(err?.response?.data?.message || err.message || 'Fout bij API')
  } catch {
    return err.message || 'Fout bij API'
  }
}

// --- lifecycle ---
onMounted(loadData)
</script>

<style scoped>
.planning-page {
  padding: 20px;
}
</style>
