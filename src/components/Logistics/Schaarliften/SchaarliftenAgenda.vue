<template>
  <div class="agenda-container">
    <h1>Planning Assets</h1>

    <!-- TOOLBAR -->
    <div class="agenda-toolbar">
      <div class="filters">
        <el-date-picker
          v-model="dateRange"
          type="daterange"
          start-placeholder="Startdatum"
          end-placeholder="Einddatum"
          format="YYYY-MM-DD"
          value-format="YYYY-MM-DD"
          :picker-options="pickerOptions"
          @change="onDateChange"
        />

        <select v-model="selectedType" class="type-select">
          <option value="">Alle types</option>
          <option v-for="type in types" :key="type._id" :value="type._id">
            {{ type.naam }}
          </option>
        </select>
      </div>

      <button class="add-btn" @click="$emit('addBoeking')">+ Toevoegen</button>
    </div>

    <!-- HEADER -->
    <div class="header-row">
      <div class="corner-cell">Asset</div>
      <div v-for="dag in dagen" :key="dag" class="header-cell">
        {{ formatDatum(dag) }}
      </div>
    </div>

    <!-- GEEN DATA -->
    <div v-if="!heeftBoekingen" class="geen-boekingen">Geen boekingen in deze periode</div>

    <!-- RIJEN -->
    <div v-else class="rows">
      <div v-for="asset in gefilterdeAssets" :key="getAssetId(asset)" class="row">
        <div class="label">
          {{ asset?.nummer || asset?.naam || 'Onbekend' }}
        </div>

        <div class="timeline">
          <div
            v-for="boek in boekingenPerAsset(getAssetId(asset))"
            :key="boek._id"
            class="boek-block"
            :class="boek.status"
            :style="getBlokStyle(boek)"
            @click="$emit('openBoeking', boek._id)"
          >
            <strong class="boeking-title">
              {{ boek.reference || 'Onbekend' }}
            </strong>
            <small class="datum-range">
              {{ boek.beginDatumFormatted }} - {{ boek.eindDatumFormatted }}
            </small>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { ElDatePicker } from 'element-plus'

const props = defineProps({
  boekingen: Array,
  types: Array,
})

const emit = defineEmits(['openBoeking', 'addBoeking', 'filterType'])

const MAX_DAYS = 20

const start = ref(new Date())
const end = ref(new Date(new Date().setDate(new Date().getDate() + 7)))

const dateRange = ref([
  start.value.toISOString().slice(0, 10),
  end.value.toISOString().slice(0, 10),
])

const dagen = ref([])
const selectedType = ref('')

onMounted(() => generateDays())

watch(selectedType, (val) => {
  emit('filterType', val)
})

// 🔥 Helper (BELANGRIJK)
const getAssetId = (asset) => (typeof asset === 'string' ? asset : asset?._id)

// 📅 dagen genereren
function generateDays() {
  dagen.value = []
  const d = new Date(start.value)
  while (d <= end.value) {
    dagen.value.push(d.toISOString().slice(0, 10))
    d.setDate(d.getDate() + 1)
  }
}

// 📅 datum wijzigen
function onDateChange(val) {
  if (!val) return
  let [s, e] = val.map((d) => new Date(d))

  if ((e - s) / 86400000 > MAX_DAYS) {
    e = new Date(s)
    e.setDate(s.getDate() + MAX_DAYS)
  }

  start.value = s
  end.value = e
  generateDays()
}

// ✅ Assets bepalen
const gefilterdeAssets = computed(() => {
  const map = new Map()

  props.boekingen.forEach((b) => {
    const assetId = getAssetId(b.asset)
    if (!assetId) return

    const bs = new Date(b.leverDatum)
    const be = b.ophaalDatum ? new Date(b.ophaalDatum) : end.value

    if (bs <= end.value && be >= start.value) {
      map.set(assetId, b.asset)
    }
  })

  return Array.from(map.values())
})

