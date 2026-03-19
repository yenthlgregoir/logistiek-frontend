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

      <div class="actions">
        <button class="btn btn-primary" @click="$emit('new')">
          <i class="fa fa-plus"></i> Add
        </button>
      </div>
    </div>

    <!-- TABLE HEADER -->
    <div class="table-header">
      <div>Klantnummer</div>
      <div>Naam</div>
    </div>

    <!-- FIXED HEIGHT LIST (geen scroll!) -->
    <div class="rows-container">
      <div
        v-for="k in filteredKlanten"
        :key="k._id || k.id"
        class="table-row"
        :class="{ selected: String(k._id) === String(selectedId) }"
        @click="$emit('select', k)"
      >
        <div>{{ k.klantNummer || 'N/A' }}</div>
        <div>{{ k.naam || 'Onbekend' }}</div>
      </div>

      <div v-if="!filteredKlanten.length" class="no-results">
        Geen resultaten gevonden
      </div>
    </div>

  </div>
</template>

<script setup>
import { computed } from "vue";

const props = defineProps({
  klanten: { type: Array, default: () => [] },
  selectedId: [Number, String],
  search: { type: String, default: "" },
});

defineEmits(["select", "new", "update:search"]);

const filteredKlanten = computed(() => {
  const term = props.search.toLowerCase();
  return props.klanten.filter((k) => {
    return (
      !term ||
      k.naam?.toLowerCase().includes(term) ||
      k.klantNummer?.toLowerCase().includes(term)
    );
  });
});
</script>

<style scoped>
.lijstweergave {
  width: 100%;
  font-family: "Inter", sans-serif;
}

/* -----------------------------------------
   TOOLBAR
----------------------------------------- */
.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
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

/* ACTIONS */
.actions {
  display: flex;
  gap: 8px;
  align-items: center;
}

.btn {
  padding: 10px 16px;
  border-radius: 10px;
  border: none;
  cursor: pointer;
  font-weight: 600;
}

.btn-primary {
  background: #5786f7;
  color: white;
  transition: 0.25s ease;
}

.btn-primary:hover {
  background: #3b6cf0;
  transform: translateY(-2px);
  box-shadow: 0 6px 14px rgba(0, 0, 0, 0.12);
}

/* -----------------------------------------
   TABLE HEADER
----------------------------------------- */
.table-header {
  display: grid;
  grid-template-columns: 1fr 2fr;
  padding: 14px 18px;
  background: #f0f0f0;
  backdrop-filter: blur(6px);
  font-weight: 700;
  color: #6e6e6e;
  border-radius: 14px;
  border: 1px solid rgba(0, 0, 0, 0.06);
  margin-bottom: 14px;
  font-size: 14px;
}

/* -----------------------------------------
   ROWS CONTAINER (FIXED HEIGHT)
----------------------------------------- */
.rows-container {
  display: flex;
  flex-direction: column;
  gap: 10px;

  /* 🔥 KEY PART: geen scroll, altijd passend */
  max-height: calc(100vh - 240px);
  overflow: hidden;
}

/* -----------------------------------------
   ROW
----------------------------------------- */
.table-row {
  display: grid;
  grid-template-columns: 1fr 2fr;
  padding: 16px 18px;
  background: #ffffff;
  border-radius: 14px;
  border: 1px solid rgba(0, 0, 0, 0.05);
  box-shadow: 0 3px 8px rgba(0, 0, 0, 0.08);
  cursor: pointer;
  transition: 0.25s;
}

.table-row:hover {
  background: #5786f7;
  color: white;
  transform: translateY(-3px);
}

.selected {
  background: #3b6cf0 !important;
  color: white;
  font-weight: 600;
}

/* EMPTY */
.no-results {
  text-align: center;
  padding: 2rem;
  font-size: 15px;
  color: #1b4965;
  font-style: italic;
}
</style>