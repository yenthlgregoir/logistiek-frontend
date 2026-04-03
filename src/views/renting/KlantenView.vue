<template>
  <div class="page">
    <h2>Klanten</h2>

    <!-- LIST -->
    <KlantenList
      :klanten="paginatedKlanten"
      :search="search"
      :selected-id="selectedKlant?._id"
      @update:search="search = $event"
      @select="selectKlant"
      @new="selectNew"
    />

    <!-- PAGINATION -->
    <div v-if="klanten.length > pageSize" class="pagination">
      <button :disabled="currentPage === 1" @click="currentPage--">Vorige</button>

      <span>Pagina {{ currentPage }} van {{ totalPages }}</span>

      <button :disabled="currentPage === totalPages" @click="currentPage++">Volgende</button>
    </div>

    <!-- DETAIL SLIDE-OVER -->
    <KlantenDetail
      :show="showDetail"
      :form="form"
      :selected-klant="selectedKlant"
      @save="saveKlant"
      @cancel="cancel"
      @delete="deleteKlant"
      @close="showDetail = false"
      @leveradresToevoegen="leveradresToevoegen"
      @update-lever-adres="updateLeverAdres"
      @remove-lever-adres="removeLeverAdres"
    />

    <!-- NIEUW ADRES -->
    <NieuwLeveradresModal
      :show="showModal"
      :model-value="nieuwAdres"
      @close="showModal = false"
      @save="addLeverAdres"
    />
  </div>
</template>

<script setup>
import { reactive, ref, computed, onMounted, onBeforeUnmount } from 'vue'

import KlantenList from '@/components/renting/klanten/KlantenList.vue'
import KlantenDetail from '@/components/renting/klanten/KlantenDetail.vue'
import NieuwLeveradresModal from '@/components/renting/klanten/NieuwLeveradresModal.vue'

import { klantApi } from '@/api/klant'

const klanten = ref([])
const search = ref('')
const selectedKlant = ref(null)
const showDetail = ref(false)

const filteredKlanten = computed(() => {
  const term = search.value.toLowerCase()
  return klanten.value.filter(
    (k) => k.naam?.toLowerCase().includes(term) || k.klantNummer?.toLowerCase().includes(term),
  )
})

/* -----------------------------
   PAGINATION (same as toestellen)
----------------------------- */
const currentPage = ref(1)
const pageSize = ref(9)

const totalPages = computed(() => Math.ceil(filteredKlanten.value.length / pageSize.value))

const paginatedKlanten = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return filteredKlanten.value.slice(start, start + pageSize.value)
})

function updatePageSize() {
  const availableHeight = window.innerHeight - 330
  const rowHeight = 60
  pageSize.value = Math.floor(availableHeight / rowHeight)
}

onMounted(() => {
  updatePageSize()
  window.addEventListener('resize', updatePageSize)
  loadKlanten()
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', updatePageSize)
})

/* -----------------------------
   LOAD KLANTEN
----------------------------- */
async function loadKlanten() {
  try {
    const data = await klantApi.list()
    klanten.value = Array.isArray(data) ? data : (data.items ?? [])
  } catch (e) {
    console.error('Laden van klanten mislukt', e)
  }
}

/* -----------------------------
   FORM + DETAIL
----------------------------- */
const form = reactive({
  id: null,
  naam: '',
  klantNummer: '',
  telefoonnummer: '',
  mailadres: '',
  factuurAdres: { straat: '', huisnummer: '', postcode: '', gemeente: '' },
  leverAdressen: [],
  BTWnummer: '',
})

const nieuwAdres = reactive({
  naam: '',
  straat: '',
  huisnummer: '',
  postcode: '',
  gemeente: '',
})
const showModal = ref(false)

function selectKlant(k) {
  selectedKlant.value = k
  showDetail.value = true

  Object.assign(form, {
    id: k._id,
    naam: k.naam,
    klantNummer: k.klantNummer,
    telefoonnummer: k.telefoonnummer,
    mailadres: k.mailadres,
    factuurAdres: {
      straat: k.factuurAdres?.straat ?? '',
      huisnummer: k.factuurAdres?.huisnummer ?? '',
      postcode: k.factuurAdres?.postcode ?? '',
      gemeente: k.factuurAdres?.gemeente ?? '',
    },
    leverAdressen: k.leverAdressen ?? [],
    BTWnummer: k.BTWnummer,
  })
}

function selectNew() {
  selectedKlant.value = null
  showDetail.value = true

  Object.assign(form, {
    id: null,
    naam: '',
    klantNummer: '',
    telefoonnummer: '',
    mailadres: '',
    factuurAdres: { straat: '', huisnummer: '', postcode: '', gemeente: '' },
    leverAdressen: [],
    BTWnummer: '',
  })
}

async function saveKlant(data) {
  try {
    if (selectedKlant.value) {
      await klantApi.update(selectedKlant.value._id, data)
    } else {
      await klantApi.add(JSON.stringify(data))
    }

    loadKlanten()
    showDetail.value = false
  } catch (e) {
    console.error('Fout bij opslaan klant', e)
  }
}

function cancel() {
  showDetail.value = false
}

function leveradresToevoegen() {
  Object.assign(nieuwAdres, {
    naam: '',
    straat: '',
    huisnummer: '',
    postcode: '',
    gemeente: '',
  })
  showModal.value = true
}

async function addLeverAdres(adres) {
  if (selectedKlant.value?._id) {
    await klantApi.addLeverAdres(selectedKlant.value._id, JSON.stringify(adres))
    refreshKlant(selectedKlant.value._id)
    showModal.value = false
  } else {
    form.leverAdressen.push({ ...adres })
  }
}

async function updateLeverAdres(adres) {
  await klantApi.updateLeverAdres(selectedKlant.value._id, adres)
  refreshKlant(selectedKlant.value._id)
}

async function removeLeverAdres(adres) {
  await klantApi.removeLeverAdres(selectedKlant.value._id, adres._id)
  refreshKlant(selectedKlant.value._id)
}

async function deleteKlant() {
  await klantApi.remove(selectedKlant.value._id)
  loadKlanten()
  showDetail.value = false
}

async function refreshKlant(id) {
  const updated = await klantApi.get(id)
  selectedKlant.value = updated
  Object.assign(form, updated)
}
</script>

<style scoped>
.page {
  padding: 1rem;
  overflow: hidden;
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
  cursor: pointer;
}

.pagination button:disabled {
  background-color: #a1b9f5;
  cursor: not-allowed;
}
</style>
