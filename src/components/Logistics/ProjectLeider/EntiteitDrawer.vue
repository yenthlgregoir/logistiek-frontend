<template>
  <BaseDrawer :show="show" title="Nieuwe Entiteit" @close="$emit('close')">
    <div class="form-container">
      <div class="info-block">
        <label>Naam</label>
        <input v-model="form.naam" placeholder="Naam entiteit" />
      </div>

      <div class="info-block">
        <label>Kleur</label>
        <input type="color" v-model="form.kleur" />
      </div>

      <div class="info-block">
        <label>Icon</label>
        <input v-model="search" placeholder="Zoek icon..." autocomplete="off" spellcheck="false" />
        <div class="icon-grid">
          <div
            v-for="icon in filteredIcons"
            :key="icon"
            class="icon-item"
            :class="{ selected: form.icon === icon }"
            @click="form.icon = icon"
          >
            <span class="material-icons" :style="{ color: form.kleur }">
              {{ icon }}
            </span>
            <span class="icon-name">{{ icon }}</span>
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <button class="btn btn-secondary" @click="$emit('close')">Cancel</button>
      <button class="btn btn-primary" @click="save">Save</button>
    </template>
  </BaseDrawer>
</template>

<script setup>
import { ref, computed } from 'vue'
import BaseDrawer from '@/components/base/BaseDrawer.vue'

defineProps({ show: Boolean })
const emit = defineEmits(['close', 'created'])

const form = ref({
  naam: '',
  kleur: '#000000',
  icon: '',
})

const search = ref('')

const materialIcons = [
  'ac_unit',
  'air',
  'thermostat',
  'fire_extinguisher',
  'local_fire_department',
  'water',
  'opacity',
  'bolt',
  'flash_on',
  'power',
  'build',
  'settings',
  'precision_manufacturing',
  'sensor_door',
  'restaurant',
  'kitchen',
  'local_cafe',
  'free_breakfast',
  'local_dining',
  'warehouse',
  'inventory',
  'local_shipping',
  'engineering',
  'construction',
  'solar_power',
]

const filteredIcons = computed(() => {
  if (!search.value) return materialIcons
  return materialIcons.filter((i) => i.toLowerCase().includes(search.value.toLowerCase()))
})

function save() {
  if (!form.value.naam.trim()) {
    alert('Naam is verplicht')
    return
  }
  if (!form.value.icon) {
    alert('Icon is verplicht')
    return
  }
  // Genereer een random id
  const newEntiteit = {
    naam: form.value.naam,
    color: form.value.kleur,
    icon: form.value.icon,
  }
  emit('created', newEntiteit)
  emit('close')
  form.value = { naam: '', kleur: '#000000', icon: '' }
}
</script>

<style scoped>
.form-container {
  flex: 1;
  overflow-y: auto;
  padding: 16px 12px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* icon-grid max-height kan groter zodat meer icons zichtbaar zijn */

.info-block {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.info-block label {
  font-size: 14px;
  font-weight: 600;
  color: #4b5563; /* medium gray */
  user-select: none;
}

input[type='text'],
input[type='color'],
input[type='search'],
input[type='email'],
input[type='password'],
select {
  padding: 10px 14px;
  border-radius: 10px;
  border: 1.8px solid #d1d5db;
  font-size: 15px;
  font-weight: 500;
  color: #111827;
  outline-offset: 2px;
  transition:
    border-color 0.25s ease,
    box-shadow 0.25s ease;
  background-color: #fafafa;
  box-shadow: inset 0 1px 3px rgb(0 0 0 / 0.06);
}

input[type='text']:focus,
input[type='color']:focus,
input[type='search']:focus,
input[type='email']:focus,
input[type='password']:focus,
select:focus {
  border-color: #3b82f6;
  box-shadow: 0 0 8px #3b82f6aa;
  background-color: #fff;
}

.icon-grid {
  max-height: none;
  overflow-y: auto;
}

.icon-grid::-webkit-scrollbar {
  width: 6px;
}

.icon-grid::-webkit-scrollbar-track {
  background: transparent;
}

.icon-grid::-webkit-scrollbar-thumb {
  background-color: #a5b4fc;
  border-radius: 12px;
}

.icon-item {
  cursor: pointer;
  border-radius: 12px;
  padding: 12px 0;
  text-align: center;
  user-select: none;
  border: 2px solid transparent;
  background-color: #f9fafb;
  transition:
    background-color 0.3s ease,
    border-color 0.3s ease,
    transform 0.15s ease;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.icon-item:hover {
  background-color: #eff6ff;
  border-color: #3b82f6;
  transform: translateY(-3px);
  box-shadow: 0 6px 12px rgba(59, 130, 246, 0.3);
}

.icon-item.selected {
  border-color: #2563eb;
  background-color: #dbeafe;
  box-shadow: 0 6px 16px rgba(37, 99, 235, 0.45);
}

.material-icons {
  font-size: 30px;
  user-select: none;
  color: inherit;
  line-height: 1;
}

.icon-name {
  margin-top: 6px;
  font-size: 12px;
  font-weight: 500;
  color: #374151;
  user-select: none;
  word-break: break-word;
}
.info-block input {
  padding: 8px 10px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 14px;
}
</style>
