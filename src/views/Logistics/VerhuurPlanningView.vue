<template>
  <div class="planning-page">
    <!-- HEADER -->
    <header class="page-header">
      <div>
        <span class="eyebrow">Logistiek · Verhuur</span>
        <h1>Planning {{ assetModel.toLowerCase() }}</h1>
      </div>

      <div class="stats">
        <div class="stat">
          <span class="stat__value">{{ stats.total }}</span>
          <span class="stat__label">Boekingen</span>
        </div>
        <div class="stat stat--active">
          <span class="stat__value">{{ stats.activeToday }}</span>
          <span class="stat__label">Actief vandaag</span>
        </div>
        <div class="stat stat--open">
          <span class="stat__value">{{ stats.openEnded }}</span>
          <span class="stat__label">Zonder einddatum</span>
        </div>
      </div>
    </header>

    <!-- FOUT BIJ LADEN -->
    <Transition name="fade">
      <div v-if="loadError" class="banner" role="alert">
        <span>{{ loadError }}</span>
        <button type="button" @click="loadData">Opnieuw proberen</button>
      </div>
    </Transition>

    <!-- Agenda (loading valt door naar AgendaComponent) -->
    <div class="agenda-panel">
      <VerhuurAgenda
      :boekingen="boekingen"
      :types="machineTypes"
      :loading="loading"
      @openBoeking="openBoeking"
      @addBoeking="nieuweBoeking"
      @filterType="onFilterType"
      />
    </div>

    <!-- Edit drawer -->
    <VerhuurDrawer
      v-if="showDrawer"
      :show="showDrawer"
      :verhuur="selectedVerhuur"
      :loading="loading"
      :assets="machineTypes"
      :assetModel="assetModel"
      :werven="werven"
      :projectleiders="projectleiders"
      :entiteiten="entiteiten"
      :error="error"
      @close="closeDrawer"
      @edit="updateVerhuur"
      @delete="deleteVerhuur"
      @assigned="onToestelAssigned"
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
import { ref, computed, watch } from 'vue'

import VerhuurAgenda from '@/components/Logistics/verhuur/VerhuurAgenda.vue'
import VerhuurDrawer from '@/components/Logistics/verhuur/VerhuurDrawer.vue'
import AddVerhuurDrawer from '@/components/Logistics/verhuur/AddVerhuurDrawer.vue'

import { verhuurApi } from '@/api/verhuur.js'
import { werfApi } from '@/api/werf.js'
import { leiderApi } from '@/api/projectLeider.js'
import { werfcontainerApi } from '@/api/werfcontainer'
import { entiteitApi } from '@/api/entiteit'

const props = defineProps({
  assetModel: { type: String, required: true },
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

const error = ref('') // fouten in drawers
const loadError = ref('') // fout bij laden pagina
const loading = ref(false)
const saveSuccess = ref(false)

const filters = ref({ type: '', assetModel: props.assetModel })

// --- stats ---
const stats = computed(() => {
  const now = new Date()
  let activeToday = 0
  let openEnded = 0
  for (const b of boekingen.value) {
    const start = new Date(b.leverDatum || b.beginDatum)
    const endRaw = b.ophaalDatum || b.eindDatum
    if (!endRaw) openEnded++
    const end = endRaw ? new Date(endRaw) : null
    if (start <= now && (!end || end >= now)) activeToday++
  }
  return { total: boekingen.value.length, activeToday, openEnded }
})

// --- laden bij (route)wissel; immediate vervangt onMounted ---
watch(
  () => props.assetModel,
  async () => {
    filters.value.assetModel = props.assetModel
    filters.value.type = ''
    await loadData()
  },
  { immediate: true },
)

async function loadData() {
  try {
    loading.value = true
    loadError.value = ''

    const isContainer = props.assetModel === 'WerfContainer'

    const [werfRes, plRes, boekingenRes, typesRes, entRes] = await Promise.all([
      werfApi.list(),
      leiderApi.list(),
      verhuurApi.list(filters.value),
      isContainer ? werfcontainerApi.getTypes() : null,
      isContainer ? entiteitApi.getEntiteiten() : null,
    ])

    machineTypes.value = isContainer
      ? typesRes?.data || []
      : [
          { type: 'Schaarlift', naam: 'Schaarlift' },
          { type: 'Knikarm', naam: 'Knikarm' },
        ]
    entiteiten.value = isContainer ? entRes?.data || [] : []

    werven.value = werfRes.data || []
    projectleiders.value = plRes.data || []
    boekingen.value = boekingenRes.data || []
  } catch (err) {
    console.error('Fout bij laden data', err)
    loadError.value = 'Kon de planning niet laden.'
  } finally {
    loading.value = false
  }
}

// --- filters ---
async function onFilterType(type) {
  filters.value.type = type?.naam || ''
  await loadData()
}

// --- open bestaande ---
function getBookingId(value) {
  if (value == null) return null
  return typeof value === 'object' ? value.id ?? value._id ?? null : value
}

function openBoeking(value) {
  error.value = ''
  const id = getBookingId(value)
  if (id == null || id === '') {
    loadError.value = 'De boeking kan niet geopend worden: het boeking-ID ontbreekt.'
    return
  }
  const boek = boekingen.value.find((booking) =>
    [booking?.id, booking?._id].some(candidate => candidate != null && String(candidate) === String(id)),
  )
  if (!boek) {
    loadError.value = 'Deze boeking staat niet meer in de geladen planning. Vernieuw de planning en probeer opnieuw.'
    return
  }
  loadError.value = ''
  selectedVerhuur.value = boek
  showAddDrawer.value = false
  showDrawer.value = true
}

// --- nieuwe ---
async function onToestelAssigned(verhuur) {
  const id = verhuur?.id ?? verhuur?._id
  const selectedId = selectedVerhuur.value?.id ?? selectedVerhuur.value?._id
  if (id != null && selectedId != null && String(id) === String(selectedId)) {
    selectedVerhuur.value = verhuur
  }
  await loadData()
}

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
    const id = getBookingId(data) ?? getBookingId(selectedVerhuur.value)
    if (id == null) throw new Error('Boeking-ID ontbreekt.')
    await verhuurApi.update(id, cleanPayload(data))
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
    projectleider: v.projectleider?.id || v.projectleider,
    entiteit: v.entiteit?.id || v.entiteit,
    assetModel: v.assetModel || props.assetModel,
  }
}

