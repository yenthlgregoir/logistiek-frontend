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
      <!-- KLANT -->
      <DropdownChip
        v-model="customerFilter"
        :options="companies?.items || []"
        value-key="_id"
        label-key="naam"
        title="Klant"
      />

      <!-- STATUS -->
      <DropdownChip
        v-model="statusFilter"
        :options="statusOptions"
        title="Status"
      />

      <!-- TYPE -->
      <DropdownChip
        v-model="toestelTypeFilter"
        :options="toestelType?.types || []"
        value-key="_id"
        label-key="naam"
        title="Type"
      />

      <!-- PERIODE -->
      <DateRangeChip
        v-model="dateRangeFilter"
        title="Periode"
      />

      <button
        class="reset"
        @click="resetFilters"
      >
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
              :key="item._id"
              class="itemRow"
              :class="{
                active: store.currentBoeking?._id === item._id,
              }"
              @click="openBooking(item, $event)"
            >
              <td class="ref">
                {{ item.ref }}
              </td>

              <td>
                {{ item.toestel?.Ref || 'Niet toegewezen' }}
              </td>

              <td class="adres-cell">
                <Transition
                  name="fade-slide"
                  mode="out-in"
                >
                  <span
                    :key="!!store.currentBoeking"
                    class="adres-text"
                  >
                    {{
                      store.currentBoeking
                        ? item.leverAdresDetails?.naam ||
                          item.klant?.naam
                        : formatAdres(item)
                    }}
                  </span>
                </Transition>
              </td>

              <td>
                {{ formatPeriode(item) }}
              </td>

              <td>
                <span
                  class="status"
                  :class="item.status"
                >
                  ● {{ item.status }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- DETAIL PANEL -->
      <div
        v-if="showPanel && store.currentBoeking"
        class="detail-panel"
        :class="`from-${rowPosition}`"
        :style="{ '--from-y': panelOffsetY + 'px' }"
      >
        <div class="panel-header">
          <div>
            <section id="panel-title">
              <h3>
                {{
                  store.currentBoeking.leverAdresDetails?.naam ||
                  store.currentBoeking.klant?.naam ||
                  'Boeking'
                }}
              </h3>

              <button
                class="close-btn"
                @click="closeBooking"
              >
                ✕
              </button>
            </section>

            <section id="panel-sub">
              <span class="panel-ref">
                Ref: {{ store.currentBoeking.ref }}
              </span>

              <button @click="toPDF">
                <Download />
                Download leverbon
              </button>
            </section>
          </div>
        </div>

        <div class="panels">
          <!-- LEVERADRES -->
          <div class="panel-section">
            <strong>Leveradres</strong>

            <p>
              {{ formatAdres(store.currentBoeking) }}
            </p>
          </div>

          <!-- PERIODE -->
          <div class="panel-section">
            <strong>Periode</strong>

            <p>
              {{ formatPeriode(store.currentBoeking) }}
            </p>
          </div>

          <!-- TOESTEL -->
          <div class="panel-section">
            <strong>Toestel</strong>

            <p>
              {{
                store.currentBoeking.toestel?.Ref ||
                'Niet toegewezen'
              }}
            </p>
          </div>

          <!-- TRANSPORT -->
          <div class="panel-section">
            <strong>Transport</strong>

            <p>
              {{ store.currentBoeking.type || '-' }}
            </p>
          </div>

          <!-- COMMENT -->
          <div class="panel-section">
            <strong>Comment</strong>

            <p class="comment-display">
              {{
                store.currentBoeking.comment ||
                'Geen comment'
              }}
            </p>
          </div>

          <!-- STATUS -->
          <div class="panel-section">
            <strong>Status</strong>

            <p>
              <span
                class="status"
                :class="store.currentBoeking.status"
              >
                ● {{ store.currentBoeking.status }}
              </span>
            </p>
          </div>

          <!-- BUTTONS -->
          <div class="buttons">
            <button
              class="toevoegen-btn"
              @click="openEditModal"
            >
              Bewerken
            </button>

            <button
              class="danger-btn"
              @click="deleteBookingFromPanel"
            >
              Verwijderen
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- BOEKING MODAL -->
    <BoekingModal
      v-if="showBoekingModal"
      :boekingId="selectedBoekingId"
      @close="closeBoekingModal"
      @update="refreshBoekingen"
      @assignToestel="openVrijeToestellenModal"
      @verwijderen="deleteBoeking"
      @save="saveComment"
    />

    <!-- VRIJE TOESTELLEN -->
    <VrijToestellenModal
      v-if="showVrijeToestellenModal"
      :toestellen="store.vrijeToestellen"
      @select="assignToestel"
      @close="showVrijeToestellenModal = false"
    />
  </div>
</template>

<script setup>
import {
  ref,
  onMounted,
  onUnmounted,
  watch,
  computed,
} from 'vue'

import { useDebounceFn } from '@vueuse/core'
import { Download } from 'lucide-vue-next'

import { useBoekingenStore } from '@/stores/renting/boekingen.store.js'

import { klantApi } from '@/api/klant.js'
import { toestelApi } from '@/api/toestel.js'
import { uploadApi } from '@/api/upload.js'

import DropdownChip from '@/components/base/FilterChip.vue'
import DateRangeChip from '@/components/base/DateRangeChip.vue'

import BoekingModal from '@/components/renting/agenda/BoekingModal.vue'
import VrijToestellenModal from '@/components/renting/agenda/VrijToestellenModal.vue'

const store = useBoekingenStore()

// =========================
// SEARCH
// =========================

const search = computed({
  get: () => store.search,

  set: (val) => {
    store.search = val
  },
})

// =========================
// PANEL STATE
// =========================

const showPanel = ref(false)
const panelOffsetY = ref(0)
const isAnimating = ref(false)

const rowPosition = ref('middle')

// =========================
// MODAL STATE
// =========================

const showBoekingModal = ref(false)
const showVrijeToestellenModal = ref(false)

const selectedBoekingId = ref(null)

// =========================
// FILTER DATA
// =========================

const companies = ref([])
const toestelType = ref([])

const statusOptions = [
  {
    _id: 'Aangevraagd',
    naam: 'Aangevraagd',
  },
  {
    _id: 'Bevestigd',
    naam: 'Bevestigd',
  },
  {
    _id: 'Leveren',
    naam: 'Leveren',
  },
  {
    _id: 'Geleverd',
    naam: 'Geleverd',
  },
  {
    _id: 'Opgehaald',
    naam: 'Opgehaald',
  },
  {
    _id: 'Afgewerkt',
    naam: 'Afgewerkt',
  },
]

// =========================
// FILTER COMPUTEDS
// =========================

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

// =========================
// RESET FILTERS
// =========================

function resetFilters() {
  store.search = ''
  store.selectedKlant = null
  store.selectedStatus = null
  store.selectedType = null
  store.dateRange = [null, null]

  reload()
}

// =========================
// RELOAD
// =========================

const reload = useDebounceFn(async () => {
  closeBooking()

  await store.loadBoekingen()
}, 300)

watch(search, reload)

// =========================
// DETAIL PANEL
// =========================

function openBooking(item, event) {
  const rowRect =
    event.currentTarget.getBoundingClientRect()

  const viewportHeight =
    window.innerHeight

  if (
    rowRect.top <
    viewportHeight * 0.3
  ) {
    rowPosition.value = 'top'
  } else if (
    rowRect.top >
    viewportHeight * 0.7
  ) {
    rowPosition.value = 'bottom'
  } else {
    rowPosition.value = 'middle'
  }

  panelOffsetY.value =
    rowRect.top - 120

  store.currentBoeking = item

  isAnimating.value = true
}

function closeBooking() {
  store.currentBoeking = null

  showPanel.value = false
  isAnimating.value = false
}

function onTableTransitionEnd(event) {
  if (
    event.propertyName !== 'width'
  ) {
    return
  }

  if (!store.currentBoeking) {
    return
  }

  showPanel.value = true
  isAnimating.value = false
}

// =========================
// OPEN EDIT MODAL
// =========================

function openEditModal() {
  if (!store.currentBoeking?._id) {
    return
  }

  selectedBoekingId.value =
    store.currentBoeking._id

  showBoekingModal.value = true
}

// =========================
// CLOSE BOEKING MODAL
// =========================

async function closeBoekingModal() {
  const id =
    selectedBoekingId.value

  showBoekingModal.value = false

  await refreshBoekingen(id)
}

// =========================
// VRIJE TOESTELLEN
// =========================

async function openVrijeToestellenModal(id) {
  selectedBoekingId.value = id

  await store.openVrijeToestellen(id)

  showVrijeToestellenModal.value = true
}

// =========================
// ASSIGN TOESTEL
// =========================

async function assignToestel(toestel) {
  try {
    await store.assignToestel(toestel)

    showVrijeToestellenModal.value = false
    showBoekingModal.value = false

    await refreshBoekingen(
      selectedBoekingId.value,
    )
  } catch (err) {
    console.error(
      'Toestel toewijzen mislukt:',
      err,
    )
  }
}

// =========================
// SAVE COMMENT
// =========================

async function saveComment(payload) {
  if (!selectedBoekingId.value) {
    return
  }

  try {
    await store.saveComment(
      selectedBoekingId.value,
      payload.comment,
    )

    showBoekingModal.value = false

    await refreshBoekingen(
      selectedBoekingId.value,
    )
  } catch (err) {
    console.error(
      'Comment opslaan mislukt:',
      err,
    )
  }
}

// =========================
// DELETE FROM MODAL
// =========================

async function deleteBoeking() {
  try {
    await store.deleteBoeking()

    showBoekingModal.value = false
    showVrijeToestellenModal.value = false

    selectedBoekingId.value = null

    closeBooking()

    await store.loadBoekingen(false)
  } catch (err) {
    console.error(
      'Boeking verwijderen mislukt:',
      err,
    )
  }
}

// =========================
// DELETE FROM SIDE PANEL
// =========================

async function deleteBookingFromPanel() {
  if (!store.currentBoeking) {
    return
  }

  const confirmed =
    window.confirm(
      'Weet je zeker dat je deze boeking wilt verwijderen? Dit kan niet ongedaan gemaakt worden.',
    )

  if (!confirmed) {
    return
  }

  try {
    /*
     * currentBoeking staat al op de juiste boeking.
     * Dit volgt dezelfde store-flow als je Planning.
     */
    await store.deleteBoeking()

    closeBooking()

    await store.loadBoekingen(false)
  } catch (err) {
    console.error(
      'Boeking verwijderen mislukt:',
      err,
    )
  }
}

// =========================
// REFRESH
// =========================

async function refreshBoekingen(
  bookingId = selectedBoekingId.value,
) {
  try {
    await store.loadBoekingen(false)

    if (!bookingId) {
      return
    }

    const updatedBooking =
      store.boekingen.find(
        (boeking) =>
          boeking._id === bookingId,
      )

    if (updatedBooking) {
      store.currentBoeking =
        updatedBooking
    }
  } catch (err) {
    console.error(
      'Boekingen herladen mislukt:',
      err,
    )
  }
}

// =========================
// FORMATTERS
// =========================

function formatAdres(boeking) {
  if (!boeking) {
    return ''
  }

  const adres =
    boeking.leverAdresDetails ||
    boeking.klant?.factuurAdres

  if (!adres) {
    return 'Onbekende klant'
  }

  const naam =
    adres.naam ||
    boeking.klant?.naam ||
    ''

  const straat =
    adres.straat || ''

  const huisnummer =
    adres.huisnummer || ''

  const postcode =
    adres.postcode || ''

  const gemeente =
    adres.gemeente || ''

  return `${naam}: ${straat} ${huisnummer}, ${postcode} ${gemeente}`
}

function formatDate(dateString) {
  if (!dateString) {
    return ''
  }

  const date =
    new Date(dateString)

  if (
    Number.isNaN(date.getTime())
  ) {
    return dateString
  }

  return `${String(
    date.getDate(),
  ).padStart(2, '0')}/${String(
    date.getMonth() + 1,
  ).padStart(2, '0')}/${date.getFullYear()}`
}

function formatPeriode(boeking) {
  if (!boeking) {
    return ''
  }

  const begin =
    boeking.beginDatumFormatted ||
    formatDate(boeking.beginDatum)

  const eind =
    boeking.eindDatumFormatted ||
    formatDate(boeking.eindDatum)

  return begin && eind
    ? `${begin} - ${eind}`
    : ''
}

// =========================
// FILTER DATA
// =========================

async function getFilters() {
  try {
    companies.value =
      await klantApi.list()

    toestelType.value =
      await toestelApi.getTypes()
  } catch (err) {
    console.error(
      'Filters laden mislukt:',
      err,
    )
  }
}

// =========================
// PDF
// =========================

async function toPDF() {
  if (!store.currentBoeking?._id) {
    return
  }

  try {
    const blob =
      await uploadApi.exportBoeking(
        store.currentBoeking._id,
      )

    const url =
      window.URL.createObjectURL(blob)

    const anchor =
      document.createElement('a')

    anchor.href = url

    anchor.download =
      `boeking-${
        store.currentBoeking.ref ||
        store.currentBoeking._id
      }.pdf`

    document.body.appendChild(
      anchor,
    )

    anchor.click()
    anchor.remove()

    window.URL.revokeObjectURL(url)
  } catch (err) {
    console.error(
      'PDF downloaden mislukt:',
      err,
    )
  }
}

// =========================
// INIT
// =========================

onMounted(async () => {
  store.resetFilters()

  store.currentViewMode =
    'archief'

  await store.loadBoekingen()

  await getFilters()
})

// =========================
// CLEANUP
// =========================

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

.itemRow {
  cursor: pointer;
  transition: all 0.2s ease;
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

.ref {
  font-weight: 600;
}

/* =========================
   STATUS
   ========================= */

.status {
  display: inline-block;

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

/* =========================
   DETAIL PANEL
   ========================= */

.detail-panel {
  flex-shrink: 0;

  width: 380px;
  height: fit-content;

  background: #fff;

  border-radius: 12px;
  border: 1px solid #ddd;

  margin-top: 2.5rem;

  transform-origin: center;

  animation: panelIn 0.35s ease;
}

.detail-panel.from-top {
  animation: slideFromTop 0.35s ease;
}

@keyframes slideFromTop {
  from {
    transform:
      translateY(-40px)
      scale(0.98);

    opacity: 0;
  }

  to {
    transform:
      translateY(0)
      scale(1);

    opacity: 1;
  }
}

.detail-panel.from-bottom {
  animation:
    slideFromBottom
    0.35s ease;
}

@keyframes slideFromBottom {
  from {
    transform:
      translateY(40px)
      scale(0.98);

    opacity: 0;
  }

  to {
    transform:
      translateY(0)
      scale(1);

    opacity: 1;
  }
}

.detail-panel.from-middle {
  animation:
    splitFromCenter
    0.4s ease;
}

@keyframes splitFromCenter {
  0% {
    transform:
      scaleX(0.6)
      scaleY(0.95);

    opacity: 0;
    filter: blur(4px);
  }

  60% {
    transform:
      scaleX(1.05)
      scaleY(1);

    opacity: 1;
    filter: blur(0);
  }

  100% {
    transform:
      scaleX(1)
      scaleY(1);
  }
}

/* =========================
   PANEL HEADER
   ========================= */

.panel-header {
  background: #4f7ff7;
  color: white;

  padding: 16px;

  display: flex;
  justify-content: space-between;

  gap: 12px;

  border-radius:
    12px 12px 0 0;
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

.close-btn {
  background: transparent;
  border: none;
  color: white;

  border-radius: 6px;

  width: 32px;
  height: 32px;

  cursor: pointer;

  transition:
    all 0.2s ease-out;
}

.close-btn:hover {
  color: darkblue;
}

.detail-panel
  > :not(.panel-header) {
  padding: 16px;
}

/* =========================
   PANEL SECTIONS
   ========================= */

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

.comment-display {
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}

/* =========================
   BUTTONS
   ========================= */

.buttons {
  display: flex;
  justify-content: flex-end;

  margin-top: 1rem;
}

.toevoegen-btn,
.danger-btn {
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

  box-shadow:
    0 4px 14px
    rgba(79, 115, 255, 0.25);
}

.danger-btn {
  background: #ef4444;
  color: white;

  border: none;
}

.danger-btn:hover {
  background: #dc2626;

  box-shadow:
    0 4px 14px
    rgba(239, 68, 68, 0.25);
}

/* =========================
   PANEL TITLE / SUB
   ========================= */

#panel-sub,
#panel-title {
  display: flex;

  justify-content:
    space-between;

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

  background-color:
    transparent;

  border: none;

  color: white;

  font-size: 13px;
  font-weight: 500;

  text-decoration:
    underline;

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

  color:
    rgb(209, 207, 207);
}

/* =========================
   ADDRESS
   ========================= */

.adres-cell {
  max-width: 220px;
}

.adres-text {
  display: block;

  white-space: nowrap;

  overflow: hidden;

  text-overflow:
    ellipsis;
}

/* =========================
   TRANSITION
   ========================= */

.fade-slide-enter-active,
.fade-slide-leave-active {
  transition:
    opacity 0.4s ease,
    transform 0.4s ease;
}

.fade-slide-enter-from {
  opacity: 0;

  transform:
    translateY(4px);
}

.fade-slide-leave-to {
  opacity: 0;

  transform:
    translateY(-4px);
}

/* =========================
   RESPONSIVE
   ========================= */

@media (max-width: 1000px) {
  .content {
    flex-direction: column;
  }

  .table-wrapper.collapsed {
    width: 100%;
  }

  .detail-panel {
    width: 100%;
    margin-top: 1rem;
  }

  .itemRow.active::after {
    display: none;
  }
}

@media (max-width: 768px) {
  .page {
    padding: 16px;
  }

  .page-header {
    display: block;
  }

  .search-input {
    position: static;

    transform: none;

    margin-top: 12px;

    max-width: none;

    box-sizing: border-box;
  }

  .content {
    overflow-x: auto;
  }

  table {
    min-width: 700px;
  }
}
</style>