<template>
  <div class="lijstweergave">
    <!-- ======================= -->
    <!--         TOOLBAR         -->
    <!-- ======================= -->
    <div class="toolbar">
      <SearchBar
        placeholder="Zoek"
        width="260px"
        icon="fa fa-search"
        @update:modelValue="emit('update:search', $event)"
      />

      <div class="filters" role="toolbar" aria-label="Filters">
        <FilterChip
          :modelValue="klant"
          :options="klanten"
          title="Klant"
          @update:modelValue="emit('update:klant', $event)"
        />
        <FilterChip
          :modelValue="status"
          :options="statusOptions"
          title="Status"
          @update:modelValue="emit('update:status', $event)"
        />
        <FilterChip
          :modelValue="type"
          :options="types"
          title="Type"
          @update:modelValue="emit('update:type', $event)"
        />
        <DateRangeChip
          :modelValue="dateRange"
          title="Periode"
          @update:modelValue="updateDateRange"
        />

        <button
          v-if="activeFilterCount"
          type="button"
          class="filters__reset"
          @click="resetFilters"
        >
          Wis filters
          <span class="filters__badge">{{ activeFilterCount }}</span>
        </button>
      </div>
    </div>

    <BaseTable
      :items="boekingen"
      columns="1fr 1.2fr 2fr 1.4fr 1fr"
      @row-click="(b) => $emit('openBoeking', b.id)"
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
import { ref, computed, onMounted } from 'vue'
import { klantApi } from '@/api/klant'
import { toestelApi } from '@/api/toestel'
import BaseTable from '@/components/base/BaseTable.vue'
import SearchBar from '@/components/base/SearchBar.vue'
import FilterChip from '@/components/base/FilterChip.vue'
import DateRangeChip from '@/components/base/DateRangeChip.vue'

const props = defineProps({
  boekingen: { type: Array, default: () => [] },

  /* v-model's */
  search: { type: String, default: '' },
  dateRange: { type: Array, default: () => [null, null] },
  klant: { default: null },
  status: { default: null },
  type: { default: null },
})

const emit = defineEmits([
  'openBoeking',
  'addBoeking',
  'update:search',
  'update:dateRange',
  'update:klant',
  'update:status',
  'update:type',
])

/* ---------- filteropties ---------- */
const klanten = ref([])
const types = ref([])

function normalizeOptions(value, key) {
  const items = Array.isArray(value) ? value
    : Array.isArray(value?.data) ? value.data : value?.[key] ?? []
  return (Array.isArray(items) ? items : [])
    .filter(Boolean)
    .map(item => ({ ...item, id: item.id ?? item._id }))
    .filter(item => item.id != null)
}

async function loadFilterOptions() {
  const [k, t] = await Promise.allSettled([klantApi.list(), toestelApi.getTypes()])
  if (k.status === 'fulfilled') klanten.value = normalizeOptions(k.value, 'items')
  if (t.status === 'fulfilled') types.value = normalizeOptions(t.value, 'types')
}

onMounted(loadFilterOptions)

const statusOptions = [
  'Aangevraagd', 'Bevestigd', 'Leveren', 'Geleverd', 'Opgehaald', 'Afgewerkt',
].map(naam => ({ id: naam, naam }))

const isSet = v => v != null && v !== ''

const activeFilterCount = computed(() =>
  [
    isSet(props.klant),
    isSet(props.status),
    isSet(props.type),
    (props.dateRange ?? []).some(Boolean),
  ].filter(Boolean).length
)

function updateDateRange(val) {
  emit('update:dateRange', Array.isArray(val) && val.length === 2 ? val : [null, null])
}

function resetFilters() {
  emit('update:klant', null)
  emit('update:status', null)
  emit('update:type', null)
  emit('update:dateRange', [null, null])
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
.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  margin-bottom: 20px;
}

.filters {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
}

.filters__reset {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 34px;
  padding: 0 12px;
  border: 0;
  border-radius: 999px;
  background: transparent;
  color: #3b6cf6;
  font: inherit;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
}

.filters__reset:hover {
  background: #edf2ff;
}

.filters__badge {
  display: grid;
  place-items: center;
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  border-radius: 999px;
  background: #3b6cf6;
  color: #fff;
  font-size: 11px;
  font-weight: 700;
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

/* Mobile responsive toolbar */
@media (max-width: 768px) {
  .toolbar {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
  }

  .filters {
    justify-content: flex-start;
  }

  .toolbar .search,
  .toolbar .search input {
    width: 100%;
  }
}
</style>
