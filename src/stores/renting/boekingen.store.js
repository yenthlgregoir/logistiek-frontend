import { defineStore } from 'pinia'
import { boekingApi } from '@/api/boeking'
import { toestelApi } from '@/api/toestel'

// ✅ Date formatter
function formatDate(date) {
  if (!date) return null
  return new Date(date).toLocaleDateString('nl-BE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

export const useBoekingenStore = defineStore('boekingen', {
  state: () => ({
    boekingen: [],
    currentViewMode: 'actief',

    listCache: {
      actief: { key: null, time: 0, data: [] },
      archief: { key: null, time: 0, data: [] },
    },
    listTTL: 1000 * 60 * 5,

    boekingCache: {},
    boekingTTL: 1000 * 60 * 5,

    types: [],
    typesLoaded: false,

    vrijeToestellen: [],
    search: '',
    dateRange: [null, null],
    huidigeBoekingId: null,
    currentBoeking: null,

    // ✅ NIEUW
    loadingList: false,
    loadingDetail: false,
    loadingAction: false,

    errorList: null,
    errorDetail: null,
    errorAction: null,
  }),

  actions: {
    setViewMode(mode) {
      this.currentViewMode = mode
    },  

    // =========================
    // 📦 LIST
    // =========================
    async loadBoekingen() {
      const archief = this.currentViewMode === 'archief'

      const key = JSON.stringify({
        search: this.search,
        range: this.dateRange.map((d) => (d ? new Date(d).toISOString() : null)),
        archief,
      })

      const cache = this.listCache[archief ? 'archief' : 'actief']

      if (cache.key === key && Date.now() - cache.time < this.listTTL) {
        this.boekingen = cache.data
        return
      }

      if (cache.data.length > 0) {
        this.boekingen = cache.data
      }

      this.loadingList = true
      this.errorList = null

      try {
        const res = await boekingApi.list({
          search: this.search,
          startDatum: this.dateRange[0],
          eindDatum: this.dateRange[1],
          archief,
        })

        const formatted = res.map((b) => ({
          ...b,
          beginDatumFormatted: formatDate(b.beginDatum),
          eindDatumFormatted: formatDate(b.eindDatum),
        }))

        this.boekingen = formatted

        cache.key = key
        cache.time = Date.now()
        cache.data = formatted
      } catch (err) {
        console.error(err)
        this.errorList = err
      } finally {
        this.loadingList = false
      }
    },

    // =========================
    // 📄 DETAIL
    // =========================
    async loadBoeking(id) {
      const cached = this.boekingCache[id]

      this.loadingDetail = true
      this.errorDetail = null

      try {
        if (cached && Date.now() - cached.time < this.boekingTTL) {
          this.currentBoeking = cached.data
          this.huidigeBoekingId = id
          return
        }

        const inList = this.boekingen.find((b) => b._id === id)

        if (inList) {
          this.currentBoeking = inList
          this.huidigeBoekingId = id
          this.boekingCache[id] = { data: inList, time: Date.now() }
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
        this.boekingCache[id] = { data: formatted, time: Date.now() }
      } catch (err) {
        console.error(err)
        this.errorDetail = err
        this.currentBoeking = null
      } finally {
        this.loadingDetail = false
      }
    },

    // =========================
    // 🔄 ACTIONS
    // =========================
    async changeStatus(status) {
      if (!this.currentBoeking) return

      this.loadingAction = true
      this.errorAction = null

      try {
        await boekingApi.changeState(this.currentBoeking._id, { status })
        this.currentBoeking.status = status

        delete this.boekingCache[this.currentBoeking._id]
        this.listCache.actief.time = 0
        this.listCache.archief.time = 0

        await this.loadBoekingen()
      } catch (err) {
        console.error(err)
        this.errorAction = err
      } finally {
        this.loadingAction = false
      }
    },

    async updatePeriode(boekingId, beginDatum, eindDatum) {
      this.loadingAction = true
      this.errorAction = null

      try {
        await boekingApi.updatePeriode(boekingId, beginDatum, eindDatum)

        const update = {
          beginDatum,
          eindDatum,
          beginDatumFormatted: formatDate(beginDatum),
          eindDatumFormatted: formatDate(eindDatum),
        }

        if (this.currentBoeking?._id === boekingId) {
          Object.assign(this.currentBoeking, update)
        }

        const item = this.boekingen.find((b) => b._id === boekingId)
        if (item) Object.assign(item, update)

        delete this.boekingCache[boekingId]
      } catch (err) {
        console.error(err)
        this.errorAction = err
      } finally {
        this.loadingAction = false
      }
    },

    async saveComment(id, comment) {
      this.loadingAction = true
      this.errorAction = null

      try {
        await boekingApi.update(id, { comment })

        const item = this.boekingen.find((b) => b._id === id)
        if (item) item.comment = comment

        delete this.boekingCache[id]
      } catch (err) {
        console.error(err)
        this.errorAction = err
      } finally {
        this.loadingAction = false
      }
    },

    async deleteBoeking() {
      if (!this.currentBoeking) return

      this.loadingAction = true
      this.errorAction = null

      try {
        await boekingApi.remove(this.currentBoeking._id)

        delete this.boekingCache[this.currentBoeking._id]
        this.listCache.actief.time = 0
        this.listCache.archief.time = 0

        this.currentBoeking = null

        await this.loadBoekingen()
      } catch (err) {
        console.error(err)
        this.errorAction = err
      } finally {
        this.loadingAction = false
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

    async openVrijeToestellen(boekingId) {
      try {
        const b = this.boekingen.find((b) => b._id === boekingId)
        if (!b) return

        this.huidigeBoekingId = boekingId

        this.vrijeToestellen = await boekingApi.vrijeToestellen({
          beginDatum: b.beginDatum,
          eindDatum: b.eindDatum,
          toestelType: b.toestelType?._id,
        })
      } catch (err) {
        console.error(err)
      }
    },

    async assignToestel(toestel) {
      this.loadingAction = true
      this.errorAction = null

      try {
        await boekingApi.assignToestel(this.huidigeBoekingId, toestel._id)

        const item = this.boekingen.find((b) => b._id === this.huidigeBoekingId)
        if (item) item.toestel = toestel

        if (this.currentBoeking?._id === this.huidigeBoekingId) {
          this.currentBoeking.toestel = toestel
        }

        delete this.boekingCache[this.huidigeBoekingId]
      } catch (err) {
        console.error(err)
        this.errorAction = err
      } finally {
        this.loadingAction = false
      }
    },
  },
})
