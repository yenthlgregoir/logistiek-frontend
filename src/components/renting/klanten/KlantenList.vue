<template>
  <div class="lijstweergave">
    <!-- TOOLBAR -->
    <div class="toolbar">
      <div class="search">
        <i class="fa fa-search"></i>
        <input
          type="text"
          placeholder="Zoek klant..."
          :value="search"
          @input="$emit('update:search', $event.target.value)"
        />
      </div>

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

/* SEARCH */
.search {
  position: relative;
  flex: 1;
  max-width: 300px;
}

.search input {
  width: 100%;
  padding: 10px 12px 10px 34px;
  border-radius: 10px;
  border: none;
  background: transparent;
  font-size: 14px;
  transition: 0.2s ease;
}

.search input:focus {
  outline: none;
  background: #e8f0ff;
  box-shadow: 0 0 0 3px rgba(87, 134, 247, 0.2);
}

.search i {
  position: absolute;
  left: 10px;
  top: 50%;
  transform: translateY(-50%);
  color: #1b4965;
  font-size: 13px;
}
</style>
