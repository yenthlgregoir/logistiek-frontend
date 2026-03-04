<template>
  <div class="page">
    <div class="container">
      <KlantenList
        :klanten="klanten"
        :search="search"
        :selected-id="selectedKlant?._id"
        @update:search="search = $event"
        @select="selectKlant"
        @new="selectNew"
      />

      <KlantenDetail
        :form="form"
        :selected-klant="selectedKlant"
        @save="saveKlant"
        @cancel="cancel"
        @delete="deleteKlant"
        @leveradres-toevoegen="leveradresToevoegen"
        @remove-lever-adres="removeLeverAdres"
        @update-lever-adres="updateLeverAdres"
      />

      <NieuwLeveradresModal
        :show="showModal"
        :model-value="nieuwAdres"
        @close="showModal = false"
        @save="addLeverAdres"
      />
    </div>
  </div>
</template>

<script setup>
import { reactive, ref, onMounted } from 'vue'

import KlantenList from '@/components/renting/klanten/KlantenList.vue'
import KlantenDetail from '@/components/renting/klanten/KlantenDetail.vue'
import NieuwLeveradresModal from '@/components/renting/klanten/NieuwLeveradresModal.vue'
import { klantApi } from '@/api/klant'

const klanten = ref([])
const selectedKlant = ref(null)
const search = ref('')
const showModal = ref(false)

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

// Lifecycle
onMounted(loadKlanten)

// Functions
async function loadKlanten() {
  try {
    const data = await klantApi.list()
    console.log(data)
    klanten.value = Array.isArray(data) ? data : (data.items ?? [])
  } catch (e) {
    console.error(e)
    alert('Laden van klanten mislukt')
  }
}

function selectKlant(k) {
  selectedKlant.value = k
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
    selectNew()
    loadKlanten()
  } catch (error) {
    console.error('Fout bij opslaan klant:', error)
  }
}

function cancel() {
  selectNew()
}

function leveradresToevoegen() {
  showModal.value = true
}

async function addLeverAdres(adres) {
  if (selectedKlant.value?._id) {
    // Bestaande klant → direct naar backend
    await klantApi.addLeverAdres(selectedKlant.value._id, JSON.stringify(adres))
    showModal.value = false
    selectNew()
    loadKlanten()
  } else {
    // Nieuwe klant → enkel lokaal toevoegen
    form.leverAdressen.push({ ...adres })
  }

  showModal.value = false
}

async function removeLeverAdres(adres) {
  if (selectedKlant.value?._id) {
    try {
      // Bestaande klant → backend verwijderen
      await klantApi.removeLeverAdres(selectedKlant.value._id, adres._id)
      selectNew()
      loadKlanten()
    } catch (err) {
      console.error(err)
    }
  } else {
    // Nieuwe klant → lokaal verwijderen
    form.leverAdressen = form.leverAdressen.filter((a) => a !== adres)
  }
}

async function updateLeverAdres(adres) {
      try {
      // Bestaande klant → backend verwijderen
      await klantApi.updateLeverAdres(selectedKlant.value._id, adres)
      selectNew()
      loadKlanten()
    } catch (err) {
      console.error(err)
    }
}
async function deleteKlant() {
  try {
    await klantApi.remove(selectedKlant.value._id)
    selectNew()
    loadKlanten()
  } catch (e) {
    console.error(e)
    alert('Verwijderen van klant mislukt')
  }
}
</script>

<style scoped>
.page {
  min-height: 90vh;
  overflow-y: auto;
  background: #f5f7fa;
}

.container {
  display: flex;
  gap: 20px;
  padding: 20px;
  font-family: Arial, sans-serif;
  height: 90vh;
  overflow: hidden;
  min-height: 0;
}

.klanten-pane {
  flex: 1;
  border: 1px solid #ddd;
  border-radius: 8px;
  background: #f8f8f8;
  display: flex;
  flex-direction: column;
  min-height: 0;
}
.detail-pane {
  flex: 2;
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 20px;
  background: #fff;
  overflow: auto;
  min-height: 0;
}
</style>
