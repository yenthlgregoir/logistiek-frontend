<template>
  <!-- FILTERS -->
<div class="filters">
  <div class="filters-grid">
    <div class="filter-group">
      <div class="filter-title">
        🧱 TOESTEL MOET PASSEN DOOR
      </div>

      <div class="filter-row">
        <label>Max ingeklapte hoogte</label>
        <span class="limit">{{ filters.maxIngeklapteHoogte || 'geen limiet' }}</span>
      </div>
      <input type="range" min="0" max="5" step="0.1" v-model.number="filters.maxIngeklapteHoogte" />

      <div class="filter-row">
        <label>Max breedte toestel</label>
        <span class="limit">{{ filters.maxBreedte || 'geen limiet' }}</span>
      </div>
      <input type="range" min="0" max="10" step="0.5" v-model.number="filters.maxBreedte" />
    </div>

    <div class="filter-group">
      <div class="filter-title">
        🎯 TOESTEL MOET BEREIKEN
      </div>

      <div class="filter-row">
        <label>Min werkhoogte</label>
        <span class="limit">{{ filters.minWerkhoogte || 'geen limiet' }}</span>
      </div>
      <input type="range" min="0" max="30" step="0.5" v-model.number="filters.minWerkhoogte" />

      <div class="filter-row">
        <label>Min hefvermogen</label>
        <span class="limit">{{ filters.minHefvermogen || 'geen limiet' }}</span>
      </div>
      <input type="range" min="0" max="500" step="10" v-model.number="filters.minHefvermogen" />
    </div>
  </div>

  <div class="filters-footer">
    <div class="result-count">
      <strong>{{ filteredMachines.length }}</strong> toestellen voldoen
    </div>

    <button class="reset" @click="resetFilters">
      ↺ Alle filters wissen
    </button>
  </div>
</div>


  <!-- RESULTATEN -->
  <div class="machine-grid">
    <MachineCard
      v-for="item in filteredMachines"
      :key="item.id"
      v-bind="item"
    />
  </div>
</template>
<script setup>
import { ref, onMounted, computed } from 'vue'
import MachineCard from '@/components/Logistics/Schaarliften/HoogtewerkerCard.vue'
import { schaarliftenApi } from '@/api/schaarliften.js'

const machines = ref([])

/* ✅ FILTER STATE */
const filters = ref({
  maxIngeklapteHoogte: 0,
  maxBreedte: 0,
  minWerkhoogte: 0,
  minHefvermogen: 0
})

/* ✅ FILTER LOGICA */
const filteredMachines = computed(() => {
  return machines.value.filter(m => {
    if (
      filters.value.maxIngeklapteHoogte &&
      m.ingeklapteHoogte > filters.value.maxIngeklapteHoogte
    ) return false

    if (
      filters.value.maxBreedte &&
      m.breedte > filters.value.maxBreedte
    ) return false

    if (
      filters.value.minWerkhoogte &&
      m.werkhoogte < filters.value.minWerkhoogte
    ) return false

    if (
      filters.value.minHefvermogen &&
      m.hefvermogen < filters.value.minHefvermogen
    ) return false

    return true
  })
})

/* ✅ RESET */
const resetFilters = () => {
  filters.value = {
    maxIngeklapteHoogte: 0,
    maxBreedte: 0,
    minWerkhoogte: 0,
    minHefvermogen: 0
  }
}

/* ✅ DATA LADEN */
onMounted(async () => {
  const response = await schaarliftenApi.list()

  const data = Array.isArray(response)
    ? response
    : response?.data ?? []

  const grouped = {}

  data.forEach(item => {
    const type = item.Type?.naam ?? 'Onbekend'
    const werkhoogte = item.werkhoogte ?? 0

    // 🔑 groep-sleutel = type + werkhoogte
    const key = `${type}_${werkhoogte}`

    if (!grouped[key]) {
      grouped[key] = {
        id: item._id,

        model: item.Type?.naam ?? '—',
        brand: item.Type.merk ?? '-',
        type,

        werkhoogte,
        hefvermogen: item.Type?.hefvermogen ?? 0,
        ingeklapteHoogte: item.Type?.ingeklapteHoogte ?? 0,
        breedte: item.Type?.breedte ?? 0,

        description:
          item.Type?.omschrijving ?? 'Geen beschrijving beschikbaar',

        // ✅ nieuw
        aantal: 1
      }
    } else {
      // ✅ zelfde type + werkhoogte → aantal verhogen
      grouped[key].aantal++
    }
  })

  machines.value = Object.values(grouped)
})

</script>


<style scoped>
.machine-grid {
  display: grid;

  /* ✅ vaste kaartbreedte */
  grid-template-columns: repeat(auto-fit, 350px);

  /* ✅ perfecte centering bij onvolledige rij */
  justify-content: center;

  /* ✅ consistente spacing */
  gap: 24px;

  padding: 24px;
}


.filters {
  background: #ffffff;
  border-bottom: 1px solid #e5e7eb;
  padding: 24px 32px;
  padding-left: 8rem;
  padding-right: 8rem;
}

/* 2 kolommen zoals screenshot */
.filters-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 48px;
  margin-bottom: 20px;
  
}

/* Groep */
.filter-group {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

/* Titel met icoon */
.filter-title {
  font-size: 12px;
  font-weight: 700;
  color: #2563eb;
  letter-spacing: 0.05em;
  margin-bottom: 8px;
}

/* Rij label + limiet */
.filter-row {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
  color: #111827;
}

.limit {
  font-size: 12px;
  color: #6b7280;
  background: #f3f4f6;
  padding: 2px 8px;
  border-radius: 6px;
}

/* Slider styling */
input[type="range"] {
  -webkit-appearance: none;
  height: 4px;
  background: #e5e7eb;
  border-radius: 999px;
  outline: none;
}

input[type="range"]::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 16px;
  height: 16px;
  background: #2563eb;
  border-radius: 50%;
  cursor: pointer;
  border: 2px solid white;
}

input[type="range"]::-moz-range-thumb {
  width: 16px;
  height: 16px;
  background: #2563eb;
  border-radius: 50%;
  cursor: pointer;
  border: none;
}

/* Footer */
.filters-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.result-count {
  font-size: 14px;
  color: #111827;
}

.result-count strong {
  color: #2563eb;
  font-size: 18px;
}

.reset {
  background: white;
  border: 1px solid #d1d5db;
  padding: 6px 14px;
  border-radius: 8px;
  font-size: 13px;
  cursor: pointer;
}

.reset:hover {
  background: #f9fafb;
}
@media (max-width: 380px) {
  .machine-grid {
    grid-template-columns: 1fr;
  }
}
@media (max-width: 1024px) {
  .filters {
    padding: 20px 32px;
  }

  .filters-grid {
    gap: 32px;
  }
}@media (max-width: 768px) {
  .filters {
    padding: 16px;
  }

  /* ✅ filters onder elkaar */
  .filters-grid {
    grid-template-columns: 1fr;
    gap: 24px;
  }

  .filters-footer {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
}
@media (max-width: 480px) {
  .filter-title {
    font-size: 11px;
  }

  .filter-row {
    font-size: 12px;
  }

  .limit {
    font-size: 11px;
  }
}
@media (min-width: 1024px) {
  .filters {
    position: sticky;
    top: 0;
    z-index: 10;
  }
}

</style>
