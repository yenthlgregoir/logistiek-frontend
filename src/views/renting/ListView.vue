<template>
  <div class="page">
    <div class="page-header">
      <h1>Archief</h1>

      <input v-model="search" type="text" placeholder="Zoeken…" class="search-input" />
    </div>

    <!-- FILTERS -->
    <div class="filters">
      <!-- DATE -->
      <DropdownChip
        v-model="customerFilter"
        :options="companies?.items || []"
        value-key="_id"
        label-key="naam"
        title = "Klant"
      />

      <!-- CUSTOMER AUTOCOMPLETE -->
      <DropdownChip v-model="statusFilter" :options="statusOptions"  title = "Status"/>

      <!-- STATUS AUTOCOMPLETE -->
      <DropdownChip
        v-model="toestelTypeFilter"
        :options="toestelType?.types || []"
        value-key="_id"
        label-key="naam"
        title = "Type"
      />
      <DateRangeChip
  v-model="dateRangeFilter"
  title="Periode"
/>
      <button class="reset" @click="resetFilters">Reset all</button>
    </div>

    <p class="results">showing {{ store.boekingen.length }} results</p>

    <div class="devider" />

    <div class="content">
      <!-- TABLE -->
      <div
        class="table-wrapper"
        :class="{ collapsed: store.currentBoeking }"
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
              :class="{ active: store.currentBoeking?._id === item._id }"
              @click="openBooking(item, $event)"
            >
              <td class="ref">{{ item.ref }}</td>
              <td>{{ item.toestel?.Ref || 'Niet toegewezen' }}</td>
              <td class="adres-cell">
                <Transition name="fade-slide" mode="out-in">
                  <span :key="!!store.currentBoeking" class="adres-text">
                    {{
                      store.currentBoeking
                        ? item.leverAdresDetails?.naam || item.klant?.naam
                        : formatAdres(item)
                    }}
                  </span>
                </Transition>
              </td>
              <td>{{ formatPeriode(item) }}</td>
              <td>
                <span class="status" :class="item.status"> ● {{ item.status }} </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- PANEL -->
      <div v-if="showPanel" class="detail-panel"    :class="`from-${rowPosition}`"
:style="{ '--from-y': panelOffsetY + 'px' }">
        <div class="panel-header">
          <div>
            <section id="panel-title">
              <h3>AB InBev Leuven</h3>
              <button class="close-btn" @click="closeBooking">✕</button>
            </section>

            <section id="panel-sub">
              <span class="panel-ref"> Ref: {{ store.currentBoeking.ref }} </span>
              <button v-on:click="toPDF">
                <Download></Download>
                Download leverbon
              </button>
            </section>
          </div>
        </div>

        <div class="panels">
          <div class="panel-section">
            <strong>Leveradres</strong>
            <p>{{ formatAdres(store.currentBoeking) }}</p>
          </div>

          <div class="panel-section">
            <strong>Periode</strong>
            <p>{{ formatPeriode(store.currentBoeking) }}</p>
          </div>

          <div class="panel-section">
            <strong>Toestel</strong>
            <p>{{ store.currentBoeking.toestel?.Ref || 'niet toegewezen' }}</p>
          </div>

          <div class="panel-section">
            <strong>Transport</strong>
            <p>{{ store.currentBoeking.type }}</p>
          </div>

          <div class="comment-section">
            <strong>Comment</strong>
            <textarea
              v-model="store.currentBoeking.comment"
              class="comment-textarea"
              placeholder="Voeg hier een comment toe…"
              rows="4"
            />
          </div>

          <div class="status-wrapper">
            <label>Status</label>
            <select
              v-model="store.currentBoeking.status"
              class="status-select"
              :class="store.currentBoeking.status"
            >
              <option value="Aangevraagd">Aangevraagd</option>
              <option value="Bevestigd">Bevestigd</option>
              <option value="Geleverd">Geleverd</option>
              <option value="Afgewerkt">Afgewerkt</option>
              <option value="Leveren">Leveren</option>
            </select>
          </div>

          <div class="buttons">
            <button class="toevoegen-btn" @click="saveBooking">Opslaan</button>
            <button class="danger-btn" @click = "deleteBooking">Verwijderen</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch, computed } from 'vue'
