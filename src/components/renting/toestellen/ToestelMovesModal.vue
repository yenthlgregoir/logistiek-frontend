<template>
  <BaseModal title="Verplaatsingen exporteren" :busy="busy" @close="emit('close')">
    <p class="asset">
      {{ toestel.Ref || toestel.ref || 'Toestel' }} · {{ toestel.nrplaat || 'Geen nummerplaat' }}
    </p>
    <p class="description">
      Leveringen en ophalingen op basis van boekingsdatums. Niet geregistreerde vertrek- en
      retourlocaties staan als onbekend in het rapport.
    </p>
    <form id="moves-export" class="dates" @submit.prevent="download">
      <label
        >Van<input
          v-model="beginDatum"
          type="date"
          required
          :max="eindDatum || today"
          :disabled="busy"
      /></label>
      <label
        >Tot en met<input
          v-model="eindDatum"
          type="date"
          required
          :min="beginDatum"
          :max="today"
          :disabled="busy"
      /></label>
    </form>
    <p v-if="error" class="error" role="alert">{{ error }}</p>
    <template #footer>
      <button type="button" class="btn-cancel" :disabled="busy" @click="emit('close')">
        Sluiten
      </button>
      <button type="submit" form="moves-export" class="btn-primary" :disabled="busy">
        {{ busy ? 'PDF maken…' : 'Download PDF' }}
      </button>
    </template>
  </BaseModal>
</template>

<script setup>
import { ref } from 'vue'
import BaseModal from '@/components/base/BaseModal.vue'
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

async function download() {
  if (busy.value) return
  error.value = ''
  if (
    !beginDatum.value ||
    !eindDatum.value ||
    beginDatum.value > eindDatum.value ||
    eindDatum.value > today
  ) {
    error.value = 'Kies een geldige periode tot uiterlijk vandaag.'
    return
  }
  busy.value = true
  try {
    const blob = await toestelApi.movesPdf(props.toestel.id || props.toestel._id, {
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
    link.download = `moves-${name}-${beginDatum.value}-${eindDatum.value}.pdf`
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
