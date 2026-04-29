<template>
  <div class="page">
    <!-- Toolbar -->
    <div class="toolbar">
      <SearchBar
        v-model="searchQuery"
        placeholder="Zoek"
        width="300px"
        icon="fa fa-search"
        @update:modelValue="$emit('search', $event)"
      />
      <div class="buttons">
        <button class="btn btn-primary btn1" @click="$emit('toPDF')">PDF exporteren</button>
        <button class="btn btn-primary" @click="$emit('openAdd')">+ Asset</button>
      </div>
    </div>

    <!-- Table -->
    <ExpandedBaseTable
      :items="assets"
      :expand-on-row-click="true"
      columns="1fr 1fr 2fr 1fr 1fr"
      itemKey="_id"
    >
      <!-- Header -->
      <template #header>
        <div>nummer</div>
        <div>type</div>
        <div>serienummer</div>
        <div>werkhoogte</div>
        <div class="right">status</div>
      </template>

      <!-- Row -->
      <template #row="{ item }">
        <div @click="toggleRow(item)" class="clickable">{{ item.nummer || item.naam }}</div>
        <div>{{ item.Type?.naam || item.type || 'Onbekend' }}</div>
        <div>{{ item.serienummer || '-' }}</div>
        <div>{{ isSchaarlift(item) ? item.werkhoogte + ' m' : '—' }}</div>
        <div class="right">
          <span :class="['status', statusClass(item)]">{{ statusLabel(item) }}</span>
        </div>
      </template>

      <!-- Expanded -->
      <template #expanded="{ item }">
        <div class="expanded-row-container">
          <!-- LEFT -->
          <div class="expanded-left">
            <div class="section-header">
              <div class="section-title">Asset info</div>
              <button class="edit-btn" @click="editAsset(item)">✏️</button>
            </div>
            <div class="divider"></div>

            <div class="info-grid">
              <div class="column">
                <div><strong>nummer</strong></div>
                <div>{{ item.nummer || item.naam }}</div>

                <div><strong>type</strong></div>
                <div>{{ item.Type?.naam || '-' }}</div>

                <div><strong>serienummer</strong></div>
                <div>{{ item.serienummer || '-' }}</div>
              </div>

              <div v-if="isSchaarlift(item)" class="column">
                <div><strong>werkhoogte</strong></div>
                <div>{{ item.werkhoogte }} m</div>

                <div><strong>platformhoogte</strong></div>
                <div>{{ item.platformhoogte }} m</div>

                <div><strong>bouwjaar</strong></div>
                <div>{{ item.bouwjaar || '-' }}</div>
              </div>

              <div class="comments">
                <div class="comments-title"><strong>Opmerking</strong></div>
                <div class="comments-text">
                  {{ item.comment || 'Geen opmerking' }}
                </div>
              </div>

              <!-- Keuring -->
              <div v-if="isSchaarlift(item)" class="keuring">
                <div class="keuring-title"><strong>Keuring</strong></div>
                <div v-if="isKeuringVerlopen(item.keuringDatum)" class="expired-text">
                  Keuring verlopen {{ formatDate(item.keuringDatum) }}
                </div>
                <template v-else>
                  <div class="keuring-data">
                    <div>{{ daysUntilKeuring(item.keuringDatum) }} dagen</div>
                    <div>{{ formatDate(item.keuringDatum) }}</div>
                  </div>
                  <progress :value="progressValue(item.keuringDatum)" max="365" />
                </template>
              </div>
            </div>
          </div>

          <!-- RIGHT -->
          <div class="expanded-right">
            <div class="section-header">
              <div class="section-title">Boekingen</div>
            </div>
            <div class="divider"></div>

            <div v-if="item.huidigeBoekingen?.length">
              <div v-for="(b, i) in item.huidigeBoekingen" :key="i" class="boeking-grid">
                <div class="column">
                  <div><strong>leverdatum</strong></div>
                  <div>{{ formatDate(b.leverDatum) }}</div>

                  <div><strong>ophaaldatum</strong></div>
                  <div>{{ formatDate(b.ophaalDatum) || 'Geen' }}</div>

                  <div><strong>reference</strong></div>
                  <div>{{ b.reference }}</div>
                </div>
                <div class="column">
                  <div><strong>projectleider</strong></div>
                  <div>{{ b.projectleider?.naam || '-' }}</div>

                  <div><strong>werf</strong></div>
                  <div>{{ b.werf?.naam || '-' }}</div>
                </div>
              </div>
            </div>
            <div v-else class="coming-soon-placeholder">Geen actieve boekingen</div>
          </div>
        </div>
      </template>
    </ExpandedBaseTable>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import ExpandedBaseTable from '@/components/base/ExpandedBaseTable.vue'
