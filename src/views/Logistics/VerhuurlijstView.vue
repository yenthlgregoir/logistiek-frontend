<template>
  <div class="planning-page">
    <h2>Verhuringen {{ assetType.toLowerCase() }}</h2>
    <div v-if="loadError" class="load-error" role="alert"><span>{{ loadError }}</span><button type="button" :disabled="loading" @click="loadData">Opnieuw proberen</button></div>
    <p v-if="loadingData" class="loading-note" role="status">Verhuringen laden…</p>
    <VerhuurLijst
      :verhuringen="verhuringen" v-model:search="search" v-model:date-range="dateRange" v-model:status="statusFilter"
      :sort-by="sortBy" :sort-direction="sortDirection"
      @openVerhuur="openVerhuur" @sort-change="updateSort"
    />
    <VerhuurDrawer :show="showDrawer" :verhuur="selectedVerhuur" :loading="loading" :error="error"
      @close="closeDrawer" @edit="updateVerhuur" @delete="onDelete" @assigned="onAssigned" />
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import VerhuurLijst from '@/components/Logistics/verhuur/VerhuurLijst.vue'
import VerhuurDrawer from '@/components/Logistics/verhuur/VerhuurDrawer.vue'
import { verhuurApi } from '@/api/verhuur.js'

const props = defineProps({ assetType: { type: String, required: true } })
const route = useRoute(), router = useRouter()
const allVerhuringen = ref([])
const selectedVerhuur = ref(null)
const showDrawer = ref(false)
const error = ref('')
const loadError = ref('')
const loadingData = ref(false)
const saving = ref(false)
const loading = computed(() => loadingData.value || saving.value)
const search = ref('')
const dateRange = ref([null, null])
const statusFilter = ref('')
const sortBy = ref('asset')
const sortDirection = ref('asc')
const sortKeys = new Set(['reference', 'asset', 'address', 'period', 'status'])
const statusOrder = new Map(['AANGEVRAAGD', 'BEVESTIGD', 'LEVEREN', 'GELEVERD', 'OPGEHAALD', 'AFGEWERKT'].map((value, index) => [value, index]))
const collator = new Intl.Collator('nl-BE', { numeric: true, sensitivity: 'base' })
let loadRequest = 0
let contextVersion = 0
let linkedRequest = 0

function entityId(value) { return value && typeof value === 'object' ? value.id ?? value._id ?? null : value ?? null }
function normalize(value) { return String(value ?? '').normalize('NFD').replace(/\p{Diacritic}/gu, '').toLocaleLowerCase('nl').trim() }
function calendarDay(value) {
  if (value == null || value === '') return null
  if (typeof value === 'string') {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
    if (match) {
      const [, year, month, day] = match.map(Number)
      const date = new Date(0)
      date.setUTCFullYear(year, month - 1, day)
      date.setUTCHours(0, 0, 0, 0)
      return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day ? date.getTime() / 86400000 : null
    }
  }
  if (!(value instanceof Date) && typeof value !== 'string' && typeof value !== 'number') return null
  const date = new Date(value)
  if (!Number.isFinite(date.getTime())) return null
  const result = new Date(0)
  result.setUTCFullYear(date.getFullYear(), date.getMonth(), date.getDate())
  result.setUTCHours(0, 0, 0, 0)
  return result.getTime() / 86400000
}

// Zoekvelden en datums één keer voorbereiden per wijziging in de brondata.
const indexedVerhuringen = computed(() => (allVerhuringen.value ?? []).filter(Boolean).map((item, index) => {
  const adres = item.werf?.adres
  const address = [item.werf?.naam, adres?.straat, adres?.huisnummer, adres?.postcode, adres?.gemeente].filter(value => value != null && value !== '').join(' ')
  const status = String(item.status ?? '').trim().toUpperCase()
  return {
    item, index, status,
    start: calendarDay(item.leverDatum),
    end: item.ophaalDatum == null || item.ophaalDatum === '' ? Infinity : calendarDay(item.ophaalDatum),
    searchText: normalize([item.reference, item.asset?.nummer, item.asset?.machineType?.naam, item.machineType?.naam, address].join(' ')),
    sort: { reference: item.reference || null, asset: item.asset?.nummer ?? null, address: address || null, status: statusOrder.get(status) ?? null },
  }
}))
const verhuringen = computed(() => {
  const terms = normalize(search.value).split(/\s+/).filter(Boolean)
  const status = String(statusFilter.value || '').toUpperCase()
  const start = calendarDay(dateRange.value?.[0])
  const end = calendarDay(dateRange.value?.[1])
  const hasPeriod = start !== null && end !== null
  const data = indexedVerhuringen.value.filter(entry => {
    if (terms.some(term => !entry.searchText.includes(term))) return false
    if (status && entry.status !== status) return false
    if (hasPeriod && (entry.start === null || entry.end === null || entry.end < entry.start || entry.start > end || entry.end < start)) return false
    return true
  })
  const direction = sortDirection.value === 'asc' ? 1 : -1
  return data.sort((a, b) => {
    const left = sortBy.value === 'period' ? a.start : a.sort[sortBy.value]
    const right = sortBy.value === 'period' ? b.start : b.sort[sortBy.value]
    // Ontbrekende waarden blijven onderaan, ook bij aflopend sorteren.
    if (left == null && right == null) return a.index - b.index
    if (left == null) return 1
    if (right == null) return -1
    const result = typeof left === 'number' && typeof right === 'number' ? left - right : collator.compare(String(left), String(right))
    return result * direction || a.index - b.index
  }).map(entry => entry.item)
})

