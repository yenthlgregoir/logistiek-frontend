<template>
  <div class="page">
    <h2>Werven</h2>
    <WerfTable
      :werven="werven"
      @add="addWerf"
      @delete="deleteWerf"
      @search="searchWerven"
      @edit="editWerf"
    />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import WerfTable from '@/components/Logistics/Werf/WerfTable.vue'
import { werfApi } from '@/api/werf.js'

const werven = ref([])

onMounted(getWerven)

async function getWerven() {
  try {
    const params = {
      search: undefined,
    }
    const response = await werfApi.list(params)
    werven.value = response
  } catch (error) {
    console.error(error)
  }
}

async function searchWerven(query) {
  try {
    const params = {
      search: query || undefined,
    }
    const response = await werfApi.list(params)
    werven.value = response
  } catch (err) {
    console.error(err)
  }
}

async function addWerf(data) {
  try {
    await werfApi.create(data)
    getWerven()
  } catch (err) {
    console.error(err)
  }
}

async function deleteWerf(werfId) {
  try {
    await werfApi.remove(werfId)
    getWerven()
  } catch (err) {
    console.error(err)
  }
}

async function editWerf(data) {
  try {
    await werfApi.update(data._id, data)
    getWerven()
  } catch (err) {
    console.log(err)
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
