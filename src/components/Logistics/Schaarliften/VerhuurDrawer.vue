<template>
  <BaseDrawer :show="show" :title="`REF: ${verhuurCopy.reference || '—'}`" @close="$emit('close')">

    <!-- INFO BLOCKS -->
    <div class="info-card" v-for="block in blocks" :key="block.label">
      <div class="card-label">{{ block.label }}</div>
      <div class="card-content">
        <div>{{ block.content }}</div>
        <button class="link-btn" @click="block.action">{{ block.actionLabel }}</button>
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
    <div v-if="error" class="error-box">
      {{ error }}
    </div>

    <!-- FOOTER -->
    <template #footer>
      <button class="btn btn-blue" @click="saveVerhuur" :disabled="loading">opslaan</button>
      <button class="btn btn-gray"  @click="donwloadPDF">            <i class="fa fa-download"></i>
</button>
      <button class="btn btn-red" @click="onDelete">verwijderen</button>
    </template>

  </BaseDrawer>

  <!-- MODALS -->
  <VrijeToestellenModal
    v-if="showToestelModal"
    :toestellen="vrijeToestellen"
    :selectedToestel="verhuurCopy.toestel"
    @select="v => verhuurCopy.toestel = v"
    @close="showToestelModal = false"
  />

  <WerfWijzigenModal
    v-if="showWerfModal"
    :werven="alleWerven"
    @select="v => verhuurCopy.werf = v"
    @close="showWerfModal = false"
  />

  <ProjectleiderWijzigenModal
    v-if="showProjectleiderModal"
    :projectleiders="alleProjectleiders"
    @select="v => verhuurCopy.projectleider = v"
    @close="showProjectleiderModal = false"
  />

  <PeriodeWijzigenModal
    v-if="showPeriodeModal"
    :boeking="verhuurCopy"
    @close="showPeriodeModal = false"
    @save="({ leverDatum, ophaalDatum }) => { 
      verhuurCopy.leverDatum = leverDatum
      verhuurCopy.ophaalDatum = ophaalDatum
    }"
  />
</template>

<script setup>
import { reactive, watch, computed, ref } from 'vue'
import BaseDrawer from '@/components/base/BaseDrawer.vue'
import VrijeToestellenModal from './VrijeToestellenModal.vue'
import WerfWijzigenModal from './WerfWijzigenModal.vue'
import ProjectleiderWijzigenModal from './ProjectleiderWijzigenModal.vue'
import PeriodeWijzigenModal from './PeriodeWijzigenModal.vue'
import { verhuurApi } from '@/api/verhuur.js'
import { leiderApi } from '@/api/projectLeider'
import { werfApi } from '@/api/werf'

const props = defineProps({
  show: Boolean,
  verhuur: Object,
  loading: Boolean,
  error: String,
})

const emit = defineEmits(['close', 'edit', 'delete'])

// MODALS
const showWerfModal = ref(false)
const showProjectleiderModal = ref(false)
const showPeriodeModal = ref(false)
const showToestelModal = ref(false)

// DATA
const alleProjectleiders = ref([])
const alleWerven = ref([])
const vrijeToestellen = ref([])

// LOKALE COPY
const verhuurCopy = reactive({
  _id: null,
  reference: '',
  werf: null,
  projectleider: null,
  machineType: null,
  toestel: null,
  leverDatum: '',
  ophaalDatum: '',
  status: 'Leveren'
})

// SYNC
watch(() => props.verhuur, (v) => {
  if (!v) return
  verhuurCopy._id = v._id
  verhuurCopy.reference = v.reference || ''
  verhuurCopy.werf = v.werf || null
  verhuurCopy.projectleider = v.projectleider || null
  verhuurCopy.machineType = v.machineType || null
  verhuurCopy.toestel = v.toestel || null
  verhuurCopy.leverDatum = v.leverDatum || ''
  verhuurCopy.ophaalDatum = v.ophaalDatum || ''
  verhuurCopy.status = v.status || 'Leveren'
}, { immediate: true })

// ACTIONS
async function onWijzigen(field) {
  switch(field) {
    case 'periode':
      showPeriodeModal.value = true
      break

    case 'projectleider':
      alleProjectleiders.value = await leiderApi.list()
      showProjectleiderModal.value = true
      break

    case 'werf':
      alleWerven.value = await werfApi.list()
      showWerfModal.value = true
      break

    case 'machine':
      const data = {
        machineType: verhuurCopy.machineType?._id,
        leverDatum: verhuurCopy.leverDatum,
        ophaalDatum: verhuurCopy.ophaalDatum || null,
        werkhoogte: verhuurCopy.machineType?.werkhoogte || 0,
      }
      vrijeToestellen.value = await verhuurApi.vrijeToestellen(data)
      showToestelModal.value = true
      break
  }
}

// SAVE
async function saveVerhuur() {
  emit('edit', { ...verhuurCopy })
}

// DELETE
function onDelete() {
  emit('delete', verhuurCopy._id)
}

// FORMAT
function formatDate(d) {
  if (!d) return ''
  return new Date(d).toLocaleDateString('nl-BE')
}

function formatAdres(v) {
  return v.werf?.naam || 'Onbekende werf'
}

async function donwloadPDF(){
   try {
    
    const blob = await verhuurApi.exportVerhuur(verhuurCopy._id)
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'boekingen.pdf'
    a.click()
    window.URL.revokeObjectURL(url)
  } catch (err) {
    console.log(err)
  }
}
// BLOCKS
const blocks = computed(() => [
  {
    label: 'Werf',
    content: formatAdres(verhuurCopy),
    actionLabel: 'Wijzigen',
    action: () => onWijzigen('werf')
  },
  {
    label: 'Project leider',
    content: verhuurCopy.projectleider?.naam || 'Niet toegewezen',
    actionLabel: 'Wijzigen',
    action: () => onWijzigen('projectleider')
  },
  {
    label: 'Machine',
    content: verhuurCopy.toestel?.nummer || 'geen toegewezen',
    actionLabel: 'Toewijzen',
    action: () => onWijzigen('machine')
  },
  {
    label: 'Periode',
    content: verhuurCopy.leverDatum
      ? `${formatDate(verhuurCopy.leverDatum)} - ${verhuurCopy.ophaalDatum ? formatDate(verhuurCopy.ophaalDatum) : 'nog geen ophaaldatum'}`
      : 'Niet ingesteld',
    actionLabel: 'Wijzigen',
    action: () => onWijzigen('periode')
  }
])
</script>

<style scoped>
.info-card {
  background: #f3f4f6;
  border-radius: 8px;
  padding: 14px 16px;
  box-shadow: 0 2px 6px rgb(0 0 0 / 0.08);
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

.btn-blue { background: #2563eb; color: white; }
.btn-gray { background: #6b7280; color: white; }
.btn-red { background: #dc2626; color: white; }
</style>