function updateSort({ key, direction }) {
  if (!sortKeys.has(key)) return
  sortBy.value = key
  sortDirection.value = direction === 'desc' ? 'desc' : 'asc'
}
// Behoud de gekozen kalenderdag; voorkom verschuiving door tijdzones.
function apiDate(value) {
  const day = calendarDay(value)
  if (day === null) throw new Error('Ongeldige datum geselecteerd.')
  return new Date(day * 86400000).toISOString().slice(0, 10)
}
async function loadData() {
  const request = ++loadRequest
  loadingData.value = true
  loadError.value = ''
  try {
    const params = { assetModel: props.assetType }
    const [van, tot] = dateRange.value ?? []
    if (van != null && van !== '') params.van = apiDate(van)
    if (tot != null && tot !== '') params.tot = apiDate(tot)

    const response = await verhuurApi.list(params)
    if (request !== loadRequest) return
    if (!Array.isArray(response.data)) throw new Error('Ongeldige lijst ontvangen.')
    allVerhuringen.value = response.data
  } catch (err) {
    if (request === loadRequest) loadError.value = apiMessage(err, 'Kon de verhuringen niet laden.')
  } finally {
    if (request === loadRequest) loadingData.value = false
  }
}
function openVerhuur(id) {
  if (saving.value || id == null) return
  const value = allVerhuringen.value.find(item => entityId(item) != null && String(entityId(item)) === String(id))
  if (!value) return
  selectedVerhuur.value = value
  showDrawer.value = true
  error.value = ''
}
function closeDrawer(clearQuery = true) {
  showDrawer.value = false; selectedVerhuur.value = null; error.value = ''
  linkedRequest++
  if (clearQuery && route.query.verhuur) {
    const query = { ...route.query }; delete query.verhuur
    router.replace({ query })
  }
}

async function updateVerhuur(data) {
  if (saving.value) return
  const id = entityId(data) ?? entityId(selectedVerhuur.value)
  if (id == null) { error.value = 'Boeking-ID ontbreekt.'; return }
  const context = contextVersion
  error.value = ''
  saving.value = true
  try {
    await verhuurApi.update(id, cleanPayload(data))
    if (context !== contextVersion) return
    await loadData()
    if (context === contextVersion) closeDrawer()
  } catch (err) {
    if (context === contextVersion) error.value = apiMessage(err, 'Opslaan is mislukt.')
  } finally { if (context === contextVersion) saving.value = false }
}
async function onDelete(value) {
  if (saving.value) return
  const id = entityId(value) ?? entityId(selectedVerhuur.value)
  if (id == null) return
  const context = contextVersion
  saving.value = true
  error.value = ''
  try {
    await verhuurApi.remove(id)
    if (context !== contextVersion) return
    await loadData()
    if (context === contextVersion) closeDrawer()
  } catch (err) {
    if (context === contextVersion) error.value = apiMessage(err, 'Verwijderen is mislukt.')
  } finally { if (context === contextVersion) saving.value = false }
}
async function onAssigned(value) {
  const id = entityId(value)
  const index = allVerhuringen.value.findIndex(item => id != null && String(entityId(item)) === String(id))
  if (index >= 0) allVerhuringen.value[index] = value
  if (id != null && String(entityId(selectedVerhuur.value)) === String(id)) selectedVerhuur.value = value
  await loadData()
}
function cleanPayload(value) {
  const result = { ...value }
  for (const [field, idField] of [['machineType', 'machineTypeId'], ['werf', 'werfId'], ['projectleider', 'projectleiderId'], ['entiteit', 'entiteitId']]) {
    if (value[idField] !== undefined) result[field] = entityId(value[idField])
    else if (value[field] !== undefined) result[field] = entityId(value[field])
  }
  return result
}
function apiMessage(error, fallback) {
  const value = error?.response?.data?.message || error?.message
  return Array.isArray(value) ? value.join(' · ') : typeof value === 'string' && value.trim() ? value : fallback
}
watch(dateRange, () => { loadData() }, { deep: true })

watch(() => props.assetType, () => {
  contextVersion++
  saving.value = false
  closeDrawer(false)
  allVerhuringen.value = []
  search.value = ''
  dateRange.value = [null, null]
  statusFilter.value = ''
  sortBy.value = 'asset'
  sortDirection.value = 'asc'
  loadData()
}, { immediate: true })
watch([() => props.assetType, () => route.query.verhuur], async ([, id]) => {
  if (typeof id !== 'string' || !id) return
  const request = ++linkedRequest
  try {
    const response = await verhuurApi.getById(id)
    if (request !== linkedRequest) return
    selectedVerhuur.value = response.data ?? response
    showDrawer.value = true
    error.value = ''
  } catch (failure) {
    if (request === linkedRequest) loadError.value = apiMessage(failure, 'Kon de gekozen verhuur niet laden.')
  }
}, { immediate: true })
onBeforeUnmount(() => { contextVersion++; loadRequest++; linkedRequest++ })
</script>

<style scoped>
.planning-page { padding: 20px; min-width: 0; max-width: 100%; box-sizing: border-box; }
h2 { margin: 0 0 20px; color: #1d304b; font-family: 'Inter', 'Segoe UI', sans-serif; font-size: 23px; font-weight: 650; letter-spacing: -.5px; }
.loading-note { color: #78899f; font-size: 12px; }
.load-error { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 16px; padding: 12px 15px; border: 1px solid #edcbd0; border-radius: 8px; color: #a03945; background: #fff3f4; font-size: 12px; }
.load-error button { border: 0; background: transparent; color: inherit; font: inherit; font-weight: 600; cursor: pointer; }
.load-error button:disabled { opacity: .5; cursor: wait; }
@media (max-width: 640px) { .planning-page { padding: 16px; } h2 { font-size: 21px; } }
</style>

