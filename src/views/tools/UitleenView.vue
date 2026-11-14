<template>
  <div class="tools-page">
    <header class="tools-header">
      <div>
        <span class="tools-eyebrow">Tools · Uitleen</span>
        <h1>{{ title }}</h1>
        <p class="tools-subtitle">
          {{
            mode === 'archief'
              ? 'Afgesloten uitleningen en geannuleerde reserveringen.'
              : 'Wie heeft welk materiaal, en wat staat nog open?'
          }}
        </p>
      </div>
      <div class="tools-actions">
        <button class="tool-btn" :disabled="store.loadingUitleen" @click="reload">Vernieuwen</button
        ><button v-if="mode === 'lijst'" class="tool-btn primary" @click="newLoan">
          <Plus :size="17" />{{
            store.materialen.length ? 'Nieuwe uitleen' : 'Materiaal toevoegen'
          }}
        </button>
      </div>
    </header>
    <div class="tools-stats">
      <div class="tools-stat">
        <strong>{{ store.uitleningen.length }}</strong
        ><span>{{ mode === 'archief' ? 'Afgesloten registraties' : 'Open uitleningen' }}</span>
      </div>
      <div class="tools-stat">
        <strong>{{ store.uitleningen.filter(isIssued).length }}</strong
        ><span>Werkelijk uitgegeven</span>
      </div>
      <div class="tools-stat">
        <strong>{{ store.uitleningen.filter((item) => item.achterstallig).length }}</strong
        ><span>Te laat</span>
      </div>
    </div>
    <div class="tools-toolbar">
      <input
        v-model="search"
        class="tools-search"
        aria-label="Uitleningen zoeken"
        placeholder="Zoek ontlener, werf of materiaal"
      /><select v-model="status" aria-label="Uitleenstatus">
        <option value="">Alle statussen</option>
        <option v-for="value in statusOptions" :key="value" :value="value">
          {{ loanStatuses[value] }}
        </option></select
      ><label v-if="mode !== 'archief'" class="tools-check"
        ><input v-model="lateOnly" type="checkbox" />Alleen te laat</label
      ><button v-if="search || status || lateOnly" class="tool-btn" @click="clearFilters">
        Filters wissen
      </button>
    </div>
    <p v-if="loadError" class="tools-error" role="alert">{{ loadError }}</p>
    <p v-if="readError" class="tools-error" role="alert">{{ readError }}</p>
    <p v-if="notice" class="tools-notice" role="status">{{ notice }}</p>
    <p v-if="store.loadingUitleen || detailLoading" class="tools-muted" role="status">
      {{ detailLoading ? 'Uitleen laden…' : 'Uitleningen laden…' }}
    </p>
    <UitleenAgenda
      v-if="mode === 'planning'"
      :materials="planningMaterials"
      :loans="filtered"
      :add-label="store.materialen.length ? 'Nieuwe uitleen' : 'Materiaal toevoegen'"
      @add="newLoan"
      @open="openLoan"
    />
    <template v-else
      ><BaseTable
        :items="paginatedItems"
        columns="1.2fr 1.4fr 1.3fr 1.1fr .8fr"
        item-key="id"
        min-width="900px"
        :sortable-columns="columns"
        :sort-by="sortBy"
        :sort-direction="direction"
        @sort-change="sortChanged"
        @row-click="openLoan"
        ><template #row="{ item }"
          ><div>
            <strong class="tools-row-title">{{ item.ontlener }}</strong
            ><span class="tools-row-sub">{{ item.referentie }}</span>
          </div>
          <div>
            {{ item.locatie || item.werfNaam
            }}<span class="tools-row-sub">{{ item.projectleiderNaam }}</span>
          </div>
          <div>
            <span v-for="line in item.regels" :key="idOf(line)" style="display: block"
              >{{ line.aantal }} × {{ line.materiaalNaam
              }}<small v-if="isIssued(item)" class="tools-row-sub"
                >{{ line.openstaandAantal }} nog open</small
              ></span
            >
          </div>
          <div>{{ period(item) }}</div>
          <div>
            <ToolsStatus :value="item.status" /><span
              v-if="item.achterstallig"
              class="tools-badge late"
              style="margin-top: 5px"
              >Te laat</span
            >
          </div></template
        ><template #empty>{{
          mode === 'archief'
            ? 'Nog geen afgesloten uitleningen voor deze filters.'
            : 'Nog geen uitleningen voor deze filters. Registreer materiaal en maak daarna een reservering.'
        }}</template></BaseTable
      ><BasePagination
        :current-page="currentPage"
        :total-pages="totalPages"
        @next="next"
        @prev="prev"
    /></template>
    <UitleenForm
      v-if="showForm"
      :loan="editing"
      :materials="store.materialen"
      :werven="store.werven"
      :projectleiders="store.projectleiders"
      :saving="store.busy"
      :error="actionError"
      :reference-error="store.referentieError"
      @close="closeForm"
      @save="save"
    />
    <UitleenDetail
      v-if="selected && !showForm"
      :loan="selected"
      :saving="store.busy"
      :error="actionError"
      @close="closeDetail"
      @edit="editLoan"
      @issue="issue"
      @retour="returnLoan"
      @annuleren="cancelLoan"
      @expected="changeExpected"
    />
  </div>
