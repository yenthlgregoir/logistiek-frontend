<template>
  <div v-if="isReady" :class="['app-layout', { 'mobile-padding': isMobile && hasSidebar }]">
    <!-- 🔥 GLOBAL LOADER -->
    <GlobalLoader />

    <!-- SIDEBAR -->
    <SidebarComponent
      v-if="hasSidebar"
      :class="['sidebar-wrapper', { 'mobile-open': mobileSidebarOpen && isMobile }]"
      @closeSidebar="mobileSidebarOpen = false"
    />

    <!-- MOBILE HEADER -->
    <MobileHeader v-if="isMobile && hasSidebar" @openSidebar="mobileSidebarOpen = true" />

    <!-- OVERLAY -->
    <div v-if="mobileSidebarOpen && isMobile" class="overlay" @click="mobileSidebarOpen = false" />

    <!-- 🚀 MAIN -->
    <main
      :class="[
        'main-content',
        mainClass,
        {
          'no-layout-transition': disableLayoutTransition,
          'no-route-transition': isFirstLoad,
        },
      ]"
    >
      <router-view />
    </main>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { useRoute } from 'vue-router'
import { useSidebarStore } from '@/stores/sidebar'

import SidebarComponent from './components/SideBarComponent.vue'
import MobileHeader from './components/MobileHeader.vue'
import GlobalLoader from '@/components/base/GlobalLoading.vue'

/* -----------------------
   ROUTE + STORE
------------------------ */
const route = useRoute()
const store = useSidebarStore()

/* -----------------------
   STATE
------------------------ */
const isReady = ref(false)
const isFirstLoad = ref(true)

const width = ref(0)
const isMobile = ref(false)

const mobileSidebarOpen = ref(false)
const disableLayoutTransition = ref(false)

/* -----------------------
   COMPUTED
------------------------ */
const hasSidebar = computed(() => !route.meta.noSidebar)

const mainClass = computed(() => {
  if (!hasSidebar.value) return 'no-sidebar'
  if (isMobile.value) return 'mobile'
  return store.collapsed ? 'collapsed' : 'expanded'
})

/* -----------------------
   RESIZE
------------------------ */
function handleResize() {
  width.value = window.innerWidth
  isMobile.value = width.value < 768

  if (!isMobile.value) {
    mobileSidebarOpen.value = false
  }
}

/* -----------------------
   🔑 DISABLE TRANSITION ON ROUTE SIDEBAR CHANGE
------------------------ */
watch(
  () => hasSidebar.value,
  () => {
    disableLayoutTransition.value = true

    requestAnimationFrame(() => {
      disableLayoutTransition.value = false
    })
  },
)

/* -----------------------
   INIT (NO FLASH)
------------------------ */
onMounted(() => {
  handleResize()
  window.addEventListener('resize', handleResize)

  requestAnimationFrame(() => {
    isReady.value = true
  })

  // enkel eerste render → geen animaties
  setTimeout(() => {
    isFirstLoad.value = false
  }, 0)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)
})
</script>

<style>
/* =========================
   BASE
========================= */

.app-layout {
  display: flex;
  min-height: 100vh;
  position: relative;
}

/* =========================
   MAIN CONTENT
========================= */

.main-content {
  flex: 1;
  background: #ebeffa;
}

/* ✅ sidebar states (desktop) */
.main-content.expanded {
  margin-left: 260px;
}

.main-content.collapsed {
  margin-left: 80px;
}

.main-content.expanded,
.main-content.collapsed {
  transition: margin-left 0.3s ease;
}

/* ✅ no sidebar */
.main-content.no-sidebar {
  margin-left: 0 !important;
  transition: none !important;
}

/* ✅ disable transitions ONLY when routing */
.no-layout-transition {
  transition: none !important;
}

/* ✅ disable animations on first render */
.no-route-transition * {
  transition: none !important;
  animation: none !important;
}

/* mobile */
@media (max-width: 768px) {
  .main-content.mobile {
    margin-left: 0 !important;
  }
}

/* =========================
   SIDEBAR
========================= */

.sidebar-wrapper {
  position: fixed;
  top: 0;
  left: 0;
  height: 100vh;
  width: 260px;
  z-index: 1000;
  transition: transform 0.3s ease;
}

@media (max-width: 768px) {
  .sidebar-wrapper {
    width: 100vw;
    transform: translateX(-100%);
  }
}

.sidebar-wrapper.mobile-open {
  transform: translateX(0);
}

/* =========================
   OVERLAY
========================= */

.overlay {
  position: fixed;
  top: 60px;
  left: 0;
  width: 100%;
  height: calc(100% - 60px);
  background: rgba(0, 0, 0, 0.45);
  z-index: 999;
}

/* =========================
   MOBILE PADDING
========================= */

.app-layout.mobile-padding {
  padding-top: 60px;
}
</style>
