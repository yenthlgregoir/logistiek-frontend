<template>
  <section class="agenda-container" aria-label="Boekingsagenda">
    <header class="agenda-toolbar">
      <div class="toolbar-actions">
        <div class="date-controls">
          <label class="sr-only" :for="pickerId">Periode</label>
          <el-date-picker
            :id="pickerId" v-model="dateRange" type="daterange"
            start-placeholder="Startdatum" end-placeholder="Einddatum"
            format="DD/MM/YYYY" value-format="YYYY-MM-DD"
            range-separator="—" :clearable="false" :disabled-date="allowPastDates ? undefined : isPastDay" unlink-panels
          />
        </div>
        <label v-if="typeOptions?.length" class="type-filter">
          <span class="sr-only">Filter op type</span>
          <select v-model="selectedType"><option value="">Alle types</option><option v-for="type in typeOptions" :key="type._id ?? type.id ?? type.naam" :value="type">{{ type.naam }}</option></select>
        </label>
        <button type="button" class="add-btn" @click="emit('addBoeking')"><span aria-hidden="true">+</span> {{ addLabel }}</button>
      </div>
    </header>

    <p v-if="rangeNotice" class="notice" role="status">{{ rangeNotice }}</p>

    <div class="agenda-scroll" tabindex="0" role="region" aria-label="Planning; horizontaal scrollbaar" :style="gridVariables">
      <div class="agenda-grid">
        <div class="header-row">
          <div class="corner-cell">{{ itemLabel }}</div>
          <div class="day-headings">
            <div v-for="day in days" :key="day.key" class="header-cell" :class="{ weekend: day.weekend, today: day.today }" :aria-current="day.today ? 'date' : undefined">
              <span>{{ day.weekday }}</span><strong>{{ day.label }}</strong><span v-if="day.today" class="today-dot" aria-hidden="true"></span>
            </div>
          </div>
        </div>
        <div v-for="row in rows" :key="row.id" class="agenda-row">
          <div class="item-label"><strong>{{ row.item.Ref || row.item.nummer || 'Onbekend' }}</strong><span>{{ row.item.type?.naam || '' }}</span></div>
          <div class="timeline" :style="{ height: `${row.height}px` }" :aria-label="`Boekingen voor ${row.item.Ref || row.item.nummer || itemLabel}`">
            <div class="day-background" aria-hidden="true"><div v-for="day in days" :key="day.key" :class="{ weekend: day.weekend, today: day.today }"></div></div>
            <button v-for="block in row.blocks" :key="block.key" type="button" class="boek-block" :class="[block.statusClass, { 'continues-before': block.continuesBefore, 'continues-after': block.continuesAfter }]" :style="block.style" :title="block.accessibleLabel" :aria-label="block.accessibleLabel" @click="openBooking(block.booking)">
              <strong>{{ block.title }}</strong><small>{{ block.dateLabel }}</small>
            </button>
          </div>
        </div>
      </div>
    </div>

    <div v-if="rows.length === 0" class="empty-state" role="status"><span aria-hidden="true">▦</span><h3>Geen boekingen in deze periode</h3><p>Kies een andere periode of een ander type, of voeg een boeking toe.</p></div>
    <footer class="agenda-footer"><div class="legend" aria-label="Boekingsstatussen"><span v-for="entry in legend" :key="entry.class"><i :class="entry.class"></i>{{ entry.label }}</span></div><span>Open een boeking voor details</span></footer>
  </section>
</template>

<script setup>
import { computed, getCurrentInstance, onBeforeUnmount, onMounted, ref, watch } from 'vue'