import SearchBar from '@/components/base/SearchBar.vue'

defineProps({ assets: { type: Array, default: () => [] } })
const emit = defineEmits(['search', 'openAdd', 'edit-asset', 'toPDF'])

const searchQuery = ref('')
const openRowId = ref(null)

function toggleRow(asset) {
  openRowId.value = openRowId.value === asset._id ? null : asset._id
}

// Type check
function isSchaarlift(item) {
  return item?.werkhoogte !== undefined
}

// Status helper
function statusClass(item) {
  if (item.status === 'Kapot') return 'kapot'
  if (item.status === 'Ongekeurd') return 'ongekeurd'
  if (item.huidigeBoekingen?.length) return 'bezet'
  return 'vrij'
}
function statusLabel(item) {
  if (item.status === 'Kapot') return 'Kapot'
  if (item.status === 'Ongekeurd') return 'Ongekeurd'
  if (item.huidigeBoekingen?.length) return 'Bezet'
  return 'Vrij'
}

// Keuring
function daysUntilKeuring(d) {
  if (!d) return 0
  return Math.ceil((new Date(d) - new Date()) / (1000 * 60 * 60 * 24))
}
function isKeuringVerlopen(d) {
  return d && new Date(d) < new Date()
}
function progressValue(d) {
  return 365 - daysUntilKeuring(d)
}
function formatDate(d) {
  return d ? new Date(d).toLocaleDateString('nl-BE') : ''
}

// Edit
function editAsset(asset) {
  emit('edit-asset', asset)
}
</script>

<style scoped>
.comments {
  grid-column: 1 / -1;
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 14px;
  color: #333;
}

.comments-title {
  font-weight: 600;
}

.comments-text {
  background: #f9fafb;
  border-radius: 6px;

  white-space: pre-wrap; /* belangrijk voor vrije tekst */
}
.page {
  width: 100%;
}
.toolbar {
  display: flex;
  justify-content: space-between;
  margin-bottom: 15px;
}
.clickable {
  cursor: pointer;
  font-weight: 500;
}

.expanded-row-container {
  display: flex;
  gap: 20px;
  padding: 20px;
  border-radius: 8px;
}
.expanded-left,
.expanded-right {
  flex: 1;
  display: flex;
  flex-direction: column;
}

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

.divider {
  width: 100%;
  border: 1px solid #c2bebe;
  margin-bottom: 1rem;
}
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

.keuring {
  grid-column: 1 / -1;
  margin-top: 20px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  align-items: center;
  gap: 10px;
  color: #444;
  font-weight: 600;
}
.keuring-title {
  grid-column: 1 / -1;
}
.keuring-data {
  grid-column: 1 / -1;
  width: 80%;
  display: flex;
  justify-content: space-between;
}
.expired-text {
  color: #b91c1c;
  font-weight: 700;
  grid-column: 1 / -1;
  padding: 6px 0;
  font-size: 14px;
}
progress {
  grid-column: 1 / -1;
  width: 80%;
  height: 10px;
  border-radius: 8px;
  overflow: hidden;
  appearance: none;
}

progress::-webkit-progress-bar {
  background-color: #ddd;
  border-radius: 8px;
}

progress::-webkit-progress-value {
  background-color: #3b82f6;
  border-radius: 8px;
}
.coming-soon-placeholder {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  font-style: italic;
  color: #888;
  border: 2px dashed #ccc;
  border-radius: 8px;
  min-height: 150px;
}

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

.boeking-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px 40px;
  padding: 10px 0;
  border-bottom: 1px solid #ddd;
  margin-bottom: 10px;
}
.boeking-grid:last-child {
  border-bottom: none;
  margin-bottom: 0;
}

.btn1 {
  margin-right: 1rem;
  background-color: #969191;
}
</style>
