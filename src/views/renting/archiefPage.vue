<template>
  <div class="agenda-parent-container">
   
    <BoekingList
      :boekingen="boekingen"
      :archief= true
      @openBoeking="openBoekingModal"
      @addBoeking="openCreateModal"
      @update:search="search = $event"
    @update:dateRange="dateRange = $event"

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
import { ref, onMounted, watch } from 'vue'
import BoekingModal from '@/components/renting/agenda/BoekingModal.vue'
import BoekingList from '@/components/renting/agenda/BoekingList.vue'
import VrijToestellenModal from '@/components/renting/agenda/VrijToestellenModal.vue'
import { boekingApi } from '@/api/boeking'
import { toestelApi } from '@/api/toestel'
import 'element-plus/dist/index.css'

const showCreateModal = ref(false)
const showBoekingModal = ref(false)
const selectedBoekingId = ref(null)
const showVrijeToestellenModal = ref(false)
const vrijeToestellen = ref([])
const huidigeBoekingId = ref(null)

const types = ref([])
const boekingen = ref([])
const search = ref("")
const dateRange = ref([null, null])

watch([search, dateRange], () => {
  loadBoekingen()
})
/* -------------------- INIT DATA -------------------- */
async function loadBoekingen() {
  try {

    const res = await boekingApi.list({
      search: search.value,           // zoekterm
      startDatum: dateRange.value[0], // start datum
      eindDatum: dateRange.value[1],  // eind datum
      archief: true                  // of true bij toggle
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

async function saveComment(boeking){
  try{
      await boekingApi.update(selectedBoekingId.value, {comment: boeking.value.comment})
      loadBoekingen();
      showBoekingModal.value = false;
  }catch(err){
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
