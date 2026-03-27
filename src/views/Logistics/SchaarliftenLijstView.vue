<template>
  <div class="page">
    <h2>Schaarliften</h2>


    <!-- LIST -->
    <SchaarliftenLijst
      :liften="liften"
      @search="searchLiften"
      @open-add="showDrawer = true"
      @edit-schaarlift="openEdit"
    />

    <!-- DRAWER -->
    <SchaarliftenDrawer
      :show="showDrawer"
      :model="selectedLift"
      @close="closeDrawer"
      @save="addLift"
    />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { schaarliftenApi } from "@/api/schaarliften.js"
import SchaarliftenLijst from '@/components/Logistics/Schaarliften/SchaarliftenLijst.vue'
import SchaarliftenDrawer from '@/components/Logistics/Schaarliften/SchaarliftenDrawer.vue'

const liften = ref([])
const showDrawer = ref(false)
const selectedLift = ref(null)  // <-- belangrijk!
// INIT
onMounted(getLiften)

// GET ALL
async function getLiften() {
  try {
    const params = { search: undefined }
    const response = await schaarliftenApi.list(params)
    console.log(response)
    liften.value = response
  } catch (error) {
    console.error(error)
  }
}

// SEARCH
async function searchLiften(query) {
  try {
    const params = { search: query || undefined }
    const response = await schaarliftenApi.list(params)
    liften.value = response
  } catch (err) {
    console.error(err)
  }
}

// ADD
async function addLift(data) {
  try {
    if (selectedLift.value?._id) {
      // ✅ BEWERKEN
      await schaarliftenApi.update(selectedLift.value._id, data)
    } else {
      await schaarliftenApi.create(data)
    }

    await getLiften()
    closeDrawer()
  } catch (err) {
    console.error(err)
  }
}
function closeDrawer(){
    showDrawer.value = false;
    selectedLift.value = null
}


function openEdit(lift) {
  selectedLift.value = { ...lift }   
  showDrawer.value = true
}

</script>

<style scoped>
.page {
  padding: 1rem;
}

.page h2 {
  padding-left: 2rem;
}

/* actie knop */
.actions {
  display: flex;
  justify-content: flex-end;
  margin: 1rem 2rem;
}

.btn {
  padding: 10px 16px;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  font-weight: 600;
}

.btn-primary {
  background-color: #5786f7;
  color: white;
}

.btn-primary:hover {
  background-color: #5077d3;
}
</style>