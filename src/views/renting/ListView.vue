<template>
  <div class="page">
    <div class="page-header">
      <h1>Archief</h1>

      <input
        v-model="search"
        type="text"
        placeholder="Zoeken…"
        class="search-input"
      />
    </div>

    <!-- FILTERS -->
    <div class="filters">

  <!-- DATE -->
    <DropdownChip
    v-model="selected"
    :options="companies"
    @clear="onClear"
  />

  <!-- CUSTOMER AUTOCOMPLETE -->
  <DropdownChip
    v-model="selected"
    :options="companies"
    @clear="onClear"
  />

  <!-- STATUS AUTOCOMPLETE -->
 <DropdownChip
    v-model="selected"
    :options="companies"
    @clear="onClear"
  />

  <button class="reset" @click="resetFilters">
    Reset all
  </button>

</div>

    <p class="results">
      showing {{ store.boekingen.length }} results
    </p>

    <div class="devider" />

    <div class="content">
      <!-- TABLE -->
      <div
        class="table-wrapper"
        :class="{ collapsed: selectedBooking }"
        @transitionend="onTableTransitionEnd"
      >
        <table>
          <thead>
            <tr>
              <th>Ref</th>
              <th>Toestel</th>
              <th>Adres</th>
              <th>Periode</th>
              <th>Status</th>
            </tr>
          </thead>

          <tbody>
            <tr
              v-for="item in store.boekingen"
              :key="item.id"
              class="itemRow"
              :class="{ active: selectedBooking?.id === item.id }"
              @click="openBooking(item, $event)"
            >
              <td class="ref">{{ item.ref }}</td>
              <td>{{ item.toestel?.Ref || 'Niet toegewezen' }}</td>
              <td>{{ formatAdres(item) }}</td>
              <td>{{ formatPeriode(item) }}</td>
              <td>
                <span class="status" :class="item.status">
                  ● {{ item.status }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- PANEL -->
      <div
        v-if="showPanel"
        class="detail-panel"
        :style="{ '--from-y': panelOffsetY + 'px' }"
      >
        <div class="panel-header">
          <div>
            <h3>AB InBev Leuven</h3>
            <span class="panel-ref">
              Ref: {{ selectedBooking.ref }}
            </span>
          </div>

          <button class="close-btn" @click="closeBooking">
            ✕
          </button>
        </div>

        <div class="panels">
          <div class="panel-section">
            <strong>Leveradres</strong>
            <p>{{ formatAdres(selectedBooking) }}</p>
          </div>

          <div class="panel-section">
            <strong>Periode</strong>
            <p>{{ formatPeriode(selectedBooking) }}</p>
          </div>

          <div class="panel-section">
            <strong>Toestel</strong>
            <p>{{ selectedBooking.toestel?.Ref || 'niet toegewezen' }}</p>
          </div>

          <div class="panel-section">
            <strong>Transport</strong>
            <p>{{ selectedBooking.type }}</p>
          </div>

          <div class="comment-section">
            <strong>Comment</strong>
            <textarea
              v-model="selectedBooking.comment"
              class="comment-textarea"
              placeholder="Voeg hier een comment toe…"
              rows="4"
            />
          </div>

          <div class="status-wrapper">
            <label>Status</label>
            <select
              v-model="selectedBooking.status"
              class="status-select"
              :class="selectedBooking.status"
            >
              <option value="Aangevraagd">Aangevraagd</option>
              <option value="Bevestigd">Bevestigd</option>
              <option value="Geleverd">Geleverd</option>
              <option value="Afgewerkt">Afgewerkt</option>
               <option value="Leveren">Leveren</option>
                        

            </select>
          </div>

          <div class="buttons">
            <button class="toevoegen-btn">Opslaan</button>
            <button class="danger-btn">Verwijderen</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useDebounceFn } from '@vueuse/core'
import { useBoekingenStore } from '@/stores/renting/boekingen.store.js'
import AutocompleteSelect from '@/components/base/AutocompleteSelect.vue'
import DropdownChip from '@/components/base/FilterChip.vue'
const store = useBoekingenStore()

const search = ref('')
const selectedBooking = ref(null)
const showPanel = ref(false)
const panelOffsetY = ref(0)
const isAnimating = ref(false)

/**
 * FILTERS
 */
const filters = ref({
  dateRange: {
    start: null,
    end: null,
  },
  customer: null,
  status: null,
})

