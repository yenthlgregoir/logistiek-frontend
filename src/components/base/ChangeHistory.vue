<template>
  <button
    ref="trigger"
    type="button"
    class="history-trigger"
    :class="{ compact }"
    aria-label="Wijzigingshistoriek"
    title="Wijzigingshistoriek"
    @click="showHistory"
  >
    <svg
      v-if="compact"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="1.7"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
    >
      <path d="M3 11a9 9 0 1 1 2.6 7.4M3 4v7h7M12 7v5l3 2" />
    </svg>
    <span v-else>Wijzigingshistoriek</span>
  </button>
  <Teleport to="body">
    <dialog
      ref="dialog"
      class="history-dialog"
      :aria-labelledby="titleId"
      @cancel.prevent="closeHistory"
      @keydown.esc.stop.prevent="closeHistory"
      @click="onBackdrop"
    >
      <header class="history-dialog-header">
        <h2 :id="titleId">Wijzigingshistoriek</h2>
        <button
          type="button"
          class="history-close"
          aria-label="Historiek sluiten"
          @click="closeHistory"
        >
          ×
        </button>
      </header>
      <div class="history-content" :aria-busy="loading">
        <div class="history-toolbar">
          <span>Nieuwste wijzigingen eerst</span>
          <button type="button" :disabled="loading" @click="load(false)">Vernieuwen</button>
        </div>
        <p v-if="error" class="history-error" role="alert">{{ error }}</p>
        <p v-if="loading && !items.length" role="status">Historiek laden…</p>
        <p v-else-if="!items.length && !error" class="history-empty">
          Nog geen wijzigingen geregistreerd. Historiek wordt bijgehouden vanaf de invoering van
          deze functie.
        </p>
        <ol v-if="items.length" class="history-list">
          <li v-for="item in items" :key="item.id">
            <div class="history-heading">
              <strong>{{ actions[item.action] || 'Gewijzigd' }}</strong>
              <time :datetime="item.at">{{ dateTime(item.at) }}</time>
            </div>
            <p class="history-actor">{{ item.actorName }}</p>
            <dl class="history-changes">
              <div v-for="change in item.changes" :key="change.field">
                <dt>{{ change.label }}</dt>
                <dd>
                  <template v-if="item.action !== 'CREATED'">
                    <span class="history-old">{{ value(change, 'old') }}</span>
                    <span
                      v-if="item.action !== 'DELETED'"
                      class="history-arrow"
                      aria-label="gewijzigd naar"
                    >
                      →
                    </span>
                  </template>
                  <span v-if="item.action !== 'DELETED'">{{ value(change, 'new') }}</span>
                </dd>
              </div>
            </dl>
          </li>
        </ol>
        <button v-if="nextCursor" type="button" :disabled="loading" @click="load(true)">
          {{ loading ? 'Laden…' : 'Oudere wijzigingen laden' }}
        </button>
      </div>
      <footer class="history-dialog-footer">
        <button type="button" @click="closeHistory">Sluiten</button>
      </footer>
    </dialog>
  </Teleport>
</template>

<script setup>
import { ref, watch, onBeforeUnmount, getCurrentInstance } from 'vue'
import { api } from '@/api/client'

const props = defineProps({
  compact: { type: Boolean, default: false },
  entityId: { type: String, required: true },
  entityType: {
    type: String,
    required: true,
    validator: (v) => ['boeking', 'verhuur'].includes(v),
  },
  revision: { type: [String, Number], default: '' },
})
const actions = { CREATED: 'Aangemaakt', UPDATED: 'Gewijzigd', DELETED: 'Verwijderd' }
const labels = {
  AANGEVRAAGD: 'Aangevraagd',
  BEVESTIGD: 'Bevestigd',
  LEVEREN: 'Leveren',
  GELEVERD: 'Geleverd',
  OPGEHAALD: 'Opgehaald',
  AFGEWERKT: 'Afgewerkt',
  HOOGTEWERKER: 'Hoogtewerker',
  WERFCONTAINER: 'Werfcontainer',
  TRANSPORT_DOOR_LOGISTIEK: 'Transport door logistiek',
  OPHALING_DOOR_KLANT: 'Ophaling door klant',
}
const items = ref([])
const nextCursor = ref(null)
const loading = ref(false)
const error = ref('')
const open = ref(false)
const dialog = ref(null)
const trigger = ref(null)
const titleId = `history-title-${getCurrentInstance().uid}`
let previousOverflow
let request = 0
let controller

