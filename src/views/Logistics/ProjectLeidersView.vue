<template>
  <div class="page">
    <h2>Projectleiders</h2>
    <ProjetLeiderTable
      :leaders="leaders"
      :entiteiten="entiteiten"
      @add="addLeader"
      @delete="deleteLeader"
      @search="searchLeaders"
      @edit="editLeader"
      @add-entiteit="addEntiteit"
    />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import ProjetLeiderTable from '@/components/Logistics/ProjectLeider/ProjetLeiderTable.vue'
import { leiderApi } from "@/api/projectLeider.js"

const leaders = ref([])
const entiteiten = ref([]);

// Bij component mount data ophalen
onMounted(getEntiteiten);

onMounted(getLeaders);

// Haal lijst op van backend
async function getLeaders() {
  try {
    const params = { search: undefined }
    const response = await leiderApi.list(params)
    leaders.value = response
  } catch (error) {
    console.error(error)
  }
}

// Search functionaliteit
async function searchLeaders(query) {
  try {
    const params = { search: query || undefined }
    const response = await leiderApi.list(params)
    leaders.value = response
  } catch (err) {
    console.error(err)
  }
}

// Nieuwe projectleider toevoegen
async function addLeader(data) {
  try {
    await leiderApi.create(data)
    await getLeaders();
  } catch(err) { console.error(err) }
}

// Projectleider verwijderen
async function deleteLeader(leaderId) {
  try {
    await leiderApi.remove(leaderId)
    await getLeaders()
  } catch(err) { console.error(err) }
}

// Projectleider bewerken
async function editLeader(data) {
  try {
    await leiderApi.update(data._id, data)
    await getLeaders()
  } catch(err) {
    console.error(err)
  }
}

async function getEntiteiten(){
    try{
        const res = await leiderApi.getEntiteiten();
        entiteiten.value = res;
    }
    catch  (err) {
        console.log(err);
    }
}

async function addEntiteit(data){
    try{
        await leiderApi.createEniteit(data);
        await getEntiteiten();
    }
    catch(err){
        console.log(err);
    }
}
</script>

<style scoped>
.page {
  padding: 1rem;
}
.page h2 {
  padding-left: 2rem;
}
</style>