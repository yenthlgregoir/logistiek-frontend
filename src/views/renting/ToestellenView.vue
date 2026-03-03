<template>
  <div class="page">
    <ToestellenToolbar
      v-model:search="search"
      v-model:type="filterType"
      v-model:klant="filterKlant"
      :types="types"
      :klanten="klanten"
      @create="openForm"
    />

    <!-- TABLE -->
    <ToestellenTable
      :toestellen="filteredToestellen"
      @update-status="handleStatusUpdate"
      @edit-toestel="editForm"
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
import { ref, reactive, computed, onMounted } from 'vue'
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

onMounted(loadToestellen)
onMounted(getKlanten)
onMounted(getTypes)

async function loadToestellen() {
  try {
    const data = await toestelApi.list()
    toestellen.value = Array.isArray(data) ? data : data.items ?? []
  } catch (e) {
    console.error(e)
    alert('Laden van toestellen mislukt')
  }
}

async function getTypes() {
  try {
    const response = await toestelApi.getTypes()
    types.value = Array.isArray(response.types) ? response.types : []
  } catch (e) {
    console.error(e)
    alert('Laden van types mislukt')
  }
}

async function getKlanten() {
  try {
    const data = await klantApi.list()
    klanten.value = Array.isArray(data) ? data : data.items ?? []
  } catch (e) {
    console.error(e)
  }
}

/* -----------------------------
   FORM LOGIC
----------------------------- */

function openForm() {
  resetForm()
  isEdit.value = false
  getKlanten()
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
    klant: toestel.klant?._id || toestel.klant || ''
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
    if (data._id) {
      await toestelApi.update(data._id, data)
    } else {
      await toestelApi.create(data)
    }
    closeForm()
    loadToestellen()
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

/* -----------------------------
   FILTER
----------------------------- */

const filteredToestellen = computed(() => {
  return toestellen.value.filter((t) => {
    const q = search.value.toLowerCase()
    const matchSearch =
      !search.value ||
      t._id?.toLowerCase().includes(q) ||
      t.type?.naam?.toLowerCase().includes(q) ||
      t.Ref?.toLowerCase().includes(q) ||
      t.nrplaat?.toLowerCase().includes(q) ||
      t.chasisnummer?.toLowerCase().includes(q) ||
      t.klant?.naam?.toLowerCase().includes(q)

    const matchType = !filterType.value || t.type?.naam === filterType.value
    const matchKlant = !filterKlant.value || t.klant?._id === filterKlant.value

    return matchSearch && matchType && matchKlant
  })
})
</script>

<style scoped>
.page {
  padding: 24px;
  background: #f8fafc;
  min-height: 100vh;
}

/* OVERLAY */
.overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 2000;
}

/* MODAL */
.modal {
  width: 360px;
  background: #f4f4f4;
  border-radius: 8px;
  padding: 28px 24px;
  box-shadow: 0 15px 40px rgba(0, 0, 0, 0.25);
  animation: fadeIn 0.18s ease-out;
}
</style>