</template>
<script setup>
import { ref, computed, watch, onBeforeUnmount } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Plus } from 'lucide-vue-next'
import BaseTable from '@/components/base/BaseTable.vue'
import BasePagination from '@/components/base/BasePagination.vue'
import UitleenAgenda from '@/components/tools/UitleenAgenda.vue'
import UitleenForm from '@/components/tools/UitleenForm.vue'
import UitleenDetail from '@/components/tools/UitleenDetail.vue'
import ToolsStatus from '@/components/tools/ToolsStatus.vue'
import { usePagination } from '@/composable/usePagination'
import { useUitleenStore } from '@/stores/tools/uitleen.store'
import { uitleenApi } from '@/api/uitleen'
import { idOf, isOpen, isIssued, loanStatuses, period, errorMessage } from '@/utils/uitleen'
import '@/assets/tools.css'
const props = defineProps({ mode: { type: String, default: 'planning' } })
const store = useUitleenStore(),
  route = useRoute(),
  router = useRouter()
const search = ref(''),
  status = ref(''),
  lateOnly = ref(false)
const selected = ref(null),
  editing = ref(null),
  showForm = ref(false)
const actionError = ref(''),
  readError = ref(''),
  notice = ref(''),
  detailLoading = ref(false)
const sortBy = ref('startDatum'),
  direction = ref('asc')
let alive = true,
  context = 0,
  detailRequest = 0
