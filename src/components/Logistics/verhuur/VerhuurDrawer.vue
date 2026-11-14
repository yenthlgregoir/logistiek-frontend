<template>
  <BaseDrawer :show="show" :title="`REF: ${verhuurCopy.reference || '—'}`"
    :subtitle="verhuurCopy.logistiekeReferentie" @close="$emit('close')">
    <div v-for="block in blocks" :key="block.label" class="info-card">
      <div class="card-label">{{ block.label }}</div>
      <div class="card-content">
        <div>{{ block.content }}</div>
        <button v-if="block.action" type="button" class="link-btn" :disabled="isAssigning || loading"
          @click="block.action">{{ block.actionLabel }}</button>
      </div>
    </div>

    <div class="info-card">
      <div class="card-label">Status</div>
      <select v-model="verhuurCopy.status" class="status-select" :disabled="isAssigning || loading">
        <option v-for="status in statusOptions" :key="status" :value="status">{{ status }}</option>
      </select>
    </div>
    <div v-if="localError || error" class="error-box" role="alert">{{ localError || error }}</div>

    <template #header-extra>
      <ChangeHistory v-if="show && verhuurCopy.id" compact :entity-id="verhuurCopy.id" entity-type="verhuur" :revision="historyRevision" />
    </template>
    <template #footer>
      <button type="button" class="btn btn-blue" :disabled="isAssigning || loading" @click="saveVerhuur">Opslaan</button>
      <button type="button" class="btn btn-red" :disabled="isAssigning || loading" @click="onDelete">Verwijderen</button>
    </template>
  </BaseDrawer>

  <VrijeToestellenModal v-if="showToestelModal" :toestellen="vrijeToestellen"
    :selected-toestel="verhuurCopy.asset" :toon-werkhoogte-filter="isHoogtewerker"
    :minimum-werkhoogte="verhuurCopy.werkhoogte" :loading="loadingAssets" :busy="isAssigning"
    :error="assetError" @select="selectToestel" @retry="fetchVrijeToestellen" @close="closeAssetModal" />
  <WerfWijzigenModal v-if="showWerfModal" :werven="alleWerven"
    @select="selectWerf" @close="showWerfModal = false" />
  <ProjectleiderWijzigenModal v-if="showProjectleiderModal" :projectleiders="alleProjectleiders"
    @select="selectProjectleider" @close="showProjectleiderModal = false" />
  <PeriodeWijzigenModal v-if="showPeriodeModal" :boeking="verhuurCopy"
    @save="updatePeriode" @close="showPeriodeModal = false" />
</template>

<script setup>
import { reactive, ref, watch, computed } from 'vue'
import ChangeHistory from '@/components/base/ChangeHistory.vue'
import BaseDrawer from '@/components/base/BaseDrawer.vue'
import VrijeToestellenModal from '@/components/Logistics/verhuur/VrijeToestellenModal.vue'
import WerfWijzigenModal from '@/components/Logistics/verhuur/WerfWijzigenModal.vue'
import ProjectleiderWijzigenModal from '@/components/Logistics/verhuur/ProjectleiderWijzigenModal.vue'
import PeriodeWijzigenModal from '@/components/Logistics/verhuur/PeriodeWijzigenModal.vue'
import { verhuurApi } from '@/api/verhuur.js'
import { werfApi } from '@/api/werf.js'
import { leiderApi } from '@/api/projectLeider.js'

const props = defineProps({ show: Boolean, verhuur: Object, loading: Boolean, error: String })
const emit = defineEmits(['close', 'edit', 'delete', 'assigned'])
const showWerfModal = ref(false)
const showProjectleiderModal = ref(false)
const showPeriodeModal = ref(false)
const showToestelModal = ref(false)
const alleProjectleiders = ref([])
const alleWerven = ref([])
const vrijeToestellen = ref([])
const loadingAssets = ref(false)
const isAssigning = ref(false)
const localError = ref('')
const assetError = ref('')
const savedPayload = ref('')
const historyRevision = ref(0)
let assetRequest = 0

