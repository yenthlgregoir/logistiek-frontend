<template>
  <div class="page">
    <h2>Werven</h2>

    <WerfTable
      :werven="paginatedWerven"
      @add="addWerf"
      @delete="deleteWerf"
      @search="searchWerven"
      @edit="editWerf"
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

import WerfTable from '@/components/Logistics/Werf/WerfTable.vue'
import BasePagination from '@/components/base/BasePagination.vue'

import { werfApi } from '@/api/werf.js'
import { usePagination } from '@/composable/usePagination'

/* -----------------------------
   STATE
----------------------------- */
const werven = ref([])
const search = ref('')

/* -----------------------------
   FILTERING (zoals klanten)
----------------------------- */
const filteredWerven = computed(() => {
  const term = search.value.toLowerCase()

  return werven.value.filter(
    (w) => w.naam?.toLowerCase().includes(term) || w.werfNummer?.toLowerCase().includes(term),
  )
})

/* -----------------------------
   PAGINATION
----------------------------- */
const {
  currentPage,
  pageSize,
  totalPages,
  paginatedItems: paginatedWerven,
  next,
  prev,
  reset,
} = usePagination(filteredWerven)

/* -----------------------------
   DYNAMIC PAGE SIZE
----------------------------- */
function updatePageSize() {
  const availableHeight = window.innerHeight - 350
  const rowHeight = 60
  pageSize.value = Math.floor(availableHeight / rowHeight)
}

/* -----------------------------
   LOAD DATA
----------------------------- */
onMounted(() => {
  updatePageSize()
  window.addEventListener('resize', updatePageSize)
  getWerven()
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', updatePageSize)
})

async function getWerven() {
  try {
    const response = await werfApi.list()
    werven.value = Array.isArray(response) ? response : (response.items ?? [])
  } catch (error) {
    console.error(error)
  }
}

/* -----------------------------
   SEARCH
----------------------------- */
function searchWerven(query) {
  search.value = query || ''
}

/* reset pagination bij search */
watch(search, () => reset())

/* reset bij data change */
watch(werven, () => reset())

/* -----------------------------
   CRUD
----------------------------- */
async function addWerf(data) {
  try {
    await werfApi.create(data)
    await getWerven()
  } catch (err) {
    console.error(err)
  }
}

async function deleteWerf(werfId) {
  try {
    await werfApi.remove(werfId)
    await getWerven()
  } catch (err) {
    console.error(err)
  }
}

async function editWerf(data) {
  try {
    await werfApi.update(data._id, data)
    await getWerven()
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
