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
      :aria-haspopup="'listbox'"
      :aria-expanded="open"
      :aria-controls="listId"
      :aria-label="hasValue ? `${title}: ${selected.naam}` : `Filter op ${title}`"
      @click="toggle"
      @keydown.down.prevent="openAndFocus(0)"
      @keydown.up.prevent="openAndFocus(-1)"
    >
      <span v-if="hasValue" class="fchip__title">{{ title }}</span>
      <span class="fchip__value">{{ hasValue ? selected.naam : title }}</span>
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
      <div v-if="open" class="fchip__menu" :class="{ 'fchip__menu--right': alignRight }">
        <div v-if="showSearch" class="fchip__search">
          <Search aria-hidden="true" />
          <input
            ref="searchInput"
            v-model="query"
            type="text"
            :placeholder="`Zoek ${title.toLowerCase()}…`"
            :aria-label="`Zoek ${title.toLowerCase()}`"
            :aria-controls="listId"
            :aria-activedescendant="activeId"
            autocomplete="off"
            @keydown.down.prevent="move(1)"
            @keydown.up.prevent="move(-1)"
            @keydown.enter.prevent="selectActive"
            @keydown.tab="close()"
          />
        </div>

        <ul
          :id="listId"
          ref="list"
          class="fchip__list"
          role="listbox"
          :aria-label="title"
          :tabindex="showSearch ? -1 : 0"
          :aria-activedescendant="showSearch ? undefined : activeId"
          @keydown.down.prevent="move(1)"
          @keydown.up.prevent="move(-1)"
          @keydown.home.prevent="activeIndex = 0"
          @keydown.end.prevent="activeIndex = filtered.length - 1"
          @keydown.enter.prevent="selectActive"
          @keydown.space.prevent="selectActive"
          @keydown.tab="close()"
        >
          <li
            v-for="(option, i) in filtered"
            :id="`${listId}-${i}`"
            :key="option.id"
            role="option"
            class="fchip__option"
            :class="{ 'is-active': i === activeIndex, 'is-selected': isSelected(option) }"
            :aria-selected="isSelected(option)"
            @mousemove="activeIndex = i"
            @click="selectOption(option)"
          >
            <span class="fchip__label">{{ option.naam }}</span>
            <Check v-if="isSelected(option)" class="fchip__check" aria-hidden="true" />
          </li>

          <li v-if="!filtered.length" class="fchip__empty" role="presentation">
            {{ options.length ? 'Geen resultaten' : 'Geen opties beschikbaar' }}
          </li>
        </ul>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick, onBeforeUnmount } from 'vue'
import { Check, ChevronDown, Search, X } from 'lucide-vue-next'

const props = defineProps({
  modelValue: { default: null },
  title: { type: String, default: '' },
  options: { type: Array, required: true },
  /** Zoekveld tonen: standaard automatisch vanaf 8 opties. */
  searchable: { type: Boolean, default: undefined },
})

const emit = defineEmits(['update:modelValue', 'clear'])

const uid = `fchip-${Math.random().toString(36).slice(2, 9)}`
const listId = `${uid}-list`

const open = ref(false)
const query = ref('')
const activeIndex = ref(-1)
const alignRight = ref(false)

const root = ref(null)
const trigger = ref(null)
const searchInput = ref(null)
const list = ref(null)

const same = (a, b) => a != null && b != null && String(a) === String(b)

const selected = computed(() =>
  props.options?.find(option => same(option.id, props.modelValue)) ?? null
)
const hasValue = computed(() => !!selected.value)
const showSearch = computed(() => props.searchable ?? (props.options?.length ?? 0) >= 8)

const normalize = text => String(text ?? '')
  .normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim()

const filtered = computed(() => {
  const q = normalize(query.value)
  const options = props.options ?? []
  return q ? options.filter(option => normalize(option.naam).includes(q)) : options
})

const activeId = computed(() =>
  activeIndex.value >= 0 && activeIndex.value < filtered.value.length
    ? `${listId}-${activeIndex.value}` : undefined
)

function isSelected(option) {
  return same(option.id, props.modelValue)
}