const verhuurCopy = reactive({})
const isHoogtewerker = computed(() => verhuurCopy.assetModel === 'HOOGTEWERKER')
const statusOptions = computed(() => {
  const current = props.verhuur?.status?.toUpperCase() || 'LEVEREN'
  const next = {
    LEVEREN: ['LEVEREN', 'GELEVERD', 'AFGEWERKT'],
    GELEVERD: ['GELEVERD', 'OPGEHAALD'],
    OPGEHAALD: ['OPGEHAALD', 'AFGEWERKT'],
    AFGEWERKT: ['AFGEWERKT'],
  }
  return next[current] || [current]
})

function payload() {
  return {
    assetModel: verhuurCopy.assetModel,
    assetType: verhuurCopy.assetType,
    werfId: verhuurCopy.werfId,
    projectleiderId: verhuurCopy.projectleiderId,
    leverDatum: verhuurCopy.leverDatum,
    ophaalDatum: verhuurCopy.ophaalDatum || null,
    logistiekeReferentie: verhuurCopy.logistiekeReferentie,
    werkhoogte: verhuurCopy.assetModel === 'HOOGTEWERKER' ? verhuurCopy.werkhoogte : null,
    entiteitId: verhuurCopy.assetModel === 'WERFCONTAINER' ? verhuurCopy.entiteitId : null,
    status: verhuurCopy.status,
  }
}
const hasUnsavedChanges = computed(() => JSON.stringify(payload()) !== savedPayload.value)

function sync(value) {
  historyRevision.value++
  Object.assign(verhuurCopy, {
    id: value.id,
    reference: value.reference || '',
    assetModel: value.assetModel?.toUpperCase(),
    assetType: value.assetType,
    assetId: value.assetId || null,
    asset: value.asset || null,
    werfId: value.werfId ?? value.werf?.id,
    werf: value.werf || null,
    projectleiderId: value.projectleiderId ?? value.projectleider?.id ?? null,
    projectleider: value.projectleider || null,
    entiteitId: value.entiteitId ?? value.entiteit?.id ?? null,
    entiteit: value.entiteit || null,
    leverDatum: value.leverDatum,
    ophaalDatum: value.ophaalDatum || null,
    status: value.status?.toUpperCase() || 'LEVEREN',
    werkhoogte: value.werkhoogte ?? null,
    logistiekeReferentie: value.logistiekeReferentie || '',
  })
  savedPayload.value = JSON.stringify(payload())
}

watch([() => props.verhuur, () => props.show], ([value, show]) => {
  if (value && show) sync(value)
  if (!show) {
    showToestelModal.value = false
    showWerfModal.value = false
    showProjectleiderModal.value = false
    showPeriodeModal.value = false
    assetRequest++
  }
  localError.value = ''
}, { immediate: true })

const blocks = computed(() => [
  { label: 'Werf', content: verhuurCopy.werf?.naam || 'Onbekende werf', actionLabel: 'Wijzigen', action: () => openModal('werf') },
  { label: 'Projectleider', content: verhuurCopy.projectleider?.naam || 'Niet toegewezen', actionLabel: 'Wijzigen', action: () => openModal('projectleider') },
  { label: 'Machine', content: verhuurCopy.asset?.nummer || 'Geen toegewezen', actionLabel: 'Toewijzen',
    action: props.verhuur?.status?.toUpperCase() === 'LEVEREN' ? () => openModal('machine') : null },
  { label: 'Periode', content: `${formatDate(verhuurCopy.leverDatum)} — ${verhuurCopy.ophaalDatum ? formatDate(verhuurCopy.ophaalDatum) : 'nog geen ophaaldatum'}`,
    actionLabel: 'Wijzigen', action: () => openModal('periode') },
])

function message(error) { return error?.response?.data?.message || error?.message || 'De aanvraag is mislukt' }
function formatDate(value) { return value ? new Date(value).toLocaleString('nl-BE') : 'Niet ingesteld' }

function canAssign() {
  if (!verhuurCopy.id) throw new Error('Sla de verhuuraanvraag eerst op')
  if (props.verhuur?.status?.toUpperCase() !== 'LEVEREN') throw new Error('Toewijzen kan alleen bij status LEVEREN')
  if (hasUnsavedChanges.value) throw new Error('Sla je wijzigingen eerst op voordat je een toestel kiest')
}

async function fetchVrijeToestellen() {
  const request = ++assetRequest
  assetError.value = ''
  loadingAssets.value = true
  vrijeToestellen.value = []
  try {
    canAssign()
    const response = await verhuurApi.vrijeToestellen({ verhuurId: verhuurCopy.id })
    if (!Array.isArray(response.data)) throw new Error('De API-response bevat geen toestellenlijst onder data')
    if (request === assetRequest && showToestelModal.value) vrijeToestellen.value = response.data
  } catch (error) {
    if (request === assetRequest) assetError.value = message(error)
  } finally {
    if (request === assetRequest) loadingAssets.value = false
  }
}

async function selectToestel(toestel) {
  if (isAssigning.value) return
  assetError.value = ''
  try {
    canAssign()
    if (!toestel.id) throw new Error('Toestel-ID ontbreekt')
    isAssigning.value = true
    const response = await verhuurApi.assignToestel({ verhuurId: verhuurCopy.id, assetId: toestel.id })
    if (!response.data?.id) throw new Error('De API heeft geen bijgewerkte verhuur teruggegeven')
    sync(response.data)
    showToestelModal.value = false
    emit('assigned', response.data)
  } catch (error) {
    assetError.value = message(error)
  } finally {
    isAssigning.value = false
  }
}

function closeAssetModal() {
  if (isAssigning.value) return
  showToestelModal.value = false
  loadingAssets.value = false
  assetRequest++
}

async function openModal(field) {
  localError.value = ''
  try {
    if (field === 'machine') {
      canAssign()
      showToestelModal.value = true
      await fetchVrijeToestellen()
    } else if (field === 'werf') {
      alleWerven.value = (await werfApi.list()).data
      showWerfModal.value = true
    } else if (field === 'projectleider') {
      alleProjectleiders.value = (await leiderApi.list()).data
      showProjectleiderModal.value = true
    } else if (field === 'periode') {
      showPeriodeModal.value = true
    }
  } catch (error) { localError.value = message(error) }
}

function selectWerf(value) { verhuurCopy.werf = value; verhuurCopy.werfId = value?.id ?? null }
function selectProjectleider(value) { verhuurCopy.projectleider = value; verhuurCopy.projectleiderId = value?.id ?? null }
function updatePeriode({ leverDatum, ophaalDatum }) {
  verhuurCopy.leverDatum = leverDatum
  verhuurCopy.ophaalDatum = ophaalDatum
}
function saveVerhuur() { localError.value = ''; emit('edit', { id: verhuurCopy.id, ...payload() }) }
function onDelete() { emit('delete', verhuurCopy.id) }
</script>
<style scoped>
.info-card {
  background: #f3f4f6;
  border-radius: 8px;
  padding: 14px 16px;
  box-shadow: 0 2px 6px rgb(0 0 0 / 8%);
  margin-bottom: 14px;
}

.card-label {
  font-size: 12px;
  color: #6b7280;
  font-weight: 600;
  margin-bottom: 8px;
}

.card-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.link-btn {
  background: none;
  border: none;
  color: #2563eb;
  cursor: pointer;
  font-weight: 600;
}

.status-select {
  padding: 8px;
  border-radius: 8px;
  border: 1px solid #d1d5db;
}

.error-box {
  background: #fee2e2;
  color: #7f1d1d;
  padding: 10px;
  border-radius: 8px;
  margin-top: 10px;
}

.btn {
  border: none;
  padding: 10px 22px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
}

.btn-blue {
  background: #2563eb;
  color: white;
}

.btn-gray {
  background: #6b7280;
  color: white;
}

.btn-red {
  background: #dc2626;
  color: white;
}
</style>
