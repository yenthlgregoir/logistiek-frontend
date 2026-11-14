import { defineStore } from 'pinia'
import { ref } from 'vue'
import { materiaalApi, uitleenApi, toolsKeuzeApi } from '@/api/uitleen'
import { errorMessage, idOf } from '@/utils/uitleen'

function rows(value) {
  return Array.isArray(value)
    ? value
    : Array.isArray(value?.data)
      ? value.data
      : (value?.items ?? [])
}
function upsert(list, item) {
  const index = list.findIndex((value) => idOf(value) === idOf(item))
  if (index < 0) list.push(item)
  else list[index] = item
}

export const useUitleenStore = defineStore('tools-uitleen', () => {
  const materialen = ref([])
  const uitleningen = ref([])
  const werven = ref([])
  const projectleiders = ref([])
  const loadingMaterialen = ref(false)
  const loadingUitleen = ref(false)
  const busy = ref(false)
  const materiaalError = ref('')
  const uitleenError = ref('')
  const referentieError = ref('')
  let materialRequest = 0,
    loanRequest = 0
  let referencesLoaded = false

  async function loadMaterialen() {
    const request = ++materialRequest
    loadingMaterialen.value = true
    materiaalError.value = ''
    try {
      const result = await materiaalApi.list()
      if (request === materialRequest) materialen.value = result
    } catch (error) {
      if (request === materialRequest)
        materiaalError.value = errorMessage(error, 'Materiaal laden is mislukt.')
    } finally {
      if (request === materialRequest) loadingMaterialen.value = false
    }
  }
  async function loadUitleningen(filters = {}) {
    const request = ++loanRequest
    loadingUitleen.value = true
    uitleenError.value = ''
    try {
      const result = await uitleenApi.list(filters)
      if (request === loanRequest) uitleningen.value = result
    } catch (error) {
      if (request === loanRequest)
        uitleenError.value = errorMessage(error, 'Uitleningen laden is mislukt.')
    } finally {
      if (request === loanRequest) loadingUitleen.value = false
    }
  }
  async function loadReferenties(force = false) {
    if (referencesLoaded && !force) return
    const [sites, leaders] = await Promise.allSettled([toolsKeuzeApi.werven(), toolsKeuzeApi.projectleiders()])
    if (sites.status === 'fulfilled') werven.value = rows(sites.value)
    if (leaders.status === 'fulfilled') projectleiders.value = rows(leaders.value)
    referencesLoaded = sites.status === 'fulfilled' && leaders.status === 'fulfilled'
    referentieError.value = referencesLoaded
      ? ''
      : 'Werven of projectleiders konden niet geladen worden. Je kunt ook een vrije locatie invullen.'
  }
  async function mutate(work, kind) {
    if (busy.value) throw new Error('Er wordt nog een wijziging opgeslagen.')
    busy.value = true
    try {
      const result = await work()
      upsert(kind === 'material' ? materialen.value : uitleningen.value, result)
      return result
    } finally {
      busy.value = false
    }
  }
  const saveMateriaal = (value, id) =>
    mutate(() => (id ? materiaalApi.update(id, value) : materiaalApi.create(value)), 'material')
  const correctVoorraad = (id, value) =>
    mutate(() => materiaalApi.voorraadCorrectie(id, value), 'material')
  const saveUitleen = (value, id) =>
    mutate(() => (id ? uitleenApi.update(id, value) : uitleenApi.create(value)), 'loan')
  const uitgeven = (id) => mutate(() => uitleenApi.uitgeven(id), 'loan')
  const retour = (id, value) => mutate(() => uitleenApi.retour(id, value), 'loan')
  const annuleren = (id) => mutate(() => uitleenApi.annuleren(id), 'loan')
  const verwachteRetour = (id, datum, permanent) =>
    mutate(() => uitleenApi.verwachteRetour(id, datum, permanent), 'loan')
  return {
    materialen,
    uitleningen,
    werven,
    projectleiders,
    loadingMaterialen,
    loadingUitleen,
    busy,
    materiaalError,
    uitleenError,
    referentieError,
    loadMaterialen,
    loadUitleningen,
    loadReferenties,
    saveMateriaal,
    correctVoorraad,
    saveUitleen,
    uitgeven,
    retour,
    annuleren,
    verwachteRetour,
  }
})
