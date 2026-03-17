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
      @click="$emit('edit-toestel', toestel)"
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
/* =========================================
   WRAPPER
========================================= */
.lijstweergave {
  width: 100%;
  font-family: "Inter", sans-serif;
}

/* =========================================
   TABLE HEADER
========================================= */
.table-header {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  padding: 14px 18px;
  background: rgba(249,250,251,0.85);
  backdrop-filter: blur(6px);
  font-weight: 700;
  color: #374151;
  border-radius: 14px;
  border: 1px solid rgba(0,0,0,0.06);
  margin-bottom: 14px;
  font-size: 14px;
}

/* =========================================
   ROWS
========================================= */
.table-row {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  padding: 16px 18px;
  background: rgba(255,255,255,0.9);
  border-radius: 14px;
  border: 1px solid rgba(0,0,0,0.06);
  box-shadow:
    0 2px 6px rgba(0,0,0,0.05);
  transition: 0.25s ease;
  cursor: pointer;
  margin-bottom: 10px;
  align-items: center;
}

.table-row:hover {
  transform: translateY(-3px);
  background: rgba(255,255,255,1);
  box-shadow:
    0 6px 16px rgba(0,0,0,0.12),
    0 3px 8px rgba(0,0,0,0.08);
}

/* Basic text columns */
.table-row > div {
  font-size: 15px;
  color: #1f2937;
}

.right {
  justify-self: end;
  text-align: right;
}

/* =========================================
   STATUS BADGES
========================================= */
.col-status {
  justify-self: end;
  padding: 6px 12px;
  border-radius: 10px;
  font-weight: 600;
  font-size: 13px;
  min-width: 120px;
  text-align: center;
  transition: 0.3s ease;
}

/* Actief (groen pastel) */
.col-status.Actief {
  background: #d1fae5;
  color: #065f46;
}

/* Kapot (rood pastel) */
.col-status.Kapot {
  background: #fee2e2;
  color: #991b1b;
}

/* =========================================
   NO RESULTS
========================================= */
.no-results {
  text-align: center;
  padding: 2rem;
  font-size: 15px;
  color: #94a3b8;
  font-style: italic;
}

/* =========================================
   RESPONSIVE
========================================= */
@media (max-width: 900px) {
  .table-header,
  .table-row {
    grid-template-columns: 1fr 1fr;
    row-gap: 12px;
  }

  .col-status {
    justify-self: start;
  }
}

</style>
