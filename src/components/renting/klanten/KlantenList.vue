<template>
  <div class="klanten-pane">
    <div class="table-wrapper">
      <!-- Header -->
      <div class="header">
        <input
          :value="search"
          @input="$emit('update:search', $event.target.value)"
          placeholder="Zoek klant..."
        />
        <button @click="$emit('new')">+ Add</button>
      </div>

      <!-- Scrollable table -->
      <div class="table-scroll">
        <table class="table">
          <thead>
            <tr>
              <th>Klantnummer</th>
              <th>Naam</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="k in filteredKlanten"
              :key="k._id || k.id"
              :class="{ selected: String(k._id) === String(selectedId) }"
              @click="$emit('select', k)"
            >
              <td>{{ k.klantNummer }}</td>
              <td>{{ k.naam }}</td>
            </tr>

            <tr v-if="filteredKlanten.length === 0">
              <td colspan="2" class="empty">Geen resultaten</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  klanten: Array,
  selectedId: [Number, String],
  search: String,
})

const filteredKlanten = computed(() => {
  if (!props.search) return props.klanten
  const q = props.search.toLowerCase()
  return props.klanten.filter((k) => k.naam.toLowerCase().includes(q))
})
</script>

<style scoped>
.klanten-pane {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

/* Pane wrapper */
.table-wrapper {
  background: #ffffff;
  border-radius: 12px;
  padding: 16px;
  flex: 1 1 auto;
  display: flex;
  flex-direction: column;
  gap: 12px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.05);
  min-height: 0;
  overflow: hidden;
}

/* Header */
.header {
  display: flex;
  gap: 12px;
  flex: 0 0 auto;
}
.header input {
  flex: 1;
  padding: 8px 12px;
  border-radius: 10px;
  border: 1px solid #e5e7eb;
  font-size: 14px;
  transition: all 0.2s ease;
}
.header input:focus {
  outline: none;
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.15);
}

.header button {
  background: #2563eb;
  color: #fff;
  font-weight: 600;
  border: none;
  border-radius: 10px;
  padding: 8px 14px;
  cursor: pointer;
  transition: all 0.2s ease;
}
.header button:hover {
  background: #1d4ed8;
}

/* Scrollable table */
.table-scroll {
  flex: 1 1 auto;
  min-height: 0;
  overflow: auto;
}

/* Table */
.table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  table-layout: fixed;
}
.table thead tr {
  background: #f3f4f6;
}
.table th,
.table td {
  padding: 12px 16px;
  text-align: left;
  font-size: 14px;
  font-weight: 500;
  color: #111827;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.table th:first-child {
  border-top-left-radius: 8px;
}
.table th:last-child {
  border-top-right-radius: 8px;
}

/* Rows */
.table tbody tr {
  transition: all 0.15s ease;
  cursor: pointer;
  background: #ffffff;
  border-radius: 8px;
  margin-bottom: 2px;
}
.table tbody tr:hover {
  background: #f0f7ff;
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}
.selected {
  background: #dbeafe !important;
  font-weight: 600;
}

/* Empty state */
.empty {
  text-align: center;
  padding: 20px;
  color: #9ca3af;
  font-style: italic;
}
</style>
