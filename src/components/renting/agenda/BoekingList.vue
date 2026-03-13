<template>
  <div class="lijstweergave">
    <!-- Header -->
    <div class="lijst-header">
      <h3>Boekingen</h3>

      <div class="header-actions">
        <!-- Search input -->
        <input
          v-model="localSearch"
          type="text"
          placeholder="Zoek op ref, toestel, adres..."
          class="search-input"
          @input="updateSearch"
        />

        <!-- Date range picker -->
        <el-date-picker
          v-model="localDateRange"
          type="daterange"
          start-placeholder="Startdatum"
          end-placeholder="Einddatum"
          format="YYYY-MM-DD"
          value-format="YYYY-MM-DD"
          :picker-options="pickerOptions"
          clearable
          @change="updateDateRange"
          style="width: 300px"
        />

      </div>
    </div>

    <!-- Table header -->
    <div class="table-header">
      <div>REF</div>
      <div>Toestel</div>
      <div>Adres</div>
      <div>Periode</div>
      <div class="right">Status</div>
    </div>

    <!-- Rijen -->
    <div
      v-for="b in boekingen"
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
        {{ b.status === 'Opgehaald' ? 'Opgehaald door klant' : b.status }}
      </div>
    </div>

    <!-- Geen resultaten -->
    <div v-if="!boekingen.length" class="no-results">Geen resultaten gevonden</div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import 'element-plus/dist/index.css'
import { ElDatePicker, ElMenuItemGroup } from 'element-plus'

const props = defineProps({
  boekingen: {
    type: Array,
    default: () => [],
  },
})

const emit = defineEmits([
  'openBoeking',
  'addBoeking',
  'update:search',
  'update:dateRange'
]);

// Lokale bindings voor v-model style emit
const localSearch = ref('')
const localDateRange = ref([null, null])

// Picker opties
const pickerOptions = {
  disabledDate(date) {
    const maxDate = new Date()
    maxDate.setFullYear(maxDate.getFullYear() + 2)
    return date > maxDate
  },
}

let timeout

function updateSearch() {
  clearTimeout(timeout)
  console.log("emit")
  timeout = setTimeout(() => {
    emit('update:search', localSearch.value)
  }, 300)
}

function updateDateRange(val) {
  emit('update:dateRange', val || [null, null])
}
// Helper functies
function formatAdres(boeking) {
  const adres = boeking.leverAdresDetails || boeking.klant?.factuurAdres
  if (!adres) return 'Onbekende klant'

  return `${adres.naam || boeking.klant?.naam || 'Onbekende klant'}: ${adres.straat || ''} ${adres.huisnummer || ''}, ${adres.postcode || ''} ${adres.gemeente || ''}`
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

.col-status.Geleverd,
.col-status.Opgehaald,
.col-status.Afgewerkt {
  background: #d1fae5;
  color: #065f46;
}

.no-results {
  text-align: center;
  padding: 2rem;
  color: #9ca3af;
}

.table-header .right {
  justify-self: end;
  text-align: right;
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
</style>