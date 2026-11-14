<template>
  <BaseDrawer
    :show="show"
    :title="isEditMode ? 'Entiteit bewerken' : 'Nieuwe entiteit'"
    @close="$emit('close')"
  >
    <form id="entiteit-form" class="form" novalidate @submit.prevent="save">
      <!-- PREVIEW -->
      <div class="preview" :style="{ '--c': form.kleur }">
        <span class="preview__icon">
          <span v-if="form.icon" class="material-icons">{{ form.icon }}</span>
          <span v-else class="preview__initial">{{ initial }}</span>
        </span>
        <span class="preview__name">{{ form.naam.trim() || 'Naam entiteit' }}</span>
      </div>

      <!-- NAAM -->
      <div class="field">
        <label for="ent-naam">Naam</label>
        <input
          id="ent-naam"
          ref="naamInput"
          v-model="form.naam"
          type="text"
          placeholder="Bv. Koeltechniek"
          :class="{ invalid: errors.naam }"
          @input="errors.naam = ''"
        />
        <small v-if="errors.naam" class="error">{{ errors.naam }}</small>
      </div>

      <!-- KLEUR -->
      <div class="field">
        <label>Kleur</label>
        <div class="swatches">
          <button
            v-for="c in presetColors"
            :key="c"
            type="button"
            class="swatch"
            :class="{ selected: form.kleur.toLowerCase() === c }"
            :style="{ background: c }"
            :aria-label="`Kleur ${c}`"
            @click="form.kleur = c"
          />
          <label class="swatch swatch--custom" :class="{ selected: isCustomColor }" title="Eigen kleur">
            <input v-model="form.kleur" type="color" aria-label="Eigen kleur kiezen" />
            <span :style="{ background: isCustomColor ? form.kleur : undefined }">+</span>
          </label>
        </div>
      </div>

      <!-- ICON -->
      <div class="field">
        <div class="field__head">
          <label for="ent-icon-search">Icoon</label>
          <span v-if="form.icon" class="selected-label">{{ pretty(form.icon) }}</span>
        </div>

        <input
          id="ent-icon-search"
          v-model.trim="search"
          type="search"
          placeholder="Zoek icoon…"
          autocomplete="off"
          spellcheck="false"
        />

        <div class="icon-grid" :class="{ invalid: errors.icon }" role="listbox" aria-label="Iconen">
          <button
            v-for="icon in filteredIcons"
            :key="icon"
            type="button"
            role="option"
            class="icon-item"
            :class="{ selected: form.icon === icon }"
            :aria-selected="form.icon === icon"
            :title="pretty(icon)"
            :style="{ '--c': form.kleur }"
            @click="selectIcon(icon)"
          >
            <span class="material-icons">{{ icon }}</span>
          </button>

          <p v-if="!filteredIcons.length" class="no-results">Geen iconen gevonden</p>
        </div>
        <small v-if="errors.icon" class="error">{{ errors.icon }}</small>
      </div>
    </form>

    <template #footer>
      <button type="button" class="btn btn-secondary" @click="$emit('close')">Annuleren</button>
      <button type="submit" form="entiteit-form" class="btn btn-primary">
        {{ isEditMode ? 'Wijzigingen opslaan' : 'Toevoegen' }}
      </button>
    </template>
  </BaseDrawer>
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue'
import BaseDrawer from '@/components/base/BaseDrawer.vue'

const props = defineProps({
  show: Boolean,
  entity: { type: Object, default: null },
})

const emit = defineEmits(['close', 'created', 'updated'])

const presetColors = [
  '#3553f2', '#0ea5e9', '#14b8a6', '#22c55e',
  '#eab308', '#f97316', '#ef4444', '#ec4899',
  '#8b5cf6', '#64748b',
]

const emptyForm = () => ({ naam: '', kleur: presetColors[0], icon: '' })

const form = ref(emptyForm())
const errors = ref({ naam: '', icon: '' })
const search = ref('')
const naamInput = ref(null)

const isEditMode = computed(() => !!props.entity)
const isCustomColor = computed(() => !presetColors.includes(form.value.kleur.toLowerCase()))
const initial = computed(() => (form.value.naam.trim().charAt(0) || '?').toUpperCase())

/* Bij elke keer openen het formulier (opnieuw) vullen */
watch(
  () => [props.show, props.entity],
  async ([show]) => {
    if (!show) return
    const e = props.entity
    form.value = e
      ? { naam: e.naam || '', kleur: e.color || presetColors[0], icon: e.icon || '' }
      : emptyForm()
    errors.value = { naam: '', icon: '' }
    search.value = ''
    await nextTick()
    naamInput.value?.focus()
  },
  { immediate: true },
)

const materialIcons = [
  'ac_unit', 'air', 'thermostat', 'fire_extinguisher', 'local_fire_department',
  'water', 'water_drop', 'opacity', 'bolt', 'flash_on', 'power', 'electrical_services',
  'build', 'handyman', 'settings', 'precision_manufacturing', 'engineering', 'construction',
  'plumbing', 'sensor_door', 'roofing', 'foundation', 'solar_power', 'eco',
  'restaurant', 'kitchen', 'local_cafe', 'free_breakfast', 'local_dining',
  'warehouse', 'inventory', 'local_shipping', 'business', 'apartment', 'home_work', 'factory',
]

