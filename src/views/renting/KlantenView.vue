<template>
  <div class="page">
    <h2>Klanten</h2>
    <KlantenList
      :klanten="paginatedKlanten"
      :search="search"
      :selected-id="selectedKlant?._id"
      @update:search="search = $event"
      @select="selectKlant"
      @new="selectNew"
    />
    <BasePagination
      :current-page="currentPage"
      :total-pages="totalPages"
      @next="next"
      @prev="prev"
    />
    <KlantenDetail
      :show="showDetail"
      :form="form"
      :selected-klant="selectedKlant"
      @save="saveKlant"
      @delete="deleteKlant"
      @close="closeDetail"
      @edit-lever-adres="editLeveradres"
      @leveradresToevoegen="leveradresToevoegen"
      @update-lever-adres="upsertLeverAdres"
      @remove-lever-adres="removeLeverAdresLocal"
    />
    <NieuwLeveradresModal
      :show="showModal"
      :model-value="nieuwAdres"
      @close="showModal = false"
      @save="addLeverAdresModal"
    />
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onBeforeUnmount, watch } from 'vue'

import KlantenList from '@/components/renting/klanten/KlantenList.vue'
import KlantenDetail from '@/components/renting/klanten/KlantenDetail.vue'
import NieuwLeveradresModal from '@/components/renting/klanten/NieuwLeveradresModal.vue'
import BasePagination from '@/components/base/BasePagination.vue'

import { klantApi } from '@/api/klant'
import { usePagination } from '@/composable/usePagination'

/* STATE */
const klanten = ref([])
const search = ref('')
const selectedKlant = ref(null)
const showDetail = ref(false)

/* PAGINATION */
const filteredKlanten = computed(() => {
  const term = search.value.toLowerCase()
  return klanten.value.filter(
    (k) =>
      k.naam?.toLowerCase().includes(term) ||
      k.klantNummer?.toLowerCase().includes(term)
  )
})

const {
  currentPage,
  pageSize,
  totalPages,
  paginatedItems: paginatedKlanten,
  next,
  prev,
  reset,
} = usePagination(filteredKlanten)

onMounted(() => {
  updatePageSize()
  window.addEventListener('resize', updatePageSize)
  loadKlanten()
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', updatePageSize)
})

async function loadKlanten() {
  const data = await klantApi.list()
  klanten.value = Array.isArray(data) ? data : (data.items ?? [])
}
function editLeveradres(adres) {
  Object.assign(nieuwAdres, {
    _id: undefined,
    naam: '',
    straat: '',
    huisnummer: '',
    postcode: '',
    gemeente: '',
  })

  Object.assign(nieuwAdres, adres)

  showModal.value = true
}
function updatePageSize() {
  const availableHeight = window.innerHeight - 330
  const rowHeight = 60
  pageSize.value = Math.floor(availableHeight / rowHeight)
}

watch(search, () => reset())

/* FORM (DRAFT STATE) */
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

/* MODAL */
const showModal = ref(false)
const nieuwAdres = reactive({
  naam: '',
  straat: '',
  huisnummer: '',
  postcode: '',
  gemeente: '',
})

/* SELECT */
function selectKlant(k) {
  selectedKlant.value = k
  showDetail.value = true

  Object.assign(form, JSON.parse(JSON.stringify({
    id: k._id,
    naam: k.naam,
    klantNummer: k.klantNummer,
    telefoonnummer: k.telefoonnummer,
    mailadres: k.mailadres,
    factuurAdres: k.factuurAdres ?? {},
    leverAdressen: k.leverAdressen ?? [],
    BTWnummer: k.BTWnummer,
  })))
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

/* SAVE (ENIGE API MOMENT) */
async function saveKlant(data) {
  if (selectedKlant.value) {
    await klantApi.update(selectedKlant.value._id, data)
  } else {
    await klantApi.add(JSON.stringify(data))
  }

  await loadKlanten()
  showDetail.value = false
}

/* LEVERADRES FLOW (LOCAL ONLY) */
function leveradresToevoegen(localForm) {
  Object.assign(form , localForm)
  Object.assign(nieuwAdres, {
    _id: undefined,
    naam: '',
    straat: '',
    huisnummer: '',
    postcode: '',
    gemeente: '',
  })
  showModal.value = true
}

function addLeverAdresModal(adres) {
  if(adres._id){
    upsertLeverAdres(adres)
  }
  else{
      form.leverAdressen.push({ ...adres })

  }
  showModal.value = false
  Object.assign(nieuwAdres, {
    _id: undefined,
    naam: '',
    straat: '',
    huisnummer: '',
    postcode: '',
    gemeente: '',
  })
}

function upsertLeverAdres(adres) {
  const list = form.leverAdressen

  const index = adres._id
    ? list.findIndex(a => a._id === adres._id)
    : list.findIndex(a =>
        a.naam === adres.naam &&
        a.straat === adres.straat &&
        a.huisnummer === adres.huisnummer &&
        a.postcode === adres.postcode &&
        a.gemeente === adres.gemeente
      )

  if (index !== -1) {
    list[index] = { ...adres }
  } else {
    list.push({ ...adres })
  }
}

function removeLeverAdresLocal(adres) {
  form.leverAdressen = form.leverAdressen.filter(a =>
    a._id
      ? a._id !== adres._id
      : !(
          a.naam === adres.naam &&
          a.straat === adres.straat &&
          a.huisnummer === adres.huisnummer &&
          a.postcode === adres.postcode &&
          a.gemeente === adres.gemeente
        )
  )
}

/* DELETE */
async function deleteKlant() {
  await klantApi.remove(selectedKlant.value._id)
  await loadKlanten()
  showDetail.value = false
}

/* CLOSE */
function closeDetail() {
  showDetail.value = false
}
</script>

<style scoped>
.page {
  padding: 1rem;
  overflow: hidden;
}
</style>