const props = defineProps({
  items: { type: Array, default: () => [] },
  bookings: { type: Array, default: () => [] },
  typeOptions: { type: Array, default: () => [] },
  itemLabel: { type: String, default: 'Item' },
  getItemId: { type: Function, required: true },
  getBookingStart: { type: Function, required: true },
  getBookingEnd: { type: Function, required: true },
  getBookingTitle: { type: Function, required: true },
  // Behoudt het bestaande contract: maximaal maxDays verschil, dus maxDays + 1 kolommen.
  maxDays: { type: Number, default: 20 },
  allowPastDates: { type: Boolean, default: false },
  showEmptyItems: { type: Boolean, default: false },
  addLabel: { type: String, default: 'Toevoegen' },
  openEndedLabel: { type: String, default: 'Zonder ophaaldatum' },
  statusClasses: { type: Object, default: () => ({}) },
  legend: { type: Array, default: () => [
    { class: 'requested', label: 'Aangevraagd' },
    { class: 'confirmed', label: 'Bevestigd' },
    { class: 'delivery', label: 'Leveren' },
    { class: 'completed', label: 'Geleverd / opgehaald / afgewerkt' },
  ] },
})
const emit = defineEmits(['addBoeking', 'openBoeking', 'filterType'])
function openBooking(booking) {
  const id = booking?.id ?? booking?._id
  if (id != null && id !== '') emit('openBoeking', id)
}
const pickerId = `agenda-period-${getCurrentInstance().uid}`
const DAY = 86_400_000
const BLOCK_HEIGHT = 48
const LANE_HEIGHT = 56
const PADDING = 8
const selectedType = ref('')
const rangeNotice = ref('')

// Kalenderdagen als gehele getallen: geen verschuiving door tijdzones of DST.
function calendarDay(value) {
  if (value == null || value === '') return null
  if (typeof value === 'string') {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
    if (match) {
      const [, y, m, d] = match.map(Number)
      const date = new Date(0)
      date.setUTCFullYear(y, m - 1, d)
      date.setUTCHours(0, 0, 0, 0)
      return date.getUTCFullYear() === y && date.getUTCMonth() === m - 1 && date.getUTCDate() === d ? date.getTime() / DAY : null
    }
  }
  if (!(value instanceof Date) && typeof value !== 'string' && typeof value !== 'number') return null
  const date = value instanceof Date ? value : new Date(value)
  if (!Number.isFinite(date.getTime())) return null
  // Tijdstempels volgen de lokale kalenderdag; date-only strings hierboven blijven letterlijk.
  const result = new Date(0)
  result.setUTCFullYear(date.getFullYear(), date.getMonth(), date.getDate())
  result.setUTCHours(0, 0, 0, 0)
  return result.getTime() / DAY
}
function dayKey(day) { return new Date(day * DAY).toISOString().slice(0, 10) }
const dateFormatter = new Intl.DateTimeFormat('nl-BE', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'UTC' })
const weekdayFormatter = new Intl.DateTimeFormat('nl-BE', { weekday: 'short', timeZone: 'UTC' })
const headingFormatter = new Intl.DateTimeFormat('nl-BE', { day: 'numeric', month: 'short', timeZone: 'UTC' })
function displayDay(day) { return dateFormatter.format(new Date(day * DAY)) }
const today = ref(calendarDay(new Date()))
function isPastDay(date) { return calendarDay(date) < today.value }
let midnightTimer
function updateToday() {
  today.value = calendarDay(new Date())
  const next = new Date()
  next.setHours(24, 0, 0, 0)
  midnightTimer = setTimeout(updateToday, Math.max(1000, next.getTime() - Date.now() + 100))
}
onMounted(updateToday)
onBeforeUnmount(() => clearTimeout(midnightTimer))
const dayLimit = computed(() => Number.isFinite(props.maxDays) ? Math.max(0, Math.floor(props.maxDays)) : 20)
function defaultRange() { return [dayKey(today.value), dayKey(today.value + Math.min(7, dayLimit.value))] }
const dateRange = ref(defaultRange())

function normalizeRange(value) {
  const start = Array.isArray(value) ? calendarDay(value[0]) : null
  const end = Array.isArray(value) ? calendarDay(value[1]) : null
  if (start === null || end === null || end < start) {
    dateRange.value = defaultRange()
    rangeNotice.value = 'Ongeldige periode. De standaardperiode is hersteld.'
    return
  }
  const limitedEnd = Math.min(end, start + dayLimit.value)
  const normalized = [dayKey(start), dayKey(limitedEnd)]
  if (value[0] !== normalized[0] || value[1] !== normalized[1]) dateRange.value = normalized
  if (limitedEnd !== end) rangeNotice.value = `De periode is beperkt tot ${dayLimit.value + 1} kalenderdagen.`
}
watch(dateRange, value => { rangeNotice.value = ''; normalizeRange(value) }, { flush: 'sync' })
watch(dayLimit, () => normalizeRange(dateRange.value))
// Zelfde contract als het oorspronkelijke component: object of '' naar de parent.
// De parent filtert props.items; hier niet opnieuw filteren op een aangenomen typevorm.
watch(selectedType, value => emit('filterType', value))

