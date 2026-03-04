<template>
  <div class="klanten-pane">
    <div class="table-wrapper">
      <div class="header">
        <input
          :value="search"
          @input="$emit('update:search', $event.target.value)"
          placeholder="Search"
        />
        <button @click="$emit('new')">+ Add</button>
      </div>

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
              class="row"
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

<style scoped>
/* Buitenste pane wordt vanuit View een flex-column */
.klanten-pane {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0; /* cruciaal */
}

/* Table wrapper = het "paneel" met borders en padding */
.table-wrapper {
  background: white;
  border: 1px solid #ddd;

  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 10px;

  /* neemt de volledige hoogte van de .klanten-pane */
  flex: 1 1 auto;
  min-height: 0; /* cruciaal */
  overflow: hidden; /* wrapper mag NIET scrollen */
}

/* Header */
.header {
  display: flex;
  gap: 10px;
  flex: 0 0 auto;
}
input {
  padding: 6px;
  border-radius: 4px;
  border: 1px solid #ccc;
  width: 100%;
}
button {
  padding: 6px 12px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  background: #2f80ed;
  color: #fff;
  font-weight: 600;
}
button:hover {
  background: #2262b6;
}

/* Scrollende zone voor de tabel */
.table-scroll {
  flex: 1 1 auto; /* neemt de resterende hoogte */
  min-height: 0; /* noodzakelijk binnen flex */
  overflow: auto; /* <-- HIER scrollt het */
}

/* Tabel + sticky header */
.table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  table-layout: fixed;
}
thead tr {
  background: #8ec6f7;
}

th:first-child {
  border-top-left-radius: 8px;
}
th:last-child {
  border-top-right-radius: 8px;
}
th,
td {
  padding: 12px 14px;
  border-bottom: 1px solid #e5e7eb;
  text-align: left;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.row:hover {
  background: #f0f7ff;
}
.selected {
  background: #cfe8ff !important;
}

.empty {
  text-align: center;
  color: #9ca3af;
  padding: 24px;
}
</style>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  klanten: Array,
  selectedId: Number,
  search: String,
})

const filteredKlanten = computed(() => {
  if (!props.search) return props.klanten
  return props.klanten.filter((k) => k.naam.toLowerCase().includes(props.search.toLowerCase()))
})
</script>
