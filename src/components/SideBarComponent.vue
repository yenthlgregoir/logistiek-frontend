<template>
  <!-- Backdrop op mobiel -->
  <Transition name="fade">
    <div v-if="isMobile && isMobileOpen" class="backdrop" @click="close" />
  </Transition>

  <aside
    ref="sidebarPanel"
    :class="[
      'sidebar',
      { collapsed: isCollapsed, mobile: isMobile, 'mobile-open': isMobile && isMobileOpen },
    ]"
    :inert="isMobile && !isMobileOpen"
    :aria-hidden="isMobile && !isMobileOpen ? true : undefined"
    :role="isMobile ? 'dialog' : undefined"
    :aria-modal="isMobile && isMobileOpen ? true : undefined"
    aria-label="Hoofdnavigatie"
  >
    <!-- HEADER -->
    <div class="sidebar__head">
      <RouterLink to="/" class="logo-wrapper" aria-label="Naar modules" @click="handleLinkClick">
        <svg v-if="isCollapsed" class="logo-mark" viewBox="32 32 72 72" aria-hidden="true">
          <image :href="sidebarLogo" width="406" height="143" />
        </svg>
        <img v-else src="../assets/logo_ops_home.svg" class="logo" alt="Bumaco Ops platform" />
      </RouterLink>

      <button v-if="isMobile" class="close-btn" aria-label="Menu sluiten" @click="close">
        <X class="icon" />
      </button>
    </div>

    <!-- Desktop collapse knop (op de rand) -->
    <button
      v-if="!isMobile"
      class="edge-toggle"
      :aria-label="isCollapsed ? 'Menu uitklappen' : 'Menu inklappen'"
      :aria-expanded="!isCollapsed"
      @click="store.toggleSidebar()"
    >
      <ChevronLeft class="edge-toggle__icon" />
    </button>

    <!-- MODULE -->
    <div v-if="section" class="section">
      <span class="section__label">{{ section.label }}</span>
    </div>

    <!-- NAV -->
    <nav class="nav" aria-label="Modulepagina’s">
      <ul>
        <li v-for="link in currentLinks" :key="link.to" class="nav-item">
          <div class="nav-row">
            <RouterLink
              :to="link.to"
              :class="['nav-link', { active: isActive(link.to) }]"
              :aria-current="isExact(link.to) ? 'page' : undefined"
              :data-tooltip="link.label"
              :aria-label="link.label"
              @click="handleLinkClick"
            >
              <span class="nav-link__icon"><component :is="link.icon" class="icon" /></span>
              <span class="nav-link__label">{{ link.label }}</span>
            </RouterLink>

            <button
              v-if="link.submenu && !isCollapsed"
              class="chevron-btn"
              :class="{ open: isOpen(link) }"
              :aria-label="
                isOpen(link) ? `${link.label} dichtklappen` : `${link.label} openklappen`
              "
              :aria-expanded="isOpen(link)"
              @click="toggle(link)"
            >
              <ChevronDown class="icon small" />
            </button>
          </div>

          <!-- SUBMENU -->
          <div
            v-if="link.submenu && !isCollapsed"
            class="submenu-wrap"
            :class="{ open: isOpen(link) }"
          >
            <ul class="submenu">
              <li v-for="sub in link.submenu" :key="sub.to">
                <RouterLink
                  :to="sub.to"
                  :class="['submenu-item', { active: isActive(sub.to) }]"
                  :aria-current="isExact(sub.to) ? 'page' : undefined"
                  :tabindex="isOpen(link) ? 0 : -1"
                  @click="handleLinkClick"
                >
                  <component :is="sub.icon" class="icon small" />
                  <span>{{ sub.label }}</span>
                </RouterLink>
              </li>
            </ul>
          </div>
        </li>
      </ul>
    </nav>
    <nav class="sidebar-footer" aria-label="Andere opties">
      <RouterLink
        to="/"
        class="footer-link"
        data-tooltip="Alle modules"
        aria-label="Alle modules"
        @click="handleLinkClick"
      >
        <LayoutGrid class="icon" :stroke-width="1.7" aria-hidden="true" /><span>Alle modules</span>
      </RouterLink>
      <RouterLink
        v-if="sectionKey !== 'account'"
        to="/toegang"
        class="footer-link"
        data-tooltip="Mijn toegang"
        aria-label="Mijn toegang"
        @click="handleLinkClick"
      >
        <KeyRound class="icon" :stroke-width="1.7" aria-hidden="true" /><span>Mijn toegang</span>
      </RouterLink>
    </nav>
  </aside>
</template>

