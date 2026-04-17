<template>
  <div class="page">
    <h2>Projectleiders</h2>

    <ProjetLeiderTable
      :leaders="paginatedLeaders"
      :entiteiten="entiteiten"
      @add="addLeader"
      @delete="deleteLeader"
      @search="searchLeaders"
      @edit="editLeader"
      @add-entiteit="addEntiteit"
    />

    <!-- PAGINATION -->
    <BasePagination
      :current-page="currentPage"
      :total-pages="totalPages"
      @next="next"
      @prev="prev"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'

import ProjetLeiderTable from '@/components/Logistics/ProjectLeider/ProjetLeiderTable.vue'
import BasePagination from '@/components/base/BasePagination.vue'

import { leiderApi } from '@/api/projectLeider.js'
import { entiteitApi } from '@/api/entiteit'

import { usePagination } from '@/composable/usePagination'

/* -----------------------------
   STATE
----------------------------- */
const leaders = ref([])
const entiteiten = ref([])
const search = ref('')

/* -----------------------------
   PAGINATION
----------------------------- */
const {
  currentPage,
  totalPages,
  paginatedItems: paginatedLeaders,
  next,
  prev,
  reset,
} = usePagination(leaders, {
  pageSize: 10,
})

/* -----------------------------
   LOAD LEADERS
----------------------------- */
onMounted(() => {
  getLeaders()
  getEntiteiten()
})

async function getLeaders() {
  try {
    const params = {
      search: search.value || undefined,
    }

    const response = await leiderApi.list(params)
    leaders.value = response
  } catch (error) {
    console.error(error)
  }
}

/* -----------------------------
   SEARCH
----------------------------- */
async function searchLeaders(query) {
  try {
    search.value = query || ''
    reset()
    await getLeaders()
  } catch (err) {
    console.error(err)
  }
}

/* -----------------------------
   CRUD LEADERS
----------------------------- */
async function addLeader(data) {
  try {
    await leiderApi.create(data)
    await getLeaders()
  } catch (err) {
    console.error(err)
  }
}

async function deleteLeader(leaderId) {
  try {
    await leiderApi.remove(leaderId)
    await getLeaders()
  } catch (err) {
    console.error(err)
  }
}

async function editLeader(data) {
  try {
    await leiderApi.update(data._id, data)
    await getLeaders()
  } catch (err) {
    console.error(err)
  }
}

/* -----------------------------
   ENTITEITEN
----------------------------- */
async function getEntiteiten() {
  try {
    const res = await entiteitApi.getEntiteiten()
    entiteiten.value = res
  } catch (err) {
    console.log(err)
  }
}

async function addEntiteit(data) {
  try {
    await entiteitApi.createEniteit(data)
    await getEntiteiten()
  } catch (err) {
    console.log(err)
  }
}

/* -----------------------------
   RESET PAGINATION
----------------------------- */
watch(leaders, () => {
  reset()
})
</script>

<style scoped>
.page {
  padding: 1rem;
}

.page h2 {
  padding-left: 2rem;
}
</style>