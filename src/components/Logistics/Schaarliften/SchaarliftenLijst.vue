<template>
  <div class="page" :aria-busy="loading">
    <!-- Toolbar -->
    <div class="toolbar">
      <SearchBar
        v-model="searchQuery"
        placeholder="Zoek"
        width="300px"
        icon="fa fa-search"
        @update:modelValue="$emit('search', $event)"
      />

      <div class="buttons">
        <button type="button" class="btn btn-primary btn1" :disabled="exporting" @click="emit('toPDF')">
          {{ exporting ? 'PDF maken…' : 'PDF exporteren' }}
        </button>
        <button type="button" class="btn btn-primary" @click="emit('openAdd')">
          + Asset
        </button>
      </div>
    </div>

    <!-- Table -->
    <ExpandedBaseTable
      :items="assets"
      :expand-on-row-click="true"
      :rowStyle="rowStyle"
      columns="1fr 1fr 1fr 1fr 1fr 1fr"
      itemKey="id"
    >
      <!-- HEADER -->
      <template #header>
        <div>nummer</div>
        <div>type</div>
        <div>serienummer</div>
        <div>werkhoogte</div>
        <div>Locatie</div>
        <div class="right">status</div>
      </template>

      <!-- ROW -->
      <template #row="{ item }">
  <div>
    {{ item.nummer || item.naam }}
  </div>

  <div>{{ typeName(item) }}</div>
  <div>{{ item.serienummer || '-' }}</div>
  <div>{{ isSchaarlift(item) ? heightLabel(item.werkhoogte) : '—' }}</div>
  <div>{{getWerf(item) }}</div>
  <div class="right">
    <span :class="['status', statusClass(item)]">
      {{ statusLabel(item) }}
    </span>
  </div>
</template>

      <!-- EXPANDED -->
      <template #expanded="{ item }">
        <div class="expanded-row-container">
          <!-- LEFT -->
          <div class="expanded-left">
            <div class="section-header">
              <div class="section-title">Asset info</div>
              <button type="button" class="edit-btn" aria-label="Asset bewerken" @click.stop="editAsset(item)">Bewerken</button>
            </div>

            <div class="divider"></div>

            <div class="info-grid">
              <div class="column">
                <div><strong>nummer</strong></div>
                <div>{{ item.nummer || item.naam }}</div>

                <div><strong>type</strong></div>
                <div>{{ typeName(item) }}</div>

                <div><strong>serienummer</strong></div>
                <div>{{ item.serienummer || '-' }}</div>
              </div>

              <div v-if="isSchaarlift(item)" class="column">
                <div><strong>werkhoogte</strong></div>
                <div>{{ heightLabel(item.werkhoogte) }}</div>

                <div><strong>platformhoogte</strong></div>
                <div>{{ heightLabel(item.platformhoogte) }}</div>

                <div><strong>bouwjaar</strong></div>
                <div>{{ item.bouwjaar || '-' }}</div>
              </div>

              <div class="comments">
                <div class="comments-title"><strong>Opmerking</strong></div>
                <div class="comments-text">
                  {{ item.comment || 'Geen opmerking' }}
                </div>
              </div>

              <!-- KEURING -->
              <div v-if="isSchaarlift(item)" class="keuring">
                <div class="keuring-title"><strong>Keuring</strong></div>

                <div v-if="daysUntilKeuring(item.keuringDatum) === null" class="missing-date">Geen geldige keuringsdatum ingesteld</div>
                <div v-else-if="isKeuringVerlopen(item.keuringDatum)" class="expired-text">
                  Keuring verlopen {{ formatDate(item.keuringDatum) }}
                </div>

                <template v-else>
                  <div class="keuring-data">
                    <div>{{ daysUntilKeuring(item.keuringDatum) }} dagen</div>
                    <div>{{ formatDate(item.keuringDatum) }}</div>
                  </div>

                  <progress :value="progressValue(item.keuringDatum)" max="365" aria-label="Verstreken deel van een keuringsperiode van 365 dagen" />
                </template>
              </div>
            </div>
          </div>

          <!-- RIGHT -->
          <div class="expanded-right">
            <div class="section-header">
              <div class="section-title">Boekingen</div>
            </div>

            <div class="divider"></div>

            <div v-if="item.huidigeBoekingen?.length">
              <div
                v-for="(b, i) in item.huidigeBoekingen"
                :key="b.id ?? b._id ?? i"
                class="boeking-grid"
              >
                <div class="column">
                  <div><strong>leverdatum</strong></div>
                  <div>{{ formatDate(b.leverDatum) }}</div>

                  <div><strong>ophaaldatum</strong></div>
                  <div>{{ formatDate(b.ophaalDatum) || 'Geen' }}</div>

                  <div><strong>reference</strong></div>
                  <div>{{ b.reference }}</div>
                </div>

                <div class="column">
                  <div><strong>projectleider</strong></div>
                  <div>{{ b.projectleider?.naam || '-' }}</div>

                  <div><strong>werf</strong></div>
                  <div>{{ b.werf?.naam || '-' }}</div>
                </div>
              </div>
            </div>

            <div v-else class="coming-soon-placeholder">
              Geen boekingen
            </div>
          </div>
        </div>
      </template>
    </ExpandedBaseTable>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import ExpandedBaseTable from '@/components/base/ExpandedBaseTable.vue'