import { useDebounceFn } from '@vueuse/core'
import { useBoekingenStore } from '@/stores/renting/boekingen.store.js'
import { klantApi } from '@/api/klant.js'
import { toestelApi } from '@/api/toestel.js'
import DropdownChip from '@/components/base/FilterChip.vue'
import { Download } from 'lucide-vue-next'
import { uploadApi } from '@/api/upload.js'
import DateRangeChip from '@/components/base/DateRangeChip.vue'
const store = useBoekingenStore()

const search = computed({
  get: () => store.search,
  set: (val) => {
    store.search = val
  },
})
const showPanel = ref(false)
const panelOffsetY = ref(0)
const isAnimating = ref(false)

const companies = ref([])
const statusOptions = [
  { _id: 'Aangevraagd', naam: 'Aangevraagd' },
  { _id: 'Bevestigd', naam: 'Bevestigd' },
  { _id: 'Geleverd', naam: 'Geleverd' },
  { _id: 'Afgewerkt', naam: 'Afgewerkt' },
]

const toestelType = ref([])
const customerFilter = computed({
  get: () => store.selectedKlant,
  set: (val) => {
    store.selectedKlant = val
    reload()
  },
})

const statusFilter = computed({
  get: () => store.selectedStatus,
  set: (val) => {
    store.selectedStatus = val
    reload()
  },
})

const toestelTypeFilter = computed({
  get: () => store.selectedType,
  set: (val) => {
    store.selectedType = val
    reload()
  },
})

const dateRangeFilter = computed({
  get: () => store.dateRange,
  set: (val) => {
    store.dateRange = val
    reload()
  },
})
/**
 * RESET
 */
function resetFilters() {
  store.search = ''
  store.selectedKlant = null
  store.selectedStatus = null
  store.selectedType = null
  store.dateRange = [null, null]

  reload()
}

const reload = useDebounceFn(() => {
  closeBooking()
  store.loadBoekingen()
}, 300)

watch(search, reload)

/**
 * PANEL
 */
const rowPosition = ref('middle') // 'top' | 'middle' | 'bottom'

function openBooking(item, event) {
  const rowRect = event.currentTarget.getBoundingClientRect()
  const viewportHeight = window.innerHeight


  if (rowRect.top < viewportHeight * 0.3) {
    rowPosition.value = 'top'
  } else if (rowRect.top > viewportHeight * 0.7) {
    rowPosition.value = 'bottom'
  } else {
    rowPosition.value = 'middle'
  }

  panelOffsetY.value = rowRect.top - 120

  store.currentBoeking = item
  isAnimating.value = true
}

function closeBooking() {
  store.currentBoeking = null
  showPanel.value = false
}

function onTableTransitionEnd(e) {
  if (e.propertyName !== 'width') return
  if (!store.currentBoeking) return

  showPanel.value = true
  isAnimating.value = false
}

/**
 * FORMATTERS
 */