const title = computed(() =>
  props.mode === 'planning'
    ? 'Planning uitleen'
    : props.mode === 'archief'
      ? 'Archief uitleen'
      : 'Uitleningen',
)
const statusOptions = computed(() =>
  props.mode === 'archief'
    ? ['TERUG', 'GEANNULEERD']
    : ['GERESERVEERD', 'UITGELEEND', 'DEELS_TERUG'],
)
const loadError = computed(() => store.uitleenError || store.materiaalError)
const columns = [
  { key: 'ontlener', label: 'Ontlener' },
  { key: 'locatie', label: 'Werf / locatie' },
  { key: 'materiaal', label: 'Materiaal' },
  { key: 'startDatum', label: 'Periode' },
  { key: 'status', label: 'Status' },
]
const filtered = computed(() => {
  const term = search.value.trim().toLocaleLowerCase('nl-BE')
  const rows = store.uitleningen.filter(
    (item) =>
      (props.mode === 'archief' ? !isOpen(item) : isOpen(item)) &&
      (!status.value || item.status === status.value) &&
      (!lateOnly.value || item.achterstallig) &&
      (!term ||
        [
          item.ontlener,
          item.referentie,
          item.locatie,
          item.werfNaam,
          item.projectleiderNaam,
          ...item.regels.map((line) => line.materiaalNaam),
          ...item.regels.map((line) => line.materiaalNummer),
        ].some((value) =>
          String(value ?? '')
            .toLocaleLowerCase('nl-BE')
            .includes(term),
        )),
  )
  const collator = new Intl.Collator('nl-BE', { numeric: true, sensitivity: 'base' })
  const value = (item) =>
    sortBy.value === 'materiaal'
      ? item.regels.map((line) => line.materiaalNaam).join(', ')
      : (item[sortBy.value] ?? '')
  return rows.sort(
    (a, b) =>
      collator.compare(String(value(a)), String(value(b))) * (direction.value === 'asc' ? 1 : -1),
  )
})
const planningMaterials = computed(() => {
  if (!search.value.trim()) return store.materialen
  const included = new Set(
    filtered.value.flatMap((item) => item.regels.map((line) => line.materiaalId)),
  )
  const term = search.value.toLocaleLowerCase('nl-BE')
  return store.materialen.filter(
    (item) =>
      included.has(idOf(item)) ||
      [item.naam, item.nummer].some((value) =>
        String(value ?? '')
          .toLocaleLowerCase('nl-BE')
          .includes(term),
      ),
  )
})
const { currentPage, totalPages, paginatedItems, next, prev, reset, setPage } = usePagination(
  filtered,
  { pageSize: 15 },
)
watch([search, status, lateOnly], reset)
watch(totalPages, () => setPage(currentPage.value))
function clearFilters() {
  search.value = ''
  status.value = ''
  lateOnly.value = false
}
function sortChanged({ key, direction: value }) {
  sortBy.value = key
  direction.value = value
}
async function reload() {
  await Promise.all([
    store.loadMaterialen(),
    store.loadUitleningen({ archief: props.mode === 'archief' }),
  ])
}
function newLoan() {
  if (!store.materialen.length) {
    router.push('/tools/materiaal')
    return
  }
  editing.value = null
  actionError.value = ''
  showForm.value = true
  store.loadReferenties()
}
function editLoan() {
  editing.value = selected.value
  actionError.value = ''
  showForm.value = true
  store.loadReferenties()
}
function closeForm() {
  if (!store.busy) {
    showForm.value = false
    actionError.value = ''
  }
}
function closeDetail() {
  if (store.busy) return
  selected.value = null
  actionError.value = ''
  detailRequest++
  detailLoading.value = false
  if (route.query.uitleen) {
    const query = { ...route.query }
    delete query.uitleen
    router.replace({ query })
  }
}
async function openLoan(value) {
  const id = idOf(value)
  if (!id) return
  const request = ++detailRequest
  selected.value = store.uitleningen.find((item) => idOf(item) === id) ?? null
  readError.value = ''
  actionError.value = ''
  detailLoading.value = true
  try {
    const result = await uitleenApi.get(id)
    if (alive && request === detailRequest) selected.value = result
  } catch (error) {
    if (alive && request === detailRequest) readError.value = errorMessage(error)
  } finally {
    if (alive && request === detailRequest) detailLoading.value = false
  }
}
async function run(work, success) {
  const version = context
  actionError.value = ''
  try {
    const result = await work()
    if (!alive || version !== context) return
    selected.value = result
    showForm.value = false
    notice.value = success
    await reload()
  } catch (error) {
    if (alive && version === context) actionError.value = errorMessage(error)
  }
}
function save(value) {
  return run(() => store.saveUitleen(value, idOf(editing.value)), 'Reservering opgeslagen.')
}
function issue() {
  return run(() => store.uitgeven(idOf(selected.value)), 'Materiaal is uitgegeven.')
}
function returnLoan(value) {
  return run(
    () => store.retour(idOf(selected.value), value),
    'Retour geregistreerd. Beschadigd materiaal blijft geblokkeerd.',
  )
}
function cancelLoan() {
  return run(() => store.annuleren(idOf(selected.value)), 'Reservering geannuleerd.')
}
function changeExpected(value) {
  return run(
    () => store.verwachteRetour(idOf(selected.value), value.datum, value.permanent),
    'Verwachte retour bijgewerkt. Het materiaal blijft uitgeleend.',
  )
}
watch(
  () => props.mode,
  async () => {
    const version = ++context
    detailRequest++
    detailLoading.value = false
    selected.value = null
    showForm.value = false
    search.value = ''
    status.value = ''
    lateOnly.value = false
    notice.value = ''
    readError.value = ''
    await Promise.all([reload(), store.loadReferenties()])
    if (alive && version === context && route.query.uitleen) openLoan(String(route.query.uitleen))
  },
  { immediate: true },
)
watch(
  () => route.query.uitleen,
  (id) => {
    if (id) openLoan(String(id))
  },
)
onBeforeUnmount(() => {
  alive = false
  context++
  detailRequest++
})
</script>
