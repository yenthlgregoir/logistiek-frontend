<template>
  <div class="expanded-table" tabindex="0" role="region" aria-label="Assets; horizontaal scrollbaar">
    <div class="table-grid">
      <div class="table-header" :style="gridStyle"><slot name="header" /></div>
      <div v-for="(item, index) in items" :key="getKey(item, index)" class="table-group">
        <div class="table-row" :class="{ 'is-open': openKey === getKey(item, index), 'is-clickable': expandOnRowClick }" :style="[gridStyle, rowStyle ? rowStyle(item) : null]" :tabindex="expandOnRowClick ? 0 : undefined" :aria-expanded="expandOnRowClick ? openKey === getKey(item, index) : undefined" :aria-controls="expandOnRowClick ? panelId(index) : undefined" @click="onRowClick($event, item, index)" @keydown.enter.self.prevent="activate(item, index)" @keydown.space.self.prevent="activate(item, index)">
          <slot name="row" :item="item" />
        </div>
        <div v-if="openKey === getKey(item, index)" :id="panelId(index)" class="expanded-content"><slot name="expanded" :item="item" /></div>
      </div>
      <div v-if="!items.length" class="no-results"><slot name="empty">Geen assets gevonden.</slot></div>
    </div>
  </div>
</template>

<script setup>
import { computed, getCurrentInstance, ref, watch } from 'vue'
const props = defineProps({
  items: { type: Array, default: () => [] },
  columns: { type: String, default: '1fr 1fr' },
  itemKey: { type: String, default: 'id' },
  expandOnRowClick: { type: Boolean, default: false },
  rowStyle: { type: Function, default: null },
})
const emit = defineEmits(['row-click'])
const openKey = ref(null)
const uid = getCurrentInstance().uid
const gridStyle = computed(() => ({ gridTemplateColumns: props.columns }))
const fallbackKeys = new WeakMap()
let nextKey = 0
function getKey(item, index) {
  const id = item?.[props.itemKey] ?? item?.id ?? item?._id
  if (id != null && id !== '') return `id:${id}`
  if (item && typeof item === 'object') {
    if (!fallbackKeys.has(item)) fallbackKeys.set(item, `row:${nextKey++}`)
    return fallbackKeys.get(item)
  }
  return `index:${index}`
}
function panelId(index) { return `asset-details-${uid}-${index}` }
function activate(item, index) {
  if (props.expandOnRowClick) {
    const key = getKey(item, index)
    openKey.value = openKey.value === key ? null : key
  }
  emit('row-click', item)
}
function onRowClick(event, item, index) {
  if (event.target.closest('button, a, input, select, textarea, [role="button"]')) return
  activate(item, index)
}
watch(() => props.items.map((item, index) => getKey(item, index)), keys => {
  if (openKey.value !== null && !keys.includes(openKey.value)) openKey.value = null
})
</script>

<style scoped>
.expanded-table { width: 100%; max-width: 100%; min-width: 0; overflow-x: auto; background: transparent; font-family: 'Inter', 'Segoe UI', sans-serif; color: #263b56; scrollbar-width: thin; }
.expanded-table, .expanded-table :deep(*) { box-sizing: border-box; }
.expanded-table:focus-visible { outline: 2px solid #779fdb; outline-offset: 3px; }
.table-grid { min-width: 880px; padding-bottom: 5px; }
.table-header, .table-row { display: grid; align-items: center; column-gap: 24px; padding-left: 24px; padding-right: 24px; }
.table-header { min-height: 48px; margin-bottom: 10px; border-radius: 10px; background: #1c2d43; color: #c4d0e0; font-size: 10px; font-weight: 600; letter-spacing: .8px; text-transform: uppercase; }
.table-group { margin-top: 8px; border-radius: 12px; background: #fff; box-shadow: 0 2px 4px #1b304b08; }
.table-row { min-height: 68px; padding-top: 16px; padding-bottom: 16px; border-radius: 12px; font-size: 12px; line-height: 1.6; }
.table-row.is-clickable { cursor: pointer; }
.table-row.is-clickable:hover { box-shadow: inset 3px 0 #477cce; }
.table-row.is-open { border-radius: 12px 12px 0 0; }
.table-row:focus-visible { outline: 2px solid #729cdb; outline-offset: -3px; }
.table-header > :deep(*), .table-row > :deep(*) { min-width: 0; overflow-wrap: anywhere; }
.table-header :deep(.right), .table-row :deep(.right) { justify-self: end; text-align: right; }
.expanded-content { border-top: 1px solid #e5ebf3; border-radius: 0 0 12px 12px; background: #fff; color: #263b56; }
.no-results { padding: 40px 24px; color: #8291a5; text-align: center; font-size: 13px; }
</style>
