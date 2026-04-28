<template>
  <div class="machine-card">
    <!-- Header -->
    <div class="card-header">
      <h2 class="model">{{ model }}</h2>
      <p class="brand">MERK - {{ brand }}</p>
    </div>

    <!-- Image -->
    <div class="image-wrapper">
      <img
  class="machine-image"
  :src="imageSrc"
  :alt="type || 'Hoogtewerker'"
/>

      <!-- TYPE BADGE (terug ✅) -->
       
<span v-if="aantal" class="badge badge-count">
  {{ aantal }}x
</span>

      <span v-if="type" class="badge">{{ type }}</span>

      <!-- Hoogte-indicator -->
      <div class="height-indicator">
        <div class="height-line"></div>

        <div class="height-label">
          {{ werkhoogte }} m
        </div>
      </div>
    </div>

    <!-- Specs -->
  <div class="specs">
      <div class="spec">
        <span class="label">Werkhoogte</span>
        <span class="value highlight">{{ werkhoogte }} m</span>
      </div>

      <div class="spec">
        <span class="label">Hefvermogen</span>
        <span class="value highlight">{{ hefvermogen }} kg</span>
      </div>

      <div class="spec">
        <span class="label">Ingeklapte hoogte</span>
        <span class="value">{{ ingeklapteHoogte }} m</span>
      </div>

      <div class="spec">
        <span class="label">Breedte</span>
        <span class="value">{{ breedte }} m</span>
      </div>
    </div>

    <p class="description">
      {{ description }}
    </p>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  model: { type: String, required: true },
  brand: { type: String, required: true },
  type: { type: String, default: '' },

  werkhoogte: { type: Number, required: true },
  hefvermogen: { type: Number, required: true },
  ingeklapteHoogte: { type: Number, required: true },
  breedte: { type: Number, required: true },

  description: { type: String, required: true },
  
  aantal: { type: Number, default: 0 }

})

const imageSrc = computed(() => {
  if (props.type === 'Schaarlift') {
    return new URL('@/assets/schaarlift.png', import.meta.url).href
  }

  if (props.type === 'Knikarm' || props.type === 'Knikarmhoogtewerker') {
    return new URL('@/assets/knikarm.png', import.meta.url).href
  }

  // fallback
  return new URL('@/assets/placeholder.png', import.meta.url).href
})
</script>


<style scoped>
/* Card */
.machine-card {
  width: 350px; /* iets breder ✅ */
  background: #ffffff;
  border-radius: 18px;
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.12);
  overflow: hidden;
  font-family: system-ui, -apple-system, sans-serif;
  transition: transform 0.15s ease, box-shadow 0.25s ease;
}

.machine-card:hover {
  transform: scale(1.01);
  box-shadow: 0 16px 36px rgba(0, 0, 0, 0.18);
}

/* Header */
.card-header {
  background: #5b84f6;
  color: white;
  padding: 16px;
}

.model {
  font-size: 22px;
  font-weight: 700;
  margin: 0;
}

.brand {
  margin-top: 4px;
  font-size: 13px;
  opacity: 0.9;
}

/* Image zone */
.image-wrapper {
  position: relative;
  height: 240px;
  background: #f1f5fb;
  display: flex;
  justify-content: center;
  align-items: end;
  
}
.image-wrapper::after {
  content: '';
  position: absolute;
  bottom: 15px;         
  left: 16px;
  right: 16px;

  height: 2px;

  background-image: repeating-linear-gradient(
    to right,
    #c7d2fe 0,
    #c7d2fe 6px,
    transparent 6px,
    transparent 12px
  );
}
.machine-image {
  max-height: 150px;
  max-width: 70%;
  object-fit: contain;
  margin-bottom: 1rem;

}

/* Type badge */
/* bestaande badge */
.badge {
  position: absolute;
  top: 14px;
  right: 14px;
  background: #bed0ff;
  color: #2d4cc8;
  padding: 5px 12px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 700;
}

/* ✅ AANTAL BADGE (linksboven) */
.badge-count {
  left: 14px;
  right: auto;

  background: #000000;
  color: #ffffff;

  font-weight: 800;
  letter-spacing: 0.5px;
}

/* Hoogte-indicator */
.height-indicator {
  position: relative;
  margin-left: 1rem ;
  margin-bottom: 1rem;
  display: flex;
  align-items: end;

}

/* Lijn = even hoog als image */
.height-line {
  height: 150px; /* exact gelijk aan max image hoogte ✅ */
  width: 2px;
  background-image: repeating-linear-gradient(
    to bottom,
    #4fa3ff 0,
    #4fa3ff 4px,
    transparent 4px,
    transparent 8px
  );
}

/* Label gecentreerd naast lijn */
.height-label {
  position: absolute;
  top: 50%;
  left: 10px;
  transform: translateY(-50%);
  font-size: 13px;
  font-weight: 700;
  color: #4fa3ff;
  white-space: nowrap;
}
/* Specs */
.specs {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  padding: 14px;
  border-bottom: 1px solid #e5e7eb;
}

.spec {
  display: flex;
  flex-direction: column;
}

.label {
  font-size: 11px;
  color: #6b7280;
  text-transform: uppercase;
}

.value {
  font-size: 15px;
  font-weight: 600;
}

.highlight {
  color: #1d4ed8;
}

/* Description */
.description {
  padding: 20px;
  font-size: 14px;
  line-height: 1.5;
  color: #374151;
}
</style>
