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
    console.log(this.user)
    console.log('USER:', this.user)
console.log('ROLE:', this.user?.role)
  } catch (err) {
    this.user = null
    this.logout()
  }
},

    logout() {
      this.user = null
      this.token = null
      localStorage.removeItem('token')
    }
  }
})