function formatAdres(boeking) {
  const adres = boeking.leverAdresDetails || boeking.klant?.factuurAdres
  if (!adres) return 'Onbekende klant'

  return `${adres.naam || boeking.klant?.naam || ''}: ${adres.straat || ''} ${adres.huisnummer || ''}, ${adres.postcode || ''} ${adres.gemeente || ''}`
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

async function getFilters() {
  companies.value = await klantApi.list()
  toestelType.value = await toestelApi.getTypes()
}

async function saveBooking() {
  if (!store.currentBoeking) return

  try {
    await store.changeStatus(store.currentBoeking._id, store.currentBoeking.status)

    await store.saveComment(store.currentBoeking._id, store.currentBoeking.comment)

    await store.loadBoekingen(false)
    closeBooking()
  } catch (err) {
    console.error(err)
  }
}
async function deleteBooking(){
  if(!store.currentBoeking) return
  try {
    await store.deleteBoeking(store.currentBoeking._id)
    closeBooking();
  }
  catch(err){
    console.log(err);
  }
  
}
async function toPDF() {
  const blob = await uploadApi.exportBoeking(store.currentBoeking._id)
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'boekingen.pdf'
  a.click()
  window.URL.revokeObjectURL(url)
}

/**
 * INIT
 */
onMounted(async () => {
  store.resetFilters()
  store.currentViewMode = 'archief'
  await store.loadBoekingen()
  await getFilters()
})

onUnmounted(() => {
  store.currentBoeking = null
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
.devider {
  height: 1px;
  width: 100%;
  padding-left: 10%;
  padding-right: 10%;
  background-color: #f1f5f9;
}
.table-wrapper {
  width: 100%;
  transition: width 0.7s ease;
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
  border-top: 1px solid #007bf7;
  border-bottom: 1px solid #007bf7;
  color: #007bf7;
  background-color: #b7dbff;
  cursor: pointer;
}

.ref {
  font-weight: 600;
}

.status {
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
  background: #fff;
  border-radius: 12px;
  border: 1px solid #ddd;
  margin-top: 2.5rem;

  transform-origin: center;
  animation: panelIn 0.35s ease;
}

/* 🔵 FROM TOP → slide DOWN */
.detail-panel.from-top {
  animation: slideFromTop 0.35s ease;
}

@keyframes slideFromTop {
  from {
    transform: translateY(-40px) scale(0.98);
    opacity: 0;
  }
  to {
    transform: translateY(0) scale(1);
    opacity: 1;
  }
}

/* 🔵 FROM BOTTOM → slide UP */
.detail-panel.from-bottom {
  animation: slideFromBottom 0.35s ease;
}

@keyframes slideFromBottom {
  from {
    transform: translateY(40px) scale(0.98);
    opacity: 0;
  }
  to {
    transform: translateY(0) scale(1);
    opacity: 1;
  }
}

/* 🔵 FROM MIDDLE → SPLIT LEFT/RIGHT */
.detail-panel.from-middle {
  animation: splitFromCenter 0.4s ease;
}

@keyframes splitFromCenter {
  0% {
    transform: scaleX(0.6) scaleY(0.95);
    opacity: 0;
    filter: blur(4px);
  }
  60% {
    transform: scaleX(1.05) scaleY(1);
    opacity: 1;
    filter: blur(0px);
  }
  100% {
    transform: scaleX(1) scaleY(1);
  }
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
.panel-header > div {
  flex: 1;
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
  transition: all 0.5s ease-out;
}

.close-btn:hover {
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
}
.panel-actions {
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

.buttons {
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
  margin-right: 0.5rem;
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
#panel-sub,
#panel-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}
#panel-sub {
  margin-top: 0.5rem;
}
#panel-sub button {
  display: flex;
  align-items: center;
  gap: 6px;

  background-color: transparent;
  border: none;
  color: white;

  font-size: 13px;
  font-weight: 500;

  text-decoration: underline;
  text-underline-offset: 2px;

  padding: 0;
}
#panel-sub button svg {
  width: 14px;
  height: 14px;

  flex-shrink: 0;
  stroke-width: 2.2;
}
#panel-sub button:hover {
  cursor: pointer;
  color: rgb(209, 207, 207);
}
.active {
  border-top: 1px solid #007bf7;
  border-bottom: 1px solid #007bf7;
  color: #007bf7;
  background-color: #b7dbff;
}

.itemRow {
  cursor: pointer;
  transition: all 0.2s ease;
}

.itemRow.active {
  border-top: 1px solid #007bf7;
  border-bottom: 1px solid #007bf7;
  background: #b7dbff;
  color: #007bf7;
  position: relative;
  z-index: 1;
}

.itemRow.active::after {
  content: '';
  position: absolute;
  right: -15px;
  top: 50%;
  transform: translateY(-50%);

  width: 0;
  height: 0;

  border-top: 8px solid transparent;
  border-bottom: 8px solid transparent;
  border-left: 10px solid #007bf7;
}

.adres-cell {
  max-width: 220px;
}

.adres-text {
  display: block;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* ENTER */
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition:
    opacity 0.4s ease,
    transform 0.4s ease;
}

/* START */
.fade-slide-enter-from {
  opacity: 0;
  transform: translateY(4px);
}

/* END */
.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>
