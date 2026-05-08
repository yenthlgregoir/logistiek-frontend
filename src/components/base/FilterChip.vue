<template>
  <div class="dropdown-chip">
    <!-- Chip -->
    <div class="chip" @click="toggleDropdown">
      <span>{{ selectedLabel }}</span>
      <div class="devider"></div>
      <button class="close-btn" @click.stop="clearSelection">✕</button>
    </div>

    <!-- Dropdown -->
    <div v-if="open" class="dropdown">
      <div
        v-for="option in options"
        :key="option._id"
        class="dropdown-item"
        @click="selectOption(option)"
      >
        {{ option.naam }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from "vue";

const props = defineProps({
  modelValue: {
    type: [String, Number, null],
    default: null,
  },
  options: {
    type: Array,
    required: true,
  },
});

const emit = defineEmits(["update:modelValue", "clear"]);

const open = ref(false);

const toggleDropdown = () => {
  open.value = !open.value;
};

const selectOption = (option) => {
  emit("update:modelValue", option.value);
  open.value = false;
};

const clearSelection = () => {
  emit("update:modelValue", null);
  emit("clear");
};

const selectedLabel = computed(() => {
  const found = props.options.find(
    (opt) => opt.value === props.modelValue
  );
  return found ? found.label : "Selecteer...";
});
</script>

<style scoped>
.dropdown-chip {
  position: relative;
  display: inline-block;
}

.chip {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border: 1px solid #ccc;
  border-radius: 999px;
  background: transparent;
  cursor: pointer;
}
.chip:hover
{
  border: 1px solid #007BF7;
  color: #007BF7;
  background-color: #B7DBFF;
  cursor:pointer;
}
.chip:hover .close-btn{
      color: #007BF7;

}

.chip .close-btn:hover {
  color: #130066;
}

.chip:has(.close-btn:hover) .devider {
  background-color: #130066;
}

.close-btn {
  border: none;
  background: transparent;
  cursor: pointer;
  font-size: 14px;
}

.dropdown {
  position: absolute;
  top: 110%;
  left: 0;
  background: white;
  border: 1px solid #ccc;
  border-radius: 8px;
  min-width: 150px;
  box-shadow: 0 4px 10px rgba(0,0,0,0.1);
}

.dropdown-item {
  padding: 8px 12px;
  cursor: pointer;
}

.dropdown-item:hover {
  background: #eee;
}
.devider{
    width: 1px;
    height: 20px;
    background-color: #ccc;
}

.chip:hover .devider{
    background-color: #007BF7;
}
</style>