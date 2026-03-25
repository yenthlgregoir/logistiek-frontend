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
import adminPage from '@/views/authentication/adminPage.vue'
import ResetPasswordPage from '@/views/authentication/ResetPasswordPage.vue'
import CreateUserPage from '@/views/authentication/createUserPage.vue'
import ArchiefPage from '@/views/renting/archiefPage.vue'
import BoekingList from '@/components/renting/agenda/BoekingList.vue'
import AgendaComponent from '@/components/renting/agenda/AgendaComponent.vue'
import WerfView from '@/views/Logistics/WerfView.vue'
import ProjectLeidersView from '@/views/Logistics/ProjectLeidersView.vue'

const routes = [
  {
    path: '/',
    name: 'home',
    component: HomeView,
    meta: { requiresAuth: true, noSidebar:true },
  },
  {
    path: '/Purchase',
    name: 'purchase',
    component: PurchaseView,
    meta: { requiresAuth: true, roles: ['admin', 'purchase'] },
  },
  {
    path: '/Purchase/archive',
    name: 'archive',
    component: ArchiefView,
    meta: { requiresAuth: true, roles: ['admin', 'purchase'] },
  },
  {
    path: '/Purchase/order/:id',
    name: 'order',
    component: OrderView,
    meta: { requiresAuth: true, roles: ['admin', 'purchase'] },
  },
  {
    path: '/Purchase/products/:id',
    name: 'products',
    component: ProductView,
    meta: { requiresAuth: true, roles: ['admin', 'purchase'] },
  },
  {
    path: '/Purchase/files/:id',
    name: 'files',
    component: FilesView,
    meta: { requiresAuth: true, roles: ['admin', 'purchase'] },
  },
  {
    path: '/login',
    name: 'login',
    component: LoginView,
    meta: { noSidebar:true },
  },
  {
    path: '/admin/create-user',
    name: 'createUser',
    component: CreateUserPage,
    meta: { requiresAuth: true, roles: ['admin'] },
  },
  {
    path: '/admin/users',
    name: 'adminPage',
    component: adminPage,
    meta: { requiresAuth: true, roles: ['admin'] },
  },
  {
    path: '/password-reset/:token',
    name: 'ResetPasswordPage',
    component: ResetPasswordPage,
  },
  {
    path: '/renting/klanten',
    name: 'rentingKlanten',
    component: KlantenView,
    meta: { requiresAuth: true, roles: ['admin', 'renting'] },
  },
  {
    path: '/renting/toestellen',
    name: 'rentingToestellen',
    component: ToestellenView,
    meta: { requiresAuth: true, roles: ['admin', 'renting'] },
  },
  {
    path: '/renting/agenda',
    name: 'renting',
    component: agendaPage,
    meta: { requiresAuth: true, roles: ['admin', 'renting'] },
    redirect: '/renting/agenda/planning',
    children: [
      {
        path: 'planning',
        name: 'rentingPlanning',
        component: AgendaComponent,
      },
      {
        path: 'lijst',
        name: 'rentingLijst',
        component: BoekingList,
      },
    ],
  },
  {
    path: '/renting/archief',
    name: 'Archief',
    component: ArchiefPage,
    meta: { requiresAuth: true, roles: ['admin', 'renting'] },
  },
  {
    path: '/renting/detail/:boekingId',
    name: 'rentingDetail',
    component: DetailView,
    meta: { requiresAuth: true, roles: ['admin', 'renting'] },
    props: true,
  },
  {
    path: '/logistics/werf', 
    name: 'WerfPage',
    component: WerfView,
    meta: {requiresAuth: true, roles: ['admin' , 'logistics']},
  },
  {
    path: '/logistics/projectleiders',
    name: 'ProjectLeiderPage',
    component: ProjectLeidersView,
    meta: {requiresAuth: true , roles: ["admin" , "logistics"]},
  },
  {
    path: '/logistics/schaarlift',
    name: 'schaarliften',
    meta: { requiresAuth: true, roles: ['admin', 'logistics'] },
    redirect: '/logistics/schaarlift/planning',
  },

]

const router = createRouter({
  history: createWebHistory('/'),
  routes,
})

router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('token')

  if (to.meta.requiresAuth && !token) {
    return next({ name: 'login' })
  }

  if (to.meta.roles && token) {
    const userRole = localStorage.getItem('role') 

    if (!userRole) {
      return next({ name: 'login' })
    }

    // Admin mag overal
    if (userRole !== 'admin' && !to.meta.roles.includes(userRole)) {
      return next({ name: 'home' }) 
    }
  }

  next()
})

export default router
