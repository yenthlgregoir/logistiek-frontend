<template>
  <div :class="['searchbar-wrapper']" class="divsearch" :style="{ width: width }">
    <i v-if="icon" :class="icon" class="search-icon"></i>
    <input
      type="text"
      :placeholder="placeholder"
      v-model="internalValue"
      @input="onInput"
      class="search-input"
    />
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import debounce from 'lodash/debounce'

const props = defineProps({
  modelValue: String,
  placeholder: { type: String, default: 'Zoek...' },
  width: { type: String, default: '260px' },
  icon: { type: String, default: 'fa fa-search' },
  debounceTime: { type: Number, default: 300 },
})

const emit = defineEmits(['update:modelValue'])

const internalValue = ref(props.modelValue)

// Sync prop changes
watch(
  () => props.modelValue,
  (val) => (internalValue.value = val),
)

// Debounced input emit
const onInput = debounce(() => emit('update:modelValue', internalValue.value), props.debounceTime)
</script>

<style scoped>
.searchbar-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}
.search-input {
  width: 100%;
  padding: 8px 10px 8px 32px;
  padding-right: 32px;
  border-radius: 8px;
  font-size: 14px;
  background-color: transparent;
  border: 2px solid transparent;
  transition: border-color 0.2s ease;
}
.search-input:focus {
  outline: none;
  border: 2px solid rgb(140, 169, 248);
}
.search-icon {
  position: absolute;
  left: 10px;
  top: 50%;
  transform: translateY(-50%);
  color: #6b7280;
}
</style>
