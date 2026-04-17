import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/authentication/auth.store.js'

const routes = [
  // Home
  {
    path: '/',
    name: 'home',
    component: () => import('@/views/HomeView.vue'),
    meta: { requiresAuth: true, noSidebar: true },
  },

  // Purchase
  {
    path: '/Purchase',
    name: 'purchase',
    component: () => import('@/views/purchase/PurchaseView.vue'),
    meta: { requiresAuth: true, roles: ['admin', 'purchase'] },
  },
  {
    path: '/Purchase/archive',
    name: 'archive',
    component: () => import('@/views/purchase/ArchiefView.vue'),
    meta: { requiresAuth: true, roles: ['admin', 'purchase'] },
  },
  {
    path: '/Purchase/order/:id',
    name: 'order',
    component: () => import('@/views/purchase/OrderView.vue'),
    meta: { requiresAuth: true, roles: ['admin', 'purchase'] },
  },
  {
    path: '/Purchase/products/:id',
    name: 'products',
    component: () => import('@/views/purchase/ProductView.vue'),
    meta: { requiresAuth: true, roles: ['admin', 'purchase'] },
  },
  {
    path: '/Purchase/files/:id',
    name: 'files',
    component: () => import('@/views/purchase/FilesView.vue'),
    meta: { requiresAuth: true, roles: ['admin', 'purchase'] },
  },

  // Authentication
  {
    path: '/login',
    name: 'login',
    component: () => import('@/views/authentication/LoginView.vue'),
    meta: { noSidebar: true },
  },
  {
    path: '/admin/create-user',
    name: 'createUser',
    component: () => import('@/views/authentication/createUserPage.vue'),
    meta: { requiresAuth: true, roles: ['admin'] },
  },
  {
    path: '/admin/users',
    name: 'adminPage',
    component: () => import('@/views/authentication/adminPage.vue'),
    meta: { requiresAuth: true, roles: ['admin'] },
  },
  {
    path: '/password-reset/:token',
    name: 'ResetPasswordPage',
    component: () => import('@/views/authentication/ResetPasswordPage.vue'),
  },

  // Renting
  {
    path: '/renting/klanten',
    name: 'rentingKlanten',
    component: () => import('@/views/renting/KlantenView.vue'),
    meta: { requiresAuth: true, roles: ['admin', 'renting'] },
  },
  {
    path: '/renting/toestellen',
    name: 'rentingToestellen',
    component: () => import('@/views/renting/ToestellenView.vue'),
    meta: { requiresAuth: true, roles: ['admin', 'renting'] },
  },
  {
    path: '/renting/agenda',
    name: 'renting',
    component: () => import('@/views/renting/agendaPage.vue'),
    meta: { requiresAuth: true, roles: ['admin', 'renting'] },
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
    component: () => import('@/views/renting/archiefPage.vue'),
    meta: { requiresAuth: true, roles: ['admin', 'renting'] },
  },
  {
    path: '/renting/detail/:boekingId',
    name: 'rentingDetail',
    component: () => import('@/views/renting/detailView.vue'),
    meta: { requiresAuth: true, roles: ['admin', 'renting'] },
    props: true,
  },

  // Logistics
  {
    path: '/logistics/werf',
    name: 'WerfPage',
    component: () => import('@/views/Logistics/WerfView.vue'),
    meta: { requiresAuth: true, roles: ['admin', 'logistics'] },
  },
  {
    path: '/logistics/projectleiders',
    name: 'ProjectLeiderPage',
    component: () => import('@/views/Logistics/ProjectLeidersView.vue'),
    meta: { requiresAuth: true, roles: ['admin', 'logistics'] },
  },
  {
    path: '/logistics/schaarlift',
    name: 'schaarliften',
    redirect: '/logistics/schaarlift/planning',
    meta: { requiresAuth: true, roles: ['admin', 'logistics'] },
  },
  {
    path: '/logistics/schaarlift/lijst',
    name: 'schaarliftenLijst',
    component: () => import('@/views/Logistics/SchaarliftenLijstView.vue'),
    meta: { requiresAuth: true, roles: ['admin', 'logistics'] },
  },
  {
    path: '/logistics/schaarlift/verhuur',
    name: 'schaarliftenverhuur',
    component: () => import('@/views/Logistics/VerhuurlijstView.vue'),
    props: { assetType: 'Hoogtewerker' },
    meta: { requiresAuth: true, roles: ['admin', 'logistics'] },
  },
  {
    path: '/logistics/schaarlift/planning',
    name: 'schaarliftenPlanning',
    component: () => import('@/views/Logistics/VerhuurPlanningView.vue'),
    props: { assetModel: 'Hoogtewerker' },
    meta: { requiresAuth: true, roles: ['admin', 'logistics'] },
  },
  {
    path: '/logistics/werfcontainers/lijst',
    name: 'werfContainerLijst',
    component: () => import('@/views/Logistics/WerfcontainerLijstView.vue'),
    meta: { requiresAuth: true, roles: ['admin', 'logistics'] },
  },
  {
    path: '/logistics/werfcontainers/verhuur',
    name: 'werfcontainerVerhuur',
    component: () => import('@/views/Logistics/VerhuurlijstView.vue'),
    props: { assetType: 'WerfContainer' },
    meta: { requiresAuth: true, roles: ['admin', 'logistics'] },
  },
  {
    path: '/logistics/werfcontainers/planning',
    name: 'werfcontainerPlanning',
    component: () => import('@/views/Logistics/VerhuurPlanningView.vue'),
    props: { assetModel: 'WerfContainer' },
    meta: { requiresAuth: true, roles: ['admin', 'logistics'] },
  },
  {
    path: '/logistics/werfcontainers',
    name: 'werfcontainers',
    redirect: '/logistics/werfcontainers/planning',
    meta: { requiresAuth: true, roles: ['admin', 'logistics'] },
  },
]

const router = createRouter({
  history: createWebHistory('/'),
  routes,
})
router.beforeEach(async (to, from, next) => {
  const auth = useAuthStore()

  // ⛔ wacht tot auth geladen is
  if (auth.token && !auth.initialized) {
    try {
      await auth.fetchMe()
    } catch (e) {
      console.warn('fetchMe failed')
    }
  }

  // 🔐 login check
  if (to.meta.requiresAuth && !auth.token) {
    return next({ name: 'login' })
  }

  // 🎭 role check
  if (to.meta.roles) {
    const role = auth.user?.role

    if (!role) {
      return next({ name: 'login' }) 
    }

    if (role !== 'admin' && !to.meta.roles.includes(role)) {
      return next({ name: 'home' })
    }
  }

  next()
})

export default router