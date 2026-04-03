<template>
  <div class="page">
    <h2>Assets</h2>

    <!-- LIST -->
    <SchaarliftenLijst
      :assets="assets"
      @search="searchAssets"
      @open-add="openCreate"
      @edit-asset="openEdit"
    />

    <!-- DRAWER -->
    <SchaarliftenDrawer
      :show="showDrawer"
      :model="selectedAsset"
      @close="closeDrawer"
      @save="saveAsset"
    />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { schaarliftenApi } from '@/api/schaarliften.js'

import SchaarliftenLijst from '@/components/Logistics/Schaarliften/SchaarliftenLijst.vue'
import SchaarliftenDrawer from '@/components/Logistics/Schaarliften/SchaarliftenDrawer.vue'

// --- STATE ---
const assets = ref([])
const showDrawer = ref(false)
const selectedAsset = ref(null)

// --- INIT ---
onMounted(fetchAssets)

// --- FETCH ---
async function fetchAssets(query = undefined) {
  try {
    const params = { search: query || undefined }
    const response = await schaarliftenApi.list(params)

    // 🔥 altijd array veilig maken
    assets.value = response
  } catch (error) {
    console.error('Fout bij ophalen assets:', error)
  }
}

// --- SEARCH ---
function searchAssets(query) {
  fetchAssets(query)
}

// --- OPEN CREATE ---
function openCreate() {
  selectedAsset.value = null
  showDrawer.value = true
}

// --- OPEN EDIT ---
function openEdit(asset) {
  console.log('edit')
  selectedAsset.value = { ...asset }
  showDrawer.value = true
}

// --- SAVE (CREATE + UPDATE) ---
async function saveAsset(data) {
  try {
    if (selectedAsset.value?._id) {
      await schaarliftenApi.update(selectedAsset.value._id, data)
    } else {
      await schaarliftenApi.create(data)
    }

    await fetchAssets()
    closeDrawer()
  } catch (err) {
    console.error('Fout bij opslaan asset:', err)
  }
}

// --- CLOSE ---
function closeDrawer() {
  showDrawer.value = false
  selectedAsset.value = null
}
</script>

<style scoped>
.page {
  padding: 1rem;
}

.page h2 {
  padding-left: 2rem;
}

/* actie knop */
.actions {
  display: flex;
  justify-content: flex-end;
  margin: 1rem 2rem;
}

.btn {
  padding: 10px 16px;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  font-weight: 600;
}

.btn-primary {
  background-color: #5786f7;
  color: white;
}

.btn-primary:hover {
  background-color: #5077d3;
}
</style>
