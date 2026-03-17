<template>
  <header class="topbar">
    <RouterLink to="/">
      <img src="../assets/logo-bumacogroup.svg" alt="Bumaco logo" class="logo" />
    </RouterLink>

    <div class="header-right" v-if="currentLinks.length">
      <RouterLink
        v-for="link in currentLinks"
        :key="link.to"
        :to="link.to"
        :class="{ active: isActive(link.to) }"
      >
        {{ link.label }}
      </RouterLink>
    </div>
  </header>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()

const linkGroups = {
  purchase: [
    { to: '/purchase', label: 'bestellingen' },
    { to: '/purchase/archive', label: 'archief' },
    { to: '/purchase/leveranciers', label: 'leveranciers' },
  ],
  renting: [
    { to: '/renting', label: 'Agenda' },
    { to: '/renting/archief', label: 'Archief' },
    { to: '/renting/klanten', label: 'Klanten' },
    { to: '/renting/toestellen', label: 'Toestellen' },
  ],
}

const currentLinks = computed(() => {
  if (route.path.startsWith('/purchase')) return linkGroups.purchase
  if (route.path.startsWith('/renting')) return linkGroups.renting
  return [] 
})

function isActive(target) {
  return route.path === target || route.path.startsWith(target + '/')
}
</script>

<style scoped>.topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: rgba(255, 255, 255, 0.95);
  padding: 0 40px; /* verticale padding weg, gebruik height voor hoogte */
  max-height: 7vh; /* maximaal 7vh */
  height: 7vh;     /* hoogte vastzetten */
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08);
  backdrop-filter: blur(10px);
  transition: all 0.3s ease;
  position: relative;
  width: 100%;
  z-index: 10;
}

.logo {
  height: 3vh;
  transition: transform 0.3s ease;
}

.logo:hover{
  transform: scale(1.05);
}

.header-right {
  display: flex;
  gap: 32px;
  align-items: center;
  height: 100%; /* vult de topbar */
}

.header-right a {
  text-decoration: none;
  color: #4b5563;
  font-weight: 500;
  font-size: 15px;
  padding: 6px 10px;
  border-radius: 8px;
  transition: all 0.3s ease;
  line-height: 1.5; /* zorgt dat tekst gecentreerd blijft */
}

.header-right a:hover {
  color: #ffffff;
  background: #4f73ff;
  box-shadow: 0 4px 12px rgba(79, 115, 255, 0.3);
}

.header-right a.router-link-active {
  color: #4f73ff;
  font-weight: 600;
  background: rgba(79, 115, 255, 0.1);
  padding: 6px 12px;
}

a.router-link-exact-active {
  color: #2b6cb0;
}
</style>