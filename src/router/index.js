import { createRouter, createWebHistory, createWebHashHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import PurchaseView from '../views/purchase/PurchaseView.vue'
import ArchiefView from '../views/purchase/ArchiefView.vue'
import OrderView from '../views/purchase/OrderView.vue'
import ProductView from '@/views/purchase/ProductView.vue'
import FilesView from '@/views/purchase/FilesView.vue'
import LoginView from '@/views/authentication/LoginView.vue' // maak een login page
import KlantenView from '@/views/renting/KlantenView.vue'
import ToestellenView from '@/views/renting/ToestellenView.vue'
import agendaPage from '@/views/renting/agendaPage.vue'
import DetailView from '@/views/renting/detailView.vue'

const routes = [
  {
    path: '/',
    name: 'home',
    component: HomeView,
    meta: { requiresAuth: true },
  },
  {
    path: '/Purchase',
    name: 'purchase',
    component: PurchaseView,
    meta: { requiresAuth: true, roles: ['admin','purchase'] },
  },
  {
    path: '/Purchase/archive',
    name: 'archive',
    component: ArchiefView,
    meta: { requiresAuth: true, roles: ['admin','purchase'] },

  },
  {
    path: '/Purchase/order/:id',
    name: 'order',
    component: OrderView,
    meta: { requiresAuth: true, roles: ['admin','purchase'] },
  },
  {
    path: '/Purchase/products/:id',
    name: 'products',
    component: ProductView,
    meta: { requiresAuth: true, roles: ['admin','purchase'] },
  },
  {
    path: '/Purchase/files/:id',
    name: 'files',
    component: FilesView,
    meta: { requiresAuth: true, roles: ['admin','purchase'] },
  },
  {
    path: '/login',
    name: 'login',
    component: LoginView,
  },
  {
    path: '/renting/klanten',
    name: 'rentingKlanten',
    component: KlantenView,
  meta: { requiresAuth: true, roles: ['admin','renting'] },
  },
  {
    path: '/renting/toestellen',
    name: 'rentingToestellen',
    component: ToestellenView,
  meta: { requiresAuth: true, roles: ['admin','renting'] },
  },
  {
    path: '/renting',
    name: 'renting',
    component: agendaPage,
    meta: { requiresAuth: true, roles: ['admin','renting'] },
  },
  {
    path: '/renting/detail/:boekingId',
    name: 'rentingDetail',
    component: DetailView,
    meta: { requiresAuth: true, roles: ['admin','renting'] },
    props: true,
  },
]

const router = createRouter({
  history: createWebHistory('/'),  // 🔑 base '/'
  routes,
})

// 🌐 Global auth guard
router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('token')

  
  // Niet ingelogd
  if (to.meta.requiresAuth && !token) {
    return next({ name: 'login' })
  }

  // Authenticated en role-based check
  if (to.meta.roles && token) {
    const userRole = localStorage.getItem("role") // role uit login

    if (!userRole) {
      // Geen role aanwezig → token mogelijk verlopen of corrupt
      return next({ name: 'login' })
    }

    // Admin mag overal
    if (userRole !== 'admin' && !to.meta.roles.includes(userRole)) {
      // Gebruiker niet toegestaan → naar home of 403 pagina
      return next({ name: 'home' }) // of maak een ForbiddenView
    }
  }

  next()
})

export default router
