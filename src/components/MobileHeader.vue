<template>
  <header class="mobile-header">
    <button class="menu-btn" type="button" aria-label="Menu openen" @click="$emit('openSidebar')">
      <svg
        width="21"
        height="21"
        viewBox="0 0 24 24"
        stroke="currentColor"
        fill="none"
        stroke-width="1.7"
        aria-hidden="true"
      >
        <path d="M3 6h18M3 12h18M3 18h18" />
      </svg>
    </button>
    <RouterLink to="/" class="logo-wrapper" aria-label="Naar modules">
      <img src="../assets/logo_ops_home.svg" class="logo" alt="Bumaco Ops platform" />
    </RouterLink>
  </header>
</template>
<script setup>
defineEmits(['openSidebar'])
</script>
<style scoped>
.mobile-header {
  position: fixed;
  inset: 0 0 auto 0;
  height: 60px;
  background: #fff;
  border-bottom: 1px solid #e3e9f1;
  color: #6e85a3;
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 0 17px;
  z-index: 1000;
}
.menu-btn {
  display: grid;
  place-items: center;
  width: 34px;
  height: 34px;
  padding: 0;
  background: #fff;
  border: 1px solid #e3e9f1;
  border-radius: 7px;
  color: inherit;
  cursor: pointer;
}
.menu-btn:hover {
  background: #f4f7fb;
  color: #346acd;
}
.logo-wrapper {
  display: flex;
  align-items: center;
  min-height: 40px;
  border-radius: 6px;
}
.logo {
  display: block;
  width: 126px;
  height: auto;
}
.mobile-header :is(a, button):focus-visible {
  outline: 3px solid #91b0de;
  outline-offset: 3px;
}
</style>
