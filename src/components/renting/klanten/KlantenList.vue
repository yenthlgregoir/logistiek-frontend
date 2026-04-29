<template>
  <div class="lijstweergave">
    <!-- TOOLBAR -->
    <div class="toolbar">
      <SearchBar
        placeholder="Zoek"
        width="300px"
        icon="fa fa-search"
        @update:modelValue="$emit('update:search', $event)"
      />

      <button class="btn btn-primary" @click="$emit('new')">+ Add</button>
    </div>

    <BaseTable :items="klanten" columns="1fr 2fr" @row-click="$emit('select', $event)">
      <template #header>
        <div>Klantnummer</div>
        <div>Naam</div>
      </template>

      <template #row="{ item: k }">
        <div>{{ k.klantNummer || 'N/A' }}</div>
        <div>{{ k.naam || 'Onbekend' }}</div>
      </template>
    </BaseTable>
  </div>
</template>

<script setup>
import BaseTable from '@/components/base/BaseTable.vue'
import SearchBar from '@/components/base/SearchBar.vue'

defineProps({
  klanten: { type: Array, default: () => [] },
  search: { type: String, default: '' },
})

defineEmits(['select', 'new', 'update:search'])
</script>

<style scoped>
.toolbar {
  display: flex;
  justify-content: space-between;
  margin-bottom: 16px;
}

.btn-primary {
  background: #5786f7;
  color: white;
  padding: 10px 16px;
  border-radius: 10px;
}
</style>
