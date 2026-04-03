<template>
  <header class="mobile-header">
    <button class="menu-btn" @click="$emit('openSidebar')">
      <svg width="28" height="28" viewBox="0 0 24 24" stroke="white" fill="none" stroke-width="2">
        <path d="M3 6h18M3 12h18M3 18h18" />
      </svg>
    </button>
    <RouterLink to="/" class="logo-wrapper">
      <img src="../assets/logo_white.png" class="logo" />
    </RouterLink>
  </header>
</template>

<style scoped>
.mobile-header {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%; /* Hele breedte */
  height: 60px;
  background: linear-gradient(180deg, #5a89ff, #3553f2);
  color: white;
  display: flex;
  align-items: center;
  padding: 0 16px;
  z-index: 1000;
}

.menu-btn {
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 4px;
}

.title {
  font-size: 1.2rem;
  font-weight: 600;
}
.logo-wrapper {
  display: block;
  justify-content: center;
  align-items: center;
  margin-top: 10px;
}
.logo {
  width: 150px;
  transition: all 0.25s ease;
}
</style>
