<template>
  <div class="page">
    <!-- toolbar -->
    <div class="toolbar">
      <SearchBar
        v-model="searchQuery"
        placeholder="Zoek"
        width="300px"
        icon="fa fa-search"
        @update:modelValue="emit('search', $event)"
      />
      <button class="btn btn-primary" @click="openNewWerfDrawer">
        <i class="fa fa-plus"></i> Add
      </button>
    </div>

    <!-- tabel -->
    <BaseTable :items="werven" columns="1fr 2fr 2fr 1fr" @row-click="openWerfDrawer">
      <!-- header -->
      <template #header>
        <div>Naam</div>
        <div>Locatie</div>
        <div class="right">Status</div>
      </template>

      <!-- row -->
      <template #row="{ item: werf }">
        <div>{{ werf.naam || 'Onbekend' }}</div>
        <div>{{ formatLocatie(werf) }}</div>
        <div class="col-status right" :class="werf.status">
          {{ werf.status || 'Onbekend' }}
        </div>
      </template>
    </BaseTable>

    <!-- detail drawer -->
    <WerfSideBar
      v-if="selectedWerf"
      :werf="selectedWerf"
      :show="showDrawer"
      @close="closeDrawer"
      @delete="handleDelete"
      @edit="handleEdit"
    />

    <!-- nieuwe werf drawer -->
    <NewWerfSideBar :show="showNewWerfDrawer" @close="closeNewWerfDrawer" @save="handleNewWerf" />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import BaseTable from '@/components/base/BaseTable.vue'
import WerfSideBar from './WerfSideBar.vue'
import NewWerfSideBar from './AddWerfSideBar.vue'
import SearchBar from '@/components/base/SearchBar.vue'

// props
defineProps({
  werven: { type: Array, default: () => [] },
})

// emits
const emit = defineEmits(['select', 'add', 'delete', 'search', 'edit'])

// lokale state
const selectedWerf = ref(null)
const showDrawer = ref(false)
const showNewWerfDrawer = ref(false)
const searchQuery = ref('')

// functies
function formatLocatie(w) {
  if (!w.adres) return 'Onbekend'
  return `${w.adres.straat || ''} ${w.adres.huisnummer || ''}, ${
    w.adres.postcode || ''
  } ${w.adres.gemeente || ''}`
}

function openWerfDrawer(werf) {
  selectedWerf.value = werf
  showDrawer.value = true
  emit('select', werf)
}

function closeDrawer() {
  showDrawer.value = false
  setTimeout(() => {
    selectedWerf.value = null
  }, 300)
}

function openNewWerfDrawer() {
  showNewWerfDrawer.value = true
}

function closeNewWerfDrawer() {
  showNewWerfDrawer.value = false
}

function handleNewWerf(newWerf) {
  emit('add', newWerf)
  closeNewWerfDrawer()
}

function handleDelete(werfId) {
  emit('delete', werfId)
  closeDrawer()
}
function handleEdit(data) {
  emit('edit', data)
  closeDrawer
}
</script>

<style scoped>
.page {
  width: 100%;
}
.toolbar {
  display: flex;
  justify-content: space-between;
  margin-bottom: 10px;
  gap: 10px;
}
.col-status {
  padding: 6px 12px;
  border-radius: 10px;
  font-weight: 600;
  font-size: 13px;
  text-align: center;
}
.col-status.Bezig {
  background: #9add91;
  color: #065f46;
}
.col-status.Afgerond {
  background: #fee2e2;
  color: #7f1d1d;
}
.col-status.Onderhoud {
  background: #5786f7;
  color: #e0f2fe;
}
.btn {
  padding: 8px 14px;
  border-radius: 4px;
  border: none;
  cursor: pointer;
}
.btn-primary {
  background: #5786f7;
  color: white;
}
.btn-primary:hover {
  background: #5077d3;
}
</style>
