<template>
  <div class="page">
    <h2>Hoogtewerkers</h2>
    <div v-if="loadError" class="error-banner" role="alert"><span>{{ loadError }}</span><button type="button" :disabled="loading" @click="fetchAssets()">Opnieuw proberen</button></div>
    <p v-if="saveError" class="error-banner" role="alert">{{ saveError }}</p>
    <p v-if="exportError" class="error-banner" role="alert">{{ exportError }}</p>
    <p v-if="loading" class="loading-note" role="status">Hoogtewerkers laden…</p>
    <p v-if="pageNotice" class="loading-note" role="status">{{ pageNotice }}</p>

    <SchaarliftenLijst :assets="assets" :loading="loading" :exporting="exporting" @search="searchAssets" @open-add="openCreate" @edit-asset="openEdit" @toPDF="toPDF" />
    <SchaarliftenDrawer :show="showDrawer" :model="selectedAsset" :loading="saving" :error="saveError" @close="closeDrawer" @save="saveAsset" />
  </div>
</template>

<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { schaarliftenApi } from '@/api/schaarliften.js'
import SchaarliftenLijst from '@/components/Logistics/Schaarliften/SchaarliftenLijst.vue'
import SchaarliftenDrawer from '@/components/Logistics/Schaarliften/SchaarliftenDrawer.vue'

const assets = ref([])
const showDrawer = ref(false)
const selectedAsset = ref(null)
const currentSearch = ref('')
const loading = ref(false)
const saving = ref(false)
const exporting = ref(false)
const loadError = ref('')
const saveError = ref('')
const exportError = ref('')
const pageNotice = ref('')
let requestVersion = 0
let searchTimer
let disposed = false
const objectUrls = new Set()

function getId(asset) { return asset?.id ?? asset?._id ?? null }
function message(error, fallback) {
  const value = error?.response?.data?.message || error?.message
  return Array.isArray(value) ? value.join(' · ') : typeof value === 'string' && value.trim() ? value : fallback
}
function readList(data) {
  if (Array.isArray(data)) return { items: data, notice: '' }
  // Spring Page: de lijst staat onder content, niet rechtstreeks onder data.
  if (Array.isArray(data?.content)) {
    const total = data.totalElements
    const partial = data.last === false || (Number.isFinite(total) && total > data.content.length)
    return { items: data.content, notice: partial ? 'De API levert een gepagineerde lijst. Niet alle resultaten zijn geladen.' : '' }
  }
  throw new Error('De API geeft geen assetlijst terug. Verwacht een array of een pagina met content.')
}
async function fetchAssets() {
  if (disposed) return
  const request = ++requestVersion
  const query = currentSearch.value.trim()
  loading.value = true
  loadError.value = ''
  try {
    const response = await schaarliftenApi.list({ search: query || undefined })
    if (disposed || request !== requestVersion) return
    const result = readList(response.data)
    assets.value = result.items.filter(item => item !== null && typeof item === 'object')
    pageNotice.value = result.notice
  } catch (error) {
    if (!disposed && request === requestVersion) {
      assets.value = []
      pageNotice.value = ''
      loadError.value = message(error, 'Kon de hoogtewerkers niet laden.')
    }
  } finally {
    if (!disposed && request === requestVersion) loading.value = false
  }
}
function searchAssets(value) {
  currentSearch.value = String(value ?? '')
  clearTimeout(searchTimer)
  // Maak een lopend antwoord direct ongeldig, ook tijdens de debounce.
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
  if (getId(asset) == null) { saveError.value = 'Dit asset heeft geen ID en kan niet bewerkt worden.'; return }
  // Losse kopie, ook van geneste gegevens: wijzigingen raken de lijst pas na opslaan.
  selectedAsset.value = JSON.parse(JSON.stringify(asset))
  saveError.value = ''
  showDrawer.value = true
}
async function saveAsset(data) {
  if (saving.value || !showDrawer.value) return
  const editing = selectedAsset.value !== null
  const id = getId(selectedAsset.value)
  if (editing && id == null) { saveError.value = 'Asset-ID ontbreekt.'; return }
  saving.value = true
  saveError.value = ''
  try {
    if (editing) await schaarliftenApi.update(id, data)
    else await schaarliftenApi.create(data)
    if (disposed) return
    showDrawer.value = false
    selectedAsset.value = null
    clearTimeout(searchTimer)
    // Herlaad met de huidige zoekterm, zodat zoekveld en resultaten overeenkomen.
    await fetchAssets()
  } catch (error) {
    if (!disposed) saveError.value = message(error, 'Kon het asset niet opslaan.')
  } finally { if (!disposed) saving.value = false }
}
async function toPDF() {
  if (exporting.value) return
  exporting.value = true
  exportError.value = ''
  try {
    const response = await schaarliftenApi.toPdf()
    if (disposed) return
    // Ondersteunt zowel een Blob als een Axios-response met een Blob in data.
    const blob = response instanceof Blob ? response : response?.data
    if (!(blob instanceof Blob)) throw new Error('De API heeft geen PDF-bestand teruggegeven.')
    const url = URL.createObjectURL(blob)
    objectUrls.add(url)
    const anchor = document.createElement('a')
    const date = new Date()
    anchor.href = url
    anchor.download = `Hoogtewerkers_${date.getDate()}-${date.getMonth() + 1}-${date.getFullYear()}.pdf`
    anchor.hidden = true
    document.body.appendChild(anchor)
    anchor.click()
    anchor.remove()
    setTimeout(() => {
      if (objectUrls.delete(url)) URL.revokeObjectURL(url)
    }, 1000)
  } catch (error) {
    if (!disposed) exportError.value = message(error, 'PDF exporteren is mislukt.')
  } finally { if (!disposed) exporting.value = false }
}
function closeDrawer() {
  if (saving.value) return
  showDrawer.value = false
  selectedAsset.value = null
  saveError.value = ''
}
onMounted(fetchAssets)
onBeforeUnmount(() => {
  disposed = true
  requestVersion++
  clearTimeout(searchTimer)
  for (const url of objectUrls) URL.revokeObjectURL(url)
  objectUrls.clear()
})
</script>

<style scoped>
.page { width: 100%; max-width: 100%; min-width: 0; padding: 1rem; box-sizing: border-box; }
h2 { margin: 0 0 20px; color: #1d304b; font-family: 'Inter', 'Segoe UI', sans-serif; font-size: 23px; font-weight: 650; letter-spacing: -.5px; }
.error-banner { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 10px; margin: 0 0 14px; padding: 12px 15px; border: 1px solid #edcbd0; border-radius: 8px; background: #fff3f4; color: #a03945; font-size: 12px; line-height: 1.6; }
.error-banner button { border: 0; background: transparent; color: inherit; font: inherit; font-weight: 600; cursor: pointer; }
.error-banner button:disabled { opacity: .5; cursor: wait; }
.loading-note { color: #78899f; font-size: 12px; line-height: 1.6; }
</style>
