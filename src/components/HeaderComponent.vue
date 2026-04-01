<template>
  <aside :class="['sidebar', { collapsed }]">
    
    <!-- LOGO -->
    <RouterLink to="/" class="logo-wrapper">
      <img src="../assets/logo_white.png" class="logo" />
    </RouterLink>

    <!-- TOGGLE BUTTON -->
    <button class="collapse-btn" @click="toggleSidebar">
      <component :is="collapsed ? ChevronRight : ChevronLeft" />
    </button>

    <nav class="nav-links">
      <div v-for="link in currentLinks" :key="link.to" class="nav-item">

        <!-- MAIN LINK -->
        <RouterLink
          :to="link.to"
          :class="['nav-link', { active: isActive(link.to) }]"
        >
          <component :is="link.icon" class="icon" />
          <span v-if="!collapsed">{{ link.label }}</span>
        </RouterLink>

        <!-- SUBMENU -->
        <transition name="submenu">
          <div
            v-if="link.submenu && isActive(link.to) && !collapsed"
            class="submenu"
          >
            <RouterLink
              v-for="sublink in link.submenu"
              :key="sublink.to"
              :to="sublink.to"
              :class="['submenu-item', { active: route.path === sublink.to }]"
            >
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
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { collapsed, toggleSidebar } from '@/stores/sidebar';

// ICONS
import {
  ShoppingCart,
  Archive,
  Users,
  Wrench,
  Calendar,
  List,
  ChevronLeft,
  ChevronRight,
  User,
  PlusCircle,
  Hammer,
  MoveVertical,
  Warehouse 
} from 'lucide-vue-next'

const route = useRoute()

const linkGroups = {
  purchase: [
    { to: '/purchase', label: 'Bestellingen', icon: ShoppingCart },
    { to: '/purchase/archive', label: 'Archief', icon: Archive },
  ],
  renting: [
    {
      to: '/renting/agenda',
      label: 'Agenda',
      icon: Calendar,
      submenu: [
        { to: '/renting/agenda/planning', label: 'Planning', icon: Calendar },
        { to: '/renting/agenda/lijst', label: 'Lijst', icon: List },
      ],
    },
    { to: '/renting/archief', label: 'Archief', icon: Archive },
    { to: '/renting/klanten', label: 'Klanten', icon: Users },
    { to: '/renting/toestellen', label: 'Toestellen', icon: Wrench },
  ],
  logistics: [
    { to: '/logistics/schaarlift', 
    label: 'schaarlift', 
    icon: MoveVertical,  
    submenu: [
        { to: '/logistics/schaarlift/planning', label: 'Planning', icon: Calendar },
         {to: '/logistics/schaarlift/verhuur',label: 'Verhuur' , icon:Calendar},
        { to: '/logistics/schaarlift/lijst', label: 'Lijst', icon: List },
      ], 
    },
     { to: '/logistics/werfcontainers', 
    label: 'Werfcontainers', 
    icon: Warehouse,  
    submenu: [
        { to: '/logistics/werfcontainers/planning', label: 'Planning', icon: Calendar },
        { to: '/logistics/werfcontainers/lijst', label: 'Lijst', icon: List },
      ], 
    },
    { to: '/logistics/werf' , label: 'Werven' , icon: Hammer },
    { to: '/logistics/projectleiders', label: 'Projectleiders' , icon: Users}
  ],
  admin: [
    {
      to: '/admin/users',
      label: 'Users',
      icon: User 
    },
   {
      to: '/admin/create-user',
      label: 'Users',
      icon: PlusCircle 
    }
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
</script>

<style scoped>
/* ===================== SIDEBAR ===================== */
.sidebar {
  position: fixed;
  top: 0;
  left: 0;
  width: 260px;
  height: 100vh;
  padding: 24px;
  display: flex;
  flex-direction: column;
  background: linear-gradient(180deg, #5a89ff, #3553f2);
  box-shadow: 6px 0px 24px rgba(0, 0, 0, 0.12);
  backdrop-filter: blur(8px);
  transition: width 0.3s ease;
}

/* COLLAPSED */
.sidebar.collapsed {
  width: 80px;
  padding: 24px 12px;
}

/* ===================== LOGO ===================== */
.logo-wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-bottom: 40px;
}

.logo {
  width: 150px;
  transition: all 0.25s ease;
}

.sidebar.collapsed .logo {
  width: 40px;
}

.logo:hover {
  transform: scale(1.07);
}

/* ===================== TOGGLE BUTTON ===================== */
.collapse-btn {
  background: rgba(255, 255, 255, 0.15);
  border: none;
  color: white;
  border-radius: 10px;
  padding: 8px;
  cursor: pointer;
  margin-bottom: 20px;
  align-self: center;
  transition: all 0.2s ease;
}

.collapse-btn:hover {
  background: rgba(255, 255, 255, 0.3);
}

/* ===================== NAV ===================== */
.nav-links {
  display: flex;
  flex-direction: column;
  gap: 25px;
}

/* ===================== MAIN LINKS ===================== */
.nav-link {
  display: flex;
  align-items: center;
  gap: 14px;
  color: white;
  text-decoration: none;
  padding: 14px 18px;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 500;
  letter-spacing: 0.3px;
  transition: all 0.25s ease;
}

.nav-link:hover {
  background: rgba(255, 255, 255, 0.18);
}

.nav-link.active {
  background: white;
  color: #3756f3;
  font-weight: 700;
  box-shadow: 0 4px 12px rgba(255, 255, 255, 0.25);
}

/* ===================== ICONS ===================== */
.icon {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
}

.icon.small {
  width: 16px;
  height: 16px;
}

/* ===================== COLLAPSED MODE ===================== */
.sidebar.collapsed .nav-link {
  justify-content: center;
  padding: 14px;
}

.sidebar.collapsed .nav-link span {
  display: none;
}

/* ===================== SUBMENU ===================== */
.submenu {
  margin-left: 18px;
  margin-top: 15px;
  padding-left: 10px;
  border-left: 2px solid rgba(255, 255, 255, 0.4);
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.submenu-item {
  display: flex;
  align-items: center;
  gap: 10px;
  color: #ffffffcc;
  font-size: 0.9rem;
  padding: 8px 12px;
  border-radius: 8px;
  text-decoration: none;
  transition: all 0.2s ease;
}

.submenu-item:hover {
  background: rgba(255, 255, 255, 0.15);
}

.submenu-item.active {
  background: white;
  color: #3553f2;
  font-weight: 700;
}

/* Hide submenu in collapsed */
.sidebar.collapsed .submenu {
  display: none;
}

/* ===================== ANIMATION ===================== */
.submenu-enter-active,
.submenu-leave-active {
  transition: all 0.25s ease;
  overflow: hidden;
}

.submenu-enter-from,
.submenu-leave-to {
  opacity: 0;
  transform: translateY(-10px);
  max-height: 0;
}

.submenu-enter-to,
.submenu-leave-from {
  opacity: 1;
  transform: translateY(0);
  max-height: 200px;
}
</style>
