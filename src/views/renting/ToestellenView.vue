<template>
  <div class="page">
    <h2>Toestellen</h2>

    <!-- TOOLBAR -->
    <ToestellenToolbar
      v-model:search="search"
      v-model:type="filterType"
      v-model:klant="filterKlant"
      :types="types"
      :klanten="klanten"
      @update:vrijToestel="onFilterChange"
      @create="openForm"
    />

    <!-- TABLE -->
    <ToestellenTable
      :toestellen="paginatedToestellen"
      @update-status="handleStatusUpdate"
      @edit-toestel="editForm"
    />

    <!-- PAGINATION -->
    <BasePagination
      :current-page="currentPage"
      :total-pages="totalPages"
      @next="next"
      @prev="prev"
    />

    <!-- OVERLAY FORM -->
    <div v-if="showForm" class="overlay">
      <div class="modal">
        <ToestellenForm
          :form="form"
          :types="types"
          :klanten="klanten"
          :isEdit="isEdit"
          @save="saveToestel"
          @cancel="closeForm"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, watch, onBeforeUnmount } from 'vue'

import ToestellenTable from '@/components/renting/toestellen/ToestellenTable.vue'
import ToestellenToolbar from '@/components/renting/toestellen/ToestellenToolbar.vue'
import ToestellenForm from '@/components/renting/toestellen/ToestellenForm.vue'
import BasePagination from '@/components/base/BasePagination.vue'

import { toestelApi } from '@/api/toestel'
import { klantApi } from '@/api/klant'

import { usePagination } from '@/composable/usePagination'

/* -----------------------------
   STATE
----------------------------- */
const toestellen = ref([])
const search = ref('')
const filterType = ref('')
const filterKlant = ref(null)
const currentDateFilter = ref(null)

const showForm = ref(false)
const klanten = ref([])
const types = ref([])

const form = reactive({
  _id: '',
  type: '',
  Ref: '',
  nrplaat: '',
  chasisnummer: '',
  status: {
    beginDatum: '',
    eindDatum: '',
    statusType: 'Actief',
  },
  klant: '',
})

const isEdit = ref(false)

/* -----------------------------
   PAGINATION (NEW)
----------------------------- */
const {
  currentPage,
  pageSize,
  totalPages,
  paginatedItems: paginatedToestellen,
  next,
  prev,
  reset,
} = usePagination(toestellen)

/* -----------------------------
   LOAD DATA
----------------------------- */
onMounted(() => {
  getKlanten()
  getTypes()
  loadToestellen()
  updatePageSize()

  window.addEventListener('resize', updatePageSize)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', updatePageSize)
})

async function getTypes() {
  try {
    const response = await toestelApi.getTypes()
    types.value = Array.isArray(response.types) ? response.types : []
  } catch (e) {
    console.error(e)
  }
}

async function getKlanten() {
  try {
    const data = await klantApi.list()
    klanten.value = Array.isArray(data) ? data : (data.items ?? [])
  } catch (e) {
    console.error(e)
  }
}

/* -----------------------------
   LOAD TOESTELLEN
----------------------------- */
async function loadToestellen() {
  try {
    const params = {
      search: search.value || undefined,
      type: filterType.value || undefined,

      // 🔥 FIX: klant toevoegen
      klant: filterKlant.value?._id || filterKlant.value || undefined,

      ...(currentDateFilter.value
        ? {
            beginDatum: currentDateFilter.value.beginDatum,
            eindDatum: currentDateFilter.value.eindDatum,
          }
        : {}),
    }

    const res = await toestelApi.list(params)
    toestellen.value = res.items || res
  } catch (e) {
    console.error('Fout bij laden toestellen', e)
  }
}

/* -----------------------------
   FILTERS
----------------------------- */
watch([search, filterType, filterKlant], () => {
  reset()
  loadToestellen()
})

function onFilterChange(dateRange) {
  currentDateFilter.value = dateRange
  reset()
  loadToestellen()
}

/* -----------------------------
   PAGE SIZE (UI ONLY)
----------------------------- */
function updatePageSize() {
  const availableHeight = window.innerHeight - 350
  const rowHeight = 60
  pageSize.value = Math.floor(availableHeight / rowHeight)
}

/* -----------------------------
   FORM LOGIC
----------------------------- */
function openForm() {
  resetForm()
  isEdit.value = false
  showForm.value = true
}

function editForm(toestel) {
  Object.assign(form, {
    _id: toestel._id,
    type: toestel.type?._id || toestel.type || '',
    Ref: toestel.Ref || '',
    nrplaat: toestel.nrplaat || '',
    chasisnummer: toestel.chasisnummer || '',
    status: {
      beginDatum: toestel.status?.beginDatum || '',
      eindDatum: toestel.status?.eindDatum || '',
      statusType: toestel.status?.statusType || 'Actief',
    },
    klant: toestel.klant?._id || toestel.klant || '',
  })

  isEdit.value = true
  showForm.value = true
}

function closeForm() {
  showForm.value = false
}

function resetForm() {
  Object.assign(form, {
    _id: '',
    type: '',
    Ref: '',
    nrplaat: '',
    chasisnummer: '',
    status: {
      beginDatum: '',
      eindDatum: '',
      statusType: 'Actief',
    },
    klant: '',
  })
}

/* -----------------------------
   SAVE
----------------------------- */
async function saveToestel(data) {
  try {
    if (data._id) await toestelApi.update(data._id, data)
    else await toestelApi.create(data)

    closeForm()
    loadToestellen()
    getTypes()
  } catch (e) {
    console.error('Fout bij opslaan toestel:', e)
  }
}

/* -----------------------------
   STATUS UPDATE
----------------------------- */
async function handleStatusUpdate(payload) {
  try {
    await toestelApi.updateStatus(payload.id, payload.statusType)
    loadToestellen()
  } catch (e) {
    console.error(e)
  }
}
</script>

<style scoped>
.page {
  padding: 1rem;
}

.overlay {
  position: fixed;
  inset: 0;
  background: rgba(27, 73, 101, 0.65);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 2000;
}

.modal {
  width: 360px;
  background: #bee9e8;
  border-radius: 8px;
  padding: 28px 24px;
  box-shadow: 0 15px 40px rgba(0, 0, 0, 0.25);
}
</style>