/**
 * MOCK / REPLACE MET STORE DATA
 */
const companies = [
  { label: "AB InBev", value: "ab" },
  { label: "Heineken", value: "heineken" },
  { label: "Carlsberg", value: "carlsberg" },
];
const statusOptions = [
  { _id: 'Aangevraagd', name: 'Aangevraagd' },
  { _id: 'Bevestigd', name: 'Bevestigd' },
  { _id: 'Geleverd', name: 'Geleverd' },
  { _id: 'Afgewerkt', name: 'Afgewerkt' },
]

/**
 * RESET
 */
function resetFilters() {
  filters.value = {
    dateRange: { start: null, end: null },
    customer: null,
    status: null,
  }
  reload()
}

/**
 * LOAD
 */
const reload = useDebounceFn(() => {
  store.resetFilters()

  store.search = search.value

  store.filters = {
    dateRange: filters.value.dateRange,
    customer: filters.value.customer,
    status: filters.value.status,
  }

  store.loadBoekingen()
}, 300)

watch(search, reload)
watch(filters, reload, { deep: true })

/**
 * PANEL
 */
function openBooking(item, event) {
  if (isAnimating.value) return

  const rowRect = event.currentTarget.getBoundingClientRect()
  panelOffsetY.value = rowRect.top - 120

  selectedBooking.value = item
  showPanel.value = false
  isAnimating.value = true
}

function closeBooking() {
  selectedBooking.value = null
  showPanel.value = false
}

function onTableTransitionEnd(e) {
  if (e.propertyName !== 'width') return
  if (!selectedBooking.value) return

  showPanel.value = true
  isAnimating.value = false
}

/**
 * FORMATTERS
 */
function formatAdres(boeking) {
  const adres = boeking.leverAdresDetails || boeking.klant?.factuurAdres
  if (!adres) return 'Onbekende klant'

  return `${adres.naam || ''}: ${adres.straat || ''} ${adres.huisnummer || ''}, ${adres.postcode || ''} ${adres.gemeente || ''}`
}