function parseApiError(err) {
  try {
    return JSON.parse(err?.response?.data?.message || err.message || 'Fout bij API')
  } catch {
    return err?.response?.data?.message || err.message || 'Fout bij API'
  }
}
</script>

<style scoped>
.planning-page {
  box-sizing: border-box;
  width: 100%;
  max-width: 100%;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 28px 32px;
  min-height: 100%;
  background:
    radial-gradient(900px circle at 100% -10%, rgba(90, 137, 255, 0.1), transparent 60%),
    #f5f7fb;
  font-family: 'Inter', system-ui, sans-serif;
  color: #0f172a;
}

/* Laat de brede tijdlijn binnen de beschikbare flex-/gridbreedte krimpen. */
.agenda-panel {
  width: 100%;
  max-width: 100%;
  min-width: 0;
}

.agenda-panel > :deep(*) {
  box-sizing: border-box;
  min-width: 0;
  max-width: 100%;
}

.agenda-panel :deep(.agenda-container) {
  box-sizing: border-box;
  width: 100%;
  max-width: 100%;
  min-width: 0;
}

/* Eén horizontale scroll in de agenda; verticaal scrollt de pagina. */
.agenda-panel :deep(.agenda-scroll) {
  min-width: 0;
  max-width: 100%;
  max-height: none;
  overflow-x: auto;
  overflow-y: hidden;
}

.page-header {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  justify-content: space-between;
  gap: 20px;
}

.eyebrow {
  display: block;
  margin-bottom: 6px;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #3553f2;
}

h1 {
  margin: 0;
  font-size: 28px;
  font-weight: 700;
  letter-spacing: -0.02em;
}
h1::first-letter {
  text-transform: uppercase;
}

.stats {
  display: flex;
  gap: 10px;
}
.stat {
  display: flex;
  flex-direction: column;
  min-width: 120px;
  padding: 12px 16px;
  background: #fff;
  border: 1px solid #e6eaf2;
  border-radius: 14px;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
}
.stat__value {
  font-size: 22px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}
.stat__label {
  font-size: 12px;
  color: #64748b;
}
.stat--active .stat__value {
  color: #16a34a;
}
.stat--open .stat__value {
  color: #ea580c;
}

.banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 16px;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 12px;
  color: #b91c1c;
  font-size: 14px;
}
.banner button {
  border: 0;
  background: none;
  color: inherit;
  font: inherit;
  font-weight: 600;
  text-decoration: underline;
  cursor: pointer;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 200ms ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

@media (max-width: 768px) {
  .planning-page {
    padding: 20px 16px;
  }
  .stats {
    width: 100%;
  }
  .stat {
    flex: 1;
    min-width: 0;
  }
}
</style>
