<template>
  <div class="agenda-parent-container">
    <h1>Archief</h1>

    <!-- FILTERS -->
    <div class="filters" role="toolbar" aria-label="Filters">
      <FilterChip v-model="store.selectedKlant" :options="companies" title="Klant" />
      <FilterChip v-model="store.selectedStatus" :options="statusOptions" title="Status" />
      <FilterChip v-model="store.selectedType" :options="toestelTypes" title="Type" />
      <DateRangeChip v-model="dateRangeFilter" title="Periode" />

      <button
        v-if="activeFilterCount"
        type="button"
        class="filters__reset"
        @click="clearChipFilters"
      >
        Wis filters
        <span class="filters__badge">{{ activeFilterCount }}</span>
      </button>
    </div>

    <BoekingList
      :boekingen="store.boekingen"
      v-model:search="store.search"
      v-model:dateRange="store.dateRange"
      @openBoeking="openBoekingModal"
    />

    <BoekingModal
      v-if="showBoekingModal"
      :boekingId="selectedBoekingId"
      @close="showBoekingModal = false"
      @update="refreshBoekingen"
      @assignToestel="openVrijeToestellenModal"
      @verwijderen="deleteBoeking"
      @save="saveComment"
    />

    <VrijToestellenModal
      v-if="showVrijeToestellenModal"
      :toestellen="store.vrijeToestellen"
      @select="assignToestel"
      @close="showVrijeToestellenModal = false"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useDebounceFn } from '@vueuse/core'

import { useBoekingenStore } from '@/stores/renting/boekingen.store.js'
import { klantApi } from '@/api/klant'
import { toestelApi } from '@/api/toestel'

import FilterChip from '@/components/base/FilterChip.vue'
import DateRangeChip from '@/components/base/DateRangeChip.vue'
import BoekingList from '@/components/renting/agenda/BoekingList.vue'
import BoekingModal from '@/components/renting/agenda/BoekingModal.vue'
import VrijToestellenModal from '@/components/renting/agenda/VrijToestellenModal.vue'

const store = useBoekingenStore()

const showBoekingModal = ref(false)
const showVrijeToestellenModal = ref(false)
const selectedBoekingId = ref(null)

/**
 * FILTER OPTIONS
 */
const companies = ref([])
const toestelTypes = ref([])

const statusOptions = [
  'Aangevraagd', 'Bevestigd', 'Leveren', 'Geleverd', 'Opgehaald', 'Afgewerkt',
].map(naam => ({ id: naam, naam }))

function normalizeOptions(value, key) {
  const items = Array.isArray(value) ? value
    : Array.isArray(value?.data) ? value.data : value?.[key] ?? []
  return (Array.isArray(items) ? items : [])
    .filter(Boolean)
    .map(item => ({ ...item, id: item.id ?? item._id }))
    .filter(item => item.id != null)
}

async function loadFilterOptions() {
  const [klanten, types] = await Promise.allSettled([klantApi.list(), toestelApi.getTypes()])
  if (klanten.status === 'fulfilled') companies.value = normalizeOptions(klanten.value, 'items')
  if (types.status === 'fulfilled') toestelTypes.value = normalizeOptions(types.value, 'types')
}

const dateRangeFilter = computed({
  get: () => store.dateRange,
  set: value => {
    store.dateRange = Array.isArray(value) && value.length === 2 ? [...value] : [null, null]
  },
})

const activeFilterCount = computed(() =>
  [
    store.selectedKlant,
    store.selectedStatus,
    store.selectedType,
    (store.dateRange ?? []).some(Boolean) || null,
  ].filter(v => v != null && v !== '').length
)

function clearChipFilters() {
  store.selectedKlant = null
  store.selectedStatus = null
  store.selectedType = null
  store.dateRange = [null, null]
}

/**
 * 🔥 SINGLE SOURCE OF TRUTH FOR LOAD
 * (geen resetFilters() hier: dat zou de filters wissen
 *  die deze reload net hebben getriggerd)
 */
const reload = useDebounceFn(() => {
  store.loadBoekingen()
}, 250)

/**
 * ⚠️ ONLY WATCH FILTERS, NOT MANUAL LOADS ANYWHERE ELSE
 */
watch(
  () => [
    store.search,
    store.dateRange,
    store.selectedKlant,
    store.selectedStatus,
    store.selectedType,
  ],
  () => {
    reload()
  },
  { deep: true }
)

/**
 * MODALS
 */
function openBoekingModal(id) {
  selectedBoekingId.value = id
  showBoekingModal.value = true
}

async function openVrijeToestellenModal(id) {
  selectedBoekingId.value = id
  await store.openVrijeToestellen(id)
  showVrijeToestellenModal.value = true
}

async function assignToestel(toestel) {
  await store.assignToestel(toestel)
  showVrijeToestellenModal.value = false
}

async function deleteBoeking() {
  await store.deleteBoeking()
  showBoekingModal.value = false
}

async function saveComment(payload) {
  await store.saveComment(selectedBoekingId.value, payload.comment)
  showBoekingModal.value = false
}

function refreshBoekingen() {
  store.loadBoekingen()
}

/**
 * INIT
 */
onMounted(async () => {
  store.resetFilters()
  clearChipFilters()
  store.currentViewMode = 'archief'

  loadFilterOptions()
  await store.loadTypes()
  await store.loadBoekingen()
})
</script>

<style scoped>
.agenda-parent-container {
  font-family: Arial, sans-serif;
  padding: 1rem;
  width: 100%;
}

.filters {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  margin: 0.75rem 0 1rem;
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
</style>