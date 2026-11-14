<template>
  <Teleport to="body">
    <div class="tools-overlay" @click.self="close">
      <section
        ref="panel"
        class="tools-drawer"
        role="dialog"
        aria-modal="true"
        :aria-labelledby="titleId"
        tabindex="-1"
        :style="{ maxWidth: width }"
      >
        <header class="tools-drawer-head">
          <div>
            <span class="tools-eyebrow">Tools · Uitleen</span>
            <h2 :id="titleId">{{ title }}</h2>
          </div>
          <button
            class="tool-btn"
            type="button"
            aria-label="Sluiten"
            :disabled="busy"
            @click="close"
          >
            <X :size="18" />
          </button>
        </header>
        <div class="tools-drawer-content"><slot /></div>
        <footer v-if="$slots.footer" class="tools-drawer-footer"><slot name="footer" /></footer>
      </section>
    </div>
  </Teleport>
</template>
<script setup>
import { ref, onMounted, onBeforeUnmount, getCurrentInstance } from 'vue'
import { X } from 'lucide-vue-next'
import '@/assets/tools.css'
const props = defineProps({
  title: { type: String, required: true },
  busy: Boolean,
  width: { type: String, default: '720px' },
})
const emit = defineEmits(['close'])
const panel = ref(null)
const titleId = `tools-drawer-title-${getCurrentInstance().uid}`
let previousFocus
function close() {
  if (!props.busy) emit('close')
}
function onKey(event) {
  if (event.key === 'Escape') {
    event.preventDefault()
    close()
  }
  if (event.key !== 'Tab' || !panel.value) return
  const controls = [
    ...panel.value.querySelectorAll(
      'button:not(:disabled),input:not(:disabled),select:not(:disabled),textarea:not(:disabled),a[href]',
    ),
  ].filter((el) => el.getClientRects().length)
  const first = controls[0],
    last = controls.at(-1)
  if (!first) {
    event.preventDefault()
    panel.value.focus()
    return
  }
  if (
    event.shiftKey &&
    (document.activeElement === first || document.activeElement === panel.value)
  ) {
    event.preventDefault()
    last.focus()
  } else if (
    !event.shiftKey &&
    (document.activeElement === last || document.activeElement === panel.value)
  ) {
    event.preventDefault()
    first.focus()
  }
}
onMounted(() => {
  previousFocus = document.activeElement
  panel.value?.focus()
  document.addEventListener('keydown', onKey)
})
onBeforeUnmount(() => {
  document.removeEventListener('keydown', onKey)
  if (previousFocus?.isConnected) previousFocus.focus()
})
</script>
<style scoped>
.tools-overlay {
  position: fixed;
  inset: 0;
  background: #14283d55;
  z-index: 2000;
  display: flex;
  justify-content: flex-end;
}
.tools-drawer {
  width: 100%;
  height: 100dvh;
  background: #f9fbfe;
  box-shadow: -8px 0 30px #19304e25;
  display: flex;
  flex-direction: column;
  animation: tools-drawer-in 0.2s ease;
}
.tools-drawer-head {
  padding: 22px 24px;
  background: #fff;
  border-bottom: 1px solid #e1e7f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 15px;
}
.tools-drawer-head h2 {
  font-size: 20px;
  color: #19304e;
  margin: 5px 0 0;
}
.tools-drawer-content {
  padding: 22px 24px;
  overflow-y: auto;
  min-height: 0;
  flex: 1;
}
.tools-drawer-footer {
  padding: 16px 24px;
  background: #fff;
  border-top: 1px solid #e1e7f0;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  flex-wrap: wrap;
}
@keyframes tools-drawer-in {
  from {
    transform: translateX(40px);
    opacity: 0.6;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}
@media (prefers-reduced-motion: reduce) {
  .tools-drawer {
    animation: none;
  }
}
</style>
