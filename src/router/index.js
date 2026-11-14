import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/authentication/auth.store.js'

const routes = [
  { path: '/toegang', name: 'mijnToegang', component: () => import('@/views/authentication/AccessView.vue'), meta: { requiresAuth: true, title: 'Mijn toegang' } },
  { path: '/vandaag', name: 'vandaag', component: () => import('@/views/VandaagView.vue'), meta: { requiresAuth: true, noSidebar: true, roles: ['admin'], title: 'Vandaag' } },
  // ---------------- TOOLS ----------------
  { path: '/tools', redirect: '/tools/planning', meta: { requiresAuth: true, roles: ['admin', 'tools'], title: 'Tools' } },
  { path: '/tools/planning', name: 'toolsPlanning', component: () => import('@/views/tools/UitleenView.vue'), props: { mode: 'planning' }, meta: { requiresAuth: true, roles: ['admin', 'tools'], title: 'Tools' } },
  { path: '/tools/uitleen', name: 'toolsUitleen', component: () => import('@/views/tools/UitleenView.vue'), props: { mode: 'lijst' }, meta: { requiresAuth: true, roles: ['admin', 'tools'], title: 'Tools' } },
  { path: '/tools/archief', name: 'toolsArchief', component: () => import('@/views/tools/UitleenView.vue'), props: { mode: 'archief' }, meta: { requiresAuth: true, roles: ['admin', 'tools'], title: 'Tools' } },
  { path: '/tools/materiaal', name: 'toolsMateriaal', component: () => import('@/views/tools/MateriaalView.vue'), meta: { requiresAuth: true, roles: ['admin', 'tools'], title: 'Tools' } },
  // Home
  {
    path: '/',
    name: 'home',
    component: () => import('@/views/HomeView.vue'),
    meta: {
      requiresAuth: true,
      noSidebar: true,
    },
  },

  // ---------------- PURCHASE ----------------
  {
    path: '/Purchase',
    name: 'purchase',
    component: () => import('@/views/purchase/PurchaseView.vue'),
    meta: {
      requiresAuth: true,
      roles: ['admin', 'purchase'],
      title: 'Purchase',
    },
  },
  {
    path: '/Purchase/archive',
    name: 'archive',
    component: () => import('@/views/purchase/ArchiefView.vue'),
    meta: {
      requiresAuth: true,
      roles: ['admin', 'purchase'],
      title: 'Purchase',
    },
  },
  {
    path: '/Purchase/order/:id',
    name: 'order',
    component: () => import('@/views/purchase/OrderView.vue'),
    meta: {
      requiresAuth: true,
      roles: ['admin', 'purchase'],
      title: 'Purchase',
    },
  },
  {
    path: '/Purchase/products/:id',
    name: 'products',
    component: () => import('@/views/purchase/ProductView.vue'),
    meta: {
      requiresAuth: true,
      roles: ['admin', 'purchase'],
      title: 'Purchase',
    },
  },
  {
    path: '/Purchase/files/:id',
    name: 'files',
    component: () => import('@/views/purchase/FilesView.vue'),
    meta: {
      requiresAuth: true,
      roles: ['admin', 'purchase'],
      title: 'Purchase',
    },
  },

  // ---------------- AUTH ----------------
  {
    path: '/login',
    name: 'login',
    component: () => import('@/views/authentication/LoginView.vue'),
    meta: {
      noSidebar: true,
      title: 'Login',
    },
  },
  {
    path: '/admin/create-user',
    name: 'createUser',
    redirect: '/admin/users',
    meta: {
      requiresAuth: true,
      roles: ['admin'],
      title: 'Admin',
    },
  },
  {
    path: '/admin/users',
    name: 'adminPage',
    component: () => import('@/views/authentication/adminPage.vue'),
    meta: {
      requiresAuth: true,
      roles: ['admin'],
      title: 'Admin',
    },
  },
  {
    path: '/password-reset/:token',
    name: 'ResetPasswordPage',
    component: () => import('@/views/authentication/ResetPasswordPage.vue'),
    meta: {
      noSidebar: true,
      title: 'Reset Password',
    },
  },

  // ---------------- RENTING ----------------
  {
    path: '/renting/klanten',
    name: 'rentingKlanten',
    component: () => import('@/views/renting/KlantenView.vue'),
    meta: {
      requiresAuth: true,
      roles: ['admin', 'renting'],
      title: 'Renting',
    },
  },
  {
    path: '/renting/toestellen',
    name: 'rentingToestellen',
    component: () => import('@/views/renting/ToestellenView.vue'),
    meta: {
      requiresAuth: true,
      roles: ['admin', 'renting'],
      title: 'Renting',
    },
  },

  {
    path: '/renting/toestellen/vrij',
    name: 'vrijeToestellen',
    component: () => import('@/views/renting/VrijeToestellenview.vue'),
    meta: {
      requiresAuth: true,
      roles: ['admin', 'renting'],
      title: 'Renting',
    },
  },
  {
    path: '/renting/agenda',
    name: 'renting',
    component: () => import('@/views/renting/agendaPage.vue'),
    meta: {
      requiresAuth: true,
      roles: ['admin', 'renting'],
      title: 'Renting',
    },
    redirect: '/renting/agenda/planning',
    children: [
      {
        path: 'planning',
        name: 'rentingPlanning',
        component: () => import('@/components/agenda/AgendaComponent.vue'),
      },
      {
        path: 'lijst',
        name: 'rentingLijst',
        component: () => import('@/components/renting/agenda/BoekingList.vue'),
      },
    ],
  },
  {
    path: '/renting/archief',
    name: 'Archief',
    component: () => import('@/views/renting/ListView.vue'),
    meta: {
      requiresAuth: true,
      roles: ['admin', 'renting'],
      title: 'Renting',
    },
  },
  {
    path: '/renting/detail/:boekingId',
    name: 'rentingDetail',
    component: () => import('@/views/renting/detailView.vue'),
    props: true,
    meta: {
      requiresAuth: true,
      roles: ['admin', 'renting'],
      title: 'Renting',
    },
  },

  // ---------------- LOGISTICS ----------------
  {
    path: '/logistics/werf',
    name: 'WerfPage',
    component: () => import('@/views/Logistics/WerfView.vue'),
    meta: {
      requiresAuth: true,
      roles: ['admin', 'logistics'],
      title: 'Logistics',
    },
  },
  {
    path: '/logistics/projectleiders',
    name: 'ProjectLeiderPage',
    component: () => import('@/views/Logistics/ProjectLeidersView.vue'),
    meta: {
      requiresAuth: true,
      roles: ['admin', 'logistics'],
      title: 'Logistics',
    },
  },

  {
    path: '/logistics/schaarlift',
    name: 'schaarliften',
    redirect: '/logistics/schaarlift/planning',
    meta: {
      requiresAuth: true,
      roles: ['admin', 'logistics'],
      title: 'Logistics',
    },
  },
  {
    path: '/logistics/schaarlift/lijst',
    name: 'schaarliftenLijst',
    component: () => import('@/views/Logistics/SchaarliftenLijstView.vue'),
    meta: {
      requiresAuth: true,

      title: 'Logistics',
    },
  },
  {
    path: '/logistics/schaarlift/verhuur',
    name: 'schaarliftenverhuur',
    component: () => import('@/views/Logistics/VerhuurlijstView.vue'),
    props: { assetType: 'Hoogtewerker' },
    meta: {
      requiresAuth: true,
      roles: ['admin', 'logistics'],
      title: 'Logistics',
    },
  },
  {
    path: '/logistics/schaarlift/planning',
    name: 'schaarliftenPlanning',
    component: () => import('@/views/Logistics/VerhuurPlanningView.vue'),
    props: { assetModel: 'Hoogtewerker' },
    meta: {
      requiresAuth: true,
      roles: ['admin', 'logistics'],
      title: 'Logistics',
    },
  },
  {
    path: '/hoogtewerkerselectie',
    alias: '/logistics/hoogtewerkers/lijst',
    name: 'hoogtewerkersLijst',
    component: () => import('@/views/Logistics/HoogtewerkerCardsView.vue'),
    meta: {
      requiresAuth: true,
      noSidebar: true,
      title: 'Hoogtewerker kiezen',
    },
  },
  {
    path: '/logistics/werfcontainers',
    name: 'schaarliften',
    redirect: '/logistics/werfcontainers/planning',
    meta: {
      requiresAuth: true,
      roles: ['admin', 'logistics'],
      title: 'Logistics',
    },
  },
  {
    path: '/logistics/werfcontainers/lijst',
    name: 'werfContainerLijst',
    component: () => import('@/views/Logistics/WerfcontainerLijstView.vue'),
    meta: {
      requiresAuth: true,
      roles: ['admin', 'logistics'],
      title: 'Logistics',
    },
  },
  {
    path: '/logistics/werfcontainers/verhuur',
    name: 'werfcontainerVerhuur',
    component: () => import('@/views/Logistics/VerhuurlijstView.vue'),
    props: { assetType: 'WerfContainer' },
    meta: {
      requiresAuth: true,
      roles: ['admin', 'logistics'],
      title: 'Logistics',
    },
  },
  {
    path: '/logistics/werfcontainers/planning',
    name: 'werfcontainerPlanning',
    component: () => import('@/views/Logistics/VerhuurPlanningView.vue'),
    props: { assetModel: 'WerfContainer' },
    meta: {
      requiresAuth: true,
      roles: ['admin', 'logistics'],
      title: 'Logistics',
    },
  },
  {
    path: '/logistics/entiteiten',
    name: 'EntiteitenLijst',
    component: () => import('@/views/Logistics/EntityView.vue'),
    meta: {
      requiresAuth: true,
      roles: ['admin', 'logistics'],
      title: 'Logistics',
    },
  },
]

const router = createRouter({
  history: createWebHistory('/'),
  routes,
})

router.beforeEach(async (to) => {
  const auth = useAuthStore()

  if (!auth.initialized || to.meta.requiresAuth) {
    try {
      await auth.fetchMe()
    } catch {
      // Bij een verbindingsfout tonen we de loginpagina met een foutmelding.
      if (to.name !== 'login') {
        return { name: 'login' }
      }

      return true
    }
  }

  if (to.meta.requiresAuth && !auth.isLoggedIn) {
    return { name: 'login' }
  }

  // Wie al aangemeld is, hoeft het loginscherm niet te zien.
  if (to.name === 'login' && auth.isLoggedIn) {
    return { name: 'home' }
  }

  if (to.meta.roles) {
  const roles = auth.user?.roles ?? []

  const allowed =
    roles.includes('admin') ||
    to.meta.roles.some(role => roles.includes(role))

  if (!allowed) {
    return { name: 'home' }
  }
}

  return true
})

router.afterEach((to) => {
  const defaultTitle = 'Operations'
  document.title = to.meta.title ? `${to.meta.title} | Operations` : defaultTitle
})
export default router
