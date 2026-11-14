<template>
  <div class="lijstweergave">
    <div class="toolbar">
      <div class="date-picker">
        <el-date-picker
          v-model="localDateRange" type="daterange"
          start-placeholder="Startdatum" end-placeholder="Einddatum"
          format="DD/MM/YYYY" value-format="YYYY-MM-DD"
          range-separator="—" :disabled-date="disabledDate" clearable
        />
      </div>
      <label class="status-filter"><span class="sr-only">Filter op status</span><select :value="status" @change="emit('update:status', $event.target.value)"><option value="">Alle statussen</option><option v-for="option in statusOptions" :key="option" :value="option">{{ formatStatus(option) }}</option></select></label>
      <div class="search-wrapper">
        <SearchBar :model-value="search" placeholder="Zoek referentie, toestel of werf…" width="100%" icon="fa fa-search" @update:modelValue="emit('update:search', $event)" />
      </div>
    </div>

    <BaseTable :items="verhuringen" min-width="960px" columns="minmax(0, 1fr) minmax(0, 1.1fr) minmax(0, 1.8fr) minmax(0, 1.35fr) minmax(0, 1fr)" :sortable-columns="sortableColumns" :sort-by="sortBy" :sort-direction="sortDirection" @sort-change="emit('sort-change', $event)" @row-click="openVerhuur">
          <template #header><div>Referentie</div><div>Toestel</div><div>Werf & adres</div><div>Periode</div><div class="right">Status</div></template>
          <template #row="{ item: v }">
            <div class="reference-cell" data-label="Referentie"><strong class="reference-value">{{ v.reference || '—' }}</strong></div>
            <div class="asset-cell" data-label="Toestel">
              <div class="cell-stack"><span :class="v.asset?.nummer ? 'cell-primary' : 'cell-muted'">{{ v.asset?.nummer || 'Niet toegewezen' }}</span><span v-if="v.asset?.machineType?.naam" class="cell-secondary">{{ v.asset.machineType.naam }}</span></div>
            </div>
            <div class="cell-stack address-cell" data-label="Werf & adres">
              <span class="cell-primary">{{ v.werf?.naam || (v.werf ? 'Naam niet ingesteld' : 'Onbekende werf') }}</span>
              <span class="cell-secondary">{{ formatAdres(v) }}</span>
            </div>
            <div class="period-cell" data-label="Periode">
              <span class="period-start">{{ formatDate(v.leverDatum) || 'Niet ingesteld' }}</span>
              <span class="period-end">{{ v.ophaalDatum ? `tot ${formatDate(v.ophaalDatum) || 'ongeldige ophaaldatum'}` : 'Nog geen ophaaldatum' }}</span>
            </div>
            <div class="status-cell right" data-label="Status"><span class="status-badge" :class="statusClass(v.status)">{{ formatStatus(v.status) }}</span></div>
          </template>
          <template #empty>Geen verhuringen gevonden.</template>
    </BaseTable>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import BaseTable from '@/components/base/BaseTable.vue'
import SearchBar from '@/components/base/SearchBar.vue'

const props = defineProps({
  verhuringen: { type: Array, default: () => [] },
  search: { type: String, default: '' },
  status: { type: String, default: '' },
  dateRange: { type: Array, default: () => [null, null] },
  sortBy: { type: String, default: 'asset' },
  sortDirection: { type: String, default: 'asc' },
})
const emit = defineEmits(['openVerhuur', 'update:search', 'update:dateRange', 'update:status', 'sort-change'])
const localDateRange = computed({ get: () => props.dateRange, set: updateDateRange })
const statusOptions = ['AANGEVRAAGD', 'BEVESTIGD', 'LEVEREN', 'GELEVERD', 'OPGEHAALD', 'AFGEWERKT']
const sortableColumns = [
  { key: 'reference', label: 'Referentie' }, { key: 'asset', label: 'Toestel' },
  { key: 'address', label: 'Werf & adres' }, { key: 'period', label: 'Periode' },
  { key: 'status', label: 'Status', align: 'right' },
]

// Element Plus gebruikt disabled-date rechtstreeks, niet picker-options.
function disabledDate(date) {
  const maxDate = new Date()
  maxDate.setFullYear(maxDate.getFullYear() + 2)
  maxDate.setHours(23, 59, 59, 999)
  return date.getTime() > maxDate.getTime()
}
function updateDateRange(value) { emit('update:dateRange', value || [null, null]) }
function openVerhuur(value) {
  const id = value?.id ?? value?._id
  if (id != null) emit('openVerhuur', id)
}
function formatAdres(value) {
  const adres = value.werf?.adres
  if (!adres) return 'Adres niet ingesteld'
  const straat = [adres.straat, adres.huisnummer].filter(v => v != null && String(v).trim()).join(' ')
  const plaats = [adres.postcode, adres.gemeente].filter(v => v != null && String(v).trim()).join(' ')
  return [straat, plaats].filter(Boolean).join(', ') || 'Adres niet ingesteld'
}
const dateFormatter = new Intl.DateTimeFormat('nl-BE', { day: '2-digit', month: '2-digit', year: 'numeric' })
function formatDate(value) {
  if (value == null || value === '') return ''
  let date
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [year, month, day] = value.split('-').map(Number)
    date = new Date(0)
    date.setFullYear(year, month - 1, day)
    date.setHours(0, 0, 0, 0)
    if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) return ''
  } else {
    if (!(value instanceof Date) && typeof value !== 'number' && typeof value !== 'string') return ''
    date = new Date(value)
  }
  return Number.isFinite(date.getTime()) ? dateFormatter.format(date) : ''
}
function normalizedStatus(value) { return String(value ?? '').trim().toLocaleLowerCase('nl') }
function formatStatus(value) {
  const text = normalizedStatus(value)
  return text ? text.charAt(0).toLocaleUpperCase('nl') + text.slice(1) : 'Onbekend'
}
function statusClass(value) {
  const status = normalizedStatus(value)
  return ['aangevraagd', 'bevestigd', 'leveren', 'geleverd', 'opgehaald', 'afgewerkt'].includes(status) ? `status-${status}` : 'status-unknown'
}
</script>

