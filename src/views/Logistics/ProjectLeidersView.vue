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
import { ref, onMounted, onBeforeUnmount, watch, computed } from 'vue'

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
   FILTERING (client-side)
----------------------------- */
const filteredLeaders = computed(() => {
  const term = search.value.toLowerCase()

  return leaders.value.filter(
    (l) =>
      l.naam?.toLowerCase().includes(term) ||
      l.email?.toLowerCase().includes(term)
  )
})

/* -----------------------------
   PAGINATION (responsive)
----------------------------- */
const {
  currentPage,
  pageSize,
  totalPages,
  paginatedItems: paginatedLeaders,
  next,
  prev,
  reset,
} = usePagination(filteredLeaders)

/* -----------------------------
   DYNAMIC PAGE SIZE
----------------------------- */
function updatePageSize() {
  const availableHeight = window.innerHeight - 350
  const rowHeight = 65
  pageSize.value = Math.floor(availableHeight / rowHeight)
}

/* -----------------------------
   LOAD DATA
----------------------------- */
onMounted(() => {
  updatePageSize()
  window.addEventListener('resize', updatePageSize)

  getLeaders()
  getEntiteiten()
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', updatePageSize)
})

async function getLeaders() {
  try {
    const response = await leiderApi.list()
    leaders.value = Array.isArray(response)
      ? response
      : (response.items ?? [])
  } catch (error) {
    console.error(error)
  }
}

/* -----------------------------
   SEARCH (client-side)
----------------------------- */
function searchLeaders(query) {
  search.value = query || ''
}

watch(search, () => reset())
watch(leaders, () => reset())

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
    console.error(err)
  }
}

async function addEntiteit(data) {
  try {
    await entiteitApi.createEniteit(data)
    await getEntiteiten()
  } catch (err) {
    console.error(err)
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