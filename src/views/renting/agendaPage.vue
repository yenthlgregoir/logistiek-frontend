<template>
  <div class="agenda-parent-container">
    <!-- Toggle knop -->
    <el-switch
      v-model="showAgenda"
      active-text="Agenda"
      inactive-text="Lijst"
      active-color="#4f46e5"
      inactive-color="#ccc"
    />

    <!-- Agenda component -->
    <Agenda
      v-if="showAgenda"
      :boekingen="boekingen"
      @openBoeking="openBoekingModal"
      @addBoeking="openCreateModal"
    />

    <!-- Lijstweergave -->
    <BoekingList
      v-else
      :boekingen="boekingen"
      @openBoeking="openBoekingModal"
      @addBoeking="openCreateModal"
    />

    <!-- Create Boeking Modal -->
    <CreateBoekingModal
      v-if="showCreateModal"
      :types="types"
      v-on:close="closeBoekingModal"
      @update="loadBoekingen"
    />

    <!-- Boeking Modal -->
    <BoekingModal
      v-if="showBoekingModal"
      :boekingId="selectedBoekingId"
      @close="showBoekingModal = false"
      @update="loadBoekingen"
      @assignToestel="openVrijeToestellenModal"
      @verwijderen="deleteBoeking"
    />
    <VrijToestellenModal
      v-if="showVrijeToestellenModal"
      :toestellen="vrijeToestellen"
      @select="assignToestel"
      @close="showVrijeToestellenModal = false"
    />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import Agenda from '@/components/renting/agenda/Agenda.vue'
import CreateBoekingModal from '@/components/renting/agenda/CreateBoekingModal.vue'
import BoekingModal from '@/components/renting/agenda/BoekingModal.vue'
import BoekingList from '@/components/renting/agenda/BoekingList.vue'
import VrijToestellenModal from '@/components/renting/agenda/VrijToestellenModal.vue'
import { boekingApi } from '@/api/boeking'
import { toestelApi } from '@/api/toestel'
import 'element-plus/dist/index.css'
import { colProps, ElSwitch } from 'element-plus'

const showAgenda = ref(true)
const showCreateModal = ref(false)
const showBoekingModal = ref(false)
const selectedBoekingId = ref(null)
const showVrijeToestellenModal = ref(false)
const vrijeToestellen = ref([])
const huidigeBoekingId = ref(null)

const types = ref([])
const boekingen = ref([])

/* -------------------- INIT DATA -------------------- */
async function loadBoekingen() {
  try {
    const res = await boekingApi.list()
    boekingen.value = res
  } catch (err) {
    console.log(err)
  }
}

async function loadTypes() {
  try {
    const res = await toestelApi.getTypes()
    types.value = res.types || []
  } catch (err) {
    console.log(err)
  }
}

async function openVrijeToestellenModal(boekingId) {
  try {
    const boeking = boekingen.value.find((b) => b._id === boekingId)
    if (!boeking) return

    huidigeBoekingId.value = boekingId
    vrijeToestellen.value = await boekingApi.vrijeToestellen({
      beginDatum: boeking.beginDatum,
      eindDatum: boeking.eindDatum,
      toestelType: boeking.toestelType?._id,
    })
  console.log(vrijeToestellen)

    showVrijeToestellenModal.value = true
  } catch (err) {
    console.error(err)
  }
}
/* -------------------- MODAL HANDLERS -------------------- */
function openBoekingModal(boekingId) {
  selectedBoekingId.value = boekingId
  
  showBoekingModal.value = true
}

function openCreateModal() {
  showCreateModal.value = true
}
function closeBoekingModal() {
  showCreateModal.value = false
}
async function assignToestel(toestel) {
  try {
    if (!huidigeBoekingId.value) return

    // Backend call: toestel toewijzen
    await boekingApi.assignToestel(huidigeBoekingId.value, toestel._id)

    // Update de boekingen in de frontend
    const index = boekingen.value.findIndex((b) => b._id === huidigeBoekingId.value)
    if (index !== -1) {
      boekingen.value[index].toestel = toestel
    }

    // Sluit modal
    showVrijeToestellenModal.value = false
    showBoekingModal.value = false
  } catch (err) {
    console.error(err)
  }
}

async function deleteBoeking(boekingId) {
  try {
    await boekingApi.remove(boekingId)
    loadBoekingen()
    showBoekingModal.value = false
  } catch (err) {
    console.log(err)
  }
}
/* -------------------- ON MOUNT -------------------- */
onMounted(() => {
  loadBoekingen()
  loadTypes()
})
</script>

<style scoped>
.agenda-parent-container {
  font-family: Arial, sans-serif;
  padding: 1rem;
}

.toggle-btn {
  padding: 0.5rem 1rem;
  border-radius: 6px;
  background-color: #2563eb;
  color: white;
  border: none;
  cursor: pointer;
  margin-bottom: 1rem;
  font-size: 1rem;
}

.toggle-btn:hover {
  background-color: #1d4ed8;
}

.lijstweergave ul {
  list-style: none;
  padding: 0;
}

.lijstweergave li,
.lijst-item {
  padding: 0.5rem;
  border-bottom: 1px solid #ddd;
  cursor: pointer;
}

.lijstweergave li:hover,
.lijst-item:hover {
  background: #e0e7ff;
}

/* Mobile */
@media (max-width: 768px) {
  .toggle-btn {
    width: 100%;
    font-size: 0.9rem;
  }
}
</style>
