<template>
  <div
    ref="root"
    class="fchip"
    :class="{ 'is-active': hasValue, 'is-open': open }"
    @keydown.esc.stop="close(true)"
  >
    <button
      ref="trigger"
      type="button"
      class="fchip__trigger"
      aria-haspopup="dialog"
      :aria-expanded="open"
      :aria-label="hasValue ? `${title}: ${rangeLabel}` : `Filter op ${title}`"
      @click="toggle"
    >
      <CalendarDays class="fchip__icon" aria-hidden="true" />
      <span v-if="hasValue" class="fchip__title">{{ title }}</span>
      <span class="fchip__value">{{ hasValue ? rangeLabel : title }}</span>
      <ChevronDown v-if="!hasValue" class="fchip__chevron" aria-hidden="true" />
    </button>

    <button
      v-if="hasValue"
      type="button"
      class="fchip__clear"
      :aria-label="`${title}-filter wissen`"
      @click="clearSelection"
    >
      <X aria-hidden="true" />
    </button>

    <Transition name="pop">
      <div
        v-if="open"
        class="fchip__menu"
        :class="{ 'fchip__menu--right': alignRight }"
        role="dialog"
        :aria-label="`${title} kiezen`"
      >
        <!-- PRESETS -->
        <div class="presets" role="group" aria-label="Snelkeuze">
          <button
            v-for="(preset, i) in presets"
            :key="preset.label"
            :ref="el => { if (i === 0) firstPreset = el }"
            type="button"
            class="preset"
            :class="{ 'is-selected': isPresetActive(preset) }"
            @click="applyPreset(preset)"
          >
            {{ preset.label }}
          </button>
        </div>

        <div class="divider" />

        <!-- CUSTOM -->
        <div class="custom">
          <label class="field">
            <span>Van</span>
            <input v-model="draftStart" type="date" :max="draftEnd || undefined" />
          </label>
          <label class="field">
            <span>Tot</span>
            <input v-model="draftEnd" type="date" :min="draftStart || undefined" />
          </label>
        </div>

        <p v-if="invalid" class="hint" role="alert">De einddatum ligt vóór de startdatum.</p>

        <div class="footer">
          <button type="button" class="btn btn--ghost" :disabled="!draftStart && !draftEnd" @click="resetDraft">
            Leegmaken
          </button>
          <button type="button" class="btn btn--primary" :disabled="!canApply" @click="applyCustom">
            Toepassen
          </button>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, computed, nextTick, onBeforeUnmount } from 'vue'
import { CalendarDays, ChevronDown, X } from 'lucide-vue-next'

const props = defineProps({
  /** [start, eind] als 'YYYY-MM-DD' (of null) */
  modelValue: { type: Array, default: () => [null, null] },
  title: { type: String, default: 'Periode' },
})

const emit = defineEmits(['update:modelValue', 'clear'])

const open = ref(false)
const alignRight = ref(false)
const draftStart = ref('')
const draftEnd = ref('')

const root = ref(null)
const trigger = ref(null)
let firstPreset = null

