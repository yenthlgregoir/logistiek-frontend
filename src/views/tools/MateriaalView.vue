<template>
  <div class="tools-page">
    <header class="tools-header">
      <div>
        <span class="tools-eyebrow">Tools · Uitleen</span>
        <h1>Materiaal</h1>
        <p class="tools-subtitle">Beheer je toestellen, materiaalvoorraad en uitleenhistoriek.</p>
      </div>
      <button class="tool-btn primary" @click="newMaterial">
        <Plus :size="17" />Materiaal toevoegen
      </button>
    </header>
    <div class="tools-stats">
      <div class="tools-stat">
        <strong>{{ store.materialen.length }}</strong
        ><span>Materiaalregistraties</span>
      </div>
      <div class="tools-stat">
        <strong>{{ availableCount }}</strong
        ><span>Met beschikbare voorraad</span>
      </div>
      <div class="tools-stat">
        <strong>{{ blockedCount }}</strong
        ><span>Met blokkering of defect</span>
      </div>
    </div>
    <div class="tools-toolbar">
      <input
        v-model="search"
        class="tools-search"
        aria-label="Materiaal zoeken"
        placeholder="Zoek naam, nummer, merk of serienummer"
      /><select v-model="category" aria-label="Categorie">
        <option value="">Alle categorieën</option>
        <option v-for="value in categories" :key="value">{{ value }}</option></select
      ><select v-model="status" aria-label="Toestand">
        <option value="">Alle toestanden</option>
        <option v-for="(label, key) in materialStatuses" :key="key" :value="key">
          {{ label }}
        </option></select
      ><label class="tools-check"
        ><input v-model="onlyAvailable" type="checkbox" />Alleen beschikbaar</label
      ><button class="tool-btn" :disabled="store.loadingMaterialen" @click="store.loadMaterialen()">
        Vernieuwen
      </button>
    </div>
    <div v-if="store.materiaalError" class="tools-error" role="alert">
      {{ store.materiaalError }}
    </div>
    <p v-if="store.loadingMaterialen" class="tools-muted" role="status">Materiaal laden…</p>
    <p v-if="notice" class="tools-notice" role="status">{{ notice }}</p>
    <BaseTable
      :items="paginatedItems"
      columns="1.6fr 1fr .8fr .8fr 1fr"
      item-key="id"
      :sortable-columns="columns"
      :sort-by="sortBy"
      :sort-direction="direction"
      @sort-change="sortChanged"
      @row-click="openMaterial"
    >
      <template #row="{ item }"
        ><div>
          <span class="tools-row-title">{{ item.naam }}</span
          ><span class="tools-row-sub"
            >{{ item.nummer || 'Per aantal' }} ·
            {{ item.merk || item.model || item.categorie }}</span
          >
        </div>
        <div>{{ item.categorie }}</div>
        <div>
          <strong>{{ number(item.beschikbaarheid?.beschikbaarAantal) }}</strong
          ><span class="tools-row-sub">van {{ number(item.totaalAantal) }} totaal</span>
        </div>
        <div>
          {{ number(item.beschikbaarheid?.uitgeleendAantal)
          }}<span v-if="item.geblokkeerdAantal" class="tools-row-sub"
            >{{ item.geblokkeerdAantal }} geblokkeerd</span
          >
        </div>
        <ToolsStatus :value="item.status"
      /></template>
      <template #empty>{{
        store.materialen.length
          ? 'Geen materiaal gevonden voor deze filters.'
          : 'Nog geen materiaal geregistreerd. Voeg je eerste toestel of materiaalvoorraad toe.'
      }}</template>
    </BaseTable>
    <BasePagination
      :current-page="currentPage"
      :total-pages="totalPages"
      @next="next"
      @prev="prev"
    />
    <MateriaalForm
      v-if="drawer === 'form'"
      :material="editing"
      :categories="categories"
      :saving="store.busy"
      :error="actionError"
      @close="close"
      @save="save"
    />
    <MateriaalDetail
      v-if="drawer === 'detail' && selected"
      :material="selected"
      :saving="store.busy"
      :error="actionError"
      :history="history"
      :history-loading="historyLoading"
      @close="close"
      @edit="edit"
      @correctie="correct"
      @history="loadHistory"
      @open-uitleen="openLoan"
    />
  </div>
</template>
<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { Plus } from 'lucide-vue-next'
import BaseTable from '@/components/base/BaseTable.vue'
import BasePagination from '@/components/base/BasePagination.vue'
import MateriaalForm from '@/components/tools/MateriaalForm.vue'
import MateriaalDetail from '@/components/tools/MateriaalDetail.vue'
import ToolsStatus from '@/components/tools/ToolsStatus.vue'
import { usePagination } from '@/composable/usePagination'
import { useUitleenStore } from '@/stores/tools/uitleen.store'
import { materiaalApi } from '@/api/uitleen'
import { materialStatuses, idOf, number, errorMessage } from '@/utils/uitleen'
import '@/assets/tools.css'
const store = useUitleenStore(),
  router = useRouter()
