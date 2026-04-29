<template>
  <div class="page">
    <!-- Toolbar -->
    <div class="toolbar">
      <SearchBar
        placeholder="Zoek"
        width="260px"
        icon="fa fa-search"
        @update:modelValue="emit('search', $event)"
      />
      <div class="buttons">
        <button class="btn btn-primary btn-leader" @click="openNewLeaderDrawer">
          <i class="material-icons">add</i> Add Leader
        </button>
        <button class="btn btn-secondary" @click="openEntiteitDrawer">
          <i class="material-icons">add</i> Add Entiteit
        </button>
      </div>
    </div>

    <BaseTable :items="leaders" columns="2fr 2fr 1fr 1fr" @row-click="openLeaderDrawer">
      <template #header>
        <div>Naam</div>
        <div>Mail</div>
        <div>Telefoon</div>
        <div class="right">Entiteit</div>
      </template>

      <template #row="{ item: leader }">
        <div>{{ leader.naam || 'Onbekend' }}</div>
        <div>{{ leader.mailAdres || 'Onbekend' }}</div>
        <div>{{ leader.telefoonnummer || 'Onbekend' }}</div>
        <div
          class="col-entiteit right"
          :class="leader.entiteit.naam"
          :style="{
            backgroundColor: leader.entiteit.color || '#1b4965',
            color: getContrastColor(leader.entiteit.color || '#1b4965'),
          }"
        >
          <span v-if="leader.entiteit.icon" class="material-icons entiteit-icon">
            {{ leader.entiteit.icon }}
          </span>
          <span>{{ leader.entiteit?.naam || 'Onbekend' }}</span>
        </div>
      </template>
    </BaseTable>

    <!-- Leader Drawer -->
    <LeaderDrawer
      :leader="selectedLeader"
      :show="showDrawer || showNewLeaderDrawer"
      :entiteiten="entiteiten"
      @close="closeDrawer"
      @save="handleSave"
      @edit="handleEdit"
      @delete="handleDelete"
    />

    <!-- Entiteit Drawer -->
    <EntiteitDrawer
      :show="showEntiteitDrawer"
      @close="showEntiteitDrawer = false"
      @created="handleAddEntiteit"
    />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import BaseTable from '@/components/base/BaseTable.vue'
import LeaderDrawer from './LeaderSideBar.vue'
import EntiteitDrawer from './EntiteitDrawer.vue'
import SearchBar from '@/components/base/SearchBar.vue'

defineProps({
  entiteiten: { type: Array, default: () => [] },
  leaders: { type: Array, default: () => [] },
})

const selectedLeader = ref(null)
const showDrawer = ref(false)
const showNewLeaderDrawer = ref(false)
const showEntiteitDrawer = ref(false)

const emit = defineEmits(['select', 'add', 'delete', 'search', 'edit', 'addEntiteit'])

function getContrastColor(hexColor) {
  if (!hexColor) return '#000'

  const hex = hexColor.replace('#', '')
  const r = parseInt(hex.substr(0, 2), 16) / 255
  const g = parseInt(hex.substr(2, 2), 16) / 255
  const b = parseInt(hex.substr(4, 2), 16) / 255

  const [R, G, B] = [r, g, b].map((c) =>
    c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4),
  )

  const luminance = 0.2126 * R + 0.7152 * G + 0.0722 * B

  return luminance > 0.179 ? '#000' : '#fff'
}

function openLeaderDrawer(leader) {
  selectedLeader.value = leader
  showDrawer.value = true
  emit('select', leader)
}

function closeDrawer() {
  showDrawer.value = false
  showNewLeaderDrawer.value = false
  setTimeout(() => {
    selectedLeader.value = null
  }, 300)
}

function openNewLeaderDrawer() {
  selectedLeader.value = null
  showNewLeaderDrawer.value = true
}

function openEntiteitDrawer() {
  showEntiteitDrawer.value = true
}

function handleSave(newLeader) {
  closeDrawer()
  emit('add', newLeader)
}

function handleEdit(editedLeader) {
  closeDrawer()
  emit('edit', editedLeader)
}

function handleDelete(leaderId) {
  closeDrawer()
  emit('delete', leaderId)
}

function handleAddEntiteit(data) {
  emit('addEntiteit', data)
}
</script>

<style scoped>
.page {
  width: 100%;
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center; /* Verticale uitlijning */
  gap: 12px;
  margin-bottom: 15px;
  flex-wrap: wrap;
}
.buttons {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.btn {
  display: inline-flex; /* zodat icon en text in 1 lijn zitten */
  align-items: center;
  gap: 6px; /* ruimte tussen icon en tekst */
  padding: 8px 14px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  border: none;
  transition: background 0.2s ease;
}

.btn-primary {
  background-color: #5786f7;
  color: white;
}

.btn-primary:hover {
  background-color: #5077d3;
}

.btn-secondary {
  background-color: #e5e7eb;
  color: #111827;
}

.btn-secondary:hover {
  background-color: #d1d5db;
}

.btn i,
.btn .material-icons {
  font-size: 18px; /* dezelfde grootte als search icon */
  vertical-align: middle;
}

.col-entiteit {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 10px;
  font-weight: 600;
  font-size: 13px;
  background: #e5e7eb;
}

.entiteit-icon {
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.search {
  position: relative;
  flex: 1;
  max-width: 300px;
}

.search input {
  padding: 8px 12px 8px 32px;
  border-radius: 6px;
  border: none;
  background: transparent;
}

.search i {
  position: absolute;
  left: 10px;
  top: 50%;
  transform: translateY(-50%);
  color: #1b4965;
}

.btn-leader {
  margin-right: 1rem;
}

.material-icons {
  font-size: 20px;
  line-height: 1;
  user-select: none;
}
</style>
