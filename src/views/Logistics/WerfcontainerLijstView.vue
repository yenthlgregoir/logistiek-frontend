<template>
  <div class="page">
    <h2>Werfcontainers</h2>
    <div v-if="loadError" class="error-banner" role="alert"><span>{{ loadError }}</span><button type="button" :disabled="loading" @click="fetchAssets()">Opnieuw proberen</button></div>
    <div v-if="entiteitenError" class="error-banner" role="alert"><span>{{ entiteitenError }}</span><button type="button" :disabled="loadingEntiteiten" @click="getEntiteiten">Opnieuw proberen</button></div>
    <p v-if="saveError" class="error-banner" role="alert">{{ saveError }}</p>
    <p v-if="loading" class="loading-note" role="status">Werfcontainers laden…</p>
    <p v-if="pageNotice" class="loading-note" role="status">{{ pageNotice }}</p>

    <WerfcontainerLijst :assets="assets" @search="searchAssets" @open-add="openCreate" @edit-asset="openEdit" />
    <WerfcontainerDrawer :show="showDrawer" :model="selectedAsset" :entiteiten="entiteiten" :loading="saving" :error="saveError" @close="closeDrawer" @save="saveAsset" />
  </div>
</template>

<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { werfcontainerApi } from '@/api/werfcontainer.js'
import { entiteitApi } from '@/api/entiteit'
import WerfcontainerLijst from '@/components/Logistics/Werfcontainers/WerfcontainerLijst.vue'
import WerfcontainerDrawer from '@/components/Logistics/Werfcontainers/WerfcontainerDrawer.vue'

const assets = ref([])
const entiteiten = ref([])
const showDrawer = ref(false)
const selectedAsset = ref(null)
const search = ref('')
const loading = ref(false)
const loadingEntiteiten = ref(false)
const saving = ref(false)
const loadError = ref('')
const entiteitenError = ref('')
const saveError = ref('')
const pageNotice = ref('')
let requestVersion = 0
let searchTimer
let disposed = false

function getId(value) { return value?.id ?? value?._id ?? null }
function message(error, fallback) {
  const value = error?.response?.data?.message || error?.message
  return Array.isArray(value) ? value.join(' · ') : typeof value === 'string' && value.trim() ? value : fallback
}
function readList(response, label) {
  // Sommige API-helpers geven Axios-response terug, andere rechtstreeks data.
  const data = response?.data ?? response
  if (Array.isArray(data)) return { items: data, partial: false }
  if (Array.isArray(data?.content)) {
    return { items: data.content, partial: data.last === false || (Number.isFinite(data.totalElements) && data.totalElements > data.content.length) }
  }
  throw new Error(`${label}: de API geeft geen lijst terug.`)
}
async function fetchAssets() {
  if (disposed) return
  const request = ++requestVersion
  loading.value = true
  loadError.value = ''
  try {
    const response = await werfcontainerApi.list({ search: search.value.trim() || undefined })
    if (disposed || request !== requestVersion) return
    const result = readList(response, 'Werfcontainers')
    assets.value = result.items.filter(item => item !== null && typeof item === 'object')
    console.log(assets.value)
    pageNotice.value = result.partial ? 'De API levert een gepagineerde lijst. Niet alle werfcontainers zijn geladen.' : ''
  } catch (error) {
    if (!disposed && request === requestVersion) {
      assets.value = []
      pageNotice.value = ''
      loadError.value = message(error, 'Kon de werfcontainers niet laden.')
    }
  } finally {
    if (!disposed && request === requestVersion) loading.value = false
  }
}
async function getEntiteiten() {
  if (disposed || loadingEntiteiten.value) return
  loadingEntiteiten.value = true
  entiteitenError.value = ''
  try {
    const response = await entiteitApi.getEntiteiten()
    if (disposed) return
    const result = readList(response, 'Entiteiten')
    if (result.partial) throw new Error('Niet alle entiteiten zijn geladen. Gebruik voor deze keuzelijst een volledig lijstendpoint.')
    entiteiten.value = result.items.filter(item => item !== null && typeof item === 'object')
  } catch (error) {
    if (!disposed) {
      entiteiten.value = []
      entiteitenError.value = message(error, 'Kon de entiteiten niet laden.')
    }
  } finally { if (!disposed) loadingEntiteiten.value = false }
}
function searchAssets(value) {
  search.value = String(value ?? '')
  clearTimeout(searchTimer)
  requestVersion++
  loading.value = true
  searchTimer = setTimeout(fetchAssets, 250)
}
function openCreate() {
  if (saving.value) return
  selectedAsset.value = null
  saveError.value = ''
  showDrawer.value = true
}
function openEdit(asset) {
  if (saving.value) return
  if (getId(asset) == null) { saveError.value = 'Deze werfcontainer heeft geen ID en kan niet bewerkt worden.'; return }
  selectedAsset.value = JSON.parse(JSON.stringify(asset))
  saveError.value = ''
  showDrawer.value = true
}
async function saveAsset(data) {
  if (saving.value || !showDrawer.value) return
  const editing = selectedAsset.value !== null
  const id = getId(selectedAsset.value)
  if (editing && id == null) { saveError.value = 'Werfcontainer-ID ontbreekt.'; return }
  saving.value = true
  saveError.value = ''
  try {
    if (editing) await werfcontainerApi.update(id, data)
    else await werfcontainerApi.create(data)
    if (disposed) return
    showDrawer.value = false
    selectedAsset.value = null
    clearTimeout(searchTimer)
    await fetchAssets()
  } catch (error) {
    if (!disposed) saveError.value = message(error, 'Kon de werfcontainer niet opslaan.')
  } finally { if (!disposed) saving.value = false }
}
function closeDrawer() {
  if (saving.value) return
  showDrawer.value = false
  selectedAsset.value = null
  saveError.value = ''
}
onMounted(() => { fetchAssets(); getEntiteiten() })
onBeforeUnmount(() => { disposed = true; requestVersion++; clearTimeout(searchTimer) })
</script>

<style scoped>
.page { width: 100%; max-width: 100%; min-width: 0; padding: 1rem; box-sizing: border-box; }
h2 { margin: 0 0 20px; color: #1d304b; font-family: 'Inter', 'Segoe UI', sans-serif; font-size: 23px; font-weight: 650; letter-spacing: -.5px; }
.error-banner { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 10px; margin: 0 0 14px; padding: 12px 15px; border: 1px solid #edcbd0; border-radius: 8px; background: #fff3f4; color: #a03945; font-size: 12px; line-height: 1.6; }
.error-banner button { border: 0; background: transparent; color: inherit; font: inherit; font-weight: 600; cursor: pointer; }
.error-banner button:disabled { opacity: .5; cursor: wait; }
.loading-note { color: #78899f; font-size: 12px; line-height: 1.6; }
</style>
