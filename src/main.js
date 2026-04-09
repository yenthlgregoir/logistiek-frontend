import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { createPinia } from 'pinia'
import { useAuthStore } from '@/stores/authentication/auth.store.js'

import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css' // belangrijk: globale CSS import

import './assets/main.css'

const app = createApp(App)
const pinia = createPinia()
app.use(pinia)
app.use(router)
app.use(ElementPlus) 
app.mount('#app')

// Haal user info op bij refresh
const auth = useAuthStore()
if (auth.token) {
  auth.fetchMe()
}
