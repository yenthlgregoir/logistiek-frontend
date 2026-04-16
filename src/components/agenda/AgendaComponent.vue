<template>
  <div class="agenda-container">

    <!-- TOOLBAR -->
    <div class="agenda-toolbar">
        <div class="left">
    <div class="datepicker">
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
    </div>
      

      <select v-if="typeOptions?.length" v-model="selectedType" class="type-select">
        <option value="">Alle types</option>
        <option v-for="type in typeOptions" :key="type._id" :value="type">
          {{ type.naam }}
        </option>
      </select>

        </div>
        
      <button class="add-btn" @click="$emit('addBoeking')">+ Toevoegen</button>
    </div>

    <!-- HEADER -->
    <div class="header-row">
      <div class="corner-cell">{{ itemLabel }}</div>
      <div v-for="dag in days" :key="dag" class="header-cell">{{ formatDateAgenda(dag) }}</div>
    </div>

    <!-- GEEN BOEKINGEN -->
    <div v-if="!hasBookings" class="geen-boekingen">
      Geen boekingen in deze periode
    </div>

    <!-- RIJEN -->
    <div v-else class="rows">
      <div v-for="item in filteredItems" :key="getItemId(item)" class="row">
        <div class="label">{{ item.Ref || item.nummer ||'Onbekend' }} <br/> {{ item.type?.naam || '' }} </div>
        
        <div class="timeline">
          <div
            v-for="booking in bookingsForItem(item)"
            :key="booking._id"
            class="boek-block"
            :class="booking.status"
            :style="getBlockStyle(booking)"
            @click="$emit('openBoeking', booking._id)"
          >
            <strong class="boeking-title">{{ getBookingTitle(booking) }}</strong>
<small class="datum-range">
  {{ formatDate(getBookingStart(booking)) }}
  <span v-if="getBookingEnd(booking) && (booking.ophaalDatum || booking.eindDatum)">
    - {{ formatDate(getBookingEnd(booking)) }}
  </span>
  <span v-else>
    - nog geen ophaaldatum
  </span>
</small>          </div>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'

const props = defineProps({
  items: Array,
  bookings: Array,
  typeOptions: Array,
  itemLabel: { type: String, default: 'Item' },
  getItemId: Function,
  getBookingStart: Function,
  getBookingEnd: Function,
  getBookingTitle: Function,
  maxDays: { type: Number, default: 20 }
})

const emit = defineEmits(['addBoeking', 'openBoeking', 'filterType'])

const startDate = ref(new Date())
const endDate = ref(new Date(new Date().setDate(new Date().getDate() + 7)))
const dateRange = ref([startDate.value.toISOString().slice(0,10), endDate.value.toISOString().slice(0,10)])
const days = ref([])
const selectedType = ref('')

const pickerOptions = {
  disabledDate(time) {
    return time.getTime() < new Date().getTime() - 86400000
  }
}

onMounted(() => generateDays())
watch(selectedType, val => emit('filterType', val))

const filteredItems = computed(() => props.items || [])

const hasBookings = computed(() => {
  return filteredItems.value.some(item => bookingsForItem(item).length > 0)
})

function generateDays() {
  days.value = []
  const d = new Date(startDate.value)
  while(d <= endDate.value) {
    days.value.push(d.toISOString().slice(0,10))
    d.setDate(d.getDate() +1)
  }
}

function onDateChange(val) {
  if (!val || val.length !==2) return
  let [s,e] = val.map(d => new Date(d))

  if ((e-s)/86400000 > props.maxDays) {
    e = new Date(s)
    e.setDate(s.getDate() + props.maxDays)
  }

  startDate.value = s
  endDate.value = e
  dateRange.value = [s.toISOString().slice(0,10), e.toISOString().slice(0,10)]
  generateDays()
}

