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
  v-model:search="search"
  v-model:dateRange="dateRange"
  @openBoeking="openBoekingModal"
  @addBoeking="openCreateModal"
  @update:search="search = $event"
  @update:dateRange="dateRange = $event"
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
      @save= "saveComment"
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
import { ref, onMounted, watch} from 'vue'
import Agenda from '@/components/renting/agenda/Agenda.vue'
import CreateBoekingModal from '@/components/renting/agenda/CreateBoekingModal.vue'
import BoekingModal from '@/components/renting/agenda/BoekingModal.vue'
import BoekingList from '@/components/renting/agenda/BoekingList.vue'
import VrijToestellenModal from '@/components/renting/agenda/VrijToestellenModal.vue'
import { boekingApi } from '@/api/boeking'
import { toestelApi } from '@/api/toestel'
import 'element-plus/dist/index.css'
import { ElSwitch } from 'element-plus'
import { uploadApi } from '@/api/upload'

const showAgenda = ref(true)
const showCreateModal = ref(false)
const showBoekingModal = ref(false)
const selectedBoekingId = ref(null)
const showVrijeToestellenModal = ref(false)
const vrijeToestellen = ref([])
const huidigeBoekingId = ref(null)
const search = ref('')           // 🔹 zoekterm
const dateRange = ref([null, null])  // 🔹 daterange filter

const types = ref([])
const boekingen = ref([])
watch([search, dateRange], () => {
  loadBoekingen()
})

// Watcher voor toggle
watch(showAgenda, (newVal) => {
  if (newVal) {
    // Agenda is aan → laad boekingen zonder filters
    search.value = ''               // lege search
    dateRange.value = [null, null] // geen datumfilter
    loadBoekingen()
  } else {
    // Lijst aan → eventueel filters behouden, of ook resetten
    loadBoekingen()
  }
})
/* -------------------- INIT DATA -------------------- */
async function loadBoekingen() {
  try {

    const res = await boekingApi.list({
      search: search.value,           // zoekterm
      startDatum: dateRange.value[0], // start datum
      eindDatum: dateRange.value[1],  // eind datum
      archief: false                  // of true bij toggle
    });

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

    // Backend call
    await boekingApi.assignToestel(huidigeBoekingId.value, toestel._id)

    // Refreshed boeking ophalen
    const refreshedBoeking = await boekingApi.get(huidigeBoekingId.value)

    // Lokaal updaten
    const index = boekingen.value.findIndex(b => b._id === huidigeBoekingId.value)
    if (index !== -1) {
      boekingen.value[index] = refreshedBoeking
    }

    showVrijeToestellenModal.value = false
      showBoekingModal.value = false

    // Modal blijft open
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

async function saveComment(boeking) {
  try {
    // Update backend
    await boekingApi.update(selectedBoekingId.value, { comment: boeking.value.comment })

    // Refreshed boeking ophalen
    const refreshedBoeking = await boekingApi.get(selectedBoekingId.value)

    // Lokaal updaten
    const index = boekingen.value.findIndex(b => b._id === selectedBoekingId.value)
    if (index !== -1) {
      boekingen.value[index] = refreshedBoeking
    }

      showBoekingModal.value = false
  } catch (err) {
    console.error(err)
  }
}
async function exportPDF(){
  try{
    const blob = await uploadApi.exportBoekingen();
     const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'boekingen.pdf';
    a.click();
    window.URL.revokeObjectURL(url);
  }
  catch(err){
    console.log(err);
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
