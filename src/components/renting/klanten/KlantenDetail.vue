<template>
  <Transition name="drawer">
    <div v-if="show" class="drawer-wrapper">
      <div class="drawer">
        <!-- HEADER -->
        <div class="drawer-header">
          <h3>Detail</h3>
          <button class="close-btn" @click="$emit('close')">✕</button>
        </div>

        <div class="drawer-content">
          <div class="adres-row">
            <!-- FACTUUR -->
            <div class="factuuradres">
              <div class="form-group">
                <label>Naam</label>
                <input v-model="localForm.naam" />
              </div>

              <div class="form-group">
                <label>Klantnummer</label>
                <input v-model="localForm.klantNummer" />
              </div>

              <div class="form-group">
                <label>Telefoonnummer</label>
                <input v-model="localForm.telefoonnummer" />
              </div>

              <div class="form-group">
                <label>Mailadres</label>
                <input v-model="localForm.mailadres" />
              </div>

              <div class="form-group">
                <label>BTW-nummer</label>

                <div style="display: flex; gap: 10px">
                  <input v-model="localForm.BTWnummer" />

                  <button class="validate-btn" @click="checkBTW" :disabled="loadingBTW">
                    {{ loadingBTW ? 'Bezig...' : 'Valideer' }}
                  </button>
                </div>

                <span v-if="btwError" class="error">{{ btwError }}</span>
              </div>

              <h4>Factuuradres</h4>

              <div class="form-group-inline">
                <input v-model="localForm.factuurAdres.straat" placeholder="Straat" />
                <input v-model="localForm.factuurAdres.huisnummer" placeholder="Nr" />
              </div>

              <div class="form-group-inline">
                <input v-model="localForm.factuurAdres.postcode" placeholder="Postcode" />
                <input v-model="localForm.factuurAdres.gemeente" placeholder="Gemeente" />
              </div>

              <div class="buttons">
                <button class="save" @click="emitSave">Opslaan</button>
                <button v-if="selectedKlant" class="delete" @click="$emit('delete')">
                  Verwijderen
                </button>
              </div>
            </div>

            <div class="divider"></div>

            <!-- LEVERADRESSEN -->
            <div class="leveradressen">
              <h4>Leveradressen</h4>

              <div class="search-row">
                <input v-model="zoekTerm" placeholder="Zoek..." />
                <button @click="$emit('leveradresToevoegen', localForm)" class="add-adres">
                  + Add
                </button>
              </div>

              <div class="leveradressen-container">
                <div
                  v-for="adres in filtered"
                  :key="adres._id ?? adres.naam"
                  class="leveradres-card"
                >
                  <div class="adres-info" @click="$emit('edit-lever-adres', adres)">
                    <strong>{{ adres.naam }}</strong>
                    <div>{{ adres.straat }} {{ adres.huisnummer }}</div>
                    <div>{{ adres.postcode }} {{ adres.gemeente }}</div>
                  </div>

                  <div class="card-buttons">
                    <button class="edit-small" @click.stop="$emit('edit-lever-adres', adres)">
                      ✎
                    </button>

                    <button class="delete-small" @click.stop="$emit('remove-lever-adres', adres)">
                      ✕
                    </button>
                  </div>
                </div>

                <p v-if="!filtered.length">Geen resultaten</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { reactive, ref, watch, computed } from 'vue'
import { VAT_REGEX } from '@/utils/vatRegex'

const props = defineProps({
  form: { type: Object, required: true },
  selectedKlant: Object,
  show: Boolean,
})

const emit = defineEmits([
  'save',
  'delete',
  'close',
  'leveradresToevoegen',
  'update-lever-adres',
  'remove-lever-adres',
  'edit-lever-adres',
])

/**
 * 🔥 FIX: reactive i.p.v ref + replace
 * → voorkomt broken v-model binding
 */
const localForm = reactive({
  naam: '',
  klantNummer: '',
  telefoonnummer: '',
  mailadres: '',
  BTWnummer: '',
  factuurAdres: {
    straat: '',
    huisnummer: '',
    postcode: '',
    gemeente: '',
  },
  leverAdressen: [],
})

