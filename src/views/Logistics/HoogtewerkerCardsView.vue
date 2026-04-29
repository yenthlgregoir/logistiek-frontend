<template>
  <div v-if="step < 4" class="filters wizard">
    <transition name="wizard-fade" mode="out-in">
      <div :key="step" class="filters-full wizard-center wizard-step">
        
        <!-- STEP 1 -->
        <div v-if="step === 1" class="wizard-card">
          <div class="filter-title">Welk type toestel zoek je?</div>

          <div class="select-cards">
            <HoogtewerkerKeuzeCard
              v-model="machineType"
              title="Schaarlift"
              value="Schaarlift"
              image="Schaarlift"
            />

            <HoogtewerkerKeuzeCard
              v-model="machineType"
              title="Knikarm"
              value="Knikarm"
              image="Knikarm"
            />

            <HoogtewerkerKeuzeCard
              v-model="machineType"
              title="Beide"
              value="both"
              image="/images/beide.svg"
            />
          </div>

          <button :disabled="!machineType" class="btn" @click="step = 2">
            Volgende →
          </button>
        </div>

        <!-- STEP 2 -->
        <div v-else-if="step === 2" class="wizard-card">
          <div class="filter-title">🧱 TOESTEL MOET PASSEN DOOR</div>

          <div class="filter-row">
            <label class="labelclass">Max ingeklapte hoogte</label>
            <span class="limit" :class="{ active: filters.maxIngeklapteHoogte }">
              {{ filters.maxIngeklapteHoogte || 'geen limiet' }}
            </span>
          </div>

          <input type="range" min="0" max="5" step="0.1"
            v-model.number="filters.maxIngeklapteHoogte" />

          <div class="filter-row">
            <label class="labelclass">Max breedte</label>
            <span class="limit" :class="{ active: filters.maxBreedte }">
              {{ filters.maxBreedte || 'geen limiet' }}
            </span>
          </div>

          <input type="range" min="0" max="3" step="0.1"
            v-model.number="filters.maxBreedte" />

          <div class="filters-footer">
            <button @click="step = 1" class="btn">← terug</button>
            <button @click="step = 3" class="btn">volgende →</button>
          </div>
        </div>

        <!-- STEP 3 -->
        <div v-else class="wizard-card">
          <div class="filter-title">🎯 TOESTEL MOET BEREIKEN</div>

          <div class="filter-row">
            <label class="labelclass">Min werkhoogte</label>
            <span class="limit" :class="{ active: filters.minWerkhoogte }">
              {{ filters.minWerkhoogte || 'geen limiet' }}
            </span>
          </div>

          <input type="range" min="0" max="14" step="0.5"
            v-model.number="filters.minWerkhoogte" />

          <div class="filter-row">
            <label class="labelclass">Min hefvermogen</label>
            <span class="limit" :class="{ active: filters.minHefvermogen }">
              {{ filters.minHefvermogen || 'geen limiet' }}
            </span>
          </div>

          <input type="range" min="0" max="400" step="10"
            v-model.number="filters.minHefvermogen" />

          <div class="filters-footer">
            <div class="result-count">
              <strong>{{ filteredMachines.length }}</strong> toestellen
            </div>

            <button class="reset btn" @click="resetFilters">reset</button>
            <button class="btn" @click="step = 4">resultaten →</button>
          </div>
        </div>

      </div>
    </transition>
  </div>

  <!-- ===================== -->
  <!-- RESULTATEN -->
  <!-- ===================== -->

  <div v-if="step === 4">

    <!-- HEADER -->
    <div class="results-header">
      <button @click="step = 3">← filters aanpassen</button>

      <div>
        <strong>{{ filteredMachines.length }}</strong> resultaten
      </div>
    </div>

    <!-- EMPTY STATE -->
    <div v-if="filteredMachines.length === 0" class="empty-state">
      <h2>Geen hoogtewerkers voldoen aan uw eisen</h2>
      <button class="btn" @click="resetFilters">Reset filters</button>
    </div>

    <!-- RESULTS -->
    <transition-group v-else name="card-fade" tag="div" class="machine-grid">
      <MachineCard
        v-for="item in filteredMachines"
        :key="item.id"
        v-bind="item"
      />
    </transition-group>

  </div>
</template>
<script setup>
import { ref, onMounted, computed } from 'vue'
import MachineCard from '@/components/Logistics/Schaarliften/HoogtewerkerCard.vue'
import { schaarliftenApi } from '@/api/schaarliften.js'
import HoogtewerkerKeuzeCard from '@/components/Logistics/Schaarliften/HoogtewerkerKeuzeCard.vue'

const machines = ref([])

/* STEP FLOW */
const step = ref(1)
const machineType = ref(null)

/* FILTERS */
const filters = ref({
  maxIngeklapteHoogte: 0,
  maxBreedte: 0,
  minWerkhoogte: 0,
  minHefvermogen: 0,
})

/* FILTER LOGICA */
const filteredMachines = computed(() => {
  return machines.value.filter((m) => {
    if (machineType.value !== 'both' && machineType.value) {
      if (m.type !== machineType.value) return false
    }

    if (filters.value.maxIngeklapteHoogte && m.ingeklapteHoogte > filters.value.maxIngeklapteHoogte)
      return false

    if (filters.value.maxBreedte && m.breedte > filters.value.maxBreedte) return false

    if (filters.value.minWerkhoogte && m.werkhoogte < filters.value.minWerkhoogte) return false

    if (filters.value.minHefvermogen && m.hefvermogen < filters.value.minHefvermogen) return false

    return true
  })
})

