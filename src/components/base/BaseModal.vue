<template>
  <div class="modal-overlay" @click.self="close">
    <div class="modal" role="dialog" aria-modal="true" :aria-labelledby="titleId" :aria-busy="busy">
      <div class="modal-header">
        <div :id="titleId" class="modal-heading">
          <slot name="header"><h2>{{ title }}</h2></slot>
        </div>
        <button type="button" class="close-btn" :disabled="busy" aria-label="Sluiten" @click="close">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18" /></svg>
        </button>
      </div>

      <div class="modal-body"><slot /></div>

      <div class="modal-footer">
        <slot name="footer"><button type="button" class="btn-cancel" :disabled="busy" @click="close">Annuleren</button></slot>
      </div>
    </div>
  </div>
</template>

<script setup>
import { getCurrentInstance, onMounted, onUnmounted } from 'vue'

const props = defineProps({
  title: { type: String, default: 'Titel' },
  busy: { type: Boolean, default: false },
})
const emit = defineEmits(['close'])
const titleId = `base-modal-title-${getCurrentInstance().uid}`

function close() { if (!props.busy) emit('close') }
function handleKey(event) { if (event.key === 'Escape') close() }
onMounted(() => window.addEventListener('keydown', handleKey))
onUnmounted(() => window.removeEventListener('keydown', handleKey))
</script>

