<template>
  <div class="lijstweergave">
    <!-- Header -->
    <div class="lijst-header">
      <h3>Boekingen</h3>

      <div class="header-actions">
        <input
          v-model="search"
          type="text"
          placeholder="Zoek op ref, toestel, adres..."
          class="search-input"
        />

        <el-date-picker
          v-model="dateRange"
          type="daterange"
          start-placeholder="Startdatum"
          end-placeholder="Einddatum"
          format="YYYY-MM-DD"
          value-format="YYYY-MM-DD"
          :picker-options="pickerOptions"
          clearable
          @change="onDateChange"
          style="width: 300px"
        />
        <button class="btn btn-primary" @click="$emit('addBoeking')">
          <i class="fa fa-plus"></i> Add
        </button>
      </div>
    </div>

    <!-- Tabel header -->
    <div class="table-header">
      <div>REF</div>
      <div>Toestel</div>
      <div>Adres</div>
      <div>Periode</div>
      <div class="right">Status</div>
    </div>

    <!-- Rijen -->
    <div
      v-for="b in gefilterdeBoekingen"
      :key="b._id"
      @click="$emit('openBoeking', b._id)"
      class="table-row"
    >
      <div class="col-ref">
        <strong>{{ b.ref }}</strong>
      </div>

      <div>
        {{ b.toestel?.Ref || 'Niet toegewezen' }}
      </div>

      <div class="col-adres">
        {{ formatAdres(b) }}
      </div>

      <div class="col-periode">
        {{ formatPeriode(b) }}
      </div>

      <div class="col-status" :class="b.status">
        {{ b.status }}
      </div>
    </div>

    <!-- Geen resultaten -->
    <div v-if="!gefilterdeBoekingen.length" class="no-results">Geen resultaten gevonden</div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import 'element-plus/dist/index.css'
import { ElDatePicker } from 'element-plus'

const props = defineProps({
  boekingen: {
    type: Array,
    default: () => [],
  },
})

defineEmits(['openBoeking', 'addBoeking'])

const search = ref('')

// Daterange filter
const dateRange = ref([new Date(), null]) // standaard vanaf vandaag, geen einde
const pickerOptions = {
  disabledDate(date) {
    const maxDate = new Date()
    maxDate.setFullYear(maxDate.getFullYear() + 2)
    return date > maxDate
  },
}

// Helper functies
function formatAdres(b) {
  if (!b.leverAdresDetails) return ''
  const a = b.leverAdresDetails
  return `${a.naam || ''}: ${a.straat || ''} ${a.huisnummer || ''}, ${a.postcode || ''} ${a.gemeente || ''}`
}

function formatDate(dateString) {
  if (!dateString) return ''
  const d = new Date(dateString)
  const dag = String(d.getDate()).padStart(2, '0')
  const maand = String(d.getMonth() + 1).padStart(2, '0')
  const jaar = d.getFullYear()
  return `${dag}/${maand}/${jaar}`
}

function formatPeriode(b) {
  const begin = b.beginDatumFormatted || formatDate(b.beginDatum)
  const eind = b.eindDatumFormatted || formatDate(b.eindDatum)
  if (!begin || !eind) return ''
  return `${begin} - ${eind}`
}

// Gefilterde boekingen: search + periode
const gefilterdeBoekingen = computed(() => {
  const term = search.value.toLowerCase()
  const startFilter = dateRange.value[0] ? new Date(dateRange.value[0]) : null
  const eindFilter = dateRange.value[1] ? new Date(dateRange.value[1]) : null

  return props.boekingen.filter((b) => {
    // 1️⃣ tekst search
    const textMatch =
      !term ||
      b.ref?.toLowerCase().includes(term) ||
      b.toestel?.Ref?.toLowerCase().includes(term) ||
      formatAdres(b).toLowerCase().includes(term) ||
      formatPeriode(b).toLowerCase().includes(term) ||
      b.status?.toLowerCase().includes(term)

    // 2️⃣ periode filter
    const boekStart = b.beginDatum ? new Date(b.beginDatum) : null
    const boekEind = b.eindDatum ? new Date(b.eindDatum) : null

    let periodeMatch = true
    if (startFilter) periodeMatch = periodeMatch && (!boekEind || boekEind >= startFilter)
    if (eindFilter) periodeMatch = periodeMatch && (!boekStart || boekStart <= eindFilter)

    return textMatch && periodeMatch
  })
})
function onDateChange(val) {
  if (!val || val.length === 0) {
    dateRange.value = [new Date(), null]
  }
}
</script>

<style scoped>
.lijstweergave {
  background: #f9fafb;
  border-radius: 14px;
}

/* Header */
.lijst-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
}

.header-actions {
  display: flex;
  gap: 1rem;
  align-items: center;
  flex-wrap: wrap;
}

/* Search */
.search-input {
  padding: 8px 12px;
  border-radius: 8px;
  border: 1px solid #d1d5db;
  font-size: 14px;
  width: 260px;
  transition: 0.2s ease;
}

.search-input:focus {
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.2);
  outline: none;
}

/* Table header */
.table-header {
  display: grid;
  grid-template-columns: 1fr 1fr 2fr 1.5fr 1fr;
  padding: 10px 16px;
  font-weight: 600;
  color: #374151;
  border-bottom: 2px solid #e5e7eb;
}

.table-row {
  display: grid;
  grid-template-columns: 1fr 1fr 2fr 1.5fr 1fr;
  padding: 12px 16px;
  border-bottom: 1px solid #e5e7eb;
  align-items: center;
  cursor: pointer;
  transition: all 0.2s ease;
}

.table-row:hover {
  background: #eef2ff;
}

.col-adres {
  color: #6b7280;
}

.col-status {
  justify-content: end;
  font-weight: 600;
  padding: 4px 8px;
  border-radius: 6px;
  justify-self: end;
}

/* Status kleuren */
.col-status.Aangevraagd {
  background: #fef3c7;
  color: #92400e;
}

.col-status.Bevestigd {
  background: #dbeafe;
  color: #1e3a8a;
}

.col-status.Leveren {
  background: #fde68a;
  color: #78350f;
}

.col-status.Geleverd {
  background: #d1fae5;
  color: #065f46;
}

.no-results {
  text-align: center;
  padding: 2rem;
  color: #9ca3af;
}

.table-header .right {
  justify-self: end; /* push de header cell naar rechts */
  text-align: right; /* optioneel, voor de tekst binnen de cel */
}

/* Responsive */
@media (max-width: 768px) {
  .table-header,
  .table-row {
    grid-template-columns: 1fr 1fr;
    row-gap: 8px;
  }

  .col-status {
    justify-self: start;
  }

  .search-input {
    width: 160px;
  }
}

.col-periode {
  color: #4b5563;
  font-size: 14px;
}

.periode-filters {
  display: flex;
  gap: 1rem;
  align-items: center;
  margin-bottom: 1rem;
  flex-wrap: wrap;
}
</style>