/* RESET */
const resetFilters = () => {
  step.value = 1
  machineType.value = null

  filters.value = {
    maxIngeklapteHoogte: 0,
    maxBreedte: 0,
    minWerkhoogte: 0,
    minHefvermogen: 0,
  }
}

/* DATA */
onMounted(async () => {
  const response = await schaarliftenApi.list()

  const data = Array.isArray(response) ? response : (response?.data ?? [])

  const grouped = {}

  data.forEach((item) => {
    const naam = item.Type?.naam ?? 'Onbekend'
    const werkhoogte = item.werkhoogte ?? 0
    const type = item.Type?.type ?? 'unknown'

    const key = `${naam}_${werkhoogte}`

    if (!grouped[key]) {
      grouped[key] = {
        id: item._id,
        model: item.Type?.naam ?? '—',
        brand: item.Type?.merk ?? '-',
        type,

        werkhoogte,
        hefvermogen: item.Type?.hefvermogen ?? 0,
        ingeklapteHoogte: item.Type?.ingeklapteHoogte ?? 0,
        breedte: item.Type?.breedte ?? 0,

        description: item.Type?.omschrijving ?? '',
        aantal: 1,
      }
    } else {
      grouped[key].aantal++
    }
  })

  machines.value = Object.values(grouped)
})
</script>

<style scoped>
.machine-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, 350px);
  justify-content: center;
  gap: 24px;
  padding: 24px;
}
.filters {
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
}
.card-fade-enter-active {
  transition: all 0.35s ease;
}

.card-fade-enter-from {
  opacity: 0;
  transform: translateY(15px) scale(0.98);
}

.card-fade-enter-to {
  opacity: 1;
  transform: translateY(0) scale(1);
}
.empty-state {
  height: 60vh;
  display: flex;
  flex-direction: column;
  gap: 16px;
  justify-content: center;
  align-items: center;
  text-align: center;
  color: #374151;
}

.empty-state h2 {
  font-size: 20px;
  font-weight: 700;
}

/* ===================== */
/* CARD (MAIN CONTAINER) */
/* ===================== */
.select-cards {
  display: flex;
  gap: 18px;
  justify-content: center;
  margin: 20px 0;
}

.wizard-card {
  width: 520px;
  padding: 32px;
  border-radius: 16px;
  display: flex;
  flex-direction: column;
  gap: 18px;
  text-align: center;
  transition: all 0.3s ease;
}

/* ===================== */
/* TITEL */
/* ===================== */

.filter-title {
  font-size: 24px;
  font-weight: 700;
  color: #2563eb;
  margin-bottom: 6px;
}

/* ===================== */
/* RADIO BUTTONS */
/* ===================== */

.labelclass {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;

  transition: 0.2s;
  font-size: 14px;
}

input[type='radio'] {
  accent-color: #2563eb;
}
.wizard-step {
  min-height: 420px;
  display: flex;
  justify-content: center;
  align-items: center;
}

/* ENTER / LEAVE ANIMATION */
.wizard-fade-enter-active,
.wizard-fade-leave-active {
  transition: all 0.35s ease;
}

/* start state */
.wizard-fade-enter-from {
  opacity: 0;
  transform: translateY(20px);
}

/* end leave state */
.wizard-fade-leave-to {
  opacity: 0;
  transform: translateY(-20px);
}
/* ===================== */
/* ROWS */
/* ===================== */

.filter-row {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
  color: #374151;
}

.limit {
  display: flex;
  width: 7rem;
  align-items: center;
  justify-content: center;
  font-size: 15px;
  color: #6b7280;
  background: #f3f4f6;
  padding: 3px 10px;
  border-radius: 5px;
  border: dashed 1px gray;
  transition: all 0.2s ease;
}

/* actieve state (er is een limiet gekozen) */
.limit.active {
  background: #e4e4e4; /* donker */
  color: #60a5fa; /* blauw */
  border: none;
  font-weight: 600;
}
/* ===================== */
/* BUTTONS */
/* ===================== */

button {
  border: none;
  cursor: pointer;
  font-weight: 600;
  transition: 0.2s ease;
}

.btn {
  background: #2563eb;
  color: white;
  padding: 10px 14px;
  border-radius: 10px;
}

.btn:hover {
  background: #1d4ed8;
}

.btn:disabled {
  background: #93c5fd;
  cursor: not-allowed;
}

/* reset button */
.reset {
  background: #dddddf;
  color: #111827;
}

.reset:hover {
  background: rgb(191, 193, 196);
}

/* ===================== */
/* FOOTER */
/* ===================== */

.filters-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 10px;
}

/* ===================== */
/* RANGE SLIDERS */
/* ===================== */

input[type='range'] {
  width: 100%;
  -webkit-appearance: none;
  height: 6px;
  background: #6b96eb;
  border-radius: 999px;
  outline: none;
}

input[type='range']::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 18px;
  height: 18px;
  background: #2563eb;
  border-radius: 50%;
  border: 3px solid white;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
  cursor: pointer;
}

/* ===================== */
/* RESULT HEADER */
/* ===================== */

.results-header {
  grid-column: 1 / -1;
  display: flex;
  justify-content: space-between;
  align-items: center;

  padding: 12px 16px;
  margin-bottom: 16px;


  border-radius: 12px;

  font-size: 14px;
  color: #374151;
}
.results-header strong {
  background: #2563eb;
  color: white;
  padding: 2px 10px;
  border-radius: 999px;
  font-size: 13px;
}
/* ===================== */
/* RESPONSIVE */
/* ===================== */

@media (max-width: 640px) {
  .wizard-card {
    width: 92%;
    padding: 24px;
  }
}
</style>
