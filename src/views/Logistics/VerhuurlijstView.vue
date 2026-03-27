<template>
  <div class="planning-page">
    <!-- ====================== -->
    <!--  SCHAARELIFTEN LIST -->
    <!-- ====================== -->
    <VerhuurLijst
      :verhuringen="verhuringen"
      @openVerhuur="openVerhuur"
      @update:search="updateSearch"
      @update:dateRange="updateDateRange"
    />

    <!-- ====================== -->
    <!--  DRAWER -->
    <!-- ====================== -->
    <VerhuurDrawer
      :show="showDrawer"
      :verhuur="selectedVerhuur"
      :loading="loading"
      :error="error"
      @close="closeDrawer"
      @edit="updateVerhuur"
      @delete="onDelete"
    />
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import VerhuurLijst from '@/components/Logistics/Schaarliften/VerhuurLijst.vue'
import VerhuurDrawer from '@/components/Logistics/Schaarliften/VerhuurDrawer.vue'
import { verhuurApi } from '@/api/verhuur.js'
import { werfApi } from '@/api/werf.js'
import { leiderApi } from '@/api/projectLeider.js'
import { schaarliftenApi } from '@/api/schaarliften.js'

/* ---------------- STATE ---------------- */
const allVerhuringen = ref([]) // 🔥 originele data
const selectedVerhuur = ref(null)
const showDrawer = ref(false)

const machineTypes = ref([])
const werven = ref([])
const projectleiders = ref([])

const error = ref('')
const search = ref('')
const dateRange = ref([null, null])
const loading = ref(false)

/* ---------------- INIT ---------------- */
async function loadData() {
  try {
    loading.value = true

    const [typesRes, werfRes, plRes, verhuringenRes] = await Promise.all([
      schaarliftenApi.getTypes(),
      werfApi.list(),
      leiderApi.list(),
      verhuurApi.list() // 🔥 geen filters hier
    ])

    machineTypes.value = typesRes || []
    werven.value = werfRes || []
    projectleiders.value = plRes || []
    allVerhuringen.value = verhuringenRes || []

  } catch (err) {
    console.error(err)
  } finally {
    loading.value = false
  }
}

loadData()

/* ---------------- FILTER (computed) ---------------- */
const verhuringen = computed(() => {
  let data = allVerhuringen.value

  // 🔍 SEARCH
  if (search.value) {
    const term = search.value.toLowerCase()
    data = data.filter(v =>
      v.reference?.toLowerCase().includes(term) ||
      v.machineType?.naam?.toLowerCase().includes(term) ||
      v.werf?.naam?.toLowerCase().includes(term)
    )
  }

  // 📅 DATUM FILTER
  if (dateRange.value[0] && dateRange.value[1]) {
    const [start, end] = dateRange.value
    data = data.filter(v => {
      const begin = new Date(v.leverDatum)
      const eind = v.ophaalDatum ? new Date(v.ophaalDatum) : new Date()

      return eind >= new Date(start) && begin <= new Date(end)
    })
  }

  return data
})

/* ---------------- EVENTS ---------------- */
function openVerhuur(id) {
  selectedVerhuur.value = allVerhuringen.value.find(v => v._id === id) || null
  showDrawer.value = true
  error.value = ''
}

function closeDrawer() {
  showDrawer.value = false
  selectedVerhuur.value = null
  error.value = ''
}

function updateSearch(val) {
  search.value = val
}

function updateDateRange(val) {
  dateRange.value = val
}

/* ---------------- CRUD ---------------- */
async function updateVerhuur(data) {
  error.value = ''
  try {
    loading.value = true
    await verhuurApi.update(data._id, cleanPayload(data))
    await loadData()
    closeDrawer()
  } catch (err) {
    error.value = err?.message || 'Er ging iets mis bij updaten'
  } finally {
    loading.value = false
  }
}

async function onDelete() {
  if (!selectedVerhuur.value) return
  error.value = ''
  try {
    loading.value = true
    await verhuurApi.remove(selectedVerhuur.value._id)
    await loadData()
    closeDrawer()
  } catch (err) {
    error.value = err?.message || 'Er ging iets mis bij verwijderen'
  } finally {
    loading.value = false
  }
}

/* ---------------- HELPERS ---------------- */
function cleanPayload(v) {
  return {
    ...v,
    machineType: v.machineType?._id || v.machineType,
    werf: v.werf?._id || v.werf,
    projectleider: v.projectleider?._id || v.projectleider,
  }
}
</script>

<style scoped>
.planning-page {
  padding: 20px;
}
</style>