<style scoped>
.lijstweergave {
  --ink: #25364d;
  width: 100%;
  max-width: 100%;
  min-width: 0;
  border: 0;
  border-radius: 0;
  background: transparent;
  color: var(--ink);
  box-shadow: none;
  font-family: 'Inter', 'Segoe UI', sans-serif;
  -webkit-font-smoothing: antialiased;
}
.lijstweergave, .lijstweergave :deep(*) { box-sizing: border-box; }
.toolbar { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px; padding: 0 0 16px; background: transparent; }
.date-picker { width: 285px; max-width: 100%; }
.date-picker :deep(.el-date-editor) { width: 100% !important; min-height: 39px; padding: 5px 11px; border-radius: 7px; background: #f8fafc; box-shadow: 0 0 0 1px #e0e6ef inset; transition: box-shadow 150ms; }
.date-picker :deep(.el-date-editor:hover) { box-shadow: 0 0 0 1px #a5bcdd inset; }
.date-picker :deep(.el-date-editor.is-active) { box-shadow: 0 0 0 1px #6d96d8 inset, 0 0 0 3px #3267d510; }
.date-picker :deep(.el-range-input) { font-family: inherit; font-size: 12px; color: #4b607c; background: transparent; }
.date-picker :deep(.el-range-separator) { color: #a0aec0; font-size: 12px; }
.search-wrapper { width: 300px; max-width: 100%; min-width: 0; margin-left: auto; }
.status-filter select { min-height: 39px; max-width: 100%; padding: 8px 30px 8px 12px; border: 1px solid #e0e6ef; border-radius: 7px; background: #f8fafc; color: #4b607c; font: inherit; font-size: 12px; cursor: pointer; }
.status-filter select:focus-visible { outline: 2px solid #729cdb; outline-offset: 3px; }
.sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0,0,0,0); white-space: nowrap; border: 0; }
.search-wrapper :deep(input) { width: 100%; min-height: 39px; border-radius: 7px; border: 1px solid #e0e6ef; background-color: #f8fafc; color: var(--ink); font-family: inherit; font-size: 12px; transition: border-color 150ms, box-shadow 150ms; }
.search-wrapper :deep(input::placeholder) { color: #8b9bb0; }
.search-wrapper :deep(input:focus) { outline: none; background-color: #fff; border-color: #6d96d8; box-shadow: 0 0 0 3px #3267d510; }
.lijstweergave :deep(.base-table) { border: 0; border-radius: 0; background: transparent; }
.reference-value { font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', monospace; color: #355f96; font-size: 12px; font-weight: 600; letter-spacing: .1px; line-height: 1.5; overflow-wrap: anywhere; }
.reference-cell, .asset-cell { min-width: 0; }
.cell-stack { display: flex; flex-direction: column; justify-content: center; gap: 4px; min-width: 0; }
.cell-primary { font-size: 12px; font-weight: 600; line-height: 1.55; overflow-wrap: anywhere; color: #34465d; }
.cell-secondary { color: #8491a3; font-size: 11px; line-height: 1.5; overflow-wrap: anywhere; }
.cell-muted { color: #a0aabc; font-size: 11px; line-height: 1.5; }
.period-cell { display: flex; flex-direction: column; justify-content: center; gap: 4px; font-size: 12px; font-variant-numeric: tabular-nums; }
.period-start { color: #455972; font-weight: 500; line-height: 1.55; }
.period-end { color: #8997ab; font-size: 11px; line-height: 1.5; }
.status-cell { display: flex; align-items: center; justify-content: flex-end; min-width: 0; }
.status-badge { --status: #69788c; --tint: #edf1f6; display: inline-flex; justify-content: center; align-items: center; max-width: 100%; padding: 5px 11px; border: 0; border-radius: 5px; color: var(--status); background: var(--tint); font-size: 11px; line-height: 1.4; font-weight: 600; overflow-wrap: anywhere; }
.status-aangevraagd { --status: #92702d; --tint: #fbefcf; }
.status-bevestigd { --status: #3f69ac; --tint: #e7effd; }
.status-leveren { --status: #a46c2d; --tint: #fcebd7; }
.status-geleverd { --status: #2c7a5b; --tint: #e0f1e8; }
.status-opgehaald { --status: #6b5ba8; --tint: #eeebf8; }
.status-afgewerkt { --status: #6d7b8f; --tint: #eaf0f5; }
@media (max-width: 640px) { .toolbar { gap: 10px; padding: 0 0 14px; } .date-picker, .search-wrapper, .status-filter, .status-filter select { width: 100%; } }
@media (prefers-reduced-motion: reduce) { .lijstweergave :deep(*) { transition: none !important; } }
</style>