import SearchBar from '@/components/base/SearchBar.vue'

const props = defineProps({ assets: { type: Array, default: () => [] }, loading: Boolean, exporting: Boolean })
const emit = defineEmits(['search', 'openAdd', 'edit-asset', 'toPDF'])
const searchQuery = ref('')
const DAY = 86400000
function calendarDay(value) {
  if (value == null || value === '') return null
  if (typeof value === 'string') {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
    if (match) {
      const [, year, month, day] = match.map(Number)
      const date = new Date(0)
      date.setUTCFullYear(year, month - 1, day)
      date.setUTCHours(0, 0, 0, 0)
      return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day ? date.getTime() / DAY : null
    }
  }
  if (!(value instanceof Date) && typeof value !== 'string' && typeof value !== 'number') return null
  const date = new Date(value)
  if (!Number.isFinite(date.getTime())) return null
  const localDay = new Date(0)
  localDay.setUTCFullYear(date.getFullYear(), date.getMonth(), date.getDate())
  localDay.setUTCHours(0, 0, 0, 0)
  return localDay.getTime() / DAY
}
const today = ref(calendarDay(new Date()))
let midnightTimer
function updateToday() {
  today.value = calendarDay(new Date())
  const next = new Date()
  next.setHours(24, 0, 0, 0)
  midnightTimer = setTimeout(updateToday, Math.max(1000, next.getTime() - Date.now() + 100))
}
onMounted(updateToday)
onBeforeUnmount(() => clearTimeout(midnightTimer))

function bookingState(bookings) {
  let active = null
  let next = null
  for (const booking of Array.isArray(bookings) ? bookings : []) {
    if (!booking) continue
    const status = String(booking.status ?? '').trim().toUpperCase()
    if (['AFGEWERKT', 'OPGEHAALD', 'GEANNULEERD'].includes(status)) continue
    const start = calendarDay(booking.leverDatum)
    const end = booking.ophaalDatum == null || booking.ophaalDatum === '' ? Infinity : calendarDay(booking.ophaalDatum)
    if (start === null || end === null || end < start) continue
    if (start <= today.value && end >= today.value) {
      if (!active || start > active.start) active = { booking, start }
    } else if (start > today.value) {
      if (!next || start < next.start) next = { booking, start }
    }
  }
  return { status: active ? 'BEZET' : next ? 'GEPLAND' : null, active: active?.booking ?? null, next: next?.booking ?? null }
}
const assetStates = computed(() => new Map((props.assets ?? []).filter(Boolean).map(asset => [asset, bookingState(asset.huidigeBoekingen)])))
function getState(asset) { return assetStates.value.get(asset) ?? bookingState(asset?.huidigeBoekingen) }
function normalizedStatus(asset) { return String(asset?.status ?? '').trim().toUpperCase() }
function statusClass(asset) {
  const status = normalizedStatus(asset)
  if (status === 'KAPOT') return 'kapot'
  if (status === 'ONGEKEURD') return 'ongekeurd'
  return getState(asset).status?.toLowerCase() || 'vrij'
}
function statusLabel(asset) {
  const status = statusClass(asset)
  if (status === 'kapot') return 'Kapot'
  if (status === 'ongekeurd') return 'Ongekeurd'
  if (status === 'bezet') return 'Bezet'
  if (status === 'gepland') {
    const next = getState(asset).next
    return next ? `Ingepland · ${formatDate(next.leverDatum)}` : 'Ingepland'
  }
  return 'Vrij'
}
function rowStyle(asset) {
  return {
    kapot: { background: '#fff1f2', color: '#92333e' },
    ongekeurd: { background: '#f3f5f8', color: '#596b82' },
    bezet: { background: '#fff8e7', color: '#866229' },
    gepland: { background: '#edf4ff', color: '#3c629c' },
    vrij: { background: '#f0faf5', color: '#35745b' },
  }[statusClass(asset)]
}
function isSchaarlift(asset) {
  const model = String(asset?.assetModel ?? '').toUpperCase()
  return asset?.werkhoogte != null || ['HOOGTEWERKER', 'SCHAARLIFT', 'KNIKARM'].includes(model)
}
function typeName(asset) {
  console.log(asset)
  return asset?.machineType?.naam || asset?.machineType?.naam || asset?.type?.naam
    || (typeof asset?.machineTypeId === 'string' ? asset.machineTypeId : asset?.machineType?.naam) || 'Onbekend'
}
function heightLabel(value) { return value == null || value === '' ? '—' : `${value} m` }
function getWerf(asset) {
  const active = getState(asset).active
  if (active) return active.werf?.naam || 'Werf niet ingesteld'
  const location = asset?.locatie
  return (typeof location === 'string' ? location : location?.naam) || 'Wingepark 27'
}
function daysUntilKeuring(value) {
  const day = calendarDay(value)
  return day === null ? null : day - today.value
}
function isKeuringVerlopen(value) { const remaining = daysUntilKeuring(value); return remaining !== null && remaining < 0 }
function progressValue(value) {
  const remaining = daysUntilKeuring(value)
  return remaining === null ? 0 : Math.max(0, Math.min(365, 365 - remaining))
}
const dateFormatter = new Intl.DateTimeFormat('nl-BE', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'UTC' })
function formatDate(value) { const day = calendarDay(value); return day === null ? '' : dateFormatter.format(new Date(day * DAY)) }
function editAsset(asset) { emit('edit-asset', asset) }
</script>

