<template>
  <div :class="['app-layout', { 'mobile-padding': isMobile && hasSidebar }]">
    <SidebarComponent
      v-if="hasSidebar"
      :class="['sidebar-wrapper', { 'mobile-open': mobileSidebarOpen && isMobile }]"
      @closeSidebar="mobileSidebarOpen = false"
    />
    <!-- MOBILE HEADER -->
    <MobileHeader v-if="isMobile && hasSidebar" @openSidebar="mobileSidebarOpen = true" />

    <!-- SIDEBAR -->

    <!-- OVERLAY ON MOBILE -->
    <div
      v-if="mobileSidebarOpen && isMobile"
      class="overlay"
      @click="mobileSidebarOpen = false"
    ></div>

    <!-- MAIN CONTENT -->
    <main :class="['main-content', mainClass]">
      <router-view />
    </main>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRoute } from 'vue-router'
import { useSidebarStore } from '@/stores/sidebar'
import SidebarComponent from './components/SideBarComponent.vue'
import MobileHeader from './components/MobileHeader.vue'

const route = useRoute()
const store = useSidebarStore()

// Detect mobile
const width = ref(window.innerWidth)
const isMobile = ref(width.value < 768)
const mobileSidebarOpen = ref(false)

function handleResize() {
  width.value = window.innerWidth
  isMobile.value = width.value < 768

  if (!isMobile.value) mobileSidebarOpen.value = false
}

onMounted(() => window.addEventListener('resize', handleResize))
onBeforeUnmount(() => window.removeEventListener('resize', handleResize))

// Sidebar state
const hasSidebar = computed(() => !route.meta.noSidebar)

// Main content margin
const mainClass = computed(() => {
  if (!hasSidebar.value) return 'no-sidebar'
  if (isMobile.value) return 'mobile'
  return store.collapsed ? 'collapsed' : 'expanded'
})
</script>

<style>
.app-layout {
  display: flex;
  min-height: 100vh;
  position: relative;
}

/* Voeg padding-top toe op mobiel om ruimte voor header te maken */
.app-layout.mobile-padding {
  padding-top: 60px;
}

/* MAIN CONTENT */
.main-content {
  flex: 1;
  background: #ebeffa;
  transition: margin-left 0.3s ease;
}

/* Desktop states */
.main-content.expanded {
  margin-left: 260px;
}
.main-content.collapsed {
  margin-left: 80px;
}
.main-content.no-sidebar {
  margin-left: 0 !important;
}

/* Mobile */
@media (max-width: 768px) {
  .main-content.mobile {
    margin-left: 0 !important;
  }
}

/* MOBILE SIDEBAR WRAPPER FULLSCREEN */
.sidebar-wrapper {
  position: fixed;
  top: 0;
  left: 0;
  height: 100vh;
  width: 260px;
  z-index: 1000;
  transition: transform 0.3s ease;
}
.sidebar-wrapper.mobile-open {
  transform: translateX(0);
}
@media (max-width: 768px) {
  .app{
    max-height: 92vh;
  }
  .sidebar-wrapper {
    width: 100vw;
    transform: translateX(-100%);
  }
}

/* OVERLAY */
.overlay {
  position: fixed;
  top: 60px; /* onder header */
  left: 0;
  width: 100%;
  height: calc(100% - 60px);
  background: rgba(0, 0, 0, 0.45);
  z-index: 999;
}
</style>