<script setup>
import { computed, ref, watch, nextTick, onMounted, onBeforeUnmount } from 'vue'
import { useRoute } from 'vue-router'
import { useSidebarStore } from '@/stores/sidebar'
import sidebarLogo from '@/assets/logo_ops_home.svg'
import {
  ShoppingCart,
  Archive,
  Users,
  Wrench,
  Calendar,
  CalendarRange,
  ClipboardList,
  List,
  ChevronLeft,
  ChevronDown,
  User,
  Hammer,
  MoveVertical,
  Warehouse,
  Locate,
  Truck,
  KeyRound,
  ShieldCheck,
  X,
  LayoutGrid,
} from 'lucide-vue-next'

const props = defineProps({
  /** Optioneel: open/dicht-status op mobiel vanuit de parent. Niet meegegeven = zichtbaar zolang gemount. */
  open: { type: Boolean, default: undefined },
})
const emit = defineEmits(['closeSidebar'])

const store = useSidebarStore()
const route = useRoute()
const sidebarPanel = ref(null)
let previousFocus

/* ---------------- mobile ---------------- */
const mq = window.matchMedia('(max-width: 767px)')
const isMobile = ref(mq.matches)
const onMq = (e) => (isMobile.value = e.matches)

const isMobileOpen = computed(() => props.open !== false)
const isCollapsed = computed(() => !isMobile.value && store.collapsed)

function close() {
  emit('closeSidebar')
}
function handleLinkClick() {
  if (isMobile.value) close()
}
function onKey(e) {
  if (!isMobile.value || !isMobileOpen.value) return
  if (e.key === 'Escape') {
    e.preventDefault()
    close()
  }
  if (e.key === 'Tab') {
    const controls = [
      ...(sidebarPanel.value?.querySelectorAll('a[href],button:not(:disabled)') ?? []),
    ].filter((element) => element.tabIndex >= 0 && element.getClientRects().length)
    const first = controls[0],
      last = controls.at(-1)
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault()
      last?.focus()
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault()
      first?.focus()
    }
  }
}
watch(
  () => isMobile.value && isMobileOpen.value,
  async (open, wasOpen) => {
    if (open) {
      previousFocus = document.activeElement
      await nextTick()
      if (isMobile.value && isMobileOpen.value)
        sidebarPanel.value?.querySelector('.close-btn')?.focus()
    } else if (wasOpen && previousFocus?.isConnected) previousFocus.focus()
  },
)

onMounted(() => {
  mq.addEventListener('change', onMq)
  window.addEventListener('keydown', onKey)
})
onBeforeUnmount(() => {
  mq.removeEventListener('change', onMq)
  window.removeEventListener('keydown', onKey)
})

/* ---------------- links ---------------- */
const sections = {
  account: { label: 'Account', icon: User },
  tools: { label: 'Tools', icon: Wrench },
  purchase: { label: 'Aankoop', icon: ShoppingCart },
  renting: { label: 'Verhuur', icon: KeyRound },
  logistics: { label: 'Logistiek', icon: Truck },
  admin: { label: 'Beheer', icon: ShieldCheck },
}

const linkGroups = {
  account: [{ to: '/toegang', label: 'Mijn toegang', icon: ShieldCheck }],
  tools: [
    { to: '/tools/planning', label: 'Planning', icon: CalendarRange },
    { to: '/tools/uitleen', label: 'Uitleningen', icon: ClipboardList },
    { to: '/tools/materiaal', label: 'Materiaal', icon: Wrench },
    { to: '/tools/archief', label: 'Archief', icon: Archive },
  ],
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
        { to: '/renting/agenda/planning', label: 'Planning', icon: CalendarRange },
        { to: '/renting/agenda/lijst', label: 'Lijst', icon: List },
      ],
    },
    { to: '/renting/archief', label: 'Archief', icon: Archive },
    { to: '/renting/klanten', label: 'Klanten', icon: Users },
    { to: '/renting/toestellen', label: 'Toestellen', icon: Wrench },
  ],
  logistics: [
    {
      to: '/logistics/schaarlift',
      label: 'Hoogtewerkers',
      icon: MoveVertical,
      submenu: [
        { to: '/logistics/schaarlift/planning', label: 'Planning', icon: CalendarRange },
        { to: '/logistics/schaarlift/verhuur', label: 'Verhuur', icon: ClipboardList },
        { to: '/logistics/schaarlift/lijst', label: 'Lijst', icon: List },
      ],
    },
    {
      to: '/logistics/werfcontainers',
      label: 'Werfcontainers',
      icon: Warehouse,
      submenu: [
        { to: '/logistics/werfcontainers/planning', label: 'Planning', icon: CalendarRange },
        { to: '/logistics/werfcontainers/verhuur', label: 'Verhuur', icon: ClipboardList },
        { to: '/logistics/werfcontainers/lijst', label: 'Lijst', icon: List },
      ],
    },
    { to: '/logistics/werf', label: 'Werven', icon: Hammer },
    { to: '/logistics/projectleiders', label: 'Projectleiders', icon: Users },
    { to: '/logistics/entiteiten', label: 'Entiteiten', icon: Locate },
  ],
  admin: [{ to: '/admin/users', label: 'Gebruikers', icon: User }],
}

