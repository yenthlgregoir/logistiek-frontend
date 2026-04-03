<template>
  <aside :class="['sidebar', { collapsed: isReallyCollapsed, 'mobile-open': isMobile && mobileOpen }]">

    <!-- LOGO -->
    <RouterLink to="/" class="logo-wrapper"               @click= "handleLinkClick"
>
      <img src="../assets/logo_white.png" class="logo" />
    </RouterLink>

    <!-- TOGGLE BUTTON -->
    <button class="collapse-btn" @click="handleCollapse">
      <component :is="isReallyCollapsed ? ChevronRight : ChevronLeft" />
    </button>

    <!-- NAV LINKS -->
    <nav class="nav-links">
      <div v-for="link in currentLinks" :key="link.to" class="nav-item">

        <RouterLink :to="link.to" :class="['nav-link', { active: isActive(link.to) }]"               @click= "handleLinkClick"
>
          <component :is="link.icon" class="icon" />
          <span v-if="!isReallyCollapsed">{{ link.label }}</span>
        </RouterLink>

        <transition name="submenu">
          <div v-if="link.submenu && isActive(link.to) && !isReallyCollapsed" class="submenu">
            <RouterLink
              v-for="sublink in link.submenu"
              :key="sublink.to"
              :to="sublink.to"
                            @click= "handleLinkClick"

              :class="['submenu-item', { active: route.path === sublink.to }]">
              <component :is="sublink.icon" class="icon small" />
              <span>{{ sublink.label }}</span>
            </RouterLink>
          </div>
        </transition>

      </div>
    </nav>
  </aside>
</template>

<script setup>
import { computed, ref, onMounted, onBeforeUnmount } from 'vue'
import { useRoute } from 'vue-router'
import { useSidebarStore } from '@/stores/sidebar'
import {
  ShoppingCart, Archive, Users, Wrench, Calendar, List,
  ChevronLeft, ChevronRight, User, PlusCircle, Hammer, MoveVertical, Warehouse
} from 'lucide-vue-next'

const store = useSidebarStore()
const route = useRoute()
const emit = defineEmits(['closeSidebar'])
const mobileOpen = ref(false)

// detect mobile
const isMobile = ref(window.innerWidth < 768)
function handleResize() { isMobile.value = window.innerWidth < 768 }
onMounted(() => window.addEventListener('resize', handleResize))
onBeforeUnmount(() => window.removeEventListener('resize', handleResize))

// collapsed logic
const isReallyCollapsed = computed(() => isMobile.value ? false : store.collapsed)

function handleCollapse() {
  if (isMobile.value) {
    emit('closeSidebar')
  } else {
    store.toggleSidebar()
  }
}

// Links
const linkGroups = {
  purchase: [{ to: '/purchase', label: 'Bestellingen', icon: ShoppingCart }, { to: '/purchase/archive', label: 'Archief', icon: Archive }],
  renting: [
    { to: '/renting/agenda', label: 'Agenda', icon: Calendar, submenu: [{ to: '/renting/agenda/planning', label: 'Planning', icon: Calendar }, { to: '/renting/agenda/lijst', label: 'Lijst', icon: List }]},
    { to: '/renting/archief', label: 'Archief', icon: Archive },
    { to: '/renting/klanten', label: 'Klanten', icon: Users },
    { to: '/renting/toestellen', label: 'Toestellen', icon: Wrench }
  ],
  logistics: [
    { to: '/logistics/schaarlift', label: 'schaarlift', icon: MoveVertical, submenu: [{ to: '/logistics/schaarlift/planning', label: 'Planning', icon: Calendar }, { to: '/logistics/schaarlift/verhuur', label: 'Verhuur', icon: Calendar }, { to: '/logistics/schaarlift/lijst', label: 'Lijst', icon: List }]},
    { to: '/logistics/werfcontainers', label: 'Werfcontainers', icon: Warehouse, submenu: [{ to: '/logistics/werfcontainers/planning', label: 'Planning', icon: Calendar }, { to: '/logistics/werfcontainers/lijst', label: 'Lijst', icon: List }]},
    { to: '/logistics/werf', label: 'Werven', icon: Hammer },
    { to: '/logistics/projectleiders', label: 'Projectleiders', icon: Users }
  ],
  admin: [
    { to: '/admin/users', label: 'Users', icon: User },
    { to: '/admin/create-user', label: 'Create User', icon: PlusCircle }
  ]
}