/* ---------- open / close ---------- */
function toggle() {
  open.value ? close() : show()
}

function show(startIndex) {
  if (open.value) return
  query.value = ''
  const selectedIndex = filtered.value.findIndex(isSelected)
  activeIndex.value = startIndex === -1
    ? filtered.value.length - 1
    : selectedIndex >= 0 ? selectedIndex : (startIndex ?? 0)
  const rect = root.value?.getBoundingClientRect()
  alignRight.value = !!rect && rect.left + 280 > window.innerWidth
  open.value = true
  document.addEventListener('pointerdown', onOutside, true)
  nextTick(() => {
    ;(showSearch.value ? searchInput.value : list.value)?.focus({ preventScroll: true })
    scrollActiveIntoView()
  })
}

function openAndFocus(startIndex) {
  show(startIndex)
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

/* ---------- selection ---------- */
function selectOption(option) {
  emit('update:modelValue', option.id)
  close(true)
}

function selectActive() {
  const option = filtered.value[activeIndex.value]
  if (option) selectOption(option)
}

function clearSelection() {
  emit('update:modelValue', null)
  emit('clear')
  nextTick(() => trigger.value?.focus())
}

/* ---------- keyboard ---------- */
function move(delta) {
  const count = filtered.value.length
  if (!count) return
  activeIndex.value = (activeIndex.value + delta + count) % count
  scrollActiveIntoView()
}

function scrollActiveIntoView() {
  nextTick(() => {
    const el = activeId.value && document.getElementById(activeId.value)
    el?.scrollIntoView({ block: 'nearest' })
  })
}

watch(query, () => {
  activeIndex.value = filtered.value.length ? 0 : -1
})

onBeforeUnmount(() => {
  document.removeEventListener('pointerdown', onOutside, true)
})
</script>

<style scoped>
.fchip {
  --accent: #3b6cf6;
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

/* Trigger */
.fchip__trigger {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 100%;
  max-width: 240px;
  margin: 0;
  padding: 0 12px 0 14px;
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

.fchip__trigger:focus-visible,
.fchip__clear:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
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
  width: max-content;
  min-width: 220px;
  max-width: 320px;
  padding: 6px;
  border: 1px solid #e6e9ef;
  border-radius: 12px;
  background: #fff;
  box-shadow: 0 16px 40px -12px rgba(15, 23, 42, 0.25), 0 2px 6px rgba(15, 23, 42, 0.06);
  transform-origin: top left;
}

.fchip__menu--right {
  left: auto;
  right: 0;
  transform-origin: top right;
}

.fchip__search {
  position: relative;
  display: flex;
  align-items: center;
  margin-bottom: 6px;
}

.fchip__search svg {
  position: absolute;
  left: 10px;
  color: var(--text-3);
}

.fchip__search input {
  width: 100%;
  height: 34px;
  padding: 0 10px 0 32px;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: #f8f9fb;
  color: var(--text);
  font: inherit;
  font-size: 13px;
  outline: none;
  box-sizing: border-box;
  transition: border-color 0.15s, background 0.15s;
}

.fchip__search input:focus {
  border-color: var(--accent);
  background: #fff;
}

.fchip__list {
  max-height: 280px;
  margin: 0;
  padding: 0;
  overflow-y: auto;
  overscroll-behavior: contain;
  list-style: none;
  outline: none;
}

.fchip__option {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 8px 10px;
  border-radius: 8px;
  color: var(--text);
  font-size: 13.5px;
  cursor: pointer;
  user-select: none;
}

.fchip__option.is-active {
  background: #f3f5f8;
}

.fchip__option.is-selected {
  color: var(--accent);
  font-weight: 600;
}

.fchip__label {
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.fchip__check {
  color: var(--accent);
}

.fchip__empty {
  padding: 14px 10px;
  color: var(--text-3);
  font-size: 13px;
  text-align: center;
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

@media (prefers-reduced-motion: reduce) {
  .pop-enter-active,
  .pop-leave-active,
  .fchip__chevron {
    transition: none;
  }
}
</style>