// ✅ Boekingen per asset
function boekingenPerAsset(assetId) {
  return props.boekingen
    .filter((b) => getAssetId(b.asset) === assetId)
    .filter((b) => {
      const bs = new Date(b.leverDatum)
      const be = b.ophaalDatum ? new Date(b.ophaalDatum) : end.value
      return bs <= end.value && be >= start.value
    })
    .map((b) => ({
      ...b,
      beginDatumFormatted: formatDatum(b.leverDatum),
      eindDatumFormatted: b.ophaalDatum ? formatDatum(b.ophaalDatum) : 'nog geen ophaaldatum',
    }))
}

// ✅ Blok positie
function getBlokStyle(boek) {
  const boekStart = new Date(boek.leverDatum)
  const boekEind = boek.ophaalDatum ? new Date(boek.ophaalDatum) : end.value

  const visibleStart = new Date(Math.max(boekStart, start.value))
  const visibleEnd = new Date(Math.min(boekEind, end.value))

  const startStr = visibleStart.toISOString().slice(0, 10)
  const endStr = visibleEnd.toISOString().slice(0, 10)

  let startIdx = dagen.value.indexOf(startStr)
  let endIdx = dagen.value.indexOf(endStr)

  if (startIdx === -1) startIdx = 0
  if (endIdx === -1) endIdx = dagen.value.length - 1

  const width = endIdx - startIdx + 1

  return {
    left: `${(startIdx * 100) / dagen.value.length}%`,
    width: `${(width * 100) / dagen.value.length}%`,
  }
}

// 📅 formatter
function formatDatum(d) {
  const dt = new Date(d)
  return `${dt.getDate()}/${dt.getMonth() + 1}`
}

const heeftBoekingen = computed(() => gefilterdeAssets.value.length > 0)

const pickerOptions = {
  disabledDate(date) {
    if (!dateRange.value) return false
    const [s] = dateRange.value
    if (!s) return false

    const max = new Date(s)
    max.setDate(max.getDate() + MAX_DAYS)

    return date > max
  },
}
</script>
<style scoped>
.agenda-container {
  width: 100%;
  font-family: 'Inter', sans-serif;
}

.agenda-toolbar {
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.4rem;
}

.filters {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.type-select {
  padding: 10px 14px;
  border-radius: 10px;
  border: 1px solid #d1d5db;
  font-size: 14px;
  background: white;
}

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

.header-row {
  width: 100%;
  display: flex;
  background: rgba(255, 255, 255, 0.7);
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.08);
}

.corner-cell {
  width: 200px;
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
  color: #374151;
  font-weight: 600;
  border-right: 1px solid #cbd5e1;
}

.geen-boekingen {
  width: 100%;
  margin-top: 1.6rem;
  padding: 2rem;
  text-align: center;
  background: rgba(255, 255, 255, 0.8);
  border-radius: 12px;
  border: 2px dashed #cbd5e1;
  color: #6b7280;
  font-size: 16px;
}

.rows {
  width: 100%;
  margin-top: 1rem;
}

.row {
  width: 100%;
  display: flex;
  margin-bottom: 12px;
  border-radius: 12px;
  background: white;
  overflow: hidden;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.06);
  transition: 0.2s ease;
}

.row:hover {
  box-shadow: 0 6px 22px rgba(0, 0, 0, 0.12);
}

.label {
  width: 200px;
  padding: 12px;
  background: #f8fafc;
  border-right: 1px solid #e5e7eb;
}

.timeline {
  flex: 1;
  position: relative;
  min-height: 55px;
  background: #ffffff;
}

.boek-block {
  position: absolute;
  top: 6px;
  height: 40px;
  padding: 8px 10px;
  border-radius: 10px;
  background: #4f73ff;
  color: white;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  justify-content: center;
  transition: 0.2s ease;
}

.boek-block:hover {
  transform: translateY(-3px);
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.12);
}

.boek-block.Afgewerkt {
  background: #fef7c3;
  color: #854d0e;
}
.boek-block.Opgehaald {
  background: #dbeafe;
  color: #1e3a8a;
}
.boek-block.Leveren {
  background: #fdecc8;
  color: #78350f;
}

.boek-block.Geleverd {
  background: #d1fae5;
  color: #065f46;
}
.boeking-title {
  font-weight: 700;
  font-size: 13px;
}

.datum-range {
  font-size: 11px;
  opacity: 0.9;
}
</style>
