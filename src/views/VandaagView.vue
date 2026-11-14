<template>
  <div class="today-page">
    <header class="today-header">
      <div>
        <RouterLink to="/" class="today-back">← Modules</RouterLink>
        <span class="today-eyebrow">Dagoverzicht · {{ dateLabel(snapshot?.datum) }}</span>
        <h1>Vandaag</h1>
        <p>Wat moet er vandaag gebeuren? Open een actie om verder te werken.</p>
      </div>
      <button class="today-button primary" :disabled="loading" @click="load">
        <RefreshCw :size="16" :class="{ spinning: loading }" />{{
          loading ? 'Laden…' : 'Vernieuwen'
        }}
      </button>
    </header>

    <div v-if="error" class="today-error" role="alert">
      <strong>Overzicht niet bijgewerkt.</strong> {{ error }}
      <span v-if="snapshot">Je ziet de laatst opgehaalde gegevens.</span>
    </div>
    <div
      v-for="(message, module) in snapshot?.fouten || {}"
      :key="module"
      class="today-error"
      role="alert"
    >
      <strong>{{ moduleLabels[module] }} ontbreekt in dit overzicht.</strong> {{ message }}
    </div>
    <div v-if="snapshot && snapshot.datum !== currentDay" class="today-error" role="status">
      Een nieuwe dag is begonnen. Vernieuw het overzicht voor de acties van vandaag.
    </div>

    <section class="today-summary" aria-label="Acties filteren">
      <button class="today-count" :class="{ active: !kind && !overdue }" @click="setCategory('')">
        <span class="today-count-icon"><ClipboardList :size="20" /></span
        ><strong>{{ actions.length }}</strong
        ><span>Open acties</span>
      </button>
      <button
        class="today-count"
        :class="{ active: kind === 'leveren' }"
        @click="setCategory('leveren')"
      >
        <span class="today-count-icon"><Truck :size="20" /></span
        ><strong>{{ count('leveren') }}</strong
        ><span>Leveren / uitgeven</span>
      </button>
      <button
        class="today-count"
        :class="{ active: kind === 'ophalen' }"
        @click="setCategory('ophalen')"
      >
        <span class="today-count-icon"><PackageCheck :size="20" /></span
        ><strong>{{ count('ophalen') }}</strong
        ><span>Ophalen / retour</span>
      </button>
      <button
        class="today-count"
        :class="{ active: kind === 'toewijzen' }"
        @click="setCategory('toewijzen')"
      >
        <span class="today-count-icon"><Wrench :size="20" /></span
        ><strong>{{ count('toewijzen') }}</strong
        ><span>Geen toestel</span>
      </button>
      <button class="today-count late" :class="{ active: overdue }" @click="setCategory('late')">
        <span class="today-count-icon"><ClockAlert :size="20" /></span
        ><strong>{{ actions.filter((action) => action.achterstallig).length }}</strong
        ><span>Te laat</span>
      </button>
    </section>

    <div class="today-toolbar">
      <input
        v-model="search"
        type="search"
        placeholder="Zoek referentie, klant, werf of materiaal"
        aria-label="Acties zoeken"
      />
      <select v-model="moduleFilter" aria-label="Module">
        <option value="">Alle modules</option>
        <option v-for="module in snapshot?.modules || []" :key="module" :value="module">
          {{ moduleLabels[module] }}
        </option>
      </select>
      <select v-model="kind" aria-label="Soort actie">
        <option value="">Alle acties</option>
        <option v-for="(label, value) in actionLabels" :key="value" :value="value">
          {{ label }}
        </option>
      </select>
      <label class="today-check"><input v-model="overdue" type="checkbox" />Alleen te laat</label>
      <button
        v-if="search || moduleFilter || kind || overdue"
        class="today-button"
        @click="clearFilters"
      >
        Filters wissen
      </button>
    </div>
    <p class="today-explanation">
      Leveringen en retouren: vandaag en eerder, zolang de actie openstaat. Zonder toestel: start
      binnen zeven dagen of al te laat. Eén boeking kan meerdere acties hebben.
    </p>
    <p v-if="loading" role="status" class="today-meta">Acties ophalen…</p>

    <BaseTable
      :items="paginatedItems"
      item-key="id"
      columns="1fr 1.1fr 1.8fr 1.5fr 1fr"
      min-width="850px"
      :sortable-columns="columns"
      :sort-by="sortBy"
      :sort-direction="direction"
      @sort-change="sortChanged"
      @row-click="openAction"
    >
      <template #row="{ item }">
        <div>
          <span class="today-module" :class="item.module">{{ moduleLabels[item.module] }}</span>
        </div>
        <div>
          <strong>{{ item.label }}</strong
          ><span v-if="item.achterstallig" class="today-overdue">Te laat</span>
        </div>
        <div>
          <strong class="today-title">{{ item.bestemming }}</strong
          ><span class="today-sub">{{ item.referentie }}</span>
        </div>
        <div>{{ item.materiaal }}</div>
        <div>
          {{ dateLabel(item.datum)
          }}<span class="today-sub">{{
            item.datum === snapshot?.datum
              ? 'Vandaag'
              : item.achterstallig
                ? 'Achterstallig'
                : 'Binnenkort'
          }}</span>
        </div>
      </template>
      <template #empty>{{ emptyText }}</template>
    </BaseTable>
    <BasePagination
      :current-page="currentPage"
      :total-pages="totalPages"
      @next="next"
      @prev="prev"
    />
    <p v-if="snapshot" class="today-meta">
      {{ filtered.length }} {{ filtered.length === 1 ? 'actie' : 'acties' }} · Laatst opgehaald om
      {{ fetchedTime }} · Tijdzone Brussel
    </p>
  </div>
