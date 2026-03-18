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
    <div v-for="b in boekingen" :key="b._id" @click="$emit('openBoeking', b._id)" class="table-row">
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
import { ElDatePicker } from 'element-plus'

defineProps({
  boekingen: {
    type: Array,
    default: () => [],
  },
})

const emit = defineEmits(['openBoeking', 'addBoeking', 'update:search', 'update:dateRange'])

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
  console.log('emit')
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
/* =========================================
   WRAPPER
========================================= */
.lijstweergave {
  width: 100%;
  font-family: 'Inter', sans-serif;
}

/* =========================================
   HEADER BAR
========================================= */
.lijst-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  margin-bottom: 20px;
}

.lijst-header h3 {
  font-size: 22px;
  font-weight: 700;
  color: #0f172a;
}

/* HEADER ACTIONS (Search + Datepicker) */
.header-actions {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
  align-items: center;
}
.table-header .right {
  justify-self: end;
  text-align: right;
}
/* =========================================
   SEARCH INPUT
========================================= */
.search-input {
  padding: 12px 14px;
  width: 260px;
  border-radius: 12px;
  border: 1px solid #d1d5db;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(6px);
  font-size: 14px;
  font-weight: 500;
  transition: 0.25s ease;
}

.search-input:focus {
  outline: none;
  border-color: #4f73ff;
  background: white;
  box-shadow: 0 0 0 4px rgba(79, 115, 255, 0.2);
}

/* =========================================
   TABLE HEADER
========================================= */
.table-header {
  display: grid;
  grid-template-columns: 1fr 1.2fr 2fr 1.4fr 1fr;
  padding: 14px 18px;
  background: rgba(249, 250, 251, 0.8);
  border-radius: 14px;
  font-weight: 700;
  color: #374151;
  border: 1px solid rgba(0, 0, 0, 0.06);
  backdrop-filter: blur(6px);
  margin-bottom: 10px;
  font-size: 14px;
}

/* =========================================
   TABLE ROW
========================================= */
.table-row {
  display: grid;
  grid-template-columns: 1fr 1.2fr 2fr 1.4fr 1fr;
  padding: 16px 18px;
  background: rgba(255, 255, 255, 0.85);
  border-radius: 14px;
  border: 1px solid rgba(0, 0, 0, 0.06);
  backdrop-filter: blur(6px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  transition: 0.25s ease;
  cursor: pointer;
  margin-bottom: 10px;
}

.table-row:hover {
  transform: translateY(-3px);
  background: rgba(255, 255, 255, 0.9);
  box-shadow:
    0 6px 20px rgba(0, 0, 0, 0.1),
    0 3px 8px rgba(0, 0, 0, 0.06);
}

/* REF Column */
.col-ref strong {
  font-size: 15px;
  color: #0f172a;
  letter-spacing: 0.02em;
}

/* ADRES Column */
.col-adres {
  color: #6b7280;
  font-size: 14px;
}

/* PERIODE */
.col-periode {
  color: #475569;
  font-weight: 500;
}

/* =========================================
   STATUS BADGES
========================================= */
.col-status {
  justify-self: end;
  padding: 6px 12px;
  border-radius: 10px;
  font-weight: 600;
  font-size: 13px;
  text-align: center;
  min-width: 120px;
  transition: 0.2s ease;
}

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

/* =========================================
   NO RESULTS
========================================= */
.no-results {
  text-align: center;
  padding: 2rem;
  font-size: 15px;
  color: #94a3b8;
  font-style: italic;
}

/* =========================================
   RESPONSIVE
========================================= */
@media (max-width: 900px) {
  .table-header,
  .table-row {
    grid-template-columns: 1fr 1fr;
    row-gap: 12px;
  }

  .col-status {
    justify-self: start;
  }

  .search-input {
    width: 180px;
  }
}
</style>
