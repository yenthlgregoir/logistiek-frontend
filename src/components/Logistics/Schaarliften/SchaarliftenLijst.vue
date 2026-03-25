<template>
  <div class="page">
    <!-- Toolbar -->
    <div class="toolbar">
      <div class="search">
        <i class="material-icons">search</i>
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search schaarliften..."
          class="search-input"
        />
      </div>
      <button class="btn btn-primary" @click="emit('openAdd')">
        + Schaarlift
      </button>
    </div>

    <!-- Table -->
    <ExpandedBaseTable :items="liften" :expand-on-row-click="true" columns="1fr 1fr 2fr 1fr 1fr" itemKey="_id" >
      <template #header>
        <div>Nummer</div>
        <div>Type</div>
        <div>Serienummer</div>
        <div>Werkhoogte</div>
        <div class="right">Status</div>
      </template>

      <template #row="{ item }">
        <div @click="toggleRow(item)" class="clickable">
          {{ item.nummer }}
        </div>
        <div>{{ item.Type?.naam || 'Onbekend' }}</div>
        <div>{{ item.serienummer || '-' }}</div>
        <div>{{ item.werkhoogte }} m</div>
        <div class="right">
          <span :class="['status', item.status.toLowerCase()]">
            {{ item.status }}
          </span>
        </div>
      </template>

      <!-- EXPANDED ROW -->
      <template #expanded="{ item }">
        <div class="expanded-row-container">
          <div class="expanded-row-left">
            <div class="section-header">
  <div class="section-title">Toestel info</div>
  <button class="edit-btn" title="Bewerk Toestel info" @click="editSchaarlift(item)">✏️</button>
</div>
            
            <div class="devider"></div>
            <div class="info-grid">
              <div class="column">
                <div><strong>Nummer</strong></div><div>{{ item.nummer }}</div>
                <div><strong>Type</strong></div><div>{{ item.Type?.naam || '-' }}</div>
                <div><strong>Serienummer</strong></div><div>{{ item.serienummer || '-' }}</div>
              </div>
              <div class="column">
                <div><strong>Werkhoogte</strong></div><div>{{ item.werkhoogte }} m</div>
                <div><strong>Platformhoogte</strong></div><div>{{ item.platformhoogte }} m</div>
                <div><strong>Bouwjaar</strong></div><div>{{ item.bouwjaar || '-' }}</div>
              </div>

              <div class="keuring">
                <div class= "keuring-title"><strong>Keuring</strong></div>
                
                <div v-if="isKeuringVerlopen(item.keuringDatum)" class="expired-text">
                  Keuring verlopen
                  {{formatDate(item.keuringDatum) }}
                </div>
                <template v-else>
                    <div class="keuring-data">
                        <div>{{ daysUntilKeuring(item.keuringDatum) }} dagen tot keuring</div>
                        <div>{{ formatDate(item.keuringDatum) }}</div>
                    </div>
                  <progress :value="progressValue(item.keuringDatum)" max="365" />
                </template>
              </div>
            </div>
          </div>

          <div class="expanded-row-right">
            <div class="section-header">
                <div class="section-title">
Boeking
                </div>
              
              <button class="edit-btn" title="Bewerk Boeking info">✏️</button>
            </div>
            <div class="coming-soon-placeholder">
              <p>Coming Soon</p>
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
  liften: { type: Array, default: () => [] }
})

const searchQuery = ref('')
const openRowId = ref(null) 
const emit = defineEmits(['search', 'openAdd' , "edit-schaarlift"])

function toggleRow(lift) {
  const id = lift._id
  openRowId.value = openRowId.value === id ? null : id
}

// debounce search
let timeout = null
watch(searchQuery, () => {
  clearTimeout(timeout)
  timeout = setTimeout(() => {
    emit('search', searchQuery.value)
  }, 400)
})

function daysUntilKeuring(dateStr) {
  if (!dateStr) return 0;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const keuringDate = new Date(dateStr);
  keuringDate.setHours(0, 0, 0, 0);

  const diffTime = keuringDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return diffDays > 0 ? diffDays : 0;
}

function isKeuringVerlopen(dateStr) {
  if (!dateStr) return false;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const keuringDate = new Date(dateStr);
  keuringDate.setHours(0, 0, 0, 0);

  return keuringDate < today;
}

function progressValue(dateStr) {
  if (!dateStr) return 0;
  
  // We nemen aan dat de keuring jaarlijks is (365 dagen)
  // Dus de voortgang is aantal dagen sinds de laatste keuring
  // Hier geven we 365 - dagen tot keuring, maar check dat waarde >= 0
  const daysLeft = daysUntilKeuring(dateStr);
  const progress = 365 - daysLeft;
  return progress > 0 ? progress : 0;
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('nl-BE', { day: '2-digit', month: '2-digit', year: 'numeric' });
}
function editSchaarlift(lift){
    emit("edit-schaarlift" , lift);
}
</script>

<style scoped>
.page {
  width: 100%;
}

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

/* clickable row */
.clickable {
  cursor: pointer;
  font-weight: 500;
}

/* expanded row */
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
.info-grid {
  display: grid;
  grid-template-columns: 1fr 1fr; 
  gap: 16px 40px;
  font-size: 14px;
  color: #333;
}

/* De kolommen zelf krijgen een eenvoudige flexbox om labels en waarden netjes te stapelen */
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
.keuring-title{
    grid-column: 1 / -1; 
}
.keuring-data{
    grid-column: 1 / -1; 
    width: 80%;
    display: flex;
    justify-content: space-between;
}
.keuring > div:nth-child(1) {
  font-weight: 700;
}

progress {
  grid-column: 1 / -1; 
  width: 80%;
  height: 10px;
  border-radius: 5px;
  overflow: hidden;
  appearance: none;
}

progress::-webkit-progress-bar {
  background-color: #ddd;
  border-radius: 5px;
}

progress::-webkit-progress-value {
  background-color: #3b82f6;
  border-radius: 5px;
}

.expired-text {
  color: #b91c1c;
  font-weight: 700;
  grid-column: 1 / -1;
  padding: 6px 0;
  font-size: 14px;
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
  user-select: none;
  min-height: 150px;
}

/* status badges */
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
.devider{
    width: 100%;
    border: 1px solid rgb(194, 190, 190);
    margin-bottom: 1rem ;
}
</style>