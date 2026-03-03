<template>
  <div class="toolbar">
    <div class="search">
      <i class="fa fa-search"></i>
      <input type="text" placeholder="Zoek op product" v-model="searchProxy" />
    </div>
    <div class="actions">
      <!-- Ronde downloadknop met alleen icoon -->
      <button class="btn btn-round" @click="$emit('download')">
        <i class="fa fa-download"></i>
      </button>

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
const emit = defineEmits(['update:search', 'create', 'download'])

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
.btn-round {
  width: 40px;
  height: 40px;
  padding: 0;
  border-radius: 50%; /* maakt de knop rond */
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 16px; /* grootte van het icoon */
}
</style>
