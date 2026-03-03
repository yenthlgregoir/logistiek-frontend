<template>
  <div class="page">
    <!-- ===== CONTENT ===== -->
    <main class="container">
      <h1 class="page-title">Archief</h1>
      <!-- ===== TOOLBAR ===== -->
      <div class="toolbar">
        <div class="search">
          <i class="fa fa-search"></i>
          <input v-model="search" type="text" placeholder="Zoek op referentie" />
        </div>
      </div>
      <!-- ===== TABLE ===== -->
      <div class="table-wrapper">
        <table class="table">
          <colgroup>
            <col style="width: 8%" />
            <!-- ID -->
            <col style="width: 25%" />
            <!-- Referentie -->
            <col style="width: 15%" />
            <!-- Aanvrager -->
            <col style="width: 15%" />
            <!-- Leverancier -->
            <col style="width: 15%" />
            <!-- Categorie -->
            <col style="width: 22%" />
            <!-- Status -->
          </colgroup>
          <thead>
            <tr>
              <th>ID</th>
              <th>Referentie</th>
              <th>Aanvrager</th>
              <th>Leverancier</th>
              <th>Categorie</th>
              <th class="right">Status</th>
            </tr>
          </thead>

          <tbody>
            <tr v-if="!groupedOrders.length">
              <td colspan="7" class="empty">
                {{ loading ? 'Laden…' : 'Geen resultaten' }}
              </td>
            </tr>

            <template v-for="group in groupedOrders" :key="group.ref">
              <!-- groepsheader ALLEEN bij 2+ -->
              <tr v-if="group.isGrouped" class="group-row">
                <td colspan="7">
                  Referentie: <strong>{{ group.ref }}</strong>
                  <span class="group-count">({{ group.orders.length }} items)</span>
                </td>
              </tr>

              <!-- orders -->
              <tr
                v-for="(order, index) in group.orders"
                :key="order._id"
                :class="[
                  'row',
                  {
                    grouped: group.isGrouped,
                    'group-end': group.isGrouped && index === group.orders.length - 1,
                  },
                ]"
              >
                <td>{{ order._id }}</td>
                <td>{{ order.ref }}</td>
                <td>{{ order.aanvrager }}</td>
                <td>{{ order.leverancier }}</td>
                <td>{{ order.categorie }}</td>

                <td class="right">
                  <div
                    class="status-select"
                    :style="{
                      backgroundColor:
                        STATUS_OPTIONS.find((s) => s.label === order.status)?.color || '#fff',
                    }"
                  >
                    {{ order.status }}
                  </div>
                </td>
              </tr>
            </template>
          </tbody>
        </table>
      </div>
    </main>
  </div>
</template>
<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { ordersApi } from '@/api/orders'

/** ================== API ENDPOINTS ================== */
const API_BASE = import.meta.env.VITE_API_BASE_URL
const ARCHIVE_URL = `${API_BASE}/archive-orders`

/** ================== STATUS (kleur) ================== */
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
const orders = ref([]) // lijst records uit backend
const loading = ref(true)
const search = ref('')

// (optioneel) eenvoudige server-side paginatie & sort
const page = ref(1)
const limit = ref(50)
const sort = ref('-createdAt')
const total = ref(0)
const pages = ref(1)

/** ================== LIFECYCLE ================== */
onMounted(() => {
  loadOrders()
})

/** ================== HELPERS ================== */
function buildQuery() {
  const params = new URLSearchParams()
  if (search.value.trim()) params.set('q', search.value.trim())
  if (sort.value) params.set('sort', sort.value)
  params.set('page', String(page.value))
  params.set('limit', String(limit.value))
  return params.toString()
}

/** ================== BACKEND CALLS ================== */
async function loadOrders() {
  loading.value = true
  try {
    const data = await ordersApi.getArchive(buildQuery())

    // Omdat backend altijd {items, total, page, pages} terugstuurt:
    orders.value = data.items ?? []
    total.value = data.total ?? 0
    pages.value = data.pages ?? 1
  } catch (err) {
    console.error('Fout bij ophalen archief-orders', err)
    alert('Laden van archief mislukt')
  } finally {
    loading.value = false
  }
}
/** ================== GROEPERING (client-side) ================== */
const groupedOrders = computed(() => {
  const map = {}

  // Je kan ook server-side filteren met ?q=..., maar dit houdt extra client-filtering
  const filtered = orders.value.filter((o) =>
    (o.ref || '').toLowerCase().includes(search.value.toLowerCase()),
  )

  filtered.forEach((order) => {
    const key = order.ref || 'Onbekend'
    if (!map[key]) map[key] = []
    map[key].push(order)
  })

  return Object.keys(map)
    .sort((a, b) => a.localeCompare(b))
    .map((ref) => ({
      ref,
      orders: map[ref],
      isGrouped: map[ref].length > 1,
    }))
})

