import { defineStore } from 'pinia'
import {
  fetchBoekingen,
  getVrijeToestellen,
  assignToestel,
  deleteBoeking,
  updateComment,
} from '@/services/boekingen.service'

import { boekingApi } from '@/api/boeking'
import { toestelApi } from '@/api/toestel'
import { formatDate } from '@/utils/date'

// simpele cache helper
function createCache(ttl: number) {
  const map = new Map<string, { data: any; time: number }>()

  return {
    get(key: string) {
      const item = map.get(key)
      if (!item) return null
      if (Date.now() - item.time > ttl) return null
      return item.data
    },
    set(key: string, data: any) {
      map.set(key, { data, time: Date.now() })
    },
    clear() {
      map.clear()
    },
    delete(key: string) {
      map.delete(key)
    },
  }
}

export const useBoekingenStore = defineStore('boekingen', {
  state: () => ({
    boekingen: [] as any[],
    currentBoeking: null as any | null,
    huidigeBoekingId: null as string | null,

    currentViewMode: 'actief',

    search: '',
    dateRange: [null, null] as [string | null, string | null],

    vrijeToestellen: [],

    types: [],
    typesLoaded: false,

    // ✅ structured loading
    loading: {
      list: false,
      detail: false,
      action: false,
    },

    error: {
      list: null as any,
      detail: null as any,
      action: null as any,
    },

    // ✅ generic caches
    listCache: createCache(5 * 60 * 1000),
    detailCache: createCache(5 * 60 * 1000),
  }),

  actions: {
    // =========================
    // 🔧 HELPERS
    // =========================
    buildListKey() {
      return JSON.stringify({
        search: this.search,
        range: this.dateRange,
        archief: this.currentViewMode === 'archief',
      })
    },

    updateLocal(id: string, patch: any) {
      if (this.currentBoeking?._id === id) {
        Object.assign(this.currentBoeking, patch)
      }

      const item = this.boekingen.find((b) => b._id === id)
      if (item) Object.assign(item, patch)
    },

    invalidateLists() {
      this.listCache.clear()
    },

    // =========================
    // 📦 LIST
    // =========================
    async loadBoekingen() {
      const key = this.buildListKey()

      const cached = this.listCache.get(key)
      if (cached) {
        this.boekingen = cached
        return
      }

      this.loading.list = true
      this.error.list = null

      try {
        const data = await fetchBoekingen({
          search: this.search,
          startDatum: this.dateRange[0],
          eindDatum: this.dateRange[1],
          archief: this.currentViewMode === 'archief',
        })

        this.boekingen = data
        this.listCache.set(key, data)
      } catch (err) {
        console.error(err)
        this.error.list = err
      } finally {
        this.loading.list = false
      }
    },

    // =========================
    // 📄 DETAIL
    // =========================
    async loadBoeking(id: string) {
      this.loading.detail = true
      this.error.detail = null

      try {
        const cached = this.detailCache.get(id)
        if (cached) {
          this.currentBoeking = cached
          this.huidigeBoekingId = id
          return
        }

        const inList = this.boekingen.find((b) => b._id === id)
        if (inList) {
          this.currentBoeking = inList
          this.huidigeBoekingId = id
          this.detailCache.set(id, inList)
          return
        }

        const res = await boekingApi.get(id)

        const formatted = {
          ...res,
          beginDatumFormatted: formatDate(res.beginDatum),
          eindDatumFormatted: formatDate(res.eindDatum),
        }

        this.currentBoeking = formatted
        this.huidigeBoekingId = id
        this.detailCache.set(id, formatted)
      } catch (err) {
        console.error(err)
        this.error.detail = err
        this.currentBoeking = null
      } finally {
        this.loading.detail = false
      }
    },

    // =========================
    // 🔄 ACTIONS
    // =========================
    async changeStatus(status: string) {
      if (!this.currentBoeking) return

      this.loading.action = true
      this.error.action = null

      const oldStatus = this.currentBoeking.status

      try {
        // optimistic update
        this.updateLocal(this.currentBoeking._id, { status })

        await boekingApi.changeState(this.currentBoeking._id, { status })

        this.detailCache.delete(this.currentBoeking._id)
        this.invalidateLists()
      } catch (err) {
        console.error(err)
        this.updateLocal(this.currentBoeking._id, { status: oldStatus })
        this.error.action = err
      } finally {
        this.loading.action = false
      }
    },

    async updatePeriode(id: string, beginDatum: string, eindDatum: string) {
      this.loading.action = true
      this.error.action = null

      try {
        await boekingApi.updatePeriode(id, beginDatum, eindDatum)

        const patch = {
          beginDatum,
          eindDatum,
          beginDatumFormatted: formatDate(beginDatum),
          eindDatumFormatted: formatDate(eindDatum),
        }

        this.updateLocal(id, patch)
        this.detailCache.delete(id)
      } catch (err) {
        console.error(err)
        this.error.action = err
      } finally {
        this.loading.action = false
      }
    },

    async saveComment(id: string, comment: string) {
      this.loading.action = true
      this.error.action = null

      try {
        await updateComment(id, comment)

        this.updateLocal(id, { comment })
        this.detailCache.delete(id)
      } catch (err) {
        console.error(err)
        this.error.action = err
      } finally {
        this.loading.action = false
      }
    },

    async deleteBoeking() {
      if (!this.currentBoeking) return

      this.loading.action = true
      this.error.action = null

      try {
        await deleteBoeking(this.currentBoeking._id)

        this.detailCache.delete(this.currentBoeking._id)
        this.invalidateLists()

        this.currentBoeking = null

        await this.loadBoekingen()
      } catch (err) {
        console.error(err)
        this.error.action = err
      } finally {
        this.loading.action = false
      }
    },

    async openVrijeToestellen(boekingId: string) {
      try {
        const b = this.boekingen.find((b) => b._id === boekingId)
        if (!b) return

        this.huidigeBoekingId = boekingId

        this.vrijeToestellen = await getVrijeToestellen({
          beginDatum: b.beginDatum,
          eindDatum: b.eindDatum,
          toestelType: b.toestelType?._id,
        })
      } catch (err) {
        console.error(err)
      }
    },

    async assignToestel(toestel: any) {
      if (!this.huidigeBoekingId) return

      this.loading.action = true
      this.error.action = null

      try {
        await assignToestel(this.huidigeBoekingId, toestel._id)

        this.updateLocal(this.huidigeBoekingId, { toestel })
        this.detailCache.delete(this.huidigeBoekingId)
      } catch (err) {
        console.error(err)
        this.error.action = err
      } finally {
        this.loading.action = false
      }
    },

    async loadTypes() {
      if (this.typesLoaded) return

      try {
        const res = await toestelApi.getTypes()
        this.types = res.types || []
        this.typesLoaded = true
      } catch (err) {
        console.error(err)
      }
    },
  },
})