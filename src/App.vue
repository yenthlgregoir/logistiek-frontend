<template>
  <div class="app-layout">
    <!-- alleen tonen als header/sidebar nodig zijn -->
    <HeaderComponent v-if="hasSidebar" />

    <main :class="['main-content', { 'no-sidebar': !hasSidebar }]">
      <router-view />
    </main>
  </div>
</template>

<script setup>
import HeaderComponent from './components/HeaderComponent.vue'
import { watch, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import { collapsed } from '@/stores/sidebar'

const route = useRoute()

// 🔥 sidebar tonen
const hasSidebar = computed(() => !route.meta.noSidebar)

// 🔥 header tonen alleen als sidebar ook getoond wordt

// 🔥 update body class voor collapsed sidebar
watch(collapsed, (val) => {
  document.body.classList.toggle('sidebar-collapsed', val)
})

// 🔥 init bij refresh
onMounted(() => {
  document.body.classList.toggle('sidebar-collapsed', collapsed.value)
})
</script>

<style>
body {
  margin: 0;
  font-family: 'Segoe UI', Roboto, sans-serif;
}

/* ===================== LAYOUT ===================== */
.app-layout {
  display: flex;
  min-height: 100vh;
}

/* ===================== MAIN CONTENT ===================== */
.main-content {
  flex: 1;
  min-height: 100vh;
  box-sizing: border-box;
  background-color: #EBEFFA;

  /* standaard ruimte voor sidebar */
  margin-left: 260px;
  transition: margin-left 0.3s ease;
}

/* collapsed sidebar */
body.sidebar-collapsed .main-content {
  margin-left: 80px;
}

/* geen sidebar en geen header */
.main-content.no-sidebar {
  margin-left: 0 !important;
}
</style>