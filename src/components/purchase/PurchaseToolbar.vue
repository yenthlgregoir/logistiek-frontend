<template>
  <div class="toolbar">
    <div class="search">
      <i class="fa fa-search"></i>
      <input type="text" placeholder="Zoek op referentie" v-model="searchProxy" />
    </div>
    <div class="actions">
      <button class="btn btn-secondary"><i class="fa fa-filter"></i> Filter</button>
      <button class="btn btn-primary" @click="onCreate"><i class="fa fa-plus"></i> Add</button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

// Props en emits één keer definiëren
const props = defineProps({
  search: String,
})
const emit = defineEmits(['update:search', 'create'])

// Computed proxy voor v-model binding
const searchProxy = computed({
  get: () => props.search,
  set: (val) => emit('update:search', val),
})

// Functie voor create knop
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
</style>
