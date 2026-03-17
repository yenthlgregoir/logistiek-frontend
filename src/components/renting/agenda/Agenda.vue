<template>
  <div class="agenda-container">
    <!-- DATUM SELECTIE -->
    <div class="agenda-toolbar">
      <div class="datepickers">
        <el-date-picker
          v-model="dateRange"
          type="daterange"
          start-placeholder="Startdatum"
          end-placeholder="Einddatum"
          format="YYYY-MM-DD"
          value-format="YYYY-MM-DD"
          :picker-options="pickerOptions"
          @change="updateDateRange"
        />

        <label class="type-filter">
  <span>Type</span>
  <select v-model="selectedType">
    <option value="">Alle types</option>
    <option v-for="type in types" :key="type._id" :value="type">
      {{ type.naam }}
    </option>
  </select>
</label>
      </div>

      <div class="right">
        <button class="btn btn-primary" @click="$emit('addBoeking')">
          <i class="fa fa-plus"></i> Add
        </button>
      </div>
    </div>

    <!-- HEADER -->
    <div class="header-row">
      <div class="corner-cell">Toestel</div>
      <div v-for="dag in dagen" :key="dag" class="header-cell">
        {{ formatDatum(dag) }}
      </div>
    </div>

    <!-- GEEN BOEKINGEN -->
    <div v-if="!heeftBoekingen" class="geen-boekingen">
      Geen boekingen deze periode
    </div>

    <!-- RIJEN -->
    <div v-else class="toestellen-wrapper">
      <div
        v-for="toestel in gefilterdeToestellen"
        :key="toestel._id"
        class="toestel-row"
      >
        <div class="toestel-cell">
          {{ toestel.Ref }}
          <div class="type-toestel">
            {{ toestel.type?.naam }}
          </div>
        </div>

        <div class="dagen-container">
          <div
            v-for="boek in boekingenVoorToestel(toestel._id)"
            :key="boek._id"
            class="boek-block"
            :class="boek.status"
            :style="boekStijl(boek)"
            @click="$emit('openBoeking', boek._id)"
          >
            <div class="boeking-title">
              {{
                boek.leverAdresDetails?.naam ||
                boek.klant?.naam ||
                'Onbekende klant'
              }}
            </div>
            {{ boek.beginDatumFormatted }} - {{ boek.eindDatumFormatted }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { toestelApi } from '@/api/toestel'
import 'element-plus/dist/index.css'
import { ElDatePicker } from 'element-plus'

/* ---------------- PROPS ---------------- */
const props = defineProps({
  boekingen: { type: Array, default: () => [] },
  initialStart: { type: Date, default: () => new Date() },
  initialEnd: {
    type: Date,
    default: () => {
      const d = new Date()
      d.setDate(d.getDate() + 7)
      return d
    },
  },
})

/* ---------------- EMITS ---------------- */
const emit = defineEmits([
  'openBoeking',
  'addBoeking',
  'export-pdf',
  'update:startDatum',
  'update:eindDatum',
])

/* ---------------- DATA ---------------- */
const MAX_RANGE_DAYS = 20

const startDatum = ref(props.initialStart)
const eindDatum = ref(props.initialEnd)

const dateRange = ref([
  startDatum.value.toISOString().slice(0, 10),
  eindDatum.value.toISOString().slice(0, 10),
])

const dagen = ref([])
const selectedType = ref('')
const types = ref([])
const toestellen = ref([])
function formatDatum(datum) {
  const d = new Date(datum)
  return d.getDate() + '/' + (d.getMonth() + 1)
}
/* ---------------- DATE PICKER ---------------- */
const pickerOptions = {
  disabledDate(date) {
    if (!dateRange.value) return false
    const [start, end] = dateRange.value

    // Start gekozen → eind mag max 30 dagen verder
    if (start && !end) {
      const maxEnd = new Date(start)
      maxEnd.setDate(maxEnd.getDate() + MAX_RANGE_DAYS)
      return date > maxEnd
    }

    // Eind gekozen → start mag max 30 dagen eerder
    if (!start && end) {
      const minStart = new Date(end)
      minStart.setDate(minStart.getDate() - MAX_RANGE_DAYS)
      return date < minStart
    }

    // Beide gekozen → range moet <= MAX_RANGE_DAYS
    if (start && end) {
      const maxEnd = new Date(start)
      maxEnd.setDate(maxEnd.getDate() + MAX_RANGE_DAYS)
      const minStart = new Date(end)
      minStart.setDate(minStart.getDate() - MAX_RANGE_DAYS)
      return date < minStart || date > maxEnd
    }

    return false
  },
}

function updateDateRange(val) {
  if (!val || val.length !== 2) return

  let [start, end] = val.map(d => new Date(d))

  // Zorg dat max-range niet overschreden wordt
  const diffTime = end - start
  const diffDays = diffTime / (1000 * 60 * 60 * 24)
  if (diffDays > MAX_RANGE_DAYS) {
    end = new Date(start)
    end.setDate(end.getDate() + MAX_RANGE_DAYS)
  }

  startDatum.value = start
  eindDatum.value = end

  dateRange.value = [
    startDatum.value.toISOString().slice(0, 10),
    eindDatum.value.toISOString().slice(0, 10),
  ]

  emit('update:startDatum', dateRange.value[0])
  emit('update:eindDatum', dateRange.value[1])

  updateDagen()
}

/* ---------------- DAGEN ---------------- */
function updateDagen() {
  const start = new Date(startDatum.value)
  const eind = new Date(eindDatum.value)

  dagen.value = []
  for (let d = new Date(start); d <= eind; d.setDate(d.getDate() + 1)) {
    dagen.value.push(new Date(d).toISOString().slice(0, 10))
  }
}

/* ---------------- TYPES ---------------- */
async function getTypes() {
  try {
    const response = await toestelApi.getTypes()
    types.value = response.types || []
  } catch (err) {
    console.log(err)
  }
}

/* ---------------- TOESTELLEN ---------------- */
const toestellenFromBoekingen = computed(() => {
  const map = new Map()
  props.boekingen.forEach(b => {
    if (!b.toestel) return
    const boekStart = new Date(b.beginDatum)
    const boekEind = new Date(b.eindDatum)
    if (boekStart <= eindDatum.value && boekEind >= startDatum.value) {
      map.set(b.toestel._id, b.toestel)
    }
  })
  return Array.from(map.values())
})

watch(toestellenFromBoekingen, val => (toestellen.value = val), { immediate: true })

const gefilterdeToestellen = computed(() => {
  if (!selectedType.value) return toestellen.value
  return toestellen.value.filter(t => t.type?._id === selectedType.value._id)
})

function boekingenVoorToestel(toestelId) {
  return props.boekingen.filter(b => {
    if (!b.toestel) return false
    if (b.toestel._id !== toestelId) return false
    const boekStart = new Date(b.beginDatum)
    const boekEind = new Date(b.eindDatum)
    return boekStart <= eindDatum.value && boekEind >= startDatum.value
  })
}

/* ---------------- BOEKING POSITIE ---------------- */
function boekStijl(boek) {
  const format = d => d.toISOString().slice(0, 10)
  const start = new Date(Math.max(new Date(boek.beginDatum), startDatum.value))
  const eind = new Date(Math.min(new Date(boek.eindDatum), eindDatum.value))
  const startStr = format(start)
  const eindStr = format(eind)
  const startIdx = dagen.value.findIndex(d => d === startStr)
  const eindIdx = dagen.value.findIndex(d => d === eindStr)
  if (startIdx === -1 || eindIdx === -1) return { display: 'none' }
  const width = eindIdx - startIdx + 1
  return {
    left: `${(startIdx * 100) / dagen.value.length}%`,
    width: `${(width * 100) / dagen.value.length}%`,
  }
}

/* ---------------- COMPUTED ---------------- */
const heeftBoekingen = computed(() =>
  gefilterdeToestellen.value.some(t => boekingenVoorToestel(t._id).length > 0)
)

/* ---------------- INIT ---------------- */
onMounted(() => {
  updateDagen()
  getTypes()
})
</script>
<style scoped>
/* ===== CONTAINER ===== */
/* ===== CONTAINER FULL WIDTH ===== */
.agenda-container {
  width: 100%;
  font-family: 'Inter', sans-serif;
}

/* ===== TOOLBAR ===== */
.agenda-toolbar {
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.4rem;
  padding: 1rem;
  background: rgba(255,255,255,0.85);
  border-radius: 14px;
  box-shadow: 0 6px 16px rgba(0,0,60,0.08);
  backdrop-filter: blur(10px);
}

.filters {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.datepicker {
  min-width: 250px;
}

.type-select {
  padding: 10px 14px;
  border-radius: 10px;
  border: 1px solid #d1d5db;
  font-size: 14px;
  background: white;
  transition: 0.3s ease;
}

/* ADD BUTTON */
.add-btn {
  background: #4f73ff;
  color: white;
  padding: 10px 18px;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  font-weight: 600;
  transition: 0.25s ease;
}

/* ===== HEADER FULL WIDTH ===== */
.header-row {
  width: 100%;
  display: flex;
  background: rgba(255,255,255,0.7);
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 10px rgba(0,0,0,0.08);
}

.corner-cell {
  width: 200px;
  flex-shrink: 0;
  font-weight: 700;
  padding: 12px;
  background: #f3f4f6;
  border-right: 1px solid #e5e7eb;
  text-align: center;
}

.header-cell {
  flex: 1;
  text-align: center;
  padding: 12px;
  background: #e4edff;
  color: #1e3a8a;
  font-weight: 600;
  border-right: 1px solid #cbd5e1;
}

/* ===== NO BOOKINGS ===== */
.geen-boekingen {
  width: 100%;
  margin-top: 1.6rem;
  padding: 2rem;
  text-align: center;
  background: rgba(255,255,255,0.8);
  border-radius: 12px;
  border: 2px dashed #cbd5e1;
  color: #6b7280;
  font-size: 16px;
}

/* ===== DEVICE ROWS FULL WIDTH ===== */
.toestellen-wrapper {
  width: 100%;
  margin-top: 0.8rem;
}

.toestel-row {
  width: 100%;
  display: flex;
  position: relative;
  min-height: 55px;
  margin-bottom: 12px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0,0,50,0.05);
  overflow: hidden;
}

/* DEVICE LABEL LEFT FIXED WIDTH */
.toestel-cell {
  width: 200px;
  flex-shrink: 0;
  padding: 12px;
  background: #f8fafc;
  border-right: 1px solid #e5e7eb;
}

/* TIMELINE TAKES FULL REMAINING WIDTH */
.dagen-container {
  flex: 1;
  position: relative;
}

/* ===== BOOKING BLOCKS ===== */
.boek-block {
  position: absolute;
  top: 6px;
  height: 40px;
  padding: 8px 10px;
  border-radius: 10px;
  border: 1px solid rgba(0,0,0,0.1);
  cursor: pointer;
  font-size: 13px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  transition: 0.2s ease;
}

.boek-block:hover {
  transform: translateY(-3px);
  box-shadow: 0 6px 18px rgba(0,0,0,0.12);
}

/* STATUS COLORS */
.boek-block.Aangevraagd { background: #fef7c3; color: #854d0e; }
.boek-block.Bevestigd   { background: #dbeafe; color: #1e3a8a; }
.boek-block.Leveren     { background: #fdecc8; color: #78350f; }
.boek-block.Geleverd,
.boek-block.Opgehaald,
.boek-block.Afgewerkt   { background: #d1fae5; color: #065f46; }

.boeking-title {
  font-weight: 700;
  font-size: 13px;
}

.datum-range {
  font-size: 11px;
  color: #374151;
}
.type-filter {
  display: inline-block;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #374151;
  margin-left: 10px;
}

/* label tekst */
.type-filter span {
  font-weight: 600;
}

/* select */
.type-filter select {
  padding: 6px 10px;
  border-radius: 8px;
  border: 1px solid #d1d5db;
  background: white;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s ease;
  margin-left: 10px;
}

/* hover */
.type-filter select:hover {
  border-color: #9ca3af;
}

/* focus */
.type-filter select:focus {
  outline: none;
  border-color: #4f73ff;
  box-shadow: 0 0 0 2px rgba(79, 115, 255, 0.2);
}
</style>
