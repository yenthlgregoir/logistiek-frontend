<template>
  <BaseTable
    :items="gefilterdeToestellen"
    columns="repeat(6, 1fr)"
    @row-click="$emit('edit-toestel', $event)"
  >
    <!-- HEADER -->
    <template #header>
      <div>Type</div>
      <div>Volgnummer</div>
      <div>Nummerplaat</div>
      <div>Identificatie</div>
      <div>Klant</div>
      <div class="right">Status</div>
    </template>

    <!-- ROW -->
    <template #row="{ item: toestel }">
      <div>{{ toestel.type?.naam || 'Onbekend' }}</div>
      <div>{{ toestel.Ref || 'N/A' }}</div>
      <div>{{ toestel.nrplaat || 'N/A' }}</div>
      <div class="asset-actions">
        <span>{{ toestel.chasisnummer || 'N/A' }}</span>
        <button
          type="button"
          class="moves-button"
          :aria-label="`Boekingen bekijken voor ${toestel.Ref || 'toestel'}`"
          @click.stop="$emit('export-moves', toestel)"
        >
          <i class="fa fa-file-pdf" aria-hidden="true"></i> Boekingen
        </button>
      </div>
      <div>{{ formatAdres(toestel.gnw) || 'Niet toegewezen' }}</div>
      <div class="col-status right" :class="toestel.status?.statusType">
        {{ toestel.status?.statusType }}
      </div>
    </template>
  </BaseTable>
</template>

<script setup>
import { computed } from 'vue'
import BaseTable from '@/components/base/BaseTable.vue'

const props = defineProps({
  toestellen: { type: Array, default: () => [] },
  search: { type: String, default: '' },
})

defineEmits(['edit-toestel', 'export-moves'])

const gefilterdeToestellen = computed(() => {
  const term = props.search.toLowerCase()
  return props.toestellen.filter((t) => {
    return (
      !term ||
      t.Ref?.toLowerCase().includes(term) ||
      t.nrplaat?.toLowerCase().includes(term) ||
      t.chasisnummer?.toLowerCase().includes(term) ||
      t.type?.naam?.toLowerCase().includes(term) ||
      t.gnw?.toLowerCase().includes(term) ||
      t.status?.statusType?.toLowerCase().includes(term)
    )
  })
})

function formatAdres(adres) {
  if (adres === 'vrij' || !adres) return 'vrij'

  return `${adres.naam || 'Onbekende klant'}: ${adres.straat || ''} ${
    adres.huisnummer || ''
  }, ${adres.postcode || ''} ${adres.gemeente || ''}`
}
</script>

<style scoped>
.asset-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
.moves-button {
  border: 1px solid #d7e2f0;
  border-radius: 7px;
  background: #f3f7fd;
  color: #294f86;
  padding: 5px 8px;
  cursor: pointer;
  font: inherit;
  font-size: 12px;
}
.moves-button:hover {
  background: #e6eefc;
}
.moves-button:focus-visible {
  outline: 2px solid #3267d5;
  outline-offset: 2px;
}
.col-status {
  padding: 6px 12px;
  border-radius: 10px;
  font-weight: 600;
  font-size: 13px;
  text-align: center;
}

.col-status.Actief {
  background: #a8eeaf;
  color: #0b7226;
}

.col-status.Kapot {
  background: #ff745c;
  color: rgb(99, 8, 8);
}
</style>
