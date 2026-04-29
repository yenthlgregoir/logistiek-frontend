<template>
  <label>
    <div class="card" :class="{ selected: modelValue === value }">
      <div class="header">
        <h3 class="title">{{ title }}</h3>

        <span class="radio">
          <span v-if="modelValue === value" class="radio-inner"></span>
        </span>
      </div>

      <div class="content">
        <img :src="imageSrc" alt="" class="image" />
      </div>

      <input
        type="radio"
        :value="value"
        :checked="modelValue === value"
        @change="$emit('update:modelValue', value)"
      />
    </div>
  </label>
</template>

<script setup>
import { computed } from 'vue'
const props = defineProps({
  title: String,
  image: String,
  value: String,
  modelValue: String,
})

const imageSrc = computed(() => {
  if (props.image === 'Schaarlift') {
    return new URL('@/assets/schaarlift.png', import.meta.url).href
  }
  if (props.image === 'Knikarm' || props.type === 'Knikarmhoogtewerker') {
    return new URL('@/assets/knikarm.png', import.meta.url).href
  } else {
    return new URL('@/assets/knikarm_schaarlift.png', import.meta.url).href
  }
})

defineEmits(['update:modelValue'])
</script>

<style scoped>
.card {
  width: 350px;
  height: 280px;
  padding: 18px 20px;
  border-radius: 20px;
  border: 2px solid #dbe4ff;
  background: #ffffff;
  cursor: pointer;
  box-sizing: border-box;

  display: flex;
  flex-direction: column;
}

/* geselecteerde staat */
.card.selected {
  background: #7ea6e0;
  border: 3px solid #1f3cff;
}

/* HEADER */
.header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start; /* 👈 beter dan center hier */
  margin-bottom: 8px;
}

.title {
  font-size: 24px;
  font-weight: 700;
  margin: 0;
  line-height: 1.1; /* 👈 voorkomt rare verticale verschuiving */
}
/* CONTENT (image perfect centreren) */
.content {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding-bottom: 10px; /* 👈 dit is de geheime saus */
}

/* image */
.image {
  max-width: 140px; /* 👈 groter maken */
  max-height: 140px;
  object-fit: contain;
}

/* radio */
.radio {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  border: 2px solid #c9c9c9;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0; /* 👈 voorkomt squish */
}

/* geselecteerde radio */
.card.selected .radio {
  background: #1f3cff;
  border-color: #1f3cff;
}

.radio-inner {
  width: 8px;
  height: 8px;
  background: #ffffff;
  border-radius: 50%;
}
.card.selected {
  background: #7ea6e0;
  border: 2px solid #1f3cff; /* 👈 niet dikker maken, cleaner */
}
/* echte radio verbergen */
input[type='radio'] {
  display: none;
}

.card {
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease,
    border-color 0.2s ease,
    background 0.2s ease;
}

/* hover effect */
.card:hover {
  transform: translateY(-4px);
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.08);
  border-color: #b8c8ff;
}

/* hover op radio */
.card:hover .radio {
  border-color: #1f3cff;
}
</style>