function dateTime(raw) {
  const date = new Date(raw)
  return Number.isNaN(date.getTime())
    ? raw
    : date.toLocaleString('nl-BE', { timeZone: 'Europe/Brussels' })
}
function value(change, side) {
  const raw = change[side + 'Value']
  if (raw == null || raw === '') return 'Niet ingesteld'
  if (['leverDatum', 'ophaalDatum', 'beginDatum', 'eindDatum'].includes(change.field)) {
    const date = new Date(raw.length === 10 ? raw + 'T12:00:00' : raw)
    return Number.isNaN(date.getTime())
      ? raw
      : date.toLocaleDateString('nl-BE', { timeZone: 'Europe/Brussels' })
  }
  return labels[raw] || change[side + 'Label'] || raw
}
async function load(more) {
  controller?.abort()
  controller = new AbortController()
  const current = ++request
  loading.value = true
  error.value = ''
  try {
    const base = props.entityType === 'boeking' ? '/renting/boekingen' : '/verhuur'
    const cursor = more && nextCursor.value ? `?cursor=${encodeURIComponent(nextCursor.value)}` : ''
    const response = await api.get(
      `${base}/${encodeURIComponent(props.entityId)}/historiek${cursor}`,
      {
        signal: controller.signal,
        cache: 'no-store',
      },
    )
    if (current !== request) return
    if (!Array.isArray(response?.data?.items)) throw new Error('Ongeldige historiek ontvangen.')
    const rows = more ? [...items.value, ...response.data.items] : response.data.items
    items.value = [...new Map(rows.map((row) => [row.id, row])).values()]
    nextCursor.value = response.data.nextCursor
  } catch (failure) {
    if (current === request && failure.name !== 'AbortError')
      error.value = 'Historiek kon niet geladen worden. Probeer opnieuw via Vernieuwen.'
  } finally {
    if (current === request) loading.value = false
  }
}
function showHistory() {
  if (open.value) return
  dialog.value.showModal()
  open.value = true
  previousOverflow = document.body.style.overflow
  document.body.style.overflow = 'hidden'
  load(false)
}
function closeHistory() {
  if (!open.value) return
  open.value = false
  request++
  controller?.abort()
  loading.value = false
  dialog.value?.close()
  document.body.style.overflow = previousOverflow
  trigger.value?.focus({ preventScroll: true })
}
function onBackdrop(event) {
  if (event.target !== dialog.value) return
  const rect = dialog.value.getBoundingClientRect()
  if (
    event.clientX < rect.left ||
    event.clientX > rect.right ||
    event.clientY < rect.top ||
    event.clientY > rect.bottom
  )
    closeHistory()
}
watch([() => props.entityId, () => props.entityType, () => props.revision], () => {
  controller?.abort()
  request++
  items.value = []
  nextCursor.value = null
  loading.value = false
  error.value = ''
  if (open.value) load(false)
})
onBeforeUnmount(() => {
  if (open.value) document.body.style.overflow = previousOverflow
  request++
  controller?.abort()
})
</script>

<style scoped>
.history-trigger {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}
.history-trigger.compact {
  width: 34px;
  height: 34px;
  padding: 7px;
  border-radius: 10px;
  flex-shrink: 0;
}
.history-trigger svg {
  width: 18px;
  height: 18px;
}
.history-dialog {
  width: min(680px, calc(100vw - 32px));
  max-height: calc(100dvh - 32px);
  margin: auto;
  padding: 0;
  border: 1px solid #dce5f0;
  border-radius: 16px;
  background: #fff;
  color: #334155;
  box-shadow: 0 24px 80px #142e4d40;
  font-family: 'Inter', 'Segoe UI', sans-serif;
  overflow: hidden;
}
.history-dialog[open] {
  display: flex;
  flex-direction: column;
}
.history-dialog::backdrop {
  background: #0c192c99;
  backdrop-filter: blur(4px);
}
.history-dialog-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 18px 22px;
  border-bottom: 1px solid #e2e8f0;
  background: #f7faff;
  flex: 0 0 auto;
}
.history-dialog-header h2 {
  margin: 0;
  font-size: 18px;
  font-weight: 650;
}
.history-close {
  width: 34px;
  height: 34px;
  padding: 0;
  font-size: 22px;
}
.history-content {
  padding: 18px 22px;
  font-size: 13px;
  min-height: 0;
  overflow-y: auto;
  overscroll-behavior: contain;
}
.history-dialog-footer {
  display: flex;
  justify-content: flex-end;
  padding: 12px 22px;
  border-top: 1px solid #e2e8f0;
  flex: 0 0 auto;
  background: #f8fafc;
}
button:focus-visible {
  outline: 3px solid #78a7ed;
  outline-offset: 2px;
}
@media (max-width: 540px) {
  .history-dialog {
    width: calc(100vw - 24px);
    max-height: calc(100dvh - 24px);
  }
  .history-dialog-header,
  .history-content {
    padding: 16px;
  }
}
.history-toolbar,
.history-heading {
  display: flex;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}
.history-toolbar,
time,
.history-actor,
.history-empty {
  color: #64748b;
}
button {
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  background: #fff;
  padding: 6px 10px;
  color: #334155;
  cursor: pointer;
  font: inherit;
}
button:disabled {
  opacity: 0.6;
  cursor: default;
}
.history-list {
  padding: 0;
  margin: 12px 0;
  list-style: none;
}
.history-list > li {
  padding: 14px 0;
  border-top: 1px solid #e2e8f0;
}
.history-actor {
  margin: 4px 0 10px;
  overflow-wrap: anywhere;
}
.history-changes {
  margin: 0;
}
.history-changes > div {
  margin-top: 8px;
}
dt {
  font-weight: 600;
}
dd {
  margin: 3px 0 0;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}
.history-old {
  color: #64748b;
}
.history-arrow {
  color: #94a3b8;
}
.history-error {
  color: #b91c1c;
}
</style>