</template>

<script setup>
import { computed, ref, onMounted, onBeforeUnmount, watch } from 'vue'
import { useRouter } from 'vue-router'
import { RefreshCw, ClipboardList, Truck, PackageCheck, Wrench, ClockAlert } from 'lucide-vue-next'
import BaseTable from '@/components/base/BaseTable.vue'
import BasePagination from '@/components/base/BasePagination.vue'
import { usePagination } from '@/composable/usePagination'
import { fetchVandaag } from '@/api/vandaag'
import { actionTarget, filterActions, dateLabel, moduleLabels, actionLabels } from '@/utils/vandaag'

const router = useRouter()
const snapshot = ref(null),
  loading = ref(false),
  error = ref('')
const search = ref(''),
  moduleFilter = ref(''),
  kind = ref(''),
  overdue = ref(false)
const sortBy = ref('datum'),
  direction = ref('asc')
const currentDay = ref(dayNow())
let alive = true,
  request = 0,
  timer
const columns = [
  { key: 'module', label: 'Module' },
  { key: 'label', label: 'Actie' },
  { key: 'bestemming', label: 'Klant / werf / ontlener' },
  { key: 'materiaal', label: 'Materiaal' },
  { key: 'datum', label: 'Gepland' },
]
const actions = computed(() => snapshot.value?.acties || [])
const filtered = computed(() => {
  const rows = filterActions(actions.value, {
    module: moduleFilter.value,
    kind: kind.value,
    overdue: overdue.value,
    search: search.value,
  })
  const collator = new Intl.Collator('nl-BE', { numeric: true, sensitivity: 'base' })
  return rows.sort((a, b) => {
    // Achterstallige acties eerst bij de standaard sortering op datum.
    if (
      sortBy.value === 'datum' &&
      direction.value === 'asc' &&
      a.achterstallig !== b.achterstallig
    )
      return a.achterstallig ? -1 : 1
    return (
      collator.compare(String(a[sortBy.value] ?? ''), String(b[sortBy.value] ?? '')) *
      (direction.value === 'asc' ? 1 : -1)
    )
  })
})
const fetchedTime = computed(() =>
  new Intl.DateTimeFormat('nl-BE', {
    timeZone: 'Europe/Brussels',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(snapshot.value.opgehaaldOp)),
)
const incomplete = computed(
  () => error.value || Object.keys(snapshot.value?.fouten || {}).length > 0,
)
const emptyText = computed(() =>
  loading.value
    ? 'Acties worden geladen…'
    : incomplete.value
      ? 'Voor deze selectie zijn geen acties beschikbaar. Het overzicht is onvolledig; probeer te vernieuwen.'
      : search.value || moduleFilter.value || kind.value || overdue.value
        ? 'Geen acties gevonden voor deze filters.'
        : 'Alles bijgewerkt: er zijn geen open acties voor vandaag.',
)
const { currentPage, totalPages, paginatedItems, next, prev, reset, setPage } = usePagination(
  filtered,
  { pageSize: 15 },
)
watch([search, moduleFilter, kind, overdue], reset)
watch(totalPages, () => setPage(currentPage.value))
function count(value) {
  return actions.value.filter((action) => action.soort === value).length
}
function setCategory(value) {
  kind.value = value === 'late' ? '' : value
  overdue.value = value === 'late'
}
function clearFilters() {
  search.value = ''
  moduleFilter.value = ''
  kind.value = ''
  overdue.value = false
}
function sortChanged({ key, direction: value }) {
  sortBy.value = key
  direction.value = value
}
function openAction(action) {
  router.push(actionTarget(action))
}
function dayNow() {
  return new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Brussels' }).format(new Date())
}
async function load() {
  const version = ++request
  loading.value = true
  error.value = ''
  try {
    const value = await fetchVandaag()
    if (alive && version === request) {
      snapshot.value = value
      currentDay.value = dayNow()
    }
  } catch (failure) {
    if (alive && version === request)
      error.value = failure.message || 'Acties konden niet geladen worden.'
  } finally {
    if (alive && version === request) loading.value = false
  }
}
onMounted(() => {
  load()
  timer = setInterval(() => {
    currentDay.value = dayNow()
  }, 30000)
})
onBeforeUnmount(() => {
  alive = false
  request++
  clearInterval(timer)
})
</script>

<style scoped>
.today-page {
  min-width: 0;
  padding: 32px;
  max-width: 1500px;
  margin: auto;
  color: #263347;
  font-family: Inter, 'Segoe UI', sans-serif;
}
.today-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 20px;
  margin-bottom: 26px;
  flex-wrap: wrap;
}
.today-back {
  display: block;
  color: #466fbd;
  font-size: 12px;
  margin-bottom: 22px;
  text-decoration: none;
}
.today-eyebrow {
  color: #7b899c;
  font-size: 11px;
  letter-spacing: 1px;
  text-transform: uppercase;
}
.today-header h1 {
  font-size: 28px;
  margin: 7px 0;
  color: #19304e;
  letter-spacing: -0.7px;
}
.today-header p {
  font-size: 13px;
  line-height: 1.6;
  margin: 0;
  color: #728198;
}
.today-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border: 1px solid #d6deea;
  border-radius: 9px;
  background: #fff;
  color: #344b68;
  min-height: 40px;
  padding: 10px 15px;
  font: inherit;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
}
.today-button.primary {
  background: #346acd;
  border-color: #346acd;
  color: white;
}
.today-button:disabled {
  opacity: 0.6;
  cursor: wait;
}
.today-summary {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 14px;
  margin-bottom: 24px;
}
.today-count {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 9px;
  align-items: center;
  text-align: left;
  padding: 18px;
  border: 1px solid #dfe6f0;
  background: #fff;
  border-radius: 12px;
  color: #264563;
  cursor: pointer;
  font: inherit;
}
.today-count-icon {
  grid-row: 1/3;
  grid-column: 2;
  color: #7c9bc7;
}
.today-count strong {
  font-size: 26px;
}
.today-count > span:last-child {
  font-size: 11px;
  color: #74859a;
}
.today-count.active {
  border-color: #7a9ddc;
  box-shadow: 0 0 0 2px #346acd13;
}
.today-count.late strong,
.today-count.late .today-count-icon {
  color: #b74750;
}
.today-toolbar {
  display: flex;
  gap: 10px;
  align-items: center;
  flex-wrap: wrap;
  margin: 20px 0 12px;
}
.today-toolbar > input,
.today-toolbar select {
  max-width: 100%;
  min-height: 40px;
  padding: 10px 12px;
  border: 1px solid #d9e1ed;
  border-radius: 9px;
  color: #344b68;
  font: inherit;
  font-size: 12px;
  background: #fff;
}
.today-toolbar > input {
  width: 310px;
}
.today-check {
  display: flex;
  align-items: center;
  gap: 7px;
  font-size: 12px;
  color: #52647b;
}
.today-explanation,
.today-meta {
  font-size: 11px;
  line-height: 1.7;
  color: #7c899d;
}
.today-explanation {
  margin-bottom: 22px;
  max-width: 850px;
}
.today-module {
  display: inline-block;
  padding: 5px 9px;
  border-radius: 7px;
  font-size: 11px;
  background: #e8eef8;
  color: #47658e;
}
.today-module.tools {
  background: #fff0df;
  color: #946122;
}
.today-module.logistics {
  background: #def2ee;
  color: #267a69;
}
.today-title {
  font-weight: 600;
  color: #244361;
}
.today-sub {
  display: block;
  font-size: 11px;
  color: #7c8b9f;
  margin-top: 4px;
}
.today-overdue {
  display: block;
  width: fit-content;
  font-size: 10px;
  color: #af3e4d;
  background: #fce8eb;
  padding: 3px 7px;
  border-radius: 5px;
  margin-top: 6px;
}
.today-error {
  padding: 13px 16px;
  border: 1px solid #edcbd0;
  background: #fff3f4;
  color: #a03945;
  font-size: 12px;
  line-height: 1.7;
  border-radius: 9px;
  margin-bottom: 15px;
}
.today-error span {
  display: block;
}
.today-page :is(button, input, select, a):focus-visible {
  outline: 3px solid #8aafea;
  outline-offset: 3px;
}
@media (max-width: 1000px) {
  .today-summary {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}
@media (max-width: 600px) {
  .today-page {
    padding: 20px 14px;
  }
  .today-summary {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 9px;
  }
  .today-count {
    padding: 13px;
  }
  .today-header {
    align-items: flex-start;
  }
  .today-header > .today-button {
    width: 100%;
  }
  .today-toolbar > input {
    width: 100%;
  }
  .today-toolbar select {
    flex: 1;
  }
  .today-count strong {
    font-size: 23px;
  }
}
.spinning {
  animation: spin 1s linear infinite;
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
@media (prefers-reduced-motion: reduce) {
  .spinning {
    animation: none;
  }
}
</style>
