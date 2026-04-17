<template>
  <div v-if="totalPages > 1" class="pagination">
    <button :disabled="currentPage === 1" @click="$emit('prev')">
      Vorige
    </button>

    <span>
      Pagina {{ currentPage }} van {{ totalPages }}
    </span>

    <button :disabled="currentPage === totalPages" @click="$emit('next')">
      Volgende
    </button>
  </div>
</template>

<script setup>
defineProps({
  currentPage: Number,
  totalPages: Number,
})

defineEmits(['next', 'prev'])
</script>

<style scoped>
.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 12px;
  margin-top: 20px;
}

button {
  padding: 6px 12px;
  border-radius: 6px;
  border: none;
  background: #5786f7;
  color: white;
  cursor: pointer;
}

button:disabled {
  background: #a1b9f5;
  cursor: not-allowed;
}
</style>