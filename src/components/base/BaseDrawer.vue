<template>
  <Transition name="drawer">
    <div v-if="show" class="drawer-wrapper">
      <section class="drawer" role="region" :aria-labelledby="title ? titleId : undefined" :aria-label="title ? undefined : 'Detailpaneel'" :aria-busy="busy">
        <header class="drawer-header">
          <div class="title-block">
            <h3 v-if="title" :id="titleId">{{ title }}</h3>
            <p v-if="subtitle" class="drawer-subtitle">{{ subtitle }}</p>
          </div>
          <div class="header-actions">
            <slot name="header-extra" />
            <slot name="header-actions">
              <button type="button" class="close-btn" :disabled="busy" aria-label="Paneel sluiten" @click="close">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18" /></svg>
              </button>
            </slot>
          </div>
        </header>

        <div class="drawer-content"><slot /></div>

        <footer v-if="$slots.footer" class="drawer-footer"><slot name="footer" /></footer>
        <slot name="confirm-popup" />
      </section>
    </div>
  </Transition>
</template>

<script setup>
import { getCurrentInstance } from 'vue'

const props = defineProps({
  show: { type: Boolean, default: false },
  title: { type: String, default: '' },
  subtitle: { type: String, default: '' },
  busy: { type: Boolean, default: false },
})
const emit = defineEmits(['close'])
const titleId = `base-drawer-title-${getCurrentInstance().uid}`
function close() { if (!props.busy) emit('close') }
</script>