<style scoped>
.comments {
  grid-column: 1 / -1;
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 14px;
  color: #333;
}

.comments-title {
  font-weight: 600;
}
.row {
  display: contents; 
}


/* hover effect */
.row > div {
  transition: background 0.2s ease;
}
.comments-text {
  background: #f9fafb;
  border-radius: 6px;
  white-space: pre-wrap; /* belangrijk voor vrije tekst */
}
.page { width: 100%; max-width: 100%; min-width: 0 }
.toolbar { display: flex; flex-wrap: wrap; gap: 12px; justify-content: space-between; margin-bottom: 15px }
.buttons { display: flex; flex-wrap: wrap; gap: 10px; }
.page, .page :deep(*) { box-sizing: border-box; }
.page button:focus-visible { outline: 3px solid #83abe6; outline-offset: 3px; }
.page button:disabled { opacity: .5; cursor: wait; }
.missing-date { grid-column: 1 / -1; color: #8391a5; font-size: 12px; font-weight: 400; }
.clickable { cursor: pointer; font-weight: 500 }

.expanded-row-container { display: flex; gap: 20px; padding: 20px; border-radius: 8px }
.expanded-left, .expanded-right { flex: 1; display: flex; flex-direction: column }

.section-header { position: relative; display: flex; align-items: center; justify-content: flex-end; font-weight: 700; font-size: 16px; margin-bottom: 12px; height: 32px }
.section-title { position: absolute; left: 50%; transform: translateX(-50%); pointer-events: none }
.edit-btn { background: none; border: none; cursor: pointer; font-size: 16px; color: #555 }

.divider { width: 100%; border: 1px solid #c2bebe; margin-bottom: 1rem }
.info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px 40px; font-size: 14px; color: #333 }
.column { display: flex; flex-direction: column; gap: 8px }
.column > div { display: flex; justify-content: space-between }
.column strong { font-weight: 600 }

.keuring { grid-column: 1 / -1; margin-top: 20px; display: grid; grid-template-columns: 1fr 1fr; align-items: center; gap: 10px; color: #444; font-weight: 600 }
.keuring-title { grid-column: 1 / -1 }
.keuring-data { grid-column: 1 / -1; width: 80%; display: flex; justify-content: space-between }
.expired-text { color: #b91c1c; font-weight: 700; grid-column: 1 / -1; padding: 6px 0; font-size: 14px }
progress {
  grid-column: 1 / -1;
  width: 80%;       
  height: 10px;       
  border-radius: 8px;
  overflow: hidden;
  appearance: none;
}

progress::-webkit-progress-bar {
  background-color: #ddd;
  border-radius: 8px;
}

progress::-webkit-progress-value {
  background-color: #3b82f6;
  border-radius: 8px;
}
.coming-soon-placeholder { flex: 1; display: flex; align-items: center; justify-content: center; font-size: 18px; font-style: italic; color: #888; border: 2px dashed #ccc; border-radius: 8px; min-height: 150px }

.status { padding: 4px 10px; border-radius: 8px; font-size: 12px; font-weight: 600 }
.status.vrij { background: #d1fae5; color: #065f46 }
.status.bezet { background: #fef3c7; color: #92400e }
.status.kapot { background: #fee2e2; color: #991b1b }
.status.ongekeurd { background: #f0f0f0; color: #6b7280 }
.status.gepland { background: #91b7f0; color: #0153f7 }

.boeking-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px 40px; padding: 10px 0; border-bottom: 1px solid #ddd; margin-bottom: 10px }
.boeking-grid:last-child { border-bottom: none; margin-bottom: 0 }

.btn1{
  background-color: #969191;
}
@media (max-width: 900px) { .expanded-row-container { flex-direction: column; } }
</style>



