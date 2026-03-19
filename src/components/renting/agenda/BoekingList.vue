<template>
  <div class="lijstweergave">

    <!-- ======================= -->
    <!--      NIEUWE TOOLBAR     -->
    <!-- ======================= -->
    <div class="toolbar">
      <h3>Boekingen</h3>

      <div class="toolbar-right">

        <!-- SEARCH -->
        <div class="search">
          <i class="fa fa-search"></i>
          <input
            v-model="localSearch"
            type="text"
            placeholder="Zoek"
            class="search-input"
            @input="updateSearch"
          />
        </div>

        <!-- DATE RANGE -->
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
          style="width: 260px"
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
    <div v-if="!boekingen.length" class="no-results">
      Geen resultaten gevonden
    </div>

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

  return `${adres.naam || boeking.klant?.naam || 'Onbekende klant'}: ${adres.straat || ''} ${
    adres.huisnummer || ''
  }, ${adres.postcode || ''} ${adres.gemeente || ''}`
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
   NIEUWE TOOLBAR
========================================= */
.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.toolbar-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

/* SEARCH */
.search {
  position: relative;
  width: 260px;
}

.search input {
  width: 100%;
  padding: 8px 10px 8px 32px;
  border-radius: 8px;
  border: none;
  background: transparent;
  transition: 0.2s ease;
}

.search input:focus {
  outline: none;
  background: #e8f0ff;
  box-shadow: 0 0 0 3px rgba(87, 134, 247, 0.2);
}

.search i {
  position: absolute;
  left: 10px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 13px;
  color: #1b4965;
}

/* =========================================
   TABLE HEADER
========================================= */
.table-header {
  display: grid;
  grid-template-columns: 1fr 1.2fr 2fr 1.4fr 1fr;
  padding: 14px 18px;
  background: #f0f0f0;
  border-radius: 14px;
  font-weight: 700;
  color: #6e6e6e;
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
  background: white;
  border-radius: 14px;
  border: 1px solid rgba(0, 0, 0, 0.06);
  backdrop-filter: blur(6px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  transition: 0.25s ease;
  cursor: pointer;
  margin-bottom: 10px;
}

.table-row:hover  {
  background: #5786f7;
  color: white ;
  transform: translateY(-3px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.15);
}

.table-row:hover .col-ref strong,
.table-row:hover .col-adres,
.table-row:hover .col-periode {
  color: white;
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
  .toolbar-right {
    flex-direction: column;
    gap: 10px;
    align-items: flex-end;
  }
}
</style>
