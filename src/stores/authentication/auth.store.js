import { defineStore } from 'pinia'
import { loginApi } from '@/api/login.js'

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

      await this.fetchMe() // haal user info op na login
    },

    async fetchMe() {
      if (!this.token) return
      try {
        const user = await loginApi.getUsers() // pas hier aan naar jouw endpoint die ingelogde user teruggeeft
        this.user = Array.isArray(user) ? user[0] : user // als je backend array terugstuurt
      } catch (err) {
        this.logout() // token ongeldig? log uit
      }
    },

    logout() {
      this.user = null
      this.token = null
      localStorage.removeItem('token')
    }
  }
})