<template>
  <div class="base-table" :style="{ '--table-min-width': minWidth }" tabindex="0" role="region" aria-label="Tabel; horizontaal scrollbaar">
    <div class="table-grid">
    <div class="table-header" :style="gridStyle">
      <template v-if="sortableColumns.length">
        <button v-for="column in sortableColumns" :key="column.key" type="button" class="sort-heading" :class="{ 'sort-active': sortBy === column.key, right: column.align === 'right' }" :aria-label="`${column.label}: ${sortBy === column.key ? (sortDirection === 'asc' ? 'oplopend' : 'aflopend') + ' gesorteerd. ' : ''}Klik om ${sortBy === column.key && sortDirection === 'asc' ? 'aflopend' : 'oplopend'} te sorteren`" @click="emit('sort-change', { key: column.key, direction: sortBy === column.key && sortDirection === 'asc' ? 'desc' : 'asc' })">
          {{ column.label }}<span class="sort-indicator" aria-hidden="true">{{ sortBy === column.key ? (sortDirection === 'asc' ? '↑' : '↓') : '↕' }}</span>
        </button>
      </template>
      <slot v-else name="header" />
    </div>
    <div v-for="(item, index) in items" :key="getKey(item, index)" class="table-row" :class="{ 'no-hover': !hover }" :style="gridStyle" tabindex="0" @click="emit('row-click', item)" @keydown.enter.self.prevent="emit('row-click', item)" @keydown.space.self.prevent="emit('row-click', item)">
      <slot name="row" :item="item" />
    </div>
    <div v-if="!items.length" class="no-results"><slot name="empty">Geen resultaten gevonden.</slot></div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  items: { type: Array, default: () => [] },
  columns: { type: String, default: '1fr 1fr' },
  itemKey: { type: String, default: '_id' },
  hover: { type: Boolean, default: true },
  minWidth: { type: String, default: '720px' },
  sortableColumns: { type: Array, default: () => [] },
  sortBy: { type: String, default: '' },
  sortDirection: { type: String, default: 'asc' },
})
const emit = defineEmits(['row-click', 'sort-change'])
const gridStyle = computed(() => ({ gridTemplateColumns: props.columns }))
const fallbackKeys = new WeakMap()
let nextKey = 0
function getKey(item, index) {
  const id = item?.[props.itemKey] ?? item?.id ?? item?._id
  if (id != null && id !== '') return `id:${typeof id}:${id}`
  if (item !== null && typeof item === 'object') {
    if (!fallbackKeys.has(item)) fallbackKeys.set(item, `row:${nextKey++}`)
    return fallbackKeys.get(item)
  }
  return `value:${typeof item}:${String(item)}:${index}`
}
</script>

<style scoped>
.base-table {
  --table-ink: #263347;
  width: 100%;
  max-width: 100%;
  min-width: 0;
  overflow-x: auto;
  border: 0;
  border-radius: 0;
  background: transparent;
  color: var(--table-ink);
  font-family: 'Inter', 'Segoe UI', sans-serif;
  scrollbar-width: thin;
  scrollbar-color: #b8c5d5 #f4f6f9;
  -webkit-font-smoothing: antialiased;
}
.base-table, .base-table :deep(*) { box-sizing: border-box; }
.base-table:focus-visible { outline: 2px solid #6794d2; outline-offset: 3px; }
.table-grid { min-width: var(--table-min-width, 720px); padding-bottom: 4px; }
.table-header, .table-row { display: grid; align-items: center; column-gap: 28px; padding: 0 26px; }
.table-header {
  min-height: 48px;
  background: #1c2d43;
  color: #c4d0e0;
  border-bottom: 1px solid #132238;
  border-radius: 10px;
  margin-bottom: 10px;
  font-size: 10px;
  font-weight: 600;
  line-height: 1.5;
  letter-spacing: 1px;
  text-transform: uppercase;
}
.table-row {
  position: relative;
  min-height: 76px;
  padding-top: 17px;
  padding-bottom: 17px;
  background: #fff;
  border: 0;
  border-radius: 12px;
  box-shadow: 0 2px 4px #1b304b08;
  font-size: 13px;
  line-height: 1.5;
  cursor: pointer;
  transition: background-color 140ms, box-shadow 140ms;
}
.table-row + .table-row { margin-top: 8px; }
.table-row:not(.no-hover):hover { background: #fff; box-shadow: inset 3px 0 #477cce, 0 3px 8px #1b304b0d; }
.table-row:focus-visible { z-index: 1; outline: 2px solid #729cdb; outline-offset: -3px; background: #edf4ff; }
.table-row.no-hover { cursor: default; }
.sort-heading { display: inline-flex; align-items: center; gap: 8px; justify-self: start; padding: 10px 0; border: 0; background: transparent; color: inherit; font: inherit; letter-spacing: inherit; text-transform: inherit; text-align: left; cursor: pointer; }
.sort-heading:hover, .sort-heading.sort-active { color: #fff; }
.sort-heading:focus-visible { outline: 2px solid #99bdf3; outline-offset: 3px; border-radius: 3px; }
.sort-indicator { opacity: .45; font-size: 13px; }
.sort-active .sort-indicator { opacity: 1; color: #a8cbff; }
.table-header > :deep(*), .table-row > :deep(*) { min-width: 0; overflow-wrap: anywhere; }
.table-header :deep(.right), .table-row :deep(.right) { justify-self: end; text-align: right; }
.no-results { padding: 56px 26px; text-align: center; color: #8390a2; font-size: 13px; line-height: 1.7; background: transparent; }
@media (max-width: 768px) { .table-header, .table-row { padding-left: 20px; padding-right: 20px; column-gap: 22px; } }
@media (prefers-reduced-motion: reduce) { .table-row { transition: none; } }
</style>
