<template>
  <div class="wizard">

    <!-- ===================== -->
    <!-- STEP 1: TYPE -->
    <!-- ===================== -->
    <div v-if="step === 1" class="wizard-card">

  <div class="title">Kies type</div>

  <div v-if="loadingTypes">
    Laden...
  </div>

  <div v-else>

    <select v-model="machineType" class="dropdown">

      <option disabled value="">
  Selecteer een type
</option>

<option
  v-for="type in types"
  :key="type._id"
  :value="type._id"
>
  {{ type.naam }}
</option>

    </select>

  </div>

  <button class="btn" :disabled="!machineType" @click="step = 2">
    Volgende →
  </button>

</div>

    <!-- ===================== -->
    <!-- STEP 2: DATUM -->
    <!-- ===================== -->
    <div v-else-if="step === 2" class="wizard-card">

      <div class="title">Kies periode</div>

      <label>Startdatum</label>
      <input type="date" v-model="beginDatum" />

      <label>Einddatum</label>
      <input type="date" v-model="eindDatum" />

      <div class="footer">

        <button class="btn reset" @click="step = 1">
          ← terug
        </button>

        <button
          class="btn"
          :disabled="!beginDatum || !eindDatum"
          @click="loadAvailability"
        >
          Zoek →
        </button>

      </div>

    </div>

    <!-- ===================== -->
    <!-- STEP 3: RESULTAAT -->
    <!-- ===================== -->
    <div v-else class="wizard-card">

      <div class="title">Beschikbaarheid</div>

      <div v-if="loading">
        Laden...
      </div>

      <div v-else-if="!data">
        Geen data beschikbaar
      </div>

      <div v-else class="result-box">

        <div class="row">
          <span>Totaal</span>
          <strong>{{ data.totaalToestellen }}</strong>
        </div>

        <div class="row">
          <span>Bezet</span>
          <strong>{{ data.overlappendeBoekingen }}</strong>
        </div>

        <div class="row highlight">
          <span>Vrij</span>
          <strong>{{ data.beschikbaar }}</strong>
        </div>

      </div>

      <div class="footer">

        <button class="btn reset" @click="step = 2">
          ← terug
        </button>

        <button class="btn" @click="reset">
          opnieuw
        </button>

      </div>

    </div>

  </div>
</template>
<script setup>
import { ref, onMounted, computed } from "vue"
import { useBoekingenStore } from "@/stores/renting/boekingen.store"
import { boekingApi } from "@/api/boeking"

const store = useBoekingenStore()

const step = ref(1)
const machineType = ref(null)

const beginDatum = ref(null)
const eindDatum = ref(null)

const data = ref(null)
const loading = ref(false)

/* ✅ TYPES UIT STORE */
const types = computed(() => store.types)
const loadingTypes = ref(false)

/* ===================== */
/* LOAD TYPES VIA STORE */
/* ===================== */
onMounted(async () => {
  loadingTypes.value = true

  await store.loadTypes()

  loadingTypes.value = false
})

/* ===================== */
/* STEP 3 */
/* ===================== */
const loadAvailability = async () => {
  loading.value = true
  step.value = 3

  try {
    const res = await boekingApi.beschikbareToestellen({
      beginDatum: beginDatum.value,
      eindDatum: eindDatum.value,
      toestelType: machineType.value,
    })

    data.value = res
  } catch (err) {
    console.error(err)
    data.value = null
  }
  loading.value = false
}

/* RESET */
const reset = () => {
  step.value = 1
  machineType.value = null
  beginDatum.value = null
  eindDatum.value = null
  data.value = null
}
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
.dropdown {
  width: 100%;
  padding: 10px 12px;
  border-radius: 10px;
  border: 1px solid #d1d5db;
  font-size: 14px;
  outline: none;
  background: white;
  cursor: pointer;
}

.dropdown:focus {
  border-color: #2563eb;
  box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.2);
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
