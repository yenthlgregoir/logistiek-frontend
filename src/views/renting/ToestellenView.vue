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
    <div v-if="toestellen.length > pageSize" class="pagination">
      <button :disabled="currentPage === 1" @click="currentPage--">Vorige</button>

      <span>Pagina {{ currentPage }} van {{ totalPages }}</span>

      <button :disabled="currentPage === totalPages" @click="currentPage++">Volgende</button>
    </div>
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
import { ref, reactive, onMounted, watch, computed, onBeforeUnmount } from 'vue'
import ToestellenTable from '@/components/toestellen/ToestellenTable.vue'
import ToestellenToolbar from '@/components/toestellen/ToestellenToolbar.vue'
import ToestellenForm from '@/components/toestellen/ToestellenForm.vue'
import { toestelApi } from '@/api/toestel'
import { klantApi } from '@/api/klant'

/* -----------------------------
   STATE
----------------------------- */
const toestellen = ref([])
const search = ref('')
const filterType = ref('')
const filterKlant = ref('')
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
   LOAD DATA
----------------------------- */
onMounted(() => {
  getKlanten()
  getTypes()
  loadToestellen()
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
   LOAD TOESTELLEN MET FILTERS
----------------------------- */
async function loadToestellen() {
  try {
    const params = {
      search: search.value || undefined,
      type: filterType.value || undefined,
      klant: filterKlant.value || undefined,
      ...(currentDateFilter.value
        ? {
            beginDatum: currentDateFilter.value.beginDatum,
            eindDatum: currentDateFilter.value.eindDatum,
          }
        : {}),
    }
    const res = await toestelApi.list(params)
    console.log(res)
    toestellen.value = res.items || res
  } catch (e) {
    console.error('Fout bij laden toestellen', e)
  }
}

/* -----------------------------
   WATCHERS VOOR BACKEND FILTERING
----------------------------- */
watch([search, filterType, filterKlant], loadToestellen)

/* -----------------------------
   VRIJE TOESTELLEN
----------------------------- */
function onFilterChange(dateRange) {
  currentDateFilter.value = dateRange
  loadToestellen()
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
   SAVE TOESTEL
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
   UPDATE STATUS
----------------------------- */
async function handleStatusUpdate(payload) {
  try {
    await toestelApi.updateStatus(payload.id, payload.statusType)
    loadToestellen()
  } catch (e) {
    console.error(e)
  }
}

const currentPage = ref(1)
const pageSize = ref(9) // default, wordt overschreven
const totalPages = computed(() => Math.ceil(toestellen.value.length / pageSize.value))

function updatePageSize() {
  // hoogte van viewport min header + toolbar (bijv 200px)
  const availableHeight = window.innerHeight - 350

  const rowHeight = 60

  pageSize.value = Math.floor(availableHeight / rowHeight)
}

// recompute bij resize
onMounted(() => {
  updatePageSize()
  window.addEventListener('resize', updatePageSize)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', updatePageSize)
})
const paginatedToestellen = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return toestellen.value.slice(start, end)
})
</script>
<style scoped>
/* OVERLAY */
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

/* MODAL */

.modal {
  width: 360px;
  background: #bee9e8;
  border-radius: 8px;
  padding: 28px 24px;
  box-shadow: 0 15px 40px rgba(0, 0, 0, 0.25);
}
.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: 20px;
  gap: 12px;
}

.pagination button {
  padding: 6px 12px;
  border-radius: 6px;
  border: none;
  background-color: #5786f7;
  color: white;
  font-weight: 500;
  cursor: pointer;
  transition: 0.2s ease;
}

.pagination button:disabled {
  background-color: #a1b9f5;
  cursor: not-allowed;
}

.pagination span {
  font-weight: 500;
  color: #1b4965;
}
</style>