const range = computed(() => ({ start: calendarDay(dateRange.value[0]), end: calendarDay(dateRange.value[1]) }))
const days = computed(() => Array.from({ length: range.value.end - range.value.start + 1 }, (_, index) => {
  const day = range.value.start + index
  const date = new Date(day * DAY)
  return { key: dayKey(day), weekday: weekdayFormatter.format(date), label: headingFormatter.format(date), weekend: [0, 6].includes(date.getUTCDay()), today: day === today.value }
}))
const gridVariables = computed(() => ({ '--days': days.value.length, '--grid-min': `${180 + days.value.length * 78}px` }))
function idKey(value) { return value == null || value === '' ? null : String(value) }
function relationId(value) {
  if (value == null) return null
  return idKey(typeof value === 'object' ? props.getItemId(value) : value)
}
function statusClass(status) {
  const custom = props.statusClasses[String(status ?? '').trim()]
  if (custom) return custom
  switch (String(status ?? '').trim().toLocaleLowerCase('nl')) {
    case 'aangevraagd': return 'requested'
    case 'bevestigd': return 'confirmed'
    case 'leveren': return 'delivery'
    case 'geleverd': case 'opgehaald': case 'afgewerkt': return 'completed'
    default: return 'other'
  }
}

// Parse elke boeking één keer per bronwijziging, onafhankelijk van items of periode.
const parsedBookings = computed(() => {
  const entries = []
  let invalidCount = 0
  for (const [index, booking] of (props.bookings ?? []).entries()) {
    if (!booking) continue
    const start = calendarDay(props.getBookingStart(booking))
    // Bij verhuur is de oorspronkelijke ophaaldatum bepalend.
    // Een callback kan voor de planning een verre vervangdatum gebruiken.
    const rawEnd = Object.prototype.hasOwnProperty.call(booking, 'ophaalDatum')
      ? booking.ophaalDatum
      : props.getBookingEnd(booking)
    const openEnded = rawEnd == null || rawEnd === ''
    const end = openEnded ? Infinity : calendarDay(rawEnd)
    if (start === null || end === null || end < start) { invalidCount++; continue }
    const itemId = relationId(booking.item ?? booking.asset ?? booking.toestel)
    if (itemId === null) continue
    entries.push({ booking, itemId, start, end, openEnded, key: `${booking.id ?? booking._id ?? 'booking'}-${index}` })
  }
  return { entries, invalidCount }
})
const bookingsByItem = computed(() => {
  const index = new Map()
  const { start, end } = range.value
  for (const entry of parsedBookings.value.entries) {
    if (entry.start > end || entry.end < start) continue
    if (!index.has(entry.itemId)) index.set(entry.itemId, [])
    index.get(entry.itemId).push(entry)
  }
  return index
})