const currentLinks = computed(() => {
  if (route.path.startsWith('/purchase')) return linkGroups.purchase
  if (route.path.startsWith('/renting')) return linkGroups.renting
  if (route.path.startsWith('/admin')) return linkGroups.admin
  if (route.path.startsWith('/logistics')) return linkGroups.logistics
  return []
})

function isActive(target) {
  return route.path === target || route.path.startsWith(target + '/')
}

function handleLinkClick() {
  if (isMobile.value) {
    mobileOpen.value = false       // sluit de mobiele sidebar
    emit('closeSidebar')           // emit naar parent
  }
}
</script>

<style scoped>
/* SIDEBAR */
.sidebar {
  position: fixed;
  top: 0;
  left: 0;
  width: 260px;
  height: 100vh;
  z-index: 1001;
  padding: 24px;
  display: flex;
  flex-direction: column;
  background: linear-gradient(180deg, #5a89ff, #3553f2);
  box-shadow: 6px 0px 24px rgba(0,0,0,0.12);
  backdrop-filter: blur(8px);
  transition: width 0.3s ease, transform 0.3s ease;
}

/* COLLAPSED */
.sidebar.collapsed { width: 80px; padding: 24px 12px; }

/* LOGO */
.logo-wrapper { display: flex; justify-content: center; align-items: center; margin-bottom: 40px; }
.logo { width: 150px; transition: all 0.25s ease; }
.sidebar.collapsed .logo { width: 40px; }

/* COLLAPSE BUTTON */
.collapse-btn { background: rgba(255,255,255,0.15); border: none; color:white; border-radius:10px; padding:8px; cursor:pointer; margin-bottom:20px; align-self:center; transition: all 0.2s ease;}
.collapse-btn:hover { background: rgba(255,255,255,0.3); }

/* NAV */
.nav-links { display: flex; flex-direction: column; gap: 25px; }
.nav-link { display: flex; align-items: center; gap: 14px; color: white; text-decoration:none; padding:14px 18px; border-radius:12px; font-size:1rem; font-weight:500; transition: all 0.25s ease;}
.nav-link.active { background:white; color:#3756f3; font-weight:700; box-shadow:0 4px 12px rgba(255,255,255,0.25);}
.nav-link:hover { background: rgba(255,255,255,0.18); }

/* ICONS */
.icon { width:20px; height:20px; flex-shrink:0; }
.icon.small { width:16px; height:16px; }

/* COLLAPSED */
.sidebar.collapsed .nav-link { justify-content:center; padding:14px; }
.sidebar.collapsed .nav-link span { display:none; }
.sidebar.collapsed .submenu { display:none; }

/* SUBMENU */
.submenu { margin-left:18px; margin-top:15px; padding-left:10px; border-left:2px solid rgba(255,255,255,0.4); display:flex; flex-direction:column; gap:5px;}
.submenu-item { display:flex; align-items:center; gap:10px; color:#ffffffcc; font-size:0.9rem; padding:8px 12px; border-radius:8px; text-decoration:none; transition: all 0.2s ease;}
.submenu-item:hover { background: rgba(255,255,255,0.15);}
.submenu-item.active { background:white; color:#3553f2; font-weight:700; }

/* MOBILE FULLSCREEN */
@media (max-width: 768px) {
  .sidebar { width: 100%; transform: translateX(-100%); }
  .sidebar.mobile-open { transform: translateX(0); }
}
</style>