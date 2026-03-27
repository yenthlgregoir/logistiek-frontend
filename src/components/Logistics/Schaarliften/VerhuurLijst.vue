<template>
  <div class="lijstweergave">

    <!-- TOOLBAR -->
    <div class="toolbar">
      <h3>Verhuringen Schaarliften</h3>

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

    <!-- TABLE -->
    <BaseTable
      :items="verhuringen"
      columns="1fr 1fr 1.5fr 1fr 1fr"
      @row-click="v => $emit('openVerhuur', v._id)"
    >
      <!-- HEADER -->
      <template #header>
        <div>REF</div>
        <div>Toestel</div>
        <div>Adres</div>
        <div >Periode</div>
        <div class="right">Status</div>
      </template>

      <!-- ROW -->
      <template #row="{ item: v }">
        <div>
          <strong>{{ v.reference }}</strong>
        </div>
        <div>
          {{ v.toestel?.nummer || 'Geen toestel toegewezen' }}
        </div>
        <div class="col-adres">
          {{ formatAdres(v) }}
        </div>

        <div class="col-periode ">
          {{ formatPeriode(v) }}
        </div>

        <div class="col-status right" :class="v.status">
          {{ v.status || 'Onbekend' }}
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
  verhuringen: {
    type: Array,
    default: () => [],
  },
})

const emit = defineEmits(['openVerhuur', 'update:search', 'update:dateRange'])

const localSearch = ref('')
const localDateRange = ref([null, null])

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

/* HELPERS */
function formatAdres(v) {
  if (!v.werf) return 'Onbekende werf'

  return `${v.werf.naam || ''} - ${v.werf.adres.straat || ''} ${v.werf.adres.huisnummer || ''}, ${v.werf.adres.postcode || ''} ${v.werf.adres.gemeente || ''}`
}

function formatDate(dateString) {
  if (!dateString) return ''
  const d = new Date(dateString)
  return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`
}

function formatPeriode(v) {
  if (!v.leverDatum) return 'Niet ingesteld'

  const begin = formatDate(v.leverDatum)
  const eind = v.ophaalDatum ? formatDate(v.ophaalDatum) : 'nog geen ophaaldatum'

  return `${begin} - ${eind}`
}
</script>

<style scoped>
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
}

.search i {
  position: absolute;
  left: 10px;
  top: 50%;
  transform: translateY(-50%);
}

.col-periode.right {
  text-align: right;
  white-space: nowrap;
}

.col-status {
  font-weight: 600;
  color: #4f73ff;
  white-space: nowrap;
}


.col-status.Afgewerkt {
  background: #fef7c3;
  color: #854d0e;
}
.col-status.Opgehaald {
  background: #dbeafe;
  color: #1e3a8a;
}
.col-status.Leveren {
  background: #fdecc8;
  color: #78350f;
}

.col-status.Geleverd {
  background: #d1fae5;
  color: #065f46;
}
</style>