/** ================== KLEUR HELPER ================== */
function getTextColor(bg) {
  if (!bg) return '#000'
  const c = bg.substring(1) // remove '#'
  const rgb = parseInt(c, 16)
  const r = (rgb >> 16) & 0xff
  const g = (rgb >> 8) & 0xff
  const b = rgb & 0xff
  const luma = 0.299 * r + 0.587 * g + 0.114 * b
  return luma > 186 ? '#000' : '#fff'
}

/** ================== (OPTIONEEL) LIVE SEARCH DEBOUNCE ================== */
let debounceTimer
watch(search, () => {
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    page.value = 1
    loadOrders()
  }, 250)
})
</script>

<style scoped>
.page {
  min-height: 90vh;
  overflow-y: auto; /* pagina mag scrollen */
  background: #f5f7fa;
}

/* ===== TOPBAR ===== */
.topbar {
  background: white;
  padding: 14px 32px;
  border-bottom: 1px solid #e5e7eb;
}

.logo {
  height: 32px;
}

/* ===== CONTENT ===== */
.container {
  padding: 24px 2%;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* ===== TOOLBAR ===== */
.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.search {
  position: relative;
}

.search input {
  padding: 8px 12px 8px 32px;
  border-radius: 6px;
  border: 1px solid #d1d5db;
}

.search i {
  position: absolute;
  left: 10px;
  top: 50%;
  transform: translateY(-50%);
  color: #9ca3af;
}

.actions {
  display: flex;
  gap: 8px;
}

/* ===== TABLE ===== */
.table-wrapper {
  flex: none; /* niet forceren */
  overflow: visible;
  max-height: none;
  border-radius: 8px;
}

.table {
  width: 100%;
  background: white;
  border-radius: 8px;
  border-collapse: collapse;
  table-layout: fixed;
  overflow: hidden;
}

.table thead {
  background: #8ec6f7;
}

.table thead {
  background: #8ec6f7;
}

.table th,
.table td {
  padding: 12px 14px;
  border-bottom: 1px solid #e5e7eb;
  text-align: left;
  vertical-align: middle;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.row {
  cursor: default; /* niet meer klikbaar voor edit */
}

.row:hover {
  background: #f0f7ff;
}

.right {
  text-align: right;
}

.empty {
  text-align: center;
  color: #9ca3af;
  padding: 24px;
}

/* ===== STATUS ===== */
.status-select {
  appearance: none;
  -webkit-appearance: none;
  -moz-appearance: none;

  padding: 0.5rem 2.5rem 0.5rem 0.75rem;
  border-radius: 8px;
  border: 1px solid #d1d5db;
  background-color: #ffffff;

  font-size: 0.9rem;
  font-weight: 500;
  color: #111827;

  transition: all 0.2s ease;
}

/* hover */
.status-select:hover {
  border-color: #9ca3af;
  background-color: #f9fafb;
}

/* focus */
.status-select:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.25);
}

/* disabled (optioneel) */
.status-select:disabled {
  background-color: #f3f4f6;
  color: #9ca3af;
  cursor: not-allowed;
}

.floating {
  position: fixed;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.15);
  min-width: 200px;
  z-index: 100000;
}
/* ===== GROEPERING ===== */
.group-row {
  background: #e6f0fa;
  font-weight: 600;
  color: #1f4e79;
}

.group-row td {
  padding: 10px 14px;
  border-top: 2px solid #2f80ed;
}

.group-count {
  font-weight: normal;
  color: #4b5563;
  margin-left: 6px;
}

.row.grouped td:first-child {
  padding-left: 24px;
}
/* ===== EINDE GROEP ===== */
.row.group-end td {
  border-bottom: 2px solid #2f80ed;
}

.row.group-end {
  background: linear-gradient(to bottom, #ffffff 0%, #ffffff 70%, #f0f7ff 100%);
}
.status-wrapper {
  display: flex;
  align-items: center;
  gap: 8px;
  justify-content: flex-end;
}

.status-badge {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  display: inline-block;
  border: 1px solid #ccc;
}
</style>
