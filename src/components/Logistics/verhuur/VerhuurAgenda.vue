<template>
  <AgendaComponent
    :items="assets"
    :bookings="filteredBoekingen"
    :typeOptions="types"
    item-label="Asset"
    :get-item-id="getAssetId"
    :get-booking-start="getStart"
    :get-booking-end="getEnd"
    :get-booking-title="getTitle"
    @addBoeking="$emit('addBoeking')"
    @openBoeking="$emit('openBoeking', $event)"
    @filterType="$emit('filterType', $event)"
  />
</template>

<script setup>
import { computed } from 'vue'
import AgendaComponent from '@/components/agenda/AgendaComponent.vue'

const props = defineProps({
  boekingen: Array,
  types: Array,
})

defineEmits(['openBoeking', 'addBoeking', 'filterType'])

/* ---------------- FILTER BOEKINGEN ---------------- */
const filteredBoekingen = computed(() => {
  return (props.boekingen || []).filter((b) => {
    const asset = b.asset || b.toestel
    return asset && asset._id // 🔥 alleen geldige boekingen
  })
})

/* ---------------- ASSETS AFLEIDEN ---------------- */
const assets = computed(() => {
  const map = new Map()

  filteredBoekingen.value.forEach((b) => {
    const asset = b.asset || b.toestel
    map.set(asset._id, asset)
  })

  return Array.from(map.values())
})

/* ---------------- MAPPERS ---------------- */
const getAssetId = (a) => a._id

const getStart = (b) => {
  const raw = b.leverDatum || b.beginDatum
  return raw ? new Date(raw) : new Date()
}

const getEnd = (b) => {
  const raw = b.ophaalDatum || b.eindDatum

  if (!raw) {
    return new Date(8640000000000000)
  }

  return new Date(raw)
}

const getTitle = (b) => b.reference || b.klant?.naam || b.leverAdresDetails?.naam || 'Onbekend'
</script>

<style scoped>
.agenda-container {
  width: 100%;
  font-family: 'Inter', sans-serif;
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
</style>