/* ---------- datum-helpers (lokale tijd, geen UTC-verschuiving) ---------- */
const pad = n => String(n).padStart(2, '0')
const toIso = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`

function toDateOnly(value) {
  if (!value) return ''
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value)) return value.slice(0, 10)
  const date = value instanceof Date ? value : new Date(value)
  return Number.isFinite(date.getTime()) ? toIso(date) : ''
}

const labelFormat = new Intl.DateTimeFormat('nl-BE', { day: 'numeric', month: 'short', year: 'numeric' })
const formatLabel = iso => {
  const [y, m, d] = iso.split('-').map(Number)
  return labelFormat.format(new Date(y, m - 1, d))
}

/* ---------- huidige waarde ---------- */
const start = computed(() => toDateOnly(props.modelValue?.[0]))
const end = computed(() => toDateOnly(props.modelValue?.[1]))
const hasValue = computed(() => !!(start.value || end.value))

const rangeLabel = computed(() => {
  const preset = presets.value.find(isPresetActive)
  if (preset) return preset.label
  if (start.value && end.value) return `${formatLabel(start.value)} – ${formatLabel(end.value)}`
  if (start.value) return `vanaf ${formatLabel(start.value)}`
  if (end.value) return `tot ${formatLabel(end.value)}`
  return ''
})

/* ---------- presets ---------- */
const presets = computed(() => {
  const today = new Date()
  const y = today.getFullYear()
  const m = today.getMonth()
  const minusDays = n => new Date(y, m, today.getDate() - n)
  return [
    { label: 'Laatste 30 dagen', range: [minusDays(29), today] },
    { label: 'Deze maand', range: [new Date(y, m, 1), new Date(y, m + 1, 0)] },
    { label: 'Vorige maand', range: [new Date(y, m - 1, 1), new Date(y, m, 0)] },
    { label: 'Laatste 3 maanden', range: [new Date(y, m - 2, 1), new Date(y, m + 1, 0)] },
    { label: 'Dit jaar', range: [new Date(y, 0, 1), new Date(y, 11, 31)] },
    { label: 'Vorig jaar', range: [new Date(y - 1, 0, 1), new Date(y - 1, 11, 31)] },
  ].map(p => ({ ...p, range: p.range.map(toIso) }))
})

function isPresetActive(preset) {
  return preset.range[0] === start.value && preset.range[1] === end.value
}

/* ---------- open / close ---------- */
function toggle() {
  open.value ? close() : show()
}

function show() {
  draftStart.value = start.value
  draftEnd.value = end.value
  const rect = root.value?.getBoundingClientRect()
  alignRight.value = !!rect && rect.left + 340 > window.innerWidth
  open.value = true
  document.addEventListener('pointerdown', onOutside, true)
  nextTick(() => firstPreset?.focus({ preventScroll: true }))
}

function close(returnFocus = false) {
  if (!open.value) return
  open.value = false
  document.removeEventListener('pointerdown', onOutside, true)
  if (returnFocus) trigger.value?.focus()
}

function onOutside(event) {
  if (!root.value?.contains(event.target)) close()
}

/* ---------- acties ---------- */
const invalid = computed(() =>
  !!(draftStart.value && draftEnd.value && draftEnd.value < draftStart.value)
)
const canApply = computed(() =>
  !!draftStart.value && !!draftEnd.value && !invalid.value
    && (draftStart.value !== start.value || draftEnd.value !== end.value)
)

function emitRange(range) {
  emit('update:modelValue', range)
}

function applyPreset(preset) {
  emitRange([...preset.range])
  close(true)
}

function applyCustom() {
  if (!canApply.value) return
  emitRange([draftStart.value, draftEnd.value])
  close(true)
}

function resetDraft() {
  draftStart.value = ''
  draftEnd.value = ''
}

function clearSelection() {
  emitRange([null, null])
  emit('clear')
  nextTick(() => trigger.value?.focus())
}

onBeforeUnmount(() => {
  document.removeEventListener('pointerdown', onOutside, true)
})
</script>

<style scoped>
.fchip {
  --accent: #3b6cf6;
  --accent-hover: #2c5ae6;
  --accent-soft: #edf2ff;
  --accent-ring: rgba(59, 108, 246, 0.28);
  --border: #dfe3ea;
  --text: #0f172a;
  --text-2: #475569;
  --text-3: #8a94a6;

  position: relative;
  display: inline-flex;
  align-items: center;
  height: 34px;
  border: 1px solid var(--border);
  border-radius: 999px;
  background: #fff;
  color: var(--text-2);
  font-size: 13px;
  transition: border-color 0.15s, background 0.15s, box-shadow 0.15s;
}

.fchip:hover {
  border-color: #c6ccd6;
}

.fchip.is-open {
  border-color: var(--accent);
  box-shadow: 0 0 0 3px var(--accent-ring);
}

.fchip.is-active {
  border-color: transparent;
  background: var(--accent-soft);
  color: var(--accent);
}

.fchip svg {
  width: 14px;
  height: 14px;
  flex-shrink: 0;
  stroke-width: 2.2;
}

.fchip *,
.fchip *::before,
.fchip *::after {
  box-sizing: border-box;
}

/* Trigger */
.fchip__trigger {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 100%;
  max-width: 300px;
  margin: 0;
  padding: 0 12px;
  border: 0;
  border-radius: 999px;
  background: transparent;
  color: inherit;
  font: inherit;
  font-weight: 550;
  cursor: pointer;
  appearance: none;
}

.is-active .fchip__trigger {
  padding-right: 4px;
}

.fchip__icon {
  opacity: 0.8;
}

.fchip__title {
  font-weight: 500;
  opacity: 0.75;
}

.fchip__title::after {
  content: ':';
}

.fchip__value {
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.fchip__chevron {
  color: var(--text-3);
  transition: transform 0.2s;
}

.is-open .fchip__chevron {
  transform: rotate(180deg);
}

.fchip__trigger:focus-visible,
.fchip__clear:focus-visible,
.preset:focus-visible,
.btn:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}

/* Clear */
.fchip__clear {
  display: grid;
  place-items: center;
  width: 22px;
  height: 22px;
  margin: 0 6px 0 2px;
  padding: 0;
  border: 0;
  border-radius: 50%;
  background: transparent;
  color: inherit;
  cursor: pointer;
  appearance: none;
  transition: background 0.15s;
}

.fchip__clear:hover {
  background: rgba(59, 108, 246, 0.15);
}

.fchip__clear svg {
  width: 13px;
  height: 13px;
}

/* Menu */
.fchip__menu {
  position: absolute;
  top: calc(100% + 6px);
  left: 0;
  z-index: 60;
  width: 320px;
  padding: 12px;
  border: 1px solid #e6e9ef;
  border-radius: 14px;
  background: #fff;
  box-shadow: 0 16px 40px -12px rgba(15, 23, 42, 0.25), 0 2px 6px rgba(15, 23, 42, 0.06);
  color: var(--text);
  transform-origin: top left;
}

.fchip__menu--right {
  left: auto;
  right: 0;
  transform-origin: top right;
}

/* Presets */
.presets {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 6px;
}

.preset {
  height: 32px;
  margin: 0;
  padding: 0 10px;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: #fff;
  color: var(--text-2);
  font: inherit;
  font-size: 12.5px;
  font-weight: 550;
  text-align: left;
  cursor: pointer;
  appearance: none;
  transition: background 0.15s, border-color 0.15s, color 0.15s;
}

.preset:hover {
  background: #f6f8fb;
  border-color: #c6ccd6;
  color: var(--text);
}

.preset.is-selected {
  background: var(--accent-soft);
  border-color: transparent;
  color: var(--accent);
}

.divider {
  height: 1px;
  margin: 12px 0;
  background: #eef0f4;
}

/* Custom range */
.custom {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.field span {
  font-size: 11.5px;
  font-weight: 600;
  color: var(--text-3);
}

.field input {
  width: 100%;
  height: 36px;
  padding: 0 8px;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: #f8f9fb;
  color: var(--text);
  font: inherit;
  font-size: 13px;
  outline: none;
  transition: border-color 0.15s, background 0.15s, box-shadow 0.15s;
}

.field input:focus {
  border-color: var(--accent);
  background: #fff;
  box-shadow: 0 0 0 3px var(--accent-ring);
}

.hint {
  margin: 8px 0 0;
  font-size: 12px;
  color: #c22433;
}

/* Footer */
.footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 12px;
}

.btn {
  height: 32px;
  margin: 0;
  padding: 0 12px;
  border: 0;
  border-radius: 8px;
  font: inherit;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  appearance: none;
  transition: background 0.15s, opacity 0.15s;
}

.btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.btn--ghost {
  background: transparent;
  color: var(--text-2);
}

.btn--ghost:hover:not(:disabled) {
  background: #f3f5f8;
}

.btn--primary {
  background: var(--accent);
  color: #fff;
}

.btn--primary:hover:not(:disabled) {
  background: var(--accent-hover);
}

/* Animation */
.pop-enter-active {
  transition: opacity 0.16s ease, transform 0.18s cubic-bezier(0.2, 0.8, 0.2, 1);
}

.pop-leave-active {
  transition: opacity 0.1s ease, transform 0.1s ease;
}

.pop-enter-from,
.pop-leave-to {
  opacity: 0;
  transform: translateY(-4px) scale(0.97);
}

@media (max-width: 480px) {
  .fchip__menu {
    width: min(320px, calc(100vw - 32px));
  }
}

@media (prefers-reduced-motion: reduce) {
  .pop-enter-active,
  .pop-leave-active,
  .fchip__chevron {
    transition: none;
  }
}
</style>
