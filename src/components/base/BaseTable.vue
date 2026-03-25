<template>
  <div class="lijstweergave">

    <!-- HEADER -->
    <div class="table-header" :style="gridStyle">
      <slot name="header" />
    </div>

    <!-- ROWS -->
    <div
      v-for="item in items"
      :key="getKey(item)"
      class="table-row"
      :class="{ 'no-hover': !hover }"
      :style="gridStyle"
      @click="$emit('row-click', item)"
    >
      <slot name="row" :item="item" />
    </div>

    <!-- EMPTY -->
    <div v-if="!items.length" class="no-results">
      <slot name="empty">
        Geen resultaten gevonden
      </slot>
    </div>

  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  items: {
    type: Array,
    default: () => [],
  },
  columns: {
    type: String,
    default: '1fr 1fr',
  },
  itemKey: {
    type: String,
    default: '_id',
  },
  hover: {
    type: Boolean,
    default: true,
  },
})

defineEmits(['row-click'])

const gridStyle = computed(() => ({
  gridTemplateColumns: props.columns,
}))

function getKey(item) {
  return item?.[props.itemKey] || item?.id || Math.random()
}
</script>

<style>
/* =========================================
   WRAPPER
========================================= */
.lijstweergave {
  width: 100%;
  font-family: 'Inter', sans-serif;
}

/* =========================================
   HEADER
========================================= */
.table-header {
  display: grid;
  padding: 14px 18px;
  background: #f0f0f0;
  font-weight: 700;
  color: #6e6e6e;
  border-radius: 14px;
  border: 1px solid rgba(0, 0, 0, 0.06);
  margin-bottom: 12px;
  font-size: 14px;
  backdrop-filter: blur(6px);
}

/* =========================================
   ROW
========================================= */
.table-row {
  display: grid;
  padding: 16px 18px;
  background: #ffffff;
  border-radius: 14px;
  border: 1px solid rgba(0, 0, 0, 0.05);
  box-shadow: 0 3px 8px rgba(0, 0, 0, 0.08);
  transition: 0.25s ease;
  cursor: pointer;
  margin-bottom: 10px;
  align-items: center;
}

/* Hover effect */
.table-row:hover {
  background: #5786f7;
  color: white;
  transform: translateY(-3px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.15);
}

/* Disable hover */
.table-row.no-hover:hover {
  background: #ffffff;
  color: inherit;
  transform: none;
  box-shadow: 0 3px 8px rgba(0, 0, 0, 0.08);
  cursor: default;
}

/* =========================================
   CELLS
========================================= */
.table-header > div,
.table-row > div {
  font-size: 14px;
}

/* =========================================
   ALIGNMENT
========================================= */
.right {
  justify-self: end;
  text-align: right;
}

/* =========================================
   EMPTY STATE
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
    grid-template-columns: 1fr 1fr !important;
    row-gap: 10px;
  }
}
</style>