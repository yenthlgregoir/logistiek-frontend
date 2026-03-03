<script setup>
// Geen props nodig; dit is een simpele, herbruikbare logo-component
</script>

<template>
  <svg
    class="logo"
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-label="Bumaco logo"
  >
    <!-- Hexagon-stijl icoon in brandblauw -->
    <path d="M50 6 88 28v44L50 94 12 72V28L50 6Z" stroke="#2a6fb0" stroke-width="6" fill="none" />
    <path d="M50 22 74 36v28L50 78 26 64V36L50 22Z" stroke="#2a6fb0" stroke-width="4" fill="none" />
    <circle cx="50" cy="50" r="6" fill="#2a6fb0" />
  </svg>
</template>

<style scoped>
.logo {
  display: block;
  width: 100%;
  height: 100%;
}
</style>