// Min-heap: hergebruik de eerst vrijgekomen baan, zonder alle banen te doorzoeken.
function heapPush(heap, value) {
  heap.push(value)
  let i = heap.length - 1
  while (i > 0) {
    const parent = (i - 1) >> 1
    if (heap[parent].end <= value.end) break
    heap[i] = heap[parent]; i = parent
  }
  heap[i] = value
}
function heapPop(heap) {
  const first = heap[0]
  const last = heap.pop()
  if (heap.length) {
    let i = 0
    while (i * 2 + 1 < heap.length) {
      let child = i * 2 + 1
      if (child + 1 < heap.length && heap[child + 1].end < heap[child].end) child++
      if (heap[child].end >= last.end) break
      heap[i] = heap[child]; i = child
    }
    heap[i] = last
  }
  return first
}
function layoutBookings(entries) {
  const heap = []
  let laneCount = 0
  const blocks = [...entries].sort((a, b) => a.start - b.start || a.end - b.end).map(entry => {
    const start = Math.max(entry.start, range.value.start)
    const end = Math.min(entry.end, range.value.end)
    const lane = heap.length && heap[0].end < start ? heapPop(heap).lane : laneCount++
    heapPush(heap, { end, lane })
    const title = String(props.getBookingTitle(entry.booking) || 'Boeking')
    const dateLabel = `${displayDay(entry.start)} — ${entry.openEnded ? (entry.booking.openEndedLabel || props.openEndedLabel) : displayDay(entry.end)}`
    const status = String(entry.booking.status ?? '').trim()
    return {
      ...entry, title, dateLabel, statusClass: statusClass(status),
      accessibleLabel: `${title}. ${dateLabel}${status ? `. Status: ${status}` : ''}`,
      continuesBefore: entry.start < range.value.start,
      continuesAfter: entry.end > range.value.end,
      style: { left: `calc(${(start - range.value.start) * 100 / days.value.length}% + 3px)`, width: `calc(${(end - start + 1) * 100 / days.value.length}% - 6px)`, top: `${PADDING + lane * LANE_HEIGHT}px`, height: `${BLOCK_HEIGHT}px` },
    }
  })
  return { blocks, height: Math.max(72, laneCount * LANE_HEIGHT + PADDING * 2) }
}
const rows = computed(() => {
  const result = []
  const seen = new Set()
  for (const item of props.items ?? []) {
    if (!item) continue
    const id = relationId(item)
    if (id === null || seen.has(id)) continue
    seen.add(id)
    const entries = bookingsByItem.value.get(id) ?? []
    if (!entries.length && !props.showEmptyItems) continue
    result.push({ id, item, ...layoutBookings(entries) })
  }
  return result
})
</script>