const sectionKey = computed(() =>
  route.path === '/toegang' ? 'account' : Object.keys(linkGroups).find((k) => route.path.startsWith(`/${k}`)),
)
const section = computed(() => sections[sectionKey.value])
const currentLinks = computed(() => linkGroups[sectionKey.value] || [])

function isActive(target) {
  return route.path === target || route.path.startsWith(target + '/')
}
function isExact(target) {
  return route.path === target
}

/* ---------------- submenu open/dicht ---------------- */
const manual = ref({}) // { [to]: true|false } door gebruiker gekozen
function isOpen(link) {
  return manual.value[link.to] ?? isActive(link.to)
}
function toggle(link) {
  manual.value = { ...manual.value, [link.to]: !isOpen(link) }
}
// bij navigatie naar een sectie: die automatisch openen
watch(
  () => route.path,
  () => {
    for (const l of currentLinks.value) {
      if (l.submenu && isActive(l.to)) manual.value[l.to] = true
    }
  },
)
</script>

<style scoped>
.sidebar {
  --w: var(--sidebar-width, 244px);
  --w-collapsed: var(--sidebar-collapsed-width, 76px);
  --pad: 18px;
  --brand-2: #346acd;
  --ink: #536984;
  --ink-soft: #607792;
  --hover: #f5f8fc;
  --line: #e7edf4;
  position: fixed;
  inset: 0 auto 0 0;
  z-index: 1001;
  display: flex;
  flex-direction: column;
  width: var(--w);
  height: 100vh;
  height: 100dvh;
  padding: 24px var(--pad) 16px;
  overflow: visible;
  isolation: isolate;
  color: var(--ink);
  font-family: Inter, 'Segoe UI', sans-serif;
  background: #fff;
  border-right: 1px solid #e3e9f1;
  box-shadow: none;
  transition:
    width 0.2s ease,
    padding 0.2s ease,
    transform 0.2s ease;
}
.sidebar.collapsed {
  width: var(--w-collapsed);
  --pad: 14px;
}
ul {
  list-style: none;
  margin: 0;
  padding: 0;
}
.sidebar__head {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  min-height: 52px;
  margin-bottom: 32px;
  padding: 0 7px;
}
.logo-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 7px;
  min-height: 40px;
}
.logo {
  display: block;
  width: 148px;
  height: auto;
}
.logo-mark {
  display: block;
  width: 28px;
  height: 28px;
}
.sidebar.collapsed .sidebar__head {
  padding: 0;
  justify-content: center;
}
.close-btn {
  position: absolute;
  top: 23px;
  right: 16px;
  display: grid;
  place-items: center;
  width: 34px;
  height: 34px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: #fff;
  color: #7187a2;
  cursor: pointer;
}
.edge-toggle {
  position: absolute;
  top: 38px;
  right: -13px;
  z-index: 2;
  display: grid;
  place-items: center;
  width: 26px;
  height: 26px;
  padding: 0;
  border: 1px solid #dfe7f1;
  border-radius: 50%;
  background: #fff;
  color: #7c94b2;
  cursor: pointer;
  box-shadow: 0 2px 5px #29456707;
}
.edge-toggle:hover,
.close-btn:hover {
  background: #f3f7fc;
  color: #346acd;
}
.edge-toggle__icon {
  width: 14px;
  height: 14px;
  transition: transform 0.2s;
}
.sidebar.collapsed .edge-toggle__icon {
  transform: rotate(180deg);
}
.section {
  margin: 0 0 14px;
  padding: 0 12px;
  color: #607792;
  font-size: 10px;
  font-weight: 550;
  text-transform: uppercase;
  letter-spacing: 1px;
  line-height: 1.5;
}
.sidebar.collapsed .section {
  visibility: hidden;
}
.nav {
  flex: 1;
  min-height: 0;
  margin: 0 calc(var(--pad) * -1);
  padding: 0 var(--pad);
  overflow-y: auto;
  overflow-x: hidden;
  scrollbar-width: thin;
  scrollbar-color: #d7e1ef transparent;
}
.nav > ul {
  display: flex;
  flex-direction: column;
  gap: 5px;
}
.nav-row {
  position: relative;
  display: flex;
  align-items: center;
}
.nav-link {
  position: relative;
  flex: 1;
  display: flex;
  align-items: center;
  gap: 11px;
  min-height: 44px;
  padding: 0 12px;
  border-radius: 8px;
  color: var(--ink);
  text-decoration: none;
  font-size: 13px;
  font-weight: 450;
  white-space: nowrap;
  transition:
    background 0.15s,
    color 0.15s;
  min-width: 0;
}
.nav-link__icon {
  display: grid;
  place-items: center;
  width: 20px;
  height: 24px;
  flex-shrink: 0;
  color: #8b9eb8;
}
.nav-link__label {
  overflow: hidden;
  text-overflow: ellipsis;
  padding-right: 18px;
}
.nav-link:hover {
  background: var(--hover);
  color: #345d91;
}
.nav-link.active {
  background: #edf3fc;
  color: #315f9e;
  font-weight: 600;
}
.nav-link.active .nav-link__icon {
  color: #527caf;
}
.chevron-btn {
  position: absolute;
  right: 6px;
  display: grid;
  place-items: center;
  width: 28px;
  height: 28px;
  border: 0;
  border-radius: 6px;
  background: transparent;
  color: #92a3b9;
  cursor: pointer;
  transition:
    background 0.15s,
    transform 0.2s;
}
.chevron-btn:hover {
  background: #e6edf7;
  color: #527caf;
}
.chevron-btn.open {
  transform: rotate(180deg);
}
.submenu-wrap {
  display: grid;
  grid-template-rows: 0fr;
  transition: grid-template-rows 0.2s ease;
}
.submenu-wrap.open {
  grid-template-rows: 1fr;
}
.submenu {
  min-height: 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  gap: 3px;
  margin-left: 22px;
  padding-left: 12px;
  border-left: 1px solid var(--line);
}
.submenu-wrap.open .submenu {
  padding-top: 7px;
  padding-bottom: 7px;
}
.submenu-item {
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 9px 11px;
  min-height: 36px;
  border-radius: 7px;
  color: #607792;
  font-size: 12px;
  font-weight: 400;
  text-decoration: none;
  white-space: nowrap;
  transition:
    background 0.15s,
    color 0.15s;
}
.submenu-item:hover {
  background: #f7f9fc;
  color: #365d8e;
}
.submenu-item.active {
  background: #f2f6fc;
  color: #38659f;
  font-weight: 550;
}
.sidebar-footer {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex-shrink: 0;
  border-top: 1px solid #e9eef4;
  margin-top: 20px;
  padding-top: 14px;
}
.footer-link {
  position: relative;
  display: flex;
  align-items: center;
  gap: 11px;
  min-height: 39px;
  padding: 8px 12px;
  border-radius: 8px;
  color: #607792;
  font-size: 12px;
  text-decoration: none;
  white-space: nowrap;
}
.footer-link:hover {
  background: #f5f8fc;
  color: #426f9e;
}
.footer-link svg {
  color: #93a6bd;
}
.sidebar.collapsed .nav-link,
.sidebar.collapsed .footer-link {
  justify-content: center;
  padding: 0;
  min-height: 42px;
}
.sidebar.collapsed .nav-link__label,
.sidebar.collapsed .footer-link > span {
  display: none;
}
.sidebar.collapsed .nav {
  overflow: visible;
}
.sidebar.collapsed [data-tooltip]::after {
  content: attr(data-tooltip);
  position: absolute;
  left: calc(100% + 16px);
  top: 50%;
  z-index: 10;
  padding: 7px 10px;
  border-radius: 6px;
  background: #2e435d;
  color: white;
  font-size: 11px;
  font-weight: 450;
  white-space: nowrap;
  pointer-events: none;
  opacity: 0;
  transform: translateY(-50%);
  transition: opacity 0.15s;
}
.sidebar.collapsed [data-tooltip]:hover::after,
.sidebar.collapsed [data-tooltip]:focus-visible::after {
  opacity: 1;
}
.sidebar :is(a, button):focus-visible {
  outline: 3px solid #91b0de;
  outline-offset: 3px;
}
.icon {
  width: 19px;
  height: 19px;
  flex-shrink: 0;
  stroke-width: 1.7;
}
.icon.small {
  width: 15px;
  height: 15px;
}
.backdrop {
  position: fixed;
  inset: 0;
  z-index: 1000;
  background: #243c5859;
}
.sidebar.mobile {
  width: min(86vw, 300px);
  transform: translateX(-105%);
  border-radius: 0 12px 12px 0;
  box-shadow: 8px 0 28px #243c5810;
}
.sidebar.mobile.mobile-open {
  transform: translateX(0);
}
.sidebar.mobile .sidebar__head {
  justify-content: flex-start;
  margin-bottom: 28px;
}
.sidebar.mobile .logo {
  width: 138px;
}
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
@media (prefers-reduced-motion: reduce) {
  .sidebar,
  .sidebar * {
    transition: none !important;
  }
}
</style>
