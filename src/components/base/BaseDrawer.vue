<template>
  <Transition name="drawer">
    <div v-if="show" class="drawer-wrapper">
      <div class="drawer">
        <!-- HEADER -->
        <div class="drawer-header">
  <div class="title-block">
    <h3>{{ title }}</h3>
    <h4>{{ subtitle }}</h4>
  </div>

  <div class="header-actions">
    <slot name="header-actions">
      <button class="close-btn" @click="$emit('close')">✕</button>
    </slot>
  </div>
</div>

        <!-- CONTENT -->
        <div class="drawer-content">
          <slot />
        </div>

        <!-- FOOTER -->
        <div v-if="$slots.footer" class="drawer-footer">
          <slot name="footer" />
        </div>

        <!-- OPTIONAL CONFIRMATION POPUP -->
        <slot name="confirm-popup" />
      </div>
    </div>
  </Transition>
</template>

<script setup>
defineProps({
  show: { type: Boolean, default: false },
  title: { type: String, default: '' },
  subtitle: {type: String , default: ''}
})
</script>

<style scoped>
.drawer-wrapper {
  position: fixed;
  top: 0;
  right: 0;
  height: 100vh;
  z-index: 1000;
}
.drawer {
  width: 400px;
  height: 100%;
  background: #fff;
  border-radius: 12px 0 0 12px;
  box-shadow: -10px 0 30px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
}
.drawer-enter-from,
.drawer-leave-to {
  transform: translateX(100%);
}
.drawer-enter-active,
.drawer-leave-active {
  transition: transform 0.3s ease;
}

.drawer-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 20px;
  border-bottom: 1px solid #e5e7eb;
}

.title-block {
  display: flex;
  flex-direction: column;
}
.drawer-header h3 {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
}

.drawer-header h4 {
  margin: 4px 0 0;
  font-size: 13px;
  font-weight: 400;
  color: #6b7280;
}
.header-actions {
  display: flex;
  gap: 10px;
}
.drawer-content {
  padding: 20px;
  overflow-y: auto;
  flex: 1;
}
.drawer-footer {
  padding: 20px;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
.close-btn {
  width: 36px;
  height: 36px;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  background: #f3f4f6;
}
.close-btn:hover {
  background: #ef4444;
  color: white;
}
</style>
