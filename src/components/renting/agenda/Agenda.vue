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
          :picker-options="pickerOptions"
        />
        <label>
          Type:
          <select v-model="selectedType">
            <option value="">Alle types</option>
            <option v-for="type in types" :key="type._id" :value="type">
              {{ type.naam }}
            </option>
          </select>
        </label>
      </div>

      <button class="btn btn-primary" @click="$emit('addBoeking')">
        <i class="fa fa-plus"></i> Add
      </button>
    </div>

    <!-- HEADER -->
    <div class="header-row">
      <div class="corner-cell">Toestel</div>
      <div v-for="dag in dagen" :key="dag" class="header-cell">
        {{ formatDatum(dag) }}
      </div>
    </div>

    <!-- RIJ PER TOESTEL -->
    <div v-if="!heeftBoekingen" class="geen-boekingen">Geen boekingen deze periode</div>

    <div v-else class="toestellen-wrapper">
      <div v-for="toestel in gefilterdeToestellen" :key="toestel._id" class="toestel-row">
        <div class="toestel-cell">
          {{ toestel.Ref || 'Toestel nog niet toegewezen' }}
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
            <div class="boeking-title">{{boek.leverAdresDetails?.naam }}</div>
            -
            {{boek.beginDatumFormatted }} - {{ boek.eindDatumFormatted }}
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

