<template>
  <div class="lijstweergave">

    <!-- ======================= -->
    <!--      TOOLBAR (ONGEWIJZIGD) -->
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

    <!-- ✅ ENIGE WIJZIGING: BaseTable -->
    <BaseTable
      :items="boekingen"
      columns="1fr 1.2fr 2fr 1.4fr 1fr"
      @row-click="b => $emit('openBoeking', b._id)"
    >
      <!-- HEADER -->
      <template #header>
        <div>REF</div>
        <div>Toestel</div>
        <div>Adres</div>
        <div>Periode</div>
        <div class="right">Status</div>
      </template>

      <!-- ROW -->
      <template #row="{ item: b }">
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
      </template>
    </BaseTable>

  </div>
</template>

<script setup>
import { ref } from 'vue'
import BaseTable from '@/components/base/BaseTable.vue'
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

// ✅ ONGEWIJZIGD
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

// ✅ EXACT dezelfde helpers behouden
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
/* toolbar blijft hetzelfde */
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

/* status styling blijft hetzelfde */
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

/* SEARCH */ .search { position: relative; width: 260px; } .search input { width: 100%; padding: 8px 10px 8px 32px; border-radius: 8px; border: none; background: transparent; transition: 0.2s ease; } .search input:focus { outline: none; background: #e8f0ff; box-shadow: 0 0 0 3px rgba(87, 134, 247, 0.2); } .search i { position: absolute; left: 10px; top: 50%; transform: translateY(-50%); font-size: 13px; color: #1b4965; }
.col-status { justify-self: end; padding: 6px 12px; border-radius: 10px; font-weight: 600; font-size: 13px; text-align: center; min-width: 120px; transition: 0.2s ease; }
</style>