<style scoped>
.modal-overlay {
  --modal-accent: #3267d5;
  --modal-ink: #203652;
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: radial-gradient(ellipse at 50% 35%, #34558038, transparent 70%), #0c192c99;
  backdrop-filter: blur(7px);
  font-family: 'Inter', 'Segoe UI', sans-serif;
  color: var(--modal-ink);
}
.modal-overlay, .modal-overlay :deep(*) { box-sizing: border-box; }
.modal-overlay :deep(button), .modal-overlay :deep(input), .modal-overlay :deep(select), .modal-overlay :deep(textarea) { font: inherit; }
.modal-overlay :deep(button) { cursor: pointer; }
.modal-overlay :deep(button:disabled) { cursor: not-allowed; opacity: .5; }
.modal-overlay :deep(button:focus-visible) { outline: 3px solid #78a7ed; outline-offset: 3px; }

.modal {
  position: relative;
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: var(--base-modal-width, 560px);
  max-height: calc(100vh - 48px);
  max-height: calc(100dvh - 48px);
  min-height: 0;
  overflow: hidden;
  border: 1px solid #ffffffb3;
  border-radius: 20px;
  background: #fff;
  box-shadow: 0 32px 100px #050f234d, 0 8px 24px #050f2326, 0 0 0 1px #16325114;
  animation: appear 240ms cubic-bezier(.2, .8, .2, 1);
}
.modal-header {
  position: relative;
  isolation: isolate;
  display: flex;
  flex: 0 0 auto;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  padding: 28px 28px 24px;
  border-bottom: 1px solid #e6edf7;
  background: radial-gradient(ellipse at 95% 0%, #dce9ffb3, transparent 65%), linear-gradient(120deg, #fbfdff, #f3f7fd);
}
.modal-header::before { content: ''; position: absolute; top: 0; left: 28px; width: 52px; height: 3px; border-radius: 0 0 4px 4px; background: linear-gradient(90deg, var(--modal-accent), #88b9f5); }
.modal-heading { flex: 1; min-width: 0; overflow-wrap: anywhere; }
.modal-heading :deep(h2) { margin: 0; color: #192e4b; font-size: 23px; font-weight: 650; letter-spacing: -.75px; line-height: 1.35; }
.modal-heading :deep(p) { margin: 7px 0 0; color: #71839c; font-size: 12px; line-height: 1.7; }
.close-btn { display: grid; place-items: center; flex-shrink: 0; width: 34px; height: 34px; padding: 0; border: 1px solid #d7e2f0; border-radius: 10px; background: #ffffffb3; color: #6f83a0; box-shadow: 0 2px 5px #233f6510; transition: background 150ms, color 150ms, border-color 150ms; }
.close-btn svg { width: 16px; height: 16px; }
.close-btn:hover:enabled { background: #fff; border-color: #a4bddf; color: #294f86; }

/* Dit is het enige scrollgebied binnen de modal. */
.modal-body { flex: 1 1 auto; min-height: 0; overflow-y: auto; overscroll-behavior: contain; padding: 24px 28px; scrollbar-width: thin; scrollbar-color: #c6d1df transparent; }
.modal-body :deep(.search-input) { width: 100%; min-width: 0; min-height: 46px; padding: 12px 14px 12px 41px; border: 1px solid #dce5f0; border-radius: 11px; background: #f7f9fd; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='18' height='18' fill='none' stroke='%238296b1' stroke-width='1.7' stroke-linecap='round'%3E%3Ccircle cx='7.5' cy='7.5' r='5'/%3E%3Cpath d='m11.5 11.5 4 4'/%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: 14px center; color: #213550; font-size: 13px; box-shadow: inset 0 1px 2px #1b365306; transition: border-color 150ms, box-shadow 150ms, background-color 150ms; }
.modal-body :deep(.search-input::placeholder) { color: #8a97a8; }
.modal-body :deep(.search-input:focus) { outline: none; border-color: #729be0; background-color: #fff; box-shadow: 0 0 0 4px #2a64ca10; }
.modal-body :deep(.list) { display: flex; flex-direction: column; gap: 9px; max-height: none; overflow: visible; margin: 14px 0 0; padding: 0; list-style: none; }
.modal-body :deep(.list-item) { position: relative; display: flex; flex-direction: column; gap: 5px; width: 100%; padding: 16px 38px 16px 17px; border: 1px solid #e1e7ef; border-radius: 12px; background: #fff; color: #213550; text-align: left; cursor: pointer; box-shadow: 0 2px 4px #23426804; transition: background-color 160ms, border-color 160ms, box-shadow 160ms; }
.modal-body :deep(.list-item:hover) { background: #f8faff; border-color: #a8bfdf; box-shadow: 0 4px 12px #274e8710; }
.modal-body :deep(.list-item[aria-pressed='true']), .modal-body :deep(.list-item.selected) { background: linear-gradient(110deg, #edf4ff, #f9fbff); border-color: #85a9e1; box-shadow: inset 3px 0 var(--modal-accent), 0 3px 10px #2b64c710; }
.modal-body :deep(.list-item[aria-pressed='true']::after), .modal-body :deep(.list-item.selected::after) { content: ''; position: absolute; right: 17px; top: 50%; width: 7px; height: 12px; border-right: 2px solid var(--modal-accent); border-bottom: 2px solid var(--modal-accent); transform: translateY(-65%) rotate(45deg); }
.modal-body :deep(.item-title) { font-size: 13px; font-weight: 650; line-height: 1.5; overflow-wrap: anywhere; }
.modal-body :deep(.item-subtitle) { color: #748399; font-size: 11px; line-height: 1.6; overflow-wrap: anywhere; }
.modal-body :deep(.no-results) { padding: 28px 12px; text-align: center; color: #7a899e; font-size: 12px; line-height: 1.7; }
.modal-body :deep(.modal-error) { margin: 12px 0 0; padding: 11px 13px; border: 1px solid #efccd0; border-radius: 8px; background: #fff4f4; color: #a03b46; font-size: 12px; line-height: 1.6; overflow-wrap: anywhere; }
.modal-body :deep(.form-label) { display: block; margin: 0 0 7px; color: #5c708c; font-size: 11px; font-weight: 600; }
.modal-body :deep(.form-input), .modal-body :deep(.form-select), .modal-body :deep(.form-textarea) { width: 100%; min-height: 43px; padding: 10px 12px; border: 1px solid #dce5f0; border-radius: 10px; background: #f8fafd; color: var(--modal-ink); font-size: 13px; transition: border-color 150ms, box-shadow 150ms; }
.modal-body :deep(.form-textarea) { min-height: 96px; resize: vertical; }
.modal-body :deep(.form-input:focus), .modal-body :deep(.form-select:focus), .modal-body :deep(.form-textarea:focus) { outline: none; background: #fff; border-color: #729be0; box-shadow: 0 0 0 4px #2a64ca10; }

.modal-footer { display: flex; flex: 0 0 auto; flex-wrap: wrap; align-items: center; justify-content: flex-end; gap: 10px; padding: 18px 28px; border-top: 1px solid #e7ecf3; background: linear-gradient(180deg, #fcfdff, #f5f8fc); box-shadow: 0 -5px 18px #17365703; }
.modal-footer :deep(.btn-cancel), .modal-footer :deep(.btn-primary) { display: inline-flex; align-items: center; justify-content: center; gap: 7px; min-height: 41px; padding: 10px 17px; border: 1px solid #dce3ed; border-radius: 10px; color: #4b607b; background: #fff; font-size: 12px; font-weight: 600; box-shadow: 0 1px 3px #1e3e6810; transition: background-color 150ms, box-shadow 150ms, border-color 150ms; }
.modal-footer :deep(.btn-cancel:hover:enabled) { background: #eff3f9; }
.modal-footer :deep(.btn-primary) { border-color: #2d5db9; background: linear-gradient(180deg, #447ce3, #2d62cb); color: #fff; box-shadow: 0 4px 10px #3065c72b, inset 0 1px #ffffff26; }
.modal-footer :deep(.btn-primary:hover:enabled) { background: linear-gradient(180deg, #3971d8, #2457bc); box-shadow: 0 5px 14px #3065c73d; }

@keyframes appear { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
@media (max-width: 540px) {
  .modal-overlay { padding: 12px; }
  .modal { max-height: calc(100vh - 24px); max-height: calc(100dvh - 24px); border-radius: 13px; }
  .modal-header { padding: 18px; gap: 12px; }
  .modal-heading :deep(h2) { font-size: 19px; }
  .modal-body { padding: 18px; }
  .modal-footer { padding: 14px 18px; }
}
@media (prefers-reduced-motion: reduce) { .modal { animation: none; } .modal-overlay :deep(*) { transition: none !important; } }
</style>