/**
 * 🔥 FIX: merge i.p.v replace
 */
watch(
  () => props.form,
  (v) => {
    if (!v) return
    Object.assign(localForm, JSON.parse(JSON.stringify(v)))
  },
  { immediate: true, deep: true },
)

const selectedKlant = computed(() => props.selectedKlant)

const zoekTerm = ref('')

const filtered = computed(() => {
  const q = zoekTerm.value.toLowerCase().trim()
  const list = localForm.leverAdressen || []

  if (!q) return list

  return list.filter((a) => (a.naam || '').toLowerCase().includes(q))
})

/**
 * 🔥 FIX: clone bij emit (geen proxy leakage)
 */
function emitSave() {
  emit('save', JSON.parse(JSON.stringify(localForm)))
}

const btwError = ref('')
const loadingBTW = ref(false)
function validateBTW(value) {
  if (!value) {
    btwError.value = ''
    return true
  }

  const clean = normalizeBTW(value)
  const country = clean.slice(0, 2)
  const regex = VAT_REGEX[country]

  if (!regex) {
    btwError.value = 'Onbekend land'
    return false
  }

  if (!regex.test(clean)) {
    btwError.value = 'Ongeldig BTW-nummer'
    return false
  }

  btwError.value = ''
  return true
}
async function checkBTW() {
  const value = localForm.BTWnummer

  if (!validateBTW(value)) return

  const clean = normalizeBTW(value)

  loadingBTW.value = true
  btwError.value = ''

  try {
    const res = await fetch(`https://api.vatcomply.com/vat?vat_number=${clean}`)

    const data = await res.json()

    if (!data.valid) {
      btwError.value = 'BTW-nummer bestaat niet'
      return
    }

    // 🔥 Zorg dat input clean is
    localForm.BTWnummer = clean

    if (data.name) {
      localForm.naam = data.name
    }

    // ✅ Adres parsing (VATComply geeft string)
    if (data.address) {
      parseAddress(data.address)
    }
  } catch {
    btwError.value = 'Fout bij controleren'
  } finally {
    loadingBTW.value = false
  }
}
function parseAddress(address) {
  if (!address) return
  console.log(address)
  const lines = address.split('\n').map((l) => l.trim())

  if (lines.length >= 2) {
    const streetLine = lines[0]
    const cityLine = lines[1]

    // straat + nr
    const matchStreet = streetLine.match(/(.+?)\s(\d+.*)$/)
    if (matchStreet) {
      localForm.factuurAdres.straat = matchStreet[1]
      localForm.factuurAdres.huisnummer = matchStreet[2]
    } else {
      localForm.factuurAdres.straat = streetLine
    }

    // postcode + stad
    const matchCity = cityLine.match(/(\d{4})\s(.+)/)
    if (matchCity) {
      localForm.factuurAdres.postcode = matchCity[1]
      localForm.factuurAdres.gemeente = matchCity[2]
    }
  }
}
function normalizeBTW(value) {
  return value.toUpperCase().replace(/[^A-Z0-9]/g, '') // 🔥 alles behalve letters/cijfers weg
}
</script>

<style scoped>
.drawer-wrapper {
  position: fixed;
  top: 0;
  right: 0;
  height: 100vh;
  z-index: 1000;
}

.drawer {
  width: 50vw;
  max-width: 100%;
  height: 100%;
  background: #ffffff;
  border-radius: 12px 0 0 12px;
  box-shadow: -12px 0 40px rgba(0, 0, 0, 0.15);
  display: flex;
  flex-direction: column;
}

/* ANIMATION */
.drawer-enter-from,
.drawer-leave-to {
  transform: translateX(100%);
}
.drawer-enter-active,
.drawer-leave-active {
  transition: transform 0.32s ease;
}
.validate-btn {
  background: #10b981;
  color: white;
  padding: 0 14px;
  border-radius: 10px;
  cursor: pointer;
}

.validate-btn:hover {
  background: #059669;
}