function bookingsForItem(item) {
  if (!props.bookings) return []

  const id = props.getItemId(item)

  return props.bookings.filter(b => {
    const bs = new Date(props.getBookingStart(b))

    const rawEnd = props.getBookingEnd(b)

    // 🔥 FIX: geen einddatum = open einde
    const be = rawEnd ? new Date(rawEnd) : new Date(8640000000000000)

    return (
      bs <= endDate.value &&
      be >= startDate.value &&
      props.getItemId(b.item || b.asset || b.toestel || item) === id
    )
  })
}
function getBlockStyle(booking) {
  console.log(booking)
  const start = new Date(Math.max(new Date(props.getBookingStart(booking)), startDate.value))

  const rawEnd = props.getBookingEnd(booking)

  const end = rawEnd
    ? new Date(Math.min(new Date(rawEnd), endDate.value))
    : new Date(endDate.value)

  const startStr = start.toISOString().slice(0, 10)
  const endStr = end.toISOString().slice(0, 10)

  let startIdx = days.value.indexOf(startStr)
  let endIdx = days.value.indexOf(endStr)

  if (startIdx === -1) startIdx = 0
  if (endIdx === -1) endIdx = days.value.length - 1

  const width = endIdx - startIdx + 1

  return {
    left: `${(startIdx * 100) / days.value.length}%`,
    width: `${(width * 100) / days.value.length}%`,
  }
}

function formatDateAgenda(d) {
  const dt = new Date(d)
  return `${dt.getDate()}/${dt.getMonth()+1}`
}
function formatDate(d) {
  const dt = new Date(d)
  return `${dt.getDate()}/${dt.getMonth()+1}/${dt.getFullYear()}`
}
</script>

<style scoped>
.agenda-container { width: 100%; font-family: 'Inter', sans-serif; }
.agenda-toolbar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
.datepicker{margin-right: 1rem;}
.left{display: flex;}
.type-select { padding: 6px 10px; border-radius: 8px; border: 1px solid #d1d5db; background: white; cursor: pointer; }
.add-btn { background: #4f73ff; color: white; padding: 10px 18px; border: none; border-radius: 12px; cursor: pointer; }
.header-row { display: flex; background: #e4edff; border-radius: 12px; overflow: hidden; }
.corner-cell { width: 200px; font-weight: 700; padding: 12px; background: #f3f4f6; border-right: 1px solid #e5e7eb; text-align:center; }
.header-cell { flex:1; text-align:center; padding:12px; font-weight:600; border-right:1px solid #cbd5e1; }
.geen-boekingen { padding: 2rem; text-align:center; background: #f8fafc; border-radius:12px; border:2px dashed #cbd5e1; color:#6b7280; font-size:16px; margin-top:1rem; }
.rows { margin-top: 1rem; width:100%; }
.row { display:flex; margin-bottom:12px; border-radius:12px; background:white; overflow:hidden; position:relative; min-height:55px; box-shadow:0 2px 10px rgba(0,0,50,0.05); }
.label { width:200px; padding:12px; background:#f8fafc; border-right:1px solid #e5e7eb; }
.timeline { flex:1; position:relative; }
.boek-block { position:absolute; top:6px; height:40px; padding:8px 10px; border-radius:10px; background:#4f73ff; color:white; cursor:pointer; display:flex; flex-direction:column; justify-content:center; transition:0.2s ease; }
.boek-block:hover { transform:translateY(-3px); box-shadow:0 6px 18px rgba(0,0,0,0.12); }
.boeking-title { font-weight:700; font-size:13px; }
.datum-range { font-size:11px; opacity:0.9; }


.boek-block.Aangevraagd {
  background: #fef7c3;
  color: #854d0e;
}
.boek-block.Bevestigd {
  background: #dbeafe;
  color: #1e3a8a;
}
.boek-block.Leveren {
  background: #fdecc8;
  color: #78350f;
}
.boek-block.Geleverd,
.boek-block.Opgehaald,
.boek-block.Afgewerkt {
  background: #d1fae5;
  color: #065f46;
}
</style>