<style scoped>
.drawer-wrapper {
  --drawer-ink: #213650;
  --drawer-accent: #3267d5;
  position: fixed;
  top: 0;
  right: 0;
  z-index: 1000;
  width: var(--base-drawer-width, 440px);
  max-width: 100%;
  height: 100vh;
  height: 100dvh;
  color: var(--drawer-ink);
  font-family: 'Inter', 'Segoe UI', sans-serif;
  -webkit-font-smoothing: antialiased;
}
.drawer-wrapper, .drawer-wrapper :deep(*) { box-sizing: border-box; }
.drawer-wrapper :deep(button), .drawer-wrapper :deep(input), .drawer-wrapper :deep(select), .drawer-wrapper :deep(textarea) { font: inherit; }
.drawer-wrapper :deep(button) { cursor: pointer; }
.drawer-wrapper :deep(button:disabled) { cursor: not-allowed; opacity: .5; }
.drawer-wrapper :deep(button:focus-visible) { outline: 3px solid #8db5ec; outline-offset: 3px; }

.drawer {
  position: relative;
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  min-height: 0;
  border-left: 1px solid #dce5f0;
  border-radius: 20px 0 0 20px;
  background: #fff;
  box-shadow: -16px 0 60px #142e4d17, -3px 0 12px #142e4d08;
  isolation: isolate;
}
.drawer-header {
  position: relative;
  display: flex;
  flex: 0 0 auto;
  align-items: flex-start;
  justify-content: space-between;
  gap: 18px;
  padding: 30px 26px 25px;
  border-bottom: 1px solid #e5edf7;
  border-radius: 20px 0 0 0;
  background: radial-gradient(ellipse at 100% 0%, #dce9ffb3, transparent 70%), linear-gradient(120deg, #fbfdff, #f3f7fd);
}
.drawer-header::before { content: ''; position: absolute; top: 0; left: 26px; width: 48px; height: 3px; border-radius: 0 0 4px 4px; background: linear-gradient(90deg, var(--drawer-accent), #8cbcf3); }
.title-block { display: flex; flex-direction: column; min-width: 0; flex: 1; }
.title-block h3 { margin: 0; color: #1b304d; font-size: 21px; font-weight: 650; line-height: 1.4; letter-spacing: -.6px; overflow-wrap: anywhere; }
.drawer-subtitle { margin: 8px 0 0; color: #7a8da6; font-size: 12px; line-height: 1.7; overflow-wrap: anywhere; }
.header-actions { display: flex; align-items: center; flex-shrink: 0; gap: 8px; }
.close-btn { display: grid; place-items: center; width: 34px; height: 34px; padding: 0; border: 1px solid #d7e2f0; border-radius: 10px; background: #ffffffb3; color: #6f83a0; box-shadow: 0 2px 5px #233f6510; transition: background-color 150ms, color 150ms, border-color 150ms; }
.close-btn svg { width: 16px; height: 16px; }
.close-btn:hover:enabled { background: #fff; border-color: #a4bddf; color: #294f86; }

/* Alleen de inhoud scrollt; de header en acties blijven in beeld. */
.drawer-content { flex: 1 1 auto; min-height: 0; overflow-y: auto; overscroll-behavior: contain; padding: 24px 26px; background: #fafbfd; scrollbar-width: thin; scrollbar-color: #c6d3e3 transparent; }
.drawer-content :deep(.info-card) { margin-bottom: 12px; padding: 16px; border: 1px solid #e3eaf3; border-radius: 12px; background: #fff; box-shadow: 0 2px 5px #213b5b03; }
.drawer-content :deep(.card-label) { display: block; margin-bottom: 9px; color: #8594a9; font-size: 11px; font-weight: 550; line-height: 1.5; }
.drawer-content :deep(.card-content) { display: flex; align-items: center; justify-content: space-between; gap: 16px; color: #314862; font-size: 13px; line-height: 1.7; }
.drawer-content :deep(.card-content > div) { min-width: 0; overflow-wrap: anywhere; }
.drawer-content :deep(.link-btn) { flex-shrink: 0; padding: 6px 8px; border: 0; border-radius: 6px; background: transparent; color: #3a6bb7; font-size: 11px; font-weight: 600; }
.drawer-content :deep(.link-btn:hover:enabled) { background: #eff5ff; }
.drawer-content :deep(.status-select), .drawer-content :deep(.form-input), .drawer-content :deep(.form-select), .drawer-content :deep(.form-textarea) { width: 100%; min-height: 42px; padding: 10px 12px; border: 1px solid #dce5f0; border-radius: 9px; background: #f7f9fd; color: #314862; font-size: 12px; transition: border-color 150ms, box-shadow 150ms; }
.drawer-content :deep(.status-select:focus), .drawer-content :deep(.form-input:focus), .drawer-content :deep(.form-select:focus), .drawer-content :deep(.form-textarea:focus) { outline: none; border-color: #7a9ed9; background: #fff; box-shadow: 0 0 0 3px #3267d510; }
.drawer-content :deep(.form-textarea) { min-height: 100px; resize: vertical; }
.drawer-content :deep(.error-box) { padding: 12px 14px; border: 1px solid #edcbd0; border-radius: 9px; background: #fff3f4; color: #a03945; font-size: 12px; line-height: 1.7; overflow-wrap: anywhere; }

.drawer-footer { display: flex; align-items: center; justify-content: flex-end; flex: 0 0 auto; flex-wrap: wrap; gap: 10px; padding: 20px 26px; padding-bottom: max(20px, env(safe-area-inset-bottom)); border-top: 1px solid #e5ecf5; border-radius: 0 0 0 20px; background: linear-gradient(180deg, #fff, #f7f9fd); box-shadow: 0 -5px 20px #213b5b03; }
.drawer-footer :deep(.drawer-actions) { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px; width: 100%; }
.drawer-footer :deep(.btn) { display: inline-flex; align-items: center; justify-content: center; min-height: 41px; padding: 10px 18px; border: 1px solid transparent; border-radius: 9px; font-size: 12px; font-weight: 600; transition: background-color 150ms, box-shadow 150ms; }
.drawer-footer :deep(.btn-blue) { border-color: #2d5db9; background: linear-gradient(180deg, #447ce3, #2d62cb); color: #fff; box-shadow: 0 4px 10px #3065c724, inset 0 1px #ffffff26; }
.drawer-footer :deep(.btn-blue:hover:enabled) { background: linear-gradient(180deg, #3971d8, #2457bc); box-shadow: 0 5px 14px #3065c735; }
.drawer-footer :deep(.btn-red) { border-color: #ecd6db; background: #fff; color: #b34b59; }
.drawer-footer :deep(.btn-red:hover:enabled) { background: #fff1f3; }
.drawer-enter-active, .drawer-leave-active { transition: transform 280ms cubic-bezier(.2, .8, .2, 1), opacity 200ms; }
.drawer-enter-from, .drawer-leave-to { transform: translateX(100%); opacity: 0; }
@media (max-width: 540px) {
  .drawer-wrapper { width: 100%; }
  .drawer, .drawer-header, .drawer-footer { border-radius: 0; }
  .drawer { border-left: 0; }
  .drawer-header { padding: 25px 20px 22px; }
  .drawer-header::before { left: 20px; }
  .title-block h3 { font-size: 20px; }
  .drawer-content { padding: 20px; }
  .drawer-footer { padding-left: 20px; padding-right: 20px; }
}
@media (prefers-reduced-motion: reduce) { .drawer-enter-active, .drawer-leave-active { transition: none; } .drawer-wrapper :deep(*) { transition: none !important; } }
</style>
