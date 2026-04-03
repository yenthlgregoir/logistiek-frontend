<template>
  <div class="page">
    <!-- Toolbar -->
    <div class="toolbar">
      <div class="search">
        <i class="material-icons">search</i>
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search werfcontainers..."
          class="search-input"
        />
      </div>
      <button class="btn btn-primary" @click="emit('openAdd')">
        + Werfcontainer
      </button>
    </div>

    <!-- Table -->
    <ExpandedBaseTable
      :items="assets"
      :expand-on-row-click="true"
      columns="2fr 2fr 1fr"
      itemKey="_id"
    >
      <template #header>
        <div>nummer</div>
        <div>type</div>
        <div class="right">status</div>
      </template>

      <template #row="{ item }">
        <div class="clickable">
          {{ item.nummer }}
        </div>

        <div>{{ item.Type?.naam || 'Onbekend' }}</div>

        <div class="right">
          <span :class="['status', getStatus(item)]">
            {{ getStatusLabel(item) }}
          </span>
        </div>
      </template>

      <!-- EXPANDED -->
      <template #expanded="{ item }">
        <div class="expanded-row-container">

          <!-- LINKS -->
          <div class="expanded-row-left">
            <div class="section-header">
              <div class="section-title">Werfcontainer info</div>
              <button class="edit-btn" @click="editAsset(item)">✏️</button>
            </div>

            <div class="devider"></div>

            <div class="info-grid">
              <div class="column">
                <div><strong>nummer</strong></div>
                <div>{{ item.nummer }}</div>

                <div><strong>type</strong></div>
                <div>{{ item.Type?.naam || '-' }}</div>
              </div>
              <div class="column">
                <div><strong>status</strong></div>
                <div>{{ getStatusLabel(item) }}</div>

                <div><strong>entiteit</strong></div>
                <div>{{ item.entiteit.naam || '-' }}</div>
            </div>
        
            </div>
            
          </div>

          <!-- RECHTS -->
          <div class="expanded-row-right">
            <div class="section-header">
              <div class="section-title">Boekingen</div>
            </div>

            <div class="devider"></div>

            <div v-if="item.huidigeBoekingen?.length > 0">
              <div
                v-for="(boeking, index) in item.huidigeBoekingen"
                :key="index"
                class="info-grid"
              >
                <div class="column">
                  <div><strong>Leverdatum</strong></div>
                  <div>{{ formatDate(boeking.leverDatum) }}</div>

                  <div><strong>Ophaaldatum</strong></div>
                  <div>{{ formatDate(boeking.ophaalDatum) || 'Geen' }}</div>

                  <div><strong>Ref</strong></div>
                  <div>{{ boeking.reference }}</div>
                </div>

                <div class="column">
                  <div><strong>Projectleider</strong></div>
                  <div>{{ boeking.projectleider?.naam || '-' }}</div>

                  <div><strong>Werf</strong></div>
                  <div>{{ boeking.werf?.naam || '-' }}</div>
                </div>
              </div>
            </div>

            <div v-else class="coming-soon-placeholder">
              Geen actieve boekingen
            </div>
          </div>

        </div>
      </template>
    </ExpandedBaseTable>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import ExpandedBaseTable from '@/components/base/ExpandedBaseTable.vue'

defineProps({
  assets: { type: Array, default: () => [] }
})

const emit = defineEmits(['search', 'openAdd', 'edit-asset'])

const searchQuery = ref('')

// 🔍 SEARCH
let timeout = null
watch(searchQuery, () => {
  clearTimeout(timeout)
  timeout = setTimeout(() => {
    emit('search', searchQuery.value)
  }, 400)
})

// STATUS
function getStatus(item) {
  if (item.status === 'Kapot') return 'kapot'
  if (item.status === 'Ongekeurd') return 'ongekeurd'
  if (item.huidigeBoekingen?.length > 0) return 'bezet'
  return 'vrij'
}

function getStatusLabel(item) {
  if (item.status === 'Kapot') return 'Kapot'
  if (item.status === 'Ongekeurd') return 'Ongekeurd'
  if (item.huidigeBoekingen?.length > 0) return 'Bezet'
  return 'Vrij'
}

// DATE
function formatDate(dateStr) {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('nl-BE')
}

function editAsset(asset) {
  emit('edit-asset', asset)
}
</script>
<style scoped>
.page {
  width: 100%;
}

/* Toolbar */
.toolbar {
  display: flex;
  justify-content: space-between;
  margin-bottom: 15px;
}

.search {
  position: relative;
  max-width: 300px;
  width: 100%;
}

.search input {
  width: 100%;
  padding: 8px 12px 8px 36px;
  border-radius: 8px;
  border: 1px solid #d1d5db;
}

.search i {
  position: absolute;
  left: 10px;
  top: 50%;
  transform: translateY(-50%);
  color: #6b7280;
}

/* Table */
.clickable {
  cursor: pointer;
  font-weight: 500;
}

/* Expanded layout */
.expanded-row-container {
  display: flex;
  gap: 20px;
  padding: 20px;
  border-radius: 8px;
}

.expanded-row-left,
.expanded-row-right {
  flex: 1;
  display: flex;
  flex-direction: column;
}

/* Section header */
.section-header {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  font-weight: 700;
  font-size: 16px;
  margin-bottom: 12px;
  height: 32px;
}

.section-title {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  pointer-events: none;
}

.edit-btn {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 16px;
  color: #555;
}

/* Info grid */
.info-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px 40px;
  font-size: 14px;
  color: #333;
}

.column {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.column > div {
  display: flex;
  justify-content: space-between;
}

.column strong {
  font-weight: 600;
}

/* Divider */
.devider {
  width: 100%;
  border: 1px solid rgb(194, 190, 190);
  margin-bottom: 1rem;
}

/* Boekingen placeholder */
.coming-soon-placeholder {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  font-style: italic;
  color: #888;
  border: 2px dashed #ccc;
  border-radius: 8px;
  user-select: none;
  min-height: 120px;
}

/* Status badges */
.status {
  padding: 4px 10px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 600;
}

.status.vrij {
  background: #d1fae5;
  color: #065f46;
}

.status.bezet {
  background: #fef3c7;
  color: #92400e;
}

.status.kapot {
  background: #fee2e2;
  color: #991b1b;
}

.status.ongekeurd {
  background: #f0f0f0;
  color: #6b7280;
}
</style>