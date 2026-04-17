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
import { ref, onMounted, watch } from 'vue'

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
   PAGINATION (NEW)
----------------------------- */
const {
  currentPage,
  totalPages,
  paginatedItems: paginatedWerven,
  next,
  prev,
  reset,
} = usePagination(werven, {
  pageSize: 10,
})

/* -----------------------------
   LOAD DATA
----------------------------- */
onMounted(getWerven)

async function getWerven() {
  try {
    const params = {
      search: search.value || undefined,
    }

    const response = await werfApi.list(params)
    werven.value = response
  } catch (error) {
    console.error(error)
  }
}

/* -----------------------------
   SEARCH
----------------------------- */
async function searchWerven(query) {
  try {
    search.value = query || ''
    reset()
    await getWerven()
  } catch (err) {
    console.error(err)
  }
}

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
    console.log(err)
  }
}

/* -----------------------------
   RESET PAGINATION ON DATA CHANGE
----------------------------- */
watch(werven, () => {
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