const search = ref(''),
  category = ref(''),
  status = ref(''),
  onlyAvailable = ref(false)
const drawer = ref(null),
  selected = ref(null),
  editing = ref(null)
const history = ref([]),
  historyLoading = ref(false),
  actionError = ref(''),
  notice = ref('')
const sortBy = ref('naam'),
  direction = ref('asc')
let alive = true,
  historyRequest = 0
const columns = [
  { key: 'naam', label: 'Materiaal' },
  { key: 'categorie', label: 'Categorie' },
  { key: 'vrij', label: 'Beschikbaar' },
  { key: 'uit', label: 'Uitgeleend' },
  { key: 'status', label: 'Toestand' },
]
const categories = computed(() =>
  [...new Set(store.materialen.map((item) => item.categorie).filter(Boolean))].sort(),
)
const availableCount = computed(
  () => store.materialen.filter((item) => item.beschikbaarheid?.beschikbaarAantal > 0).length,
)
const blockedCount = computed(
  () =>
    store.materialen.filter((item) => item.status !== 'ACTIEF' || item.geblokkeerdAantal > 0)
      .length,
)
const collator = new Intl.Collator('nl-BE', { numeric: true, sensitivity: 'base' })
const filtered = computed(() => {
  const term = search.value.trim().toLocaleLowerCase('nl-BE')
  const values = store.materialen.filter(
    (item) =>
      (!category.value || item.categorie === category.value) &&
      (!status.value || item.status === status.value) &&
      (!onlyAvailable.value || item.beschikbaarheid?.beschikbaarAantal > 0) &&
      (!term ||
        [item.naam, item.nummer, item.merk, item.model, item.serienummer, item.categorie].some(
          (value) =>
            String(value ?? '')
              .toLocaleLowerCase('nl-BE')
              .includes(term),
        )),
  )
  const value = (item) =>
    sortBy.value === 'vrij'
      ? (item.beschikbaarheid?.beschikbaarAantal ?? 0)
      : sortBy.value === 'uit'
        ? (item.beschikbaarheid?.uitgeleendAantal ?? 0)
        : (item[sortBy.value] ?? '')
  return values.sort(
    (a, b) =>
      (typeof value(a) === 'number'
        ? value(a) - value(b)
        : collator.compare(String(value(a)), String(value(b)))) *
      (direction.value === 'asc' ? 1 : -1),
  )
})
const { currentPage, totalPages, paginatedItems, next, prev, reset, setPage } = usePagination(
  filtered,
  { pageSize: 15 },
)
watch([search, category, status, onlyAvailable], reset)
watch(totalPages, () => setPage(currentPage.value))
function sortChanged({ key, direction: value }) {
  sortBy.value = key
  direction.value = value
}
function newMaterial() {
  editing.value = null
  actionError.value = ''
  drawer.value = 'form'
}
function openMaterial(item) {
  historyRequest++
  historyLoading.value = false
  selected.value = item
  history.value = []
  actionError.value = ''
  drawer.value = 'detail'
}
function edit() {
  editing.value = selected.value
  actionError.value = ''
  drawer.value = 'form'
}
function close() {
  if (!store.busy) {
    drawer.value = null
    actionError.value = ''
    historyRequest++
    historyLoading.value = false
  }
}
async function save(value) {
  actionError.value = ''
  try {
    const result = await store.saveMateriaal(value, idOf(editing.value))
    if (!alive) return
    selected.value = result
    drawer.value = 'detail'
    notice.value = 'Materiaal opgeslagen.'
  } catch (error) {
    if (alive) actionError.value = errorMessage(error)
  }
}
async function correct(value) {
  actionError.value = ''
  try {
    const result = await store.correctVoorraad(idOf(selected.value), value)
    if (alive) {
      selected.value = result
      notice.value = 'Voorraadcorrectie opgeslagen.'
    }
  } catch (error) {
    if (alive) actionError.value = errorMessage(error)
  }
}
async function loadHistory() {
  const id = idOf(selected.value),
    request = ++historyRequest
  historyLoading.value = true
  actionError.value = ''
  try {
    const result = await materiaalApi.historiek(id)
    if (alive && request === historyRequest) history.value = result
  } catch (error) {
    if (alive && request === historyRequest) actionError.value = errorMessage(error)
  } finally {
    if (alive && request === historyRequest) historyLoading.value = false
  }
}
function openLoan(id) {
  router.push({ path: '/tools/uitleen', query: { uitleen: id } })
}
onMounted(() => store.loadMaterialen())
onBeforeUnmount(() => {
  alive = false
  historyRequest++
})
</script>
