<template>
  <BaseModal
    title="Boekingen per toestel"
    :busy="busy"
    style="--base-modal-width: 1080px"
    @close="emit('close')"
  >
    <p class="asset">
      {{ toestel.Ref || toestel.ref || 'Toestel' }} · {{ toestel.nrplaat || 'Geen nummerplaat' }}
    </p>
    <p class="description">Alle boekingen van dit toestel die de gekozen periode overlappen.</p>
    <form id="moves-export" class="dates" @submit.prevent="download">
      <label
        >Van<input
          v-model="beginDatum"
          type="date"
          required
          :max="eindDatum || undefined"
          :disabled="busy"
      /></label>
      <label
        >Tot en met<input
          v-model="eindDatum"
          type="date"
          required
          :min="beginDatum"
          :disabled="busy"
      /></label>
    </form>
    <p v-if="loading" role="status">Boekingen laden…</p>
    <p v-if="error" class="error" role="alert">{{ error }}</p>
    <template v-if="report && !loading">
      <p class="description">{{ report.bookings.length }} boekingen gevonden</p>
      <BaseTable
        :items="visibleBookings"
        columns="1.3fr 2fr 1fr 1fr 1fr"
        item-key="id"
        :hover="false"
      >
        <template #header
          ><div>Referentie</div>
          <div>Klant / leveradres</div>
          <div>Begin</div>
          <div>Einde</div>
          <div>Status</div></template
        >
        <template #row="{ item }">
          <div>{{ item.reference || '—' }}</div>
          <div>
            {{ item.klant }}<small>{{ item.leverAdres }}</small>
          </div>
          <div>{{ formatDate(item.beginDatum) }}</div>
          <div>{{ item.eindDatum ? formatDate(item.eindDatum) : 'Zonder einddatum' }}</div>
          <div>{{ item.status }}</div>
        </template>
        <template #empty>Geen boekingen in deze periode.</template>
      </BaseTable>
      <div v-if="totalPages > 1" class="pagination">
        <button type="button" :disabled="page === 1" @click="page--">Vorige</button>
        <span>{{ page }} / {{ totalPages }}</span>
        <button type="button" :disabled="page === totalPages" @click="page++">Volgende</button>
      </div>
    </template>
    <button v-if="!loading && error && !report" type="button" @click="loadBookings">
      Opnieuw laden
    </button>
    <template #footer>
      <button type="button" class="btn-cancel" :disabled="busy" @click="emit('close')">
        Sluiten
      </button>
      <button
        type="submit"
        form="moves-export"
        class="btn-primary"
        :disabled="busy || loading || !report"
      >
        {{ busy ? 'PDF maken…' : 'Download PDF' }}
      </button>
    </template>
  </BaseModal>
</template>

<script setup>
import { ref, computed, watch, onBeforeUnmount } from 'vue'
import BaseModal from '@/components/base/BaseModal.vue'
import BaseTable from '@/components/base/BaseTable.vue'
import { toestelApi } from '@/api/toestel'

const props = defineProps({ toestel: { type: Object, required: true } })
const emit = defineEmits(['close'])
// Match the backend's Belgian calendar, including around midnight and DST.
function belgianDate(date) {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/Brussels',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date)
  const value = (type) => parts.find((part) => part.type === type).value
  return `${value('year')}-${value('month')}-${value('day')}`
}
const today = belgianDate(new Date())
const previousYear = new Date(`${today}T12:00:00Z`)
previousYear.setUTCFullYear(previousYear.getUTCFullYear() - 1)
// Clamp February 29 to February 28, as LocalDate.minusYears does.
if (previousYear.getUTCMonth() !== Number(today.slice(5, 7)) - 1) previousYear.setUTCDate(0)
const beginDatum = ref(belgianDate(previousYear))
const eindDatum = ref(today)
const busy = ref(false)
const error = ref('')
const loading = ref(false)
const report = ref(null)
const page = ref(1)
const totalPages = computed(() => Math.max(1, Math.ceil((report.value?.bookings.length || 0) / 5)))
const visibleBookings = computed(
  () => report.value?.bookings.slice((page.value - 1) * 5, page.value * 5) || [],
)
let requestNumber = 0
let timer
function validPeriod() {
  return beginDatum.value && eindDatum.value && beginDatum.value <= eindDatum.value
}
function formatDate(value) {
  return value ? value.split('-').reverse().join('/') : 'Onbekend'
}
async function loadBookings() {
  const request = ++requestNumber
  report.value = null
  error.value = ''
  page.value = 1
  if (!validPeriod()) {
    loading.value = false
    error.value = 'Kies een geldige begin- en einddatum.'
    return
  }
  loading.value = true
  try {
    const result = await toestelApi.bookings(props.toestel.id || props.toestel._id, {
      beginDatum: beginDatum.value,
      eindDatum: eindDatum.value,
    })
    if (request === requestNumber) report.value = result
  } catch (e) {
    if (request === requestNumber) error.value = e.message || 'Boekingen ophalen is mislukt.'
  } finally {
    if (request === requestNumber) loading.value = false
  }
}
watch(
  [beginDatum, eindDatum],
  () => {
    clearTimeout(timer)
    requestNumber++
    report.value = null
    loading.value = true
    timer = setTimeout(loadBookings, 250)
  },
  { immediate: true },
)
onBeforeUnmount(() => {
  clearTimeout(timer)
  requestNumber++
})

async function download() {
  if (busy.value || loading.value || !report.value) return
  error.value = ''
  if (!beginDatum.value || !eindDatum.value || beginDatum.value > eindDatum.value) {
    error.value = 'Kies een geldige begin- en einddatum.'
    return
  }
  busy.value = true
  try {
    const blob = await toestelApi.bookingsPdf(props.toestel.id || props.toestel._id, {
      beginDatum: beginDatum.value,
      eindDatum: eindDatum.value,
    })
    if (!(blob instanceof Blob) || blob.type !== 'application/pdf')
      throw new Error('Geen geldige PDF ontvangen.')
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    const name = String(props.toestel.Ref || props.toestel.ref || 'toestel').replace(
      /[^a-zA-Z0-9_-]/g,
      '-',
    )
    link.download = `boekingen-${name}-${beginDatum.value}-${eindDatum.value}.pdf`
    document.body.appendChild(link)
    link.click()
    link.remove()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  } catch (e) {
    error.value = e.message || 'De PDF kon niet worden gemaakt. Probeer opnieuw.'
  } finally {
    busy.value = false
  }
}
</script>

<style scoped>
.asset {
  margin: 0 0 10px;
  font-weight: 600;
}
small {
  display: block;
  color: #64748b;
  margin-top: 4px;
  font-size: 11px;
}
.pagination {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 12px;
  margin-top: 12px;
  font-size: 13px;
}
.pagination button {
  padding: 6px 10px;
  border: 1px solid #d7e2f0;
  border-radius: 7px;
  background: #f3f7fd;
}
.description {
  color: #64748b;
  font-size: 13px;
  line-height: 1.6;
}
.dates {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
  margin-top: 20px;
}
label {
  display: grid;
  gap: 8px;
  font-size: 13px;
}
input {
  width: 100%;
  min-width: 0;
  padding: 10px;
  border: 1px solid #d7e2f0;
  border-radius: 8px;
}
.error {
  color: #b42318;
  font-size: 13px;
}
@media (max-width: 480px) {
  .dates {
    grid-template-columns: 1fr;
  }
}
</style>