function formatDate(dateString) {
  if (!dateString) return ''
  const d = new Date(dateString)
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`
}

function formatPeriode(b) {
  const begin = b.beginDatumFormatted || formatDate(b.beginDatum)
  const eind = b.eindDatumFormatted || formatDate(b.eindDatum)
  return begin && eind ? `${begin} - ${eind}` : ''
}

/**
 * INIT
 */
onMounted(async () => {
  store.resetFilters()
  store.currentViewMode = 'archief'
  await store.loadBoekingen()
})
</script>
<style scoped>

.page {
  padding: 32px;
  background: white;
  min-height: 100vh;
}

.content {
  display: flex;
  gap: 24px;
}

.page-header {
  position: relative;
  display: flex;
  align-items: center;
  margin-bottom: 20px;
}

.page-header h1 {
  font-size: 22px;
  font-weight: 600;
}

.search-input {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  
  padding: 14px 18px;
  border-radius: 12px;
  border: 1px solid #ddd;
  width: 100%;
  max-width: 500px;
  font-size: 16px;
}
.filters {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  margin-bottom: 8px;
}




.reset {
  background: none;
  border: none;
  color: #2563eb;
  cursor: pointer;
}

.results {
  font-size: 12px;
  color: #6b7280;
  margin-bottom: 12px;
}
.devider{
    height: 1px;
    width: 100%;
    padding-left: 10%;
    padding-right:10%;
    background-color: #f1f5f9;
}
.table-wrapper {
  width: 100%;
  transition: width .7s ease;
}

.table-wrapper.collapsed {
  width: 70%;
}

table {
  width: 100%;
  border-collapse: collapse;
}


th {
  text-align: left;
  font-size: 12px;
  font-weight: 600;
  color: #6b7280;
  padding: 12px 16px;

}

.itemRow td {
  padding: 14px 16px;
  border-top: 1px solid #f1f5f9;
  font-size: 14px;
}


.itemRow:hover td {
  border-top: 1px solid #007BF7;
  border-bottom: 1px solid #007BF7;
  color: #007BF7;
  background-color: #B7DBFF;
  cursor:pointer;
}


.ref {
  font-weight: 600;
}

.status{
    padding: 4px 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 500;
}
.status.Aangevraagd {
  background: #fef3c7;
  color: #92400e;
}

.status.Bevestigd {
  background: #dbeafe;
  color: #1e3a8a;
}

.status.Leveren {
  background: #fde68a;
  color: #78350f;
}

.status.Geleverd,
.status.Opgehaald,
.status.Afgewerkt {
  background: #d1fae5;
  color: #065f46;
}

.add-btn {
  position: fixed;
  right: 32px;
  top: 120px;
  background: #2563eb;
  color: white;
  border: none;
  border-radius: 50%;
  width: 44px;
  height: 44px;
  font-size: 20px;
  cursor: pointer;
}

.detail-panel {
  width: 380px;
  height: fit-content;
  background: #ffffff;
  border-radius: 12px;
  padding: 0;
  animation: slideIn 0.1s ease;
  display: flex;
  flex-direction: column;
  border: 1px solid rgb(221, 220, 220);
  margin-top: 2.5rem;
}
.panel-header {
  background: #4f7ff7;
  color: white;
  padding: 16px;
  display: flex;
  justify-content: space-between;
  gap: 12px;
  border-radius: 12px 12px 0 0;
}

.panel-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
}

.panel-ref {
  font-size: 12px;
  opacity: 0.9;
}
.panel-actions-top {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 6px;
}

.download {
  font-size: 12px;
  color: white;
  text-decoration: underline;
}

.close-btn {
  background: transparent;
  border: none;
  color: white;
  border-radius: 6px;
  width: 32px;
  height: 32px;
  cursor: pointer;
  transition: all .5s ease-out;
}

.close-btn:hover{
    color: darkblue;
}
.detail-panel > :not(.panel-header) {
  padding: 16px;
}
.panel-section {
  background: #f1f2f3;
  border-radius: 10px;
  padding: 12px;
  margin-bottom: 12px;
}

.panel-section strong {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
}

.panel-section p {
  margin: 4px 0 0;
  font-size: 13px;
  color: #374151;
}.panel-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  border-top: 1px solid #e5e7eb;
  padding: 16px;
  margin-top: auto;
}

.primary {
  background: #2563eb;
  color: white;
  border: none;
  padding: 6px 14px;
  border-radius: 6px;
  font-size: 13px;
}

.danger {
  background: #ef4444;
  color: white;
  border: none;
  padding: 6px 14px;
  border-radius: 6px;
  font-size: 13px;
}

@keyframes slideIn {
  from {
    transform: translateX(16px);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

.comment-textarea {
  width: 100%;
  resize: vertical;
  border-radius: 8px;
  border: 1px solid #d1d5db;
  padding: 10px;
  font-size: 13px;
  font-family: inherit;
  background: white;
  transition: border-color 0.2s ease;
}

.comment-textarea:focus {
  outline: none;
  border-color: #2563eb;
}

.status-wrapper {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-top: 20px;
}
.status-wrapper label {
  font-size: 14px;
  font-weight: 600;
  color: #475569;
}
.status-select {
  padding: 12px;
  border-radius: 10px;
  border: 1px solid #cbd5e1;
  font-weight: 600;
  font-size: 14px;
  transition: 0.25s ease;
}
.status-select.Aangevraagd {
  background: #fef3c7;
}
.status-select.Bevestigd {
  background: #dbeafe;
}
.status-select.Leveren {
  background: #fde68a;
}
.status-select.Geleverd {
  background: #d1fae5;
}
.status-select.Opgehaald {
  background: #d1fae5;
}
.status-select.Afgewerkt {
  background: #44f097;
}
.status-select:focus {
  border-color: #4f73ff;
  box-shadow: 0 0 0 4px rgba(79, 115, 255, 0.25);
  outline: none;
}

.buttons{
    display: flex;
    justify-content: end;
    margin-top: 1rem;
}

.toevoegen-btn,
.danger-btn,
.download {
  width: auto;
  padding: 9px 16px;
  border-radius: 10px;
  font-weight: 600;
  cursor: pointer;
  transition: 0.25s ease;
}
.toevoegen-btn {
  background: #4f73ff;
  color: white;
  border: none;
  margin-right: .5rem;
}
.toevoegen-btn:hover {
  background: #355dff;
  box-shadow: 0 4px 14px rgba(79, 115, 255, 0.25);
}
.download {
  background: #696d72;
  border: none;
  color: white;
}
.danger-btn {
  background: #ef4444;
  border: none;
  color: white;
}
.danger-btn:hover {
  background: #dc2626;
  box-shadow: 0 4px 14px rgba(239, 68, 68, 0.25);
}
</style>