import { defineStore } from 'pinia'
import { loginApi } from '@/api/login.js'
import router from '@/router'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    token: localStorage.getItem('token') || null
  }),
  getters: {
    isLoggedIn: (state) => !!state.token
  },
  actions: {
    async login(email, password) {
      const response = await loginApi.login(email, password)
      this.token = response.token
      localStorage.setItem('token', this.token)

      await this.fetchMe() 
    },

    async fetchMe() {
  try {
    const res = await loginApi.me()
    this.user = res
console.log('ROLE:', this.user?.role)
  } catch (err) {
  if (err?.response?.status === 401) {
    this.logout()
  } else {
    this.user = null
  }
}
},

    logout() {
      this.user = null
      this.token = null
      localStorage.removeItem('token')
    }
  }
})