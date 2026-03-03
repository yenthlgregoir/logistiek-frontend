<template>
  <div class="page">
    <main class="container">
      <h1 class="page-title">Actuele Bestellingen</h1>

      <OrdersToolbar v-model:search="search" @create="openCreate" />

      <OrdersTable
        :orders="groupedOrders"
        :status-options="STATUS_OPTIONS"
        :open-menu.sync="openMenu"
        @edit="openEdit"
        @archive="archiveOrder"
        @open-products="openProducts"
        @open-files="openFiles"
        @delete-file="deleteFile"
        @update-status="updateStatus"
      />
    </main>

    <OrderModal
      v-if="showModal"
      :key="isEditing ? currentId : 'create'"
      :form="form"
      :status-options="STATUS_OPTIONS"
      :is-editing="isEditing"
      @close="closeModal"
      @save="saveOrder"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, nextTick, watch } from 'vue'
import { useRouter } from 'vue-router'
import { ordersApi } from '@/api/orders'
import OrdersToolbar from '@/components/purchase/PurchaseToolbar.vue'
import OrdersTable from '@/components/purchase/OrdersTable.vue'
import OrderModal from '@/components/purchase/OrderModal.vue'

/** ================== API ================== */
const API_BASE = import.meta.env.VITE_API_BASE_URL
const LIVE_URL = `${API_BASE}/live-orders`
const router = useRouter()

/** ================== STATUS ================== */
const STATUS_OPTIONS = [
  { label: 'Aanvraag bestelling', color: '#CE93D8' },
  { label: 'Offerte aangevraagd', color: '#80DEEA' },
  { label: 'Offerte ontvangen', color: '#C8E6C9' },
  { label: 'Onderhandeling', color: '#FFD54F' },
  { label: 'Niet in assortiment', color: '#E57373' },
  { label: 'Offerte verloren', color: '#F48FB1' },
  { label: 'Te bestellen', color: '#FFAB91' },
  { label: 'Besteld', color: '#C8E6C9' },
  { label: 'Wachten op feedback', color: '#FFE082' },
  { label: 'Geannuleerd', color: '#B0BEC5' },
  { label: 'Research', color: '#F48FB1' },
]

/** ================== STATE ================== */
const orders = ref([])
const loading = ref(true)
const search = ref('')
const showModal = ref(false)
const isEditing = ref(false)
const currentId = ref(null)
const openMenu = ref(null)
const form = ref(resetForm())

/** ================== LIFECYCLE ================== */
onMounted(() => {
  loadOrders()
  document.addEventListener('click', onClickOutside)
  document.addEventListener('keydown', onGlobalKeydown)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', onClickOutside)
  document.removeEventListener('keydown', onGlobalKeydown)
})

/** ================== AFGELEIDE DATA ================== */
const groupedOrders = computed(() => {
  const map = {}
  for (const order of orders.value) {
    if (!map[order.ref]) map[order.ref] = []
    map[order.ref].push(order)
  }
  return Object.keys(map)
    .sort((a, b) => a.localeCompare(b))
    .map((ref) => ({
      ref,
      orders: map[ref],
      isGrouped: map[ref].length > 1,
    }))
})

/** ================== HELPERS ================== */
function resetForm() {
  return {
    ref: '',
    aanvrager: '',
    leverancier: '',
    categorie: '',
    status: '',
  }
}

/** ================== BACKEND CALLS ================== */
function buildQuery() {
  const params = new URLSearchParams()
  if (search.value.trim()) params.set('q', search.value.trim())
  return params.toString()
}
async function loadOrders() {
  loading.value = true
  try {
    const data = await ordersApi.list(buildQuery())
    console.log(data)
    orders.value = Array.isArray(data) ? data : (data.items ?? [])
  } catch (e) {
    console.error(e)
    alert('Laden van live orders mislukt')
  } finally {
    loading.value = false
  }
}

/** ================== MODAL LOGICA ================== */
function openCreate() {
  isEditing.value = false
  form.value = resetForm()
  showModal.value = true
}
function openEdit(order) {
  isEditing.value = true
  currentId.value = order._id

  // Alleen relevante velden kopiëren
  form.value = {
    ref: order.ref,
    aanvrager: order.aanvrager,
    leverancier: order.leverancier,
    categorie: order.categorie,
    status: order.status,
  }

  showModal.value = true

  // reset kebab menu via emit als openMenu prop is
  if (typeof openMenu?.value !== 'undefined') {
    openMenu.value = null
  } else {
    emits('update:openMenu', null)
  }
}
function closeModal() {
  showModal.value = false
  form.value = resetForm()
}
async function saveOrder() {
  try {
    let saved
    if (isEditing.value) {
      saved = await ordersApi.update(currentId.value, form.value)
      const index = orders.value.findIndex((o) => o._id === currentId.value)
      if (index !== -1) orders.value[index] = saved
    } else {
      saved = await ordersApi.create(form.value)
      orders.value.unshift(saved)
    }
    closeModal()
  } catch (e) {
    console.error(e)
    alert('Opslaan mislukt')
  }
}

/** ================== KEBAB MENU ================== */
function onClickOutside(e) {
  const wrapperClicked = e.target.closest?.('.kebab-wrapper')
  if (!wrapperClicked) openMenu.value = null
}
function onGlobalKeydown(e) {
  if (e.key === 'Escape') {
    if (openMenu.value !== null) {
      openMenu.value = null
      e.stopPropagation()
    }
  }
}

/** ================== TABLE ACTIES ================== */
async function updateStatus(order) {
  try {
    await ordersApi.update(order._id, { status: order.status })
  } catch (e) {
    console.error(e)
    alert('Opslaan mislukt')
  }
}
async function archiveOrder(order) {
  try {
    await ordersApi.archive(order._id)
    orders.value = orders.value.filter((o) => o._id !== order._id)
  } catch (err) {
    console.error(err)
    alert('Archiveren mislukt')
  }
}
function openProducts(order) {
  router.push({
    path: `/purchase/order/${order._id}`,
  })
  openMenu.value = null
}
function openFiles(order) {
  router.push({
    path: `/purchase/files/${order._id}`,
  })
  openMenu.value = null
}
async function deleteFile(order) {
  try {
    await ordersApi.remove(order._id)
    orders.value = orders.value.filter((o) => o._id !== order._id)
    openMenu.value = null
  } catch (err) {
    console.error(err)
    alert('Er is iets misgegaan bij het verwijderen')
  }
}
let debounceTimer
watch(search, () => {
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    loadOrders()
  }, 300)
})
</script>
<style scoped>
.page {
  min-height: 90vh;
  overflow-y: auto;
  background: #f5f7fa;
}
.container {
  margin: 0 2% 0 2%;
  display: block;
}
</style>
