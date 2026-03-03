<template>
  <div class="toolbar">
    <div class="search">
      <i class="fa fa-search"></i>
      <input type="text" placeholder="Zoek" v-model="searchProxy" />
    </div>
    <div class="actions">
      <div class="filter-container" style="position: relative">
        <button class="btn btn-secondary" @click="showFilters = !showFilters">
          <i class="fa fa-filter"></i> Filter
        </button>

        <!-- POPUP -->
        <div
          v-if="showFilters"
          class="filter-popup"
          style="
            position: absolute;
            top: 42px;
            right: 0;
            background: white;
            border: 1px solid #d1d5db;
            border-radius: 6px;
            padding: 14px;
            width: 180px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            z-index: 200;
          "
        >
          <label>Type</label>
          <select v-model="typeProxy" style="width: 100%; margin-bottom: 10px">
            <option value="">Alle</option>
            <option v-for="t in types" :key="t" :value="t">{{ t.naam }}</option>
          </select>

          <label>Klant</label>
          <select v-model="klantProxy" style="width: 100%; margin-bottom: 10px">
            <option value="">Alle</option>
            <option v-for="k in klanten" :key="k.naam" :value="k.naam">
              {{ k.naam }}
            </option>
          </select>

          <button class="btn btn-primary" style="width: 100%" @click="showFilters = false">
            Sluiten
          </button>
        </div>
      </div>

      <button class="btn btn-primary" @click="onCreate"><i class="fa fa-plus"></i> Add</button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  search: String,
  type: String,
  klant: String,
  types: Array,
  klanten: Array,
})

const emit = defineEmits(['update:search', 'update:type', 'update:klant', 'create'])

/* Search proxy */
const searchProxy = computed({
  get: () => props.search,
  set: (v) => emit('update:search', v),
})

/* Type filter */
const typeProxy = computed({
  get: () => props.type,
  set: (v) => emit('update:type', v.naam),
})

/* Klant filter */
const klantProxy = computed({
  get: () => props.klant,
  set: (v) => emit('update:klant', v),
})

const showFilters = ref(false)

function onCreate() {
  emit('create')
}
</script>

<style scoped>
.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.search {
  position: relative;
}

.search input {
  padding: 8px 12px 8px 32px;
  border-radius: 6px;
  border: 1px solid #d1d5db;
}

.search i {
  position: absolute;
  left: 10px;
  top: 50%;
  transform: translateY(-50%);
  color: #9ca3af;
}

.actions {
  display: flex;
  gap: 8px;
}

.btn {
  padding: 8px 14px;
  border-radius: 4px;
  border: none;
  cursor: pointer;
}

.btn-primary {
  background: #2f80ed;
  color: white;
}

.btn-secondary {
  background: #e6f0fa;
  color: #1f4e79;
}
select {
  padding: 6px 10px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 12px;
  width: 100%;
  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease;
}

select:focus {
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.2);
  outline: none;
}
</style>
