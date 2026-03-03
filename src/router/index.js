import { createRouter, createWebHistory } from 'vue-router'
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
    meta: { requiresAuth: true },
  },
  {
    path: '/Purchase/archive',
    name: 'archive',
    component: ArchiefView,
    meta: { requiresAuth: true },
  },
  {
    path: '/Purchase/order/:id',
    name: 'order',
    component: OrderView,
    meta: { requiresAuth: true },
  },
  {
    path: '/Purchase/products/:id',
    name: 'products',
    component: ProductView,
    meta: { requiresAuth: true },
  },
  {
    path: '/Purchase/files/:id',
    name: 'files',
    component: FilesView,
    meta: { requiresAuth: true },
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
    meta: { requiresAuth: true },
  },
  {
    path: '/renting/toestellen',
    name: 'rentingToestellen',
    component: ToestellenView,
    meta: { requiresAuth: true },
  },
  {
    path: '/renting',
    name: 'renting',
    component: agendaPage,
    meta: { requiresAuth: true },
  },
  {
    path: '/renting/detail/:boekingId',
    name: 'rentingDetail',
    component: DetailView,
    meta: { requiresAuth: true },
    props: true,
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

// 🌐 Global auth guard
router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('token')

  if (to.meta.requiresAuth && !token) {
    // Als route auth vereist en er is geen token → ga naar login
    next({ name: 'login' })
  } else {
    next()
  }
})

export default router
