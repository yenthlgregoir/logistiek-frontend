<template>
  <div class="lijstweergave">
    <!-- Table header -->
    <div class="table-header">
      <div>Type</div>
      <div>Volgnummer</div>
      <div>Nummerplaat</div>
      <div>Identificatie</div>
      <div>Klant</div>
      <div class="right">Status</div>
    </div>

    <!-- Rows -->
    <div
      v-for="toestel in gefilterdeToestellen"
      :key="toestel._id"
      class="table-row"
      @dblclick="$emit('edit-toestel', toestel)"
    >
      <div>{{ toestel.type?.naam || 'Onbekend' }}</div>
      <div>{{ toestel.Ref || 'N/A' }}</div>
      <div>{{ toestel.nrplaat || 'N/A' }}</div>
      <div>{{ toestel.chasisnummer || 'N/A' }}</div>
      <div>{{ toestel.klant?.naam || 'Niet toegewezen' }}</div>
      <div class="col-status right" :class="toestel.status?.statusType">
        {{ toestel.status?.statusType }}
      </div>
    </div>

    <div v-if="!gefilterdeToestellen.length" class="no-results">Geen resultaten gevonden</div>
  </div>
</template>

<script setup>
import { computed} from 'vue'

const props = defineProps({
  toestellen: { type: Array, default: () => [] },
  search: { type: String, default: '' },
})
defineEmits(['edit-toestel'])
const gefilterdeToestellen = computed(() => {
  const term = props.search.toLowerCase()
  return props.toestellen.filter((t) => {
    return (
      !term ||
      t.Ref?.toLowerCase().includes(term) ||
      t.nrplaat?.toLowerCase().includes(term) ||
      t.chasisnummer?.toLowerCase().includes(term) ||
      t.type?.naam?.toLowerCase().includes(term) ||
      t.klant?.naam?.toLowerCase().includes(term) ||
      t.status?.statusType?.toLowerCase().includes(term)
    )
  })
})
</script>

<style scoped>
.lijstweergave {
  background: #f9fafb;
  border-radius: 14px;
}

.table-header {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr 1fr 1fr 1fr;
  padding: 10px 16px;
  font-weight: 600;
  color: #374151;
  border-bottom: 2px solid #e5e7eb;
}

.table-row {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr 1fr 1fr 1fr;
  padding: 12px 16px;
  border-bottom: 1px solid #e5e7eb;
  align-items: center;
  cursor: pointer;
  transition: all 0.2s ease;
}
.table-row:hover {
  background: #eef2ff;
}

.col-status {
  text-align: right;
  font-weight: 600;
  padding: 4px 8px;
  border-radius: 6px;
  justify-self: end;
}

.col-status.Actief {
  background: #9be470;
  color: #000;
}
.col-status.Kapot {
  background: #fca5a5;
  color: #7f1d1d;
}

.no-results {
  text-align: center;
  padding: 2rem;
  color: #9ca3af;
}
.table-header .right {
  text-align: right;
}
/* Responsive */
@media (max-width: 768px) {
  .table-header,
  .table-row {
    grid-template-columns: 1fr 1fr;
    row-gap: 8px;
  }
  .col-status {
    justify-self: start;
  }
}
</style>