<style scoped>
.agenda-container { --border: #e1e7f0; --ink: #19304e; --muted: #6c7d93; --label-width: 180px; width: 100%; min-width: 0; color: var(--ink); font-family: 'Inter', 'Segoe UI', sans-serif; }
.agenda-container, .agenda-container :deep(*) { box-sizing: border-box; }
.agenda-container button, .agenda-container select { font: inherit; }
.agenda-container :is(button, select, [tabindex]):focus-visible { outline: 3px solid #3377df; outline-offset: 3px; }
.agenda-toolbar { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 20px; margin-bottom: 24px; }
.toolbar-actions { display: flex; flex-wrap: wrap; align-items: center; gap: 10px; min-width: 0; width: 100%; }
.date-controls { width: 280px; max-width: 100%; }
.date-controls :deep(.el-date-editor) { width: 100% !important; min-height: 40px; border-radius: 9px; }
.type-filter select { max-width: 200px; min-height: 40px; padding: 8px 30px 8px 12px; border: 1px solid #d6dfeb; border-radius: 9px; background: #fff; color: #425671; font-size: 12px; cursor: pointer; }
.add-btn { display: inline-flex; align-items: center; justify-content: center; gap: 8px; margin-left: auto; min-height: 40px; padding: 8px 16px; border: 1px solid #2359bd; border-radius: 9px; color: #fff; background: #2864d1; font-size: 12px !important; font-weight: 600 !important; cursor: pointer; transition: background 160ms; }
.add-btn > span { font-size: 20px; line-height: 1; font-weight: 400; }
.add-btn:hover { background: #1e50ad; }
.notice { font-size: 12px; line-height: 1.6; color: #805416; background: #fff8e8; padding: 10px 14px; border: 1px solid #f1ddb0; border-radius: 8px; }
.agenda-scroll { min-width: 0; max-width: 100%; overflow-x: auto; overflow-y: hidden; border: 1px solid var(--border); border-radius: 12px; isolation: isolate; scrollbar-width: thin; }
.agenda-grid { min-width: var(--grid-min); }
.header-row, .agenda-row { display: grid; grid-template-columns: var(--label-width) minmax(0, 1fr); }
.header-row { position: sticky; top: 0; z-index: 3; background: #f7f9fc; border-bottom: 1px solid var(--border); }
.corner-cell, .item-label { position: sticky; left: 0; z-index: 2; padding: 17px 18px; border-right: 1px solid var(--border); background: #fff; box-shadow: 3px 0 7px #19304e04; }
.corner-cell { background: #f2f5fa; font-size: 12px; font-weight: 700; display: flex; justify-content: center; flex-direction: column; gap: 5px; }
.day-headings, .day-background { display: grid; grid-template-columns: repeat(var(--days), minmax(0, 1fr)); }
.header-cell { position: relative; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 5px; min-height: 72px; padding: 10px 3px; border-right: 1px solid var(--border); color: #7b899b; }
.header-cell > span:first-child { font-size: 10px; text-transform: uppercase; letter-spacing: .4px; }
.header-cell strong { font-size: 12px; font-weight: 650; color: #344b68; }
.header-cell.today { background: #eaf2ff; }
.header-cell.today strong { color: #245cc4; }
.today-dot { width: 4px; height: 4px; background: #2864d1; border-radius: 50%; position: absolute; bottom: 7px; }
.agenda-row + .agenda-row { border-top: 1px solid var(--border); }
.item-label { display: flex; flex-direction: column; justify-content: center; gap: 6px; overflow-wrap: anywhere; }
.item-label strong { font-size: 12px; font-weight: 650; }
.item-label > span { color: var(--muted); font-size: 10px; line-height: 1.4; }
.timeline { position: relative; min-width: 0; }
.day-background { position: absolute; inset: 0; pointer-events: none; }
.day-background > div { border-right: 1px solid #e9edf4; }
.weekend { background: #f4f6fa; }
.day-background .today { background: #f0f6ff; }
.boek-block { position: absolute; display: flex; flex-direction: column; justify-content: center; text-align: left; gap: 4px; min-width: 0; padding: 6px 10px; border: 1px solid #b5caef; border-left: 3px solid #4c79c4; border-radius: 7px; background: #e4edfc; color: #214b89; cursor: pointer; overflow: hidden; transition: filter 150ms, box-shadow 150ms; }
.boek-block:hover { filter: brightness(.97); box-shadow: 0 3px 10px #19304e20; z-index: 1; }
.boek-block:focus-visible { z-index: 2; }
.boek-block strong, .boek-block small { overflow: hidden; white-space: nowrap; text-overflow: ellipsis; width: 100%; }
.boek-block strong { font-size: 12px; font-weight: 650; }
.boek-block small { font-size: 10px; opacity: .9; }
.boek-block.continues-before { border-top-left-radius: 0; border-bottom-left-radius: 0; border-left-style: dashed; }
.boek-block.continues-after { border-top-right-radius: 0; border-bottom-right-radius: 0; border-right-style: dashed; }
.requested { background: #fff5ce; color: #76510e; border-color: #eddc9b; border-left-color: #c19322; }
.confirmed { background: #e2edff; color: #244d8c; border-color: #bdd0f1; border-left-color: #4b7ccd; }
.delivery { background: #ffecd9; color: #824614; border-color: #f0cdac; border-left-color: #d48b43; }
.completed { background: #dff3e9; color: #21634b; border-color: #b9dfcc; border-left-color: #4a9e7a; }
.other { background: #edf0f6; color: #43516a; border-color: #d3dae6; border-left-color: #8190a7; }
.empty-state { padding: 40px 20px; text-align: center; border: 1px dashed #d5dfec; background: #fafbfd; border-radius: 10px; margin-top: 14px; }
.empty-state > span { font-size: 30px; color: #91a7c5; }
.empty-state h3 { font-size: 15px; margin: 12px 0 8px; }
.empty-state p { color: var(--muted); font-size: 12px; line-height: 1.7; margin: 0; }
.agenda-footer { display: flex; flex-wrap: wrap; justify-content: space-between; gap: 16px; padding-top: 18px; font-size: 10px; color: var(--muted); }
.legend { display: flex; flex-wrap: wrap; gap: 12px; }
.legend > span { display: inline-flex; align-items: center; gap: 6px; }
.legend i { width: 8px; height: 8px; border-radius: 3px; border-width: 1px; border-style: solid; }
.sr-only { position: absolute; width: 1px; height: 1px; margin: -1px; padding: 0; overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; border: 0; }
@media (max-width: 760px) { .date-controls { flex: 1 1 260px; } .type-filter { flex: 1 1 140px; } .type-filter select { width: 100%; max-width: none; } .add-btn { flex: 1 0 auto; } }
@media (prefers-reduced-motion: reduce) { .boek-block, .add-btn { transition: none; } }
</style>

