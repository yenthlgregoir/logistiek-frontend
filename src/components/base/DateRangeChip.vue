<template>
  <div class="dropdown-chip" ref="dropdownRef">
    <!-- CHIP -->
    <div class="chip" @click="toggleDropdown">
      <span>{{ selectedLabel }}</span>

      <div class="devider"></div>

      <button class="close-btn" @click.stop="clearSelection">
        ✕
      </button>
    </div>

    <!-- DROPDOWN -->
    <div class="dropdown" :class="{ open }">
      <el-date-picker
        v-model="internalValue"
        type="daterange"
        range-separator="Tot"
        start-placeholder="Start datum"
        end-placeholder="Eind datum"
        format="DD/MM/YYYY"
        value-format="YYYY-MM-DD"
        unlink-panels
        @change="handleChange"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch } from "vue";

const props = defineProps({
  modelValue: {
    type: Array,
    default: () => [],
  },

  title: {
    type: String,
    default: "Selecteer periode",
  },
});

const emit = defineEmits([
  "update:modelValue",
  "clear",
]);

const open = ref(false);
const dropdownRef = ref(null);

const internalValue = ref(props.modelValue);

/**
 * Sync external model
 */
watch(
  () => props.modelValue,
  (val) => {
    internalValue.value = val;
  }
);

/**
 * Toggle dropdown
 */
const toggleDropdown = () => {
  open.value = !open.value;
};

/**
 * Handle date change
 */
const handleChange = (value) => {
  emit("update:modelValue", value);
};

/**
 * Clear selection
 */
const clearSelection = () => {
  internalValue.value = [];
  emit("update:modelValue", []);
  emit("clear");
};

/**
 * Selected label
 */
const selectedLabel = computed(() => {
  if (
    !internalValue.value ||
    internalValue.value.length !== 2
  ) {
    return props.title;
  }

  return `${internalValue.value[0]} - ${internalValue.value[1]}`;
});

/**
 * Click outside
 */
const handleClickOutside = (e) => {
  if (
    dropdownRef.value &&
    !dropdownRef.value.contains(e.target)
  ) {
    open.value = false;
  }
};

onMounted(() => {
  document.addEventListener(
    "click",
    handleClickOutside
  );
});

onBeforeUnmount(() => {
  document.removeEventListener(
    "click",
    handleClickOutside
  );
});
</script>

<style scoped>
.dropdown-chip {
  position: relative;
  display: inline-block;
}

/* CHIP */
.chip {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;

  border: 1px solid #ccc;
  border-radius: 999px;

  background: transparent;
  cursor: pointer;

  transition: all 0.15s ease;
}

.chip:hover {
  border: 1px solid #007BF7;
  color: #007BF7;
  background-color: #B7DBFF;
}

.devider {
  width: 1px;
  height: 20px;
  background-color: #ccc;
}

.close-btn {
  border: none;
  background: transparent;
  cursor: pointer;
}

/* DROPDOWN */
.dropdown {
  position: absolute;
  top: 110%;
  left: 0;

  background: white;
  border: 1px solid #ccc;
  border-radius: 12px;

  padding: 12px;

  box-shadow: 0 4px 10px rgba(0,0,0,0.1);

  opacity: 0;
  transform: translateY(-6px);
  pointer-events: none;

  transition: all 0.15s ease;

  z-index: 999;
}

.dropdown.open {
  opacity: 1;
  transform: translateY(0);
  pointer-events: auto;
}
</style>