.validate-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
/* HEADER */
.drawer-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 22px 26px;
  border-bottom: 1px solid #e5e7eb;
}

.drawer-header h3 {
  font-size: 1.55rem;
  font-weight: 600;
}

/* Close button */
.close-btn {
  width: 38px;
  height: 38px;
  border: none;
  background: rgba(0, 0, 0, 0.06);
  border-radius: 12px;
  cursor: pointer;
  font-size: 18px;
  color: #475569;
  transition: 0.25s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-btn:hover {
  background: #ef4444;
  color: white;
}

/* CONTENT */
.drawer-content {
  padding: 24px 26px;
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
}

/* LAYOUT VAN TWEE KOLOMMEN */
.adres-row {
  display: flex;
  gap: 32px;
}

.factuuradres,
.leveradressen {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* DIVIDER */
.divider {
  width: 1px;
  background: #e5e7eb;
}

/* TITELTJES */
.factuuradres h4,
.leveradressen h4 {
  margin: 8px 0 0;
  font-size: 1.2rem;
  font-weight: 600;
  color: #111827;
}

/* FORM GROUPS */
.form-group,
.form-group-inline {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-group-inline {
  flex-direction: row;
  gap: 18px;
}

/* INPUT SIZES */
.input-large {
  flex: 1;
}
.input-small {
  width: 160px;
}

/* INPUTS */
input {
  width: 100%;
  padding: 10px 14px;
  font-size: 14px;
  background: #ffffff;
  border: 1px solid #d1d5db;
  border-radius: 10px;
  transition: 0.2s;
}

input:focus {
  outline: none;
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.15);
}

/* ERROR MESSAGES */
.error {
  font-size: 12px;
  color: #dc2626;
  margin-top: -2px;
}

/* BUTTON BALK */
.buttons {
  display: flex;
  gap: 14px;
  margin-top: 10px;
}

.buttons button {
  padding: 11px 18px;
  font-size: 14px;
  font-weight: 500;
  border-radius: 10px;
  transition: 0.2s;
  min-width: 115px;
}

.save {
  background: #2563eb;
  color: #fff;
}
.save:hover {
  background: #1d4ed8;
}

.cancel {
  background: #6b7280;
  color: #fff;
}
.cancel:hover {
  background: #4b5563;
}

.delete {
  background: #ef4444;
  color: #fff;
}
.delete:hover {
  background: #dc2626;
}

/* LEVERADRESSEN */
.search-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.search-input {
  flex: 1;
  padding: 10px 14px;
  border-radius: 10px;
  border: 1px solid #d1d5db;
}

.add-adres {
  background: #3b82f6;
  color: #fff;
  padding: 10px 14px;
  border-radius: 10px;
}
.add-adres:hover {
  background: #2563eb;
  cursor: pointer;
}

/* LEVERADRES CARDS */
.leveradressen-container {
  display: flex;
  flex-direction: column;
  gap: 12px;
  overflow-y: auto;
}

.leveradres-card {
  position: relative;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 14px 16px;
  cursor: pointer;
  transition: 0.2s;
}

.leveradres-card:hover {
  background: #f3f4f6;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.07);
}

.adres-info {
  padding-right: 70px;
  line-height: 1.38;
  font-size: 14px;
}

.card-buttons {
  position: absolute;
  top: 10px;
  right: 10px;
  display: flex;
  gap: 6px;
}

.card-buttons button {
  padding: 6px 8px;
  font-size: 12px;
  border-radius: 8px;
}

.edit-small {
  background: #3b82f6;
  color: #fff;
}
.edit-small:hover {
  background: #2563eb;
}

.delete-small {
  background: #ef4444;
  color: #fff;
}
.delete-small:hover {
  background: #dc2626;
}

/* RESPONSIVE */
@media (max-width: 1024px) {
  .drawer {
    width: 90vw;
  }
  .adres-row {
    flex-direction: column;
  }
  .divider {
    height: 1px;
    width: 100%;
  }
}
button {
  border: none;
}
</style>
