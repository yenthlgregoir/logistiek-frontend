<template>
  <div class="lijstweergave">
    <!-- HEADER -->
    <div class="table-header" :style="gridStyle">
      <slot name="header" />
    </div>

    <!-- ROWS -->
    <div v-for="item in items" :key="getKey(item)">
      <!-- MAIN ROW -->
      <div
  class="table-row"
  :class="{ 'no-hover': !hover }"
  :style="[gridStyle, props.rowStyle?.(item)]"
  @click="toggleRow(item)"
>
        <slot name="row" :item="item" :open="isOpen(item)" />
      </div>

      <!-- EXPANDED ROW -->
      <div v-if="$slots.expanded && isOpen(item)" class="expanded-container">
        <slot name="expanded" :item="item" />
      </div>
    </div>

    <!-- EMPTY -->
    <div v-if="!items.length" class="no-results">
      <slot name="empty"> Geen resultaten gevonden </slot>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'

//emits

// Props
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
  rowStyle: {
    type: Function,
    default: null,
  },
})

// Styles
const gridStyle = computed(() => ({
  gridTemplateColumns: props.columns,
}))

// Enkel één rij open
const openRowKey = ref(null)

// Voor objecten zonder id een stabiele tijdelijke key
const tempIds = new WeakMap()
function getKey(item) {
  if (item?.[props.itemKey]) return item[props.itemKey]
  if (item?.id) return item.id
  if (!tempIds.has(item)) tempIds.set(item, Date.now() + Math.random())
  return tempIds.get(item)
}

// Toggle expandable row
function toggleRow(item) {
  const key = getKey(item)
  openRowKey.value = openRowKey.value === key ? null : key
}

// Check of een rij open is
function isOpen(item) {
  return openRowKey.value === getKey(item)
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
  margin-bottom: 6px;
  align-items: center;
}

/* Hover effect */
.table-row:hover {
    filter: brightness(0.97);

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
   EXPANDED
========================================= */
.expanded-container {
  margin: -4px 0 10px 0;
  padding: 14px 18px;
  background: #f9fafb;
  border-radius: 12px;
  border: 1px solid rgba(0, 0, 0, 0.05);

  /* ✅ New slide animation */
  animation: slideDown 0.28s ease forwards;

  /* Prevent jump during animation */
  overflow: hidden;
  transform-origin: top;
}

@keyframes slideDown {
  0% {
    opacity: 0;
    transform: translateY(-8px) scaleY(0.95);
  }
  60% {
    transform: translateY(0px) scaleY(1.02);
  }
  100% {
    opacity: 1;
    transform: translateY(0) scaleY(1);
  }
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

.table-row.row-bezet {
  background: rgba(254, 243, 199, 0.6);
}

.table-row.row-gepland {
  background: rgba(147, 197, 253, 0.35);
}

.table-row.row-kapot {
  background: rgba(254, 226, 226, 0.7);
}

.table-row.row-ongekeurd {
  background: rgba(243, 244, 246, 0.8);
}

.table-row.row-vrij {
  background: #ffffff;
}
</style>
