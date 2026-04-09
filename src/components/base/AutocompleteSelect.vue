<template>
  <div class="autocomplete" ref="box">
    <input
      type="text"
      v-model="search"
      :placeholder="placeholder"
      class="autocomplete-input"
      @focus="openDropdown"
      @input="filterOptions"
      @keydown.down.prevent="nextOption"
      @keydown.up.prevent="prevOption"
      @keydown.enter.prevent="selectHighlighted"
    />

    <ul v-if="showDropdown" class="autocomplete-list">
      <li
        v-for="(option, index) in filteredOptions"
        :key="option._id"
        :class="{ highlighted: index === highlightedIndex }"
        @mousedown.prevent="selectOption(option)"
      >
        {{ option[labelKey] }}
      </li>
      <li v-if="filteredOptions.length === 0" class="no-results">Geen resultaten</li>
    </ul>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, onUnmounted } from 'vue'

const props = defineProps({
  modelValue: [String, Number],
  options: { type: Array, required: true },
  labelKey: { type: String, required: true },
  placeholder: { type: String, default: '' }
})

const emit = defineEmits(['update:modelValue', 'select'])

const box = ref(null)
const search = ref('')
const showDropdown = ref(false)
const filteredOptions = ref([])
const highlightedIndex = ref(0)

// watch voor props.options correct gebruiken
watch(() => props.options, () => {
  filteredOptions.value = [...props.options]
})

function openDropdown() {
  showDropdown.value = true
  filteredOptions.value = [...props.options]
}

function filterOptions() {
  const q = search.value.toLowerCase().trim()
  filteredOptions.value = props.options.filter(o =>
    String(o[props.labelKey]).toLowerCase().includes(q)
  )
  highlightedIndex.value = 0
}

function selectOption(option) {
  search.value = option[props.labelKey]
  emit('update:modelValue', option._id)
  emit('select', option)
  showDropdown.value = false
}

function selectHighlighted() {
  if (filteredOptions.value.length > 0) {
    selectOption(filteredOptions.value[highlightedIndex.value])
  }
}

function nextOption() {
  if (highlightedIndex.value < filteredOptions.value.length - 1) highlightedIndex.value++
}

function prevOption() {
  if (highlightedIndex.value > 0) highlightedIndex.value--
}

function handleClickOutside(e) {
  if (box.value && !box.value.contains(e.target)) showDropdown.value = false
}

onMounted(() => document.addEventListener('click', handleClickOutside))
onUnmounted(() => document.removeEventListener('click', handleClickOutside))
</script>
<style scoped>
.autocomplete {
  position: relative;
}

.autocomplete-input {
  padding: 0.7rem 0.9rem;
  border-radius: 10px;
  border: 1px solid #cbd5e1;
  width: 100%;
}

.autocomplete-list {
  position: absolute;
  left: 0;
  right: 0;
  top: calc(100% + 4px);
  background: white;
  border: 1px solid #cbd5e1;
  border-radius: 10px;
  max-height: 30vh;
  overflow-y: auto;
  z-index: 10;
  list-style: none;
  margin: 0;
  padding: 6px 0;
}

.autocomplete-list li {
  padding: 10px;
  cursor: pointer;
}

.autocomplete-list li:hover,
.autocomplete-list li.highlighted {
  background: #f1f5f9;
}

.no-results {
  padding: 10px 12px;
  color: #64748b;
  font-style: italic;
}
</style>