import { defineStore } from 'pinia'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    initialized: false,
    error: null,
    photoUrl: null,
    photoIdentity: null,
    photoChecked: false,
    photoRequest: 0,
  }),

  getters: {
    isLoggedIn: (state) => state.user !== null,
  },

  actions: {
    discardPhoto() {
      this.photoRequest++
      if (this.photoUrl) URL.revokeObjectURL(this.photoUrl)
      this.photoUrl = null
    },

    clearPhoto() {
      this.discardPhoto()
      this.photoIdentity = null
      this.photoChecked = false
    },

    async loadPhoto() {
      const identity =
        this.user?.tenantId && this.user?.objectId
          ? this.user.tenantId + ':' + this.user.objectId
          : null
      if (!identity) {
        this.clearPhoto()
        return
      }
      if (this.photoIdentity !== identity) {
        this.clearPhoto()
        this.photoIdentity = identity
      }
      if (this.photoChecked) return
      this.photoChecked = true
      const request = ++this.photoRequest
      try {
        const response = await fetch('/api/me/photo', {
          credentials: 'same-origin',
          cache: 'no-store',
        })
        if (!response.ok || response.status === 204) return
        const type = response.headers.get('content-type')?.split(';')[0]
        if (!['image/jpeg', 'image/png', 'image/webp'].includes(type)) return
        const blob = await response.blob()
        if (
          !blob.size ||
          blob.size > 262144 ||
          request !== this.photoRequest ||
          this.user?.tenantId + ':' + this.user?.objectId !== identity
        )
          return
        this.photoUrl = URL.createObjectURL(blob)
      } catch {
        // De initialen blijven zichtbaar als een foto niet beschikbaar is.
      }
    },

    login() {
      this.clearPhoto()
      localStorage.removeItem('token')
      window.location.assign('/oauth2/authorization/microsoft')
    },

    async fetchMe() {
      this.error = null

      try {
        const response = await fetch('/api/me', {
          credentials: 'same-origin',
          cache: 'no-store',
        })

        if (response.status === 401) {
          this.clearPhoto()
          this.user = null
          this.initialized = true
          return
        }

        if (!response.ok) {
          throw new Error(`Gebruiker ophalen mislukt (${response.status})`)
        }

        this.user = await response.json()
        this.initialized = true
        void this.loadPhoto()
      } catch (error) {
        this.clearPhoto()
        this.user = null
        this.initialized = false
        this.error = 'Kan je aanmelding niet controleren. Probeer opnieuw.'
        throw error
      }
    },

    async logout() {
      // Spring Boot moet de sessie daadwerkelijk beëindigen.
      const csrfResponse = await fetch('/api/csrf')

      if (csrfResponse.status === 401) {
        this.clearPhoto()
        this.user = null
        this.initialized = true
        localStorage.removeItem('token')
        window.location.assign('/login')
        return
      }

      if (!csrfResponse.ok) {
        throw new Error('Uitloggen mislukt')
      }

      const csrf = await csrfResponse.json()

      const response = await fetch('/logout', {
        method: 'POST',
        headers: {
          [csrf.headerName]: csrf.token,
        },
      })

      if (!response.ok) {
        throw new Error('Uitloggen mislukt')
      }

      this.clearPhoto()
      this.user = null
      this.initialized = true
      localStorage.removeItem('token')
      window.location.assign('/login')
    },
  },
})
