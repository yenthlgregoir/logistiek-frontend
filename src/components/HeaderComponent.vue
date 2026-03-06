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

<style scoped>
.topbar {
  display: flex;
  align-items: center;
  background: white;
  padding: 14px 32px;
  border-bottom: 1px solid #e5e7eb;
}

.logo {
  height: 32px;
}

.header-right {
  margin-left: auto;
  display: flex;
  gap: 24px;
}

/* RouterLink = <a> */
.header-right a {
  text-decoration: none;
  color: #4f5661;
  font-weight: 500;
  font-size: 15px;
  transition: color 0.2s ease;
}

.header-right a:hover {
  color: #080808;
}

.header-right a.router-link-active {
  color: #2f80ed;
  font-weight: 600;
}

a.router-link-exact-active {
  color: #1976d2;
}

</style>
