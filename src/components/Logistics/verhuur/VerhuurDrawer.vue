<template>
  <BaseDrawer :show="show" :title="`REF: ${verhuurCopy.reference  || '—'}`" @close="$emit('close')" :subtitle="`${verhuurCopy.logistiekeReferentie}`">
    <!-- INFO BLOCKS -->
    <div class="info-card" v-for="block in blocks" :key="block.label">
      <div class="card-label">{{ block.label }}</div>
      <div class="card-content">
        <div>{{ block.content }}</div>
        <button v-if="block.action" class="link-btn" @click="block.action">
          {{ block.actionLabel }}
        </button>
      </div>
    </div>

    <!-- STATUS -->
    <div class="info-card">
      <div class="card-label">Status</div>
      <div class="card-content">
        <select v-model="verhuurCopy.status" class="status-select">
          <option value="Leveren">Leveren</option>
          <option value="Geleverd">Geleverd</option>
          <option value="Opgehaald">Opgehaald</option>
          <option value="Afgewerkt">Afgewerkt</option>
        </select>
      </div>
    </div>

    <!-- ERROR -->
    <div v-if="error" class="error-box">{{ error }}</div>

    <!-- FOOTER -->
    <template #footer>
      <button class="btn btn-blue" @click="saveVerhuur" :disabled="loading">
        {{ loading ? 'Bezig...' : 'Opslaan' }}
      </button>
      <button class="btn btn-gray" @click="downloadPDF">
        <i class="fa fa-download"></i>
      </button>
      <button class="btn btn-red" @click="onDelete">Verwijderen</button>
    </template>
  </BaseDrawer>

  <!-- MODALS -->
  <VrijeToestellenModal
    v-if="showToestelModal"
    :toestellen="vrijeToestellen"
    :selectedToestel="verhuurCopy.asset"
    @select="(v) => (verhuurCopy.asset = v)"
    @close="showToestelModal = false"
  />
  <WerfWijzigenModal
    v-if="showWerfModal"
    :werven="alleWerven"
    @select="(v) => (verhuurCopy.werf = v)"
    @close="showWerfModal = false"
  />
  <ProjectleiderWijzigenModal
    v-if="showProjectleiderModal"
    :projectleiders="alleProjectleiders"
    @select="(v) => (verhuurCopy.projectleider = v)"
    @close="showProjectleiderModal = false"
  />
  <PeriodeWijzigenModal
    v-if="showPeriodeModal"
    :boeking="verhuurCopy"
    @save="updatePeriode"
    @close="showPeriodeModal = false"
  />
</template>

<script setup>
import { reactive, ref, watch, computed } from 'vue'
import BaseDrawer from '@/components/base/BaseDrawer.vue'
import VrijeToestellenModal from '@/components/Logistics/verhuur/VrijeToestellenModal.vue'
import WerfWijzigenModal from '@/components/Logistics/verhuur/WerfWijzigenModal.vue'
import ProjectleiderWijzigenModal from '@/components/Logistics/verhuur/ProjectleiderWijzigenModal.vue'
import PeriodeWijzigenModal from '@/components/Logistics/verhuur/PeriodeWijzigenModal.vue'

import { verhuurApi } from '@/api/verhuur.js'
import { werfApi } from '@/api/werf.js'
import { leiderApi } from '@/api/projectLeider.js'

const props = defineProps({
  show: Boolean,
  verhuur: Object,
  loading: Boolean,
  error: String,
})
const emit = defineEmits(['close', 'edit', 'delete'])

// --- MODALS ---
const showWerfModal = ref(false)
const showProjectleiderModal = ref(false)
const showPeriodeModal = ref(false)
const showToestelModal = ref(false)

// --- DATA ---
const alleProjectleiders = ref([])
const alleWerven = ref([])
const vrijeToestellen = ref([])

// --- REACTIVE COPY ---
const verhuurCopy = reactive({
  _id: null,
  reference: '',
  werf: null,
  projectleider: null,
  assetModel: null,
  asset: null,
  leverDatum: '',
  ophaalDatum: '',
  status: 'Leveren',
  werkhoogte: null,
  logistiekeReferentie : '',
})

// --- SYNC PROPS ---
watch(
  () => props.verhuur,
  (v) => {
    if (!v) return

    Object.assign(verhuurCopy, {
      _id: v._id || null,
      reference: v.reference || '',
      werf: v.werf || null,
      projectleider: v.projectleider || null,
      assetModel: v.assetModel || null,
      asset: v.asset || null,
      leverDatum: v.leverDatum || '',
      ophaalDatum: v.ophaalDatum || '',
      status: v.status || 'Leveren',
      werkhoogte: v.werkhoogte || 0,
      logistiekeReferentie: v.logistiekeReferentie || '',
    })
  },
  { immediate: true }
)

// --- BLOCKS ---
const blocks = computed(() => [
  {
    label: 'Werf',
    content: verhuurCopy.werf?.naam || 'Onbekende werf',
    actionLabel: 'Wijzigen',
    action: () => openModal('werf'),
  },
  {
    label: 'Projectleider',
    content: verhuurCopy.projectleider?.naam || 'Niet toegewezen',
    actionLabel: 'Wijzigen',
    action: () => openModal('projectleider'),
  },
  {
    label: 'Machine',
    content: verhuurCopy.asset?.nummer || 'Geen toegewezen',
    actionLabel: 'Toewijzen',
    action: () => openModal('machine'),
  },
  {
    label: 'Periode',
    content: verhuurCopy.leverDatum
      ? `${formatDate(verhuurCopy.leverDatum)} - ${verhuurCopy.ophaalDatum ? formatDate(verhuurCopy.ophaalDatum) : 'nog geen ophaaldatum'}`
      : 'Niet ingesteld',
    actionLabel: 'Wijzigen',
    action: () => openModal('periode'),
  },
])

// --- FUNCTIES ---
function formatDate(d) {
  if (!d) return ''
  return new Date(d).toLocaleDateString('nl-BE')
}

async function openModal(field) {
  switch (field) {
    case 'werf':
      alleWerven.value = await werfApi.list()
      showWerfModal.value = true
      break

    case 'projectleider':
      alleProjectleiders.value = await leiderApi.list()
      showProjectleiderModal.value = true
      break

    case 'machine': {
      const data = {
        assetModel: verhuurCopy.assetModel,
        leverDatum: verhuurCopy.leverDatum || null,
        ophaalDatum: verhuurCopy.ophaalDatum,
        werkhoogte: verhuurCopy.werkhoogte || 0,
      }
      vrijeToestellen.value = await verhuurApi.vrijeToestellen(data)
      showToestelModal.value = true
      break
    }

    case 'periode':
      showPeriodeModal.value = true
      break
  }
}

// --- SAVE / DELETE ---
async function saveVerhuur() {
  emit('edit', { ...verhuurCopy })
}
function onDelete() {
  emit('delete', verhuurCopy._id)
}
function updatePeriode({ leverDatum, ophaalDatum }) {
  verhuurCopy.leverDatum = leverDatum
  verhuurCopy.ophaalDatum = ophaalDatum
}

// --- PDF DOWNLOAD ---
async function downloadPDF() {
  try {
    const blob = await verhuurApi.exportVerhuur(verhuurCopy._id)
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `verhuur_${verhuurCopy.reference}.pdf`
    a.click()
    window.URL.revokeObjectURL(url)
  } catch (err) {
    console.error('PDF download mislukt', err)
  }
}


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
