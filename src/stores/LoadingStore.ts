import { defineStore } from 'pinia'

type TimerMap = Record<string, ReturnType<typeof setTimeout>>

export const useLoadingStore = defineStore('loading', {
  state: () => ({
    active: 0 as number,
    map: {} as Record<string, number>,

    // ⬇️ NEW: timers
    timers: {} as TimerMap,
    visible: false,
  }),

  getters: {
    isLoading: (state): boolean => state.visible,
  },

  actions: {
    start(key?: string): void {
      this.active++

      if (key) {
        this.map[key] = (this.map[key] || 0) + 1
      }

      // ⬇️ NEW: delay loader show (1s)
      if (this.active === 1) {
        this.timers.global = setTimeout(() => {
          this.visible = true
        }, 1000)
      }
    },

    stop(key?: string): void {
      if (this.active > 0) {
        this.active--
      }

      if (key && this.map[key]) {
        this.map[key]--
        if (this.map[key] <= 0) delete this.map[key]
      }

      // ⬇️ NEW: hide logic
      if (this.active === 0) {
        if (this.timers.global) {
          clearTimeout(this.timers.global)
          delete this.timers.global
        }

        this.visible = false
      }
    },

    reset(): void {
      this.active = 0
      this.map = {}

      Object.values(this.timers).forEach(clearTimeout)
      this.timers = {}

      this.visible = false
    },

    isKeyLoading(key: string): boolean {
      return (this.map[key] || 0) > 0
    },
  },
})