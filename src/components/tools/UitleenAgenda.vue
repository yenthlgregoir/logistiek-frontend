<template>
  <div class="tools-agenda">
    <AgendaComponent
      :items="items"
      :bookings="blocks"
      :type-options="categoryOptions"
      item-label="Materiaal"
      :get-item-id="idOf"
      :get-booking-start="(item) => item.start"
      :get-booking-end="(item) => item.end"
      :get-booking-title="(item) => item.title"
      :status-classes="statusClasses"
      :legend="legend"
      :allow-past-dates="true"
      :show-empty-items="true"
      :add-label="addLabel"
      open-ended-label="Zonder einddatum"
      @addBoeking="$emit('add')"
      @openBoeking="$emit('open', $event)"
      @filterType="category = $event?.naam || ''"
    />
  </div>
</template>
<script setup>
import { computed, ref } from 'vue'
import AgendaComponent from '@/components/agenda/AgendaComponent.vue'
import { planningBookings, idOf } from '@/utils/uitleen'
const props = defineProps({
  materials: { type: Array, default: () => [] },
  loans: { type: Array, default: () => [] },
  addLabel: { type: String, default: 'Nieuwe uitleen' },
})
defineEmits(['add', 'open'])
const category = ref('')
const categoryOptions = computed(() =>
  [...new Set(props.materials.map((item) => item.categorie).filter(Boolean))]
    .sort()
    .map((naam) => ({ id: naam, naam })),
)
const items = computed(() =>
  props.materials
    .filter((item) => !category.value || item.categorie === category.value)
    .map((item) => ({
      ...item,
      Ref: item.nummer ? item.nummer + ' · ' + item.naam : item.naam,
      type: { naam: item.categorie },
    })),
)
const blocks = computed(() => planningBookings(props.loans, props.materials))
const statusClasses = {
  GERESERVEERD: 'confirmed',
  UITGELEEND: 'delivery',
  DEELS_TERUG: 'requested',
  ACHTERSTALLIG: 'overdue',
}
const legend = [
  { class: 'confirmed', label: 'Gereserveerd' },
  { class: 'delivery', label: 'Uitgeleend' },
  { class: 'requested', label: 'Deels retour' },
  { class: 'overdue', label: 'Te laat' },
]
</script>
<style scoped>
.tools-agenda :deep(.boek-block.overdue),
.tools-agenda :deep(.legend .overdue) {
  background: #fce7e8;
  color: #a5404a;
  border-color: #ebbdc3;
  border-left-color: #cd6571;
}
</style>
