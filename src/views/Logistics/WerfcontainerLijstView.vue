<template>
  <div class="page">
    <h2>Werfcontainers</h2>

    <!-- LIST -->
    <WerfcontainerLijst
      :assets="assets"
      @search="searchAssets"
      @open-add="openCreate"
      @edit-asset="openEdit"
    />

    <!-- DRAWER -->
    <WerfcontainerDrawer
      :show="showDrawer"
      :model="selectedAsset"
      :entiteiten="entiteiten"
      @close="closeDrawer"
      @save="saveAsset"
    />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { werfcontainerApi } from '@/api/werfcontainer.js'
import { leiderApi } from '@/api/projectLeider.js'

import WerfcontainerLijst from '@/components/Logistics/Werfcontainers/WerfcontainerLijst.vue'
import WerfcontainerDrawer from '@/components/Logistics/Werfcontainers/WerfcontainerDrawer.vue'

// --- STATE ---
const assets = ref([])
const entiteiten = ref([])
const showDrawer = ref(false)
const selectedAsset = ref(null)

// --- INIT ---
onMounted(fetchAssets)
onMounted(getEntiteiten)

// --- FETCH ---
async function fetchAssets(query = undefined) {
  try {
    const params = { search: query || undefined }
    const response = await werfcontainerApi.list(params)

    // 🔥 altijd array veilig maken
    assets.value = response
  } catch (error) {
    console.error('Fout bij ophalen werfcontainers:', error)
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
  selectedAsset.value = { ...asset }
  showDrawer.value = true
}
async function getEntiteiten() {
  try {
    const res = await leiderApi.getEntiteiten()
    entiteiten.value = res
  } catch (err) {
    console.log(err)
  }
}
// --- SAVE (CREATE + UPDATE) ---
async function saveAsset(data) {
  try {
    console.log(data)
    if (selectedAsset.value?._id) {
      await werfcontainerApi.update(selectedAsset.value._id, data)
    } else {
      await werfcontainerApi.create(data)
    }

    await fetchAssets()
    closeDrawer()
  } catch (err) {
    console.error('Fout bij opslaan werfcontainer:', err)
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