const pretty = (name) => name.replace(/_/g, ' ')

const filteredIcons = computed(() => {
  const q = search.value.toLowerCase().replace(/\s+/g, '_')
  return q ? materialIcons.filter((i) => i.includes(q)) : materialIcons
})

function selectIcon(icon) {
  form.value.icon = icon
  errors.value.icon = ''
}

function validate() {
  errors.value = {
    naam: form.value.naam.trim() ? '' : 'Naam is verplicht',
    icon: form.value.icon ? '' : 'Kies een icoon',
  }
  return !errors.value.naam && !errors.value.icon
}

function save() {
  if (!validate()) {
    if (errors.value.naam) naamInput.value?.focus()
    return
  }

  const payload = {
    naam: form.value.naam.trim(),
    color: form.value.kleur,
    icon: form.value.icon,
  }

  // De parent sluit de drawer na een geslaagde API-call;
  // bij een fout blijft de drawer open en gaat er niets verloren.
  if (isEditMode.value) {
    emit('updated', { id: props.entity.id, data: payload })
  } else {
    emit('created', payload)
  }
}
</script>

<style scoped>
.form {
  display: flex;
  flex-direction: column;
  gap: 22px;
  padding: 16px 12px;
  font-family: 'Inter', system-ui, sans-serif;
  color: #0f172a;
}

/* PREVIEW */
.preview {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-left: 4px solid var(--c);
  border-radius: 12px;
  transition: border-color 150ms ease;
}
.preview__icon {
  display: grid;
  place-items: center;
  width: 48px;
  height: 48px;
  flex-shrink: 0;
  border-radius: 12px;
  background: color-mix(in srgb, var(--c) 14%, white);
  color: var(--c);
}
.preview__icon .material-icons {
  font-size: 26px;
}
.preview__initial {
  font-size: 20px;
  font-weight: 700;
}
.preview__name {
  font-size: 16px;
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* FIELDS */
.field {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.field__head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
}
.field label,
.field__head label {
  font-size: 13px;
  font-weight: 600;
  color: #475569;
}
.selected-label {
  font-size: 12px;
  color: #64748b;
  text-transform: capitalize;
}

input[type='text'],
input[type='search'] {
  height: 40px;
  padding: 0 12px;
  background: #fff;
  border: 1px solid #d5dce6;
  border-radius: 10px;
  font: inherit;
  font-size: 14px;
  color: #0f172a;
  transition: border-color 150ms ease, box-shadow 150ms ease;
}
input[type='text']:focus,
input[type='search']:focus {
  outline: 0;
  border-color: #a5b8ff;
  box-shadow: 0 0 0 3px rgba(53, 83, 242, 0.12);
}
input.invalid {
  border-color: #f87171;
}

.error {
  font-size: 12.5px;
  color: #dc2626;
}

/* KLEUR */
.swatches {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.swatch {
  position: relative;
  width: 30px;
  height: 30px;
  padding: 0;
  border: 0;
  border-radius: 50%;
  cursor: pointer;
  transition: transform 120ms ease, box-shadow 120ms ease;
}
.swatch:hover {
  transform: scale(1.1);
}
.swatch.selected {
  box-shadow: 0 0 0 2px #fff, 0 0 0 4px #0f172a;
}
.swatch:focus-visible {
  outline: 2px solid #3553f2;
  outline-offset: 3px;
}
.swatch--custom {
  overflow: hidden;
}
.swatch--custom input {
  position: absolute;
  inset: 0;
  opacity: 0;
  cursor: pointer;
}
.swatch--custom span {
  display: grid;
  place-items: center;
  width: 100%;
  height: 100%;
  border: 1.5px dashed #94a3b8;
  border-radius: 50%;
  color: #64748b;
  font-size: 16px;
  pointer-events: none;
}
.swatch--custom.selected span {
  border: 0;
  color: #fff;
}

/* ICONEN */
.icon-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(48px, 1fr));
  gap: 6px;
  max-height: 260px;
  padding: 8px;
  overflow-y: auto;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
}
.icon-grid.invalid {
  border-color: #f87171;
}
.icon-item {
  display: grid;
  place-items: center;
  aspect-ratio: 1;
  padding: 0;
  background: transparent;
  border: 1px solid transparent;
  border-radius: 10px;
  color: #475569;
  cursor: pointer;
  transition: background 120ms ease, color 120ms ease, border-color 120ms ease;
}
.icon-item .material-icons {
  font-size: 24px;
}
.icon-item:hover {
  background: #fff;
  border-color: #e2e8f0;
  color: var(--c);
}
.icon-item.selected {
  background: color-mix(in srgb, var(--c) 14%, white);
  border-color: var(--c);
  color: var(--c);
}
.icon-item:focus-visible {
  outline: 2px solid #3553f2;
  outline-offset: 1px;
}
.no-results {
  grid-column: 1 / -1;
  margin: 0;
  padding: 16px;
  text-align: center;
  font-size: 13px;
  color: #64748b;
}

.icon-grid::-webkit-scrollbar {
  width: 6px;
}
.icon-grid::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 6px;
}
</style>