/* ----------------------------- PROPS ----------------------------- */
const props = defineProps({
  boekingen: { type: Array, default: () => [] }, // 👈 VAN PARENT
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
const heeftBoekingen = computed(() => {
  return gefilterdeToestellen.value.some((toestel) => boekingenVoorToestel(toestel._id).length > 0)
})
const emit = defineEmits(['openBoeking', 'addBoeking'])

/* ----------------------------- DATA ----------------------------- */
const toestellen = ref([])
const dagen = ref([])
const selectedType = ref('')
const types = ref([])

const startDatum = ref(props.initialStart)
const eindDatum = ref(props.initialEnd)
const dateRange = ref([startDatum.value, eindDatum.value])

/* ----------------------------- DATEPICKER ----------------------------- */
const pickerOptions = {
  disabledDate(date) {
    if (!dateRange.value || !dateRange.value[0]) return false
    const start = new Date(dateRange.value[0])
    const maxDate = new Date(start)
    maxDate.setDate(maxDate.getDate() + 30)
    return date > maxDate
  },
}

watch(dateRange, (newRange) => {
  if (!newRange || newRange.length !== 2) return
  startDatum.value = newRange[0]
  eindDatum.value = newRange[1]
  updateDagen()
})

function formatDatum(datum) {
  const d = new Date(datum)
  return d.getDate() + '/' + (d.getMonth() + 1)
}

/* ----------------------------- TYPES ----------------------------- */
async function getTypes() {
  try {
    const response = await toestelApi.getTypes()
    types.value = response.types || []
  } catch (err) {
    console.log(err)
  }
}

/* ----------------------------- TOESTELLEN AFLEIDEN VAN BOEKINGEN ----------------------------- */
const toestellenFromBoekingen = computed(() => {
  const map = new Map()

  props.boekingen.forEach((b) => {
    if (!b.toestel) return

    const boekStart = new Date(b.beginDatum)
    const boekEind = new Date(b.eindDatum)

    // alleen boekingen die overlappen met geselecteerde periode
    const overlapt = boekStart <= eindDatum.value && boekEind >= startDatum.value

    if (overlapt) {
      map.set(b.toestel._id, b.toestel)
    }
  })

  return Array.from(map.values())
})

watch(
  toestellenFromBoekingen,
  (val) => {
    toestellen.value = val
  },
  { immediate: true },
)

/* ----------------------------- DAGEN ----------------------------- */
function updateDagen() {
  const start = new Date(startDatum.value)
  const eind = new Date(eindDatum.value)
  dagen.value = []
  for (let d = new Date(start); d <= eind; d.setDate(d.getDate() + 1)) {
    dagen.value.push(new Date(d).toISOString().slice(0, 10))
  }
}

/* ----------------------------- FILTER ----------------------------- */
function boekingenVoorToestel(toestelId) {
  return props.boekingen.filter((b) => {
    if (!b.toestel) return false
    if (b.toestel._id !== toestelId) return false
    const boekStart = new Date(b.beginDatum)
    const boekEind = new Date(b.eindDatum)
    return boekStart <= eindDatum.value && boekEind >= startDatum.value
  })
}

const gefilterdeToestellen = computed(() => {
  if (!selectedType.value) return toestellen.value
  return toestellen.value.filter((t) => t.type?._id === selectedType.value._id)
})

function dagIndex(dag) {
  return dagen.value.findIndex((d) => d === dag)
}

function boekStijl(boek) {
  const start = new Date(Math.max(new Date(boek.beginDatum), startDatum.value))
  const eind = new Date(Math.min(new Date(boek.eindDatum), eindDatum.value))
  const startStr = start.toISOString().slice(0, 10)
  const eindStr = eind.toISOString().slice(0, 10)
  const startIdx = dagIndex(startStr)
  const eindIdx = dagIndex(eindStr)
  if (startIdx === -1 || eindIdx === -1) return { display: 'none' }

  const width = eindIdx - startIdx + 1

  return {
    left: (startIdx * 100) / dagen.value.length + '%',
    width: (width * 100) / dagen.value.length + '%',
  }
}

/* ----------------------------- INIT ----------------------------- */
onMounted(() => {
  updateDagen()
  getTypes()
})
</script>
<style scoped>
.geen-boekingen {
  padding: 40px;
  text-align: center;
  font-size: 16px;
  color: #6b7280;
  background: #f9fafb;
  border: 1px dashed #d1d5db;
  border-radius: 8px;
}
.agenda-container {
  font-family: Arial, sans-serif;
  overflow-x: auto;
  padding-top: 1rem;
}
.agenda-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  flex-wrap: wrap;
}
.datepickers {
  display: flex;
  gap: 1rem;
  align-items: center;
  flex-wrap: wrap;
}
.header-row {
  display: flex;
  min-width: 800px;
}
.boeking-title{
  font-weight:800;
  display: inline;
}
.corner-cell {
  width: 180px;
  font-weight: bold;
  padding: 10px;
  background: #f3f4f6;
}
.header-cell {
  flex: 1;
  text-align: center;
  padding: 10px;
  background: #dbeafe;
  border: 1px solid #bfdbfe;
  font-size: 14px;
}
.toestel-row {
  display: flex;
  position: relative;
  min-height: 50px;
  border-bottom: 1px solid black;
  min-width: 800px;
}
.toestel-cell {
  width: 180px;
  padding: 10px;
  background: #f9fafb;
  font-weight: bold;
  border-right: 1px solid black;
}
.dagen-container {
  flex: 1;
  position: relative;
}
.boek-block {
  position: absolute;
  top: 8px;
  height: 34px;
  border-radius: 6px;
  color: black;
  padding: 6px 8px;
  font-size: 12px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  box-sizing: border-box;
  cursor: pointer;
  border: 1px solid rgb(110, 110, 110);
}
.boek-block.Aangevraagd {
  background-color: #fef3c7;
  color: #92400e;
}
.boek-block.Bevestigd {
  background: #dbeafe;
  color: #1e3a8a;
}
.boek-block.Leveren {
  background: #fde68a;
  color: #78350f;
}
.boek-block.Geleverd {
  background: #d1fae5;
  color: #065f46;
}

select {
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 14px;
  width: 70%;
  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease;
}

select:focus {
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.2);
  outline: none;
}
/* MOBILE */
@media (max-width: 768px) {
  .corner-cell,
  .toestel-cell {
    width: 120px;
    font-size: 12px;
  }
  .header-cell {
    font-size: 12px;
    padding: 6px;
  }
  .boek-block {
    font-size: 10px;
  }
}
.datepickers select {
  padding: 4px 6px;
}
</style>
