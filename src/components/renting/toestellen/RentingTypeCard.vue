<template>
  <div class="type-card" :class="{ selected }" @click="select">

    <!-- IMAGE -->
    <div class="image-wrapper">

      <img
        class="type-image"
        :src="imageSrc"
        :alt="naam"
      />

      <!-- badge -->
      <span class="badge" v-if="selected">Geselecteerd</span>

    </div>

    <!-- INFO -->
    <div class="content">

      <h3 class="title">{{ naam }}</h3>

      <p class="sub">
        Type ID: {{ id }}
      </p>

    </div>

  </div>
</template>

<script setup>
import { computed } from "vue"

const props = defineProps({
  id: String,
  naam: String,
  image: String,
  modelValue: String,
})

const emit = defineEmits(["update:modelValue"])

const selected = computed(() => props.modelValue === props.id)

const select = () => {
  emit("update:modelValue", props.id)
}

const imageSrc = computed(() => {
  if (props.image) return props.image
  return new URL("@/assets/placeholder.png", import.meta.url).href
})
</script>.type-card {
  width: 260px;
  border-radius: 14px;
  background: #fff;
  box-shadow: 0 10px 25px rgba(0,0,0,0.08);
  cursor: pointer;
  transition: 0.2s ease;
  overflow: hidden;
  border: 2px solid transparent;
}

.type-card:hover {
  transform: translateY(-3px);
}

.type-card.selected {
  border-color: #2563eb;
}

.image-wrapper {
  height: 140px;
  background: #f3f4f6;
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
}

.type-image {
  max-height: 90px;
  object-fit: contain;
}

.badge {
  position: absolute;
  top: 10px;
  right: 10px;
  background: #2563eb;
  color: white;
  font-size: 11px;
  padding: 4px 8px;
  border-radius: 999px;
}

.content {
  padding: 12px;
}

.title {
  font-size: 15px;
  font-weight: 700;
  margin: 0;
}

.sub {
  font-size: 12px;
  color: #6b7280;
  margin-top: 4px;
}