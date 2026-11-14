<template>
  <div class="modal-overlay" @click.self="close">
    <div
      class="modal"
      role="dialog"
      aria-modal="true"
      aria-label="Nieuwe Boeking"
      :aria-busy="saving"
    >
      <div class="modal-header">
        <h2>Nieuwe Boeking</h2>
        <button class="close-btn" :disabled="saving" aria-label="Sluiten" @click="close">✕</button>
      </div>

      <form @submit.prevent="submitBoeking">
        <fieldset :disabled="saving || loadingKlanten">
          <!-- Type toestel -->

          <div class="form-group">
            <label>Type toestel</label>
            <AutocompleteSelect
              v-model="form.toestelType"
              :options="types"
              label-key="naam"
              placeholder="Zoek Type"
            />
          </div>
          <!-- ✅ Klant autocomplete select -->
          <!-- NieuweBoekingModal.vue -->
          <div class="form-group">
            <label>Klant</label>
            <AutocompleteSelect
              v-model="form.klant"
              :options="klanten"
              label-key="naam"
              placeholder="Zoek klant..."
              @select="handleKlantAdres"
            />
          </div>

          <div v-if="selectedKlant" class="form-group">
            <label>Leveradres</label>
            <p>
              {{
                selectedAdres
                  ? [
                      selectedAdres.naam,
                      selectedAdres.straat,
                      selectedAdres.huisnummer,
                      selectedAdres.postcode,
                      selectedAdres.stad,
                    ]
                      .filter(Boolean)
                      .join(' ')
                  : 'Nog geen leveradres gekozen'
              }}
            </p>
            <button
              v-if="beschikbareAdressen.length"
              type="button"
              class="btn-cancel"
              @click="showAdresModal = true"
            >
              Leveradres kiezen
            </button>
          </div>
          <!-- Periode -->
          <div class="form-group">
            <label>Begin datum</label>
            <input
              type="date"
              v-model="form.beginDatum"
              :min="today"
              aria-label="Begin datum"
              required
            />
          </div>

          <div class="form-group">
            <label>Eind datum</label>
            <input
              type="date"
              v-model="form.eindDatum"
              :min="form.beginDatum"
              aria-label="Eind datum"
            />
          </div>

          <!-- Service -->
          <div class="form-group">
            <label>Type service</label>
            <select v-model="form.type" aria-label="Type service" required>
              <option disabled value="">Selecteer</option>
              <option value="Transport door logistiek">Transport door logistiek</option>
              <option value="ophaling door klant">Ophaling door klant</option>
            </select>
          </div>

          <div class="modal-footer">
            <button type="button" class="btn-cancel" @click="close">Annuleren</button>
            <button type="submit" class="btn-primary">{{ saving ? 'Opslaan…' : 'Opslaan' }}</button>
          </div>
        </fieldset>
      </form>

      <p v-if="message" :class="{ error: error }" role="alert">{{ message }}</p>
      <p v-if="loadingKlanten" role="status">Klanten laden…</p>
    </div>
  </div>

  <!-- Adres select modal -->
  <SelectLeverAdresModal
    v-if="showAdresModal"
    :adressen="beschikbareAdressen"
    @select="(adres) => (form.leverAdres = adres.id ?? adres._id)"
    @close="showAdresModal = false"
  />
</template>

<script setup>
import { reactive, ref, computed, onMounted, onUnmounted } from 'vue'
import { boekingApi } from '@/api/boeking'
import { klantApi } from '@/api/klant'
import { useBoekingenStore } from '@/stores/renting/boekingen.store.js'
import SelectLeverAdresModal from './SelectLeverAdresModal.vue'
import AutocompleteSelect from '@/components/base/AutocompleteSelect.vue'

defineProps({ types: { type: Array, default: () => [] } })
const emit = defineEmits(['close', 'update'])
const boekingenstore = useBoekingenStore()

/* --------------------------
   STATE
-------------------------- */
const form = reactive({
  toestelType: '',
  klant: '', // wordt _id
  beginDatum: '',
  eindDatum: '',
  type: '',
  leverAdres: '',
})

const klanten = ref([])
const message = ref('')
const error = ref(false)
const showAdresModal = ref(false)
const beschikbareAdressen = ref([])
const saving = ref(false)
const loadingKlanten = ref(true)
const today = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Brussels' }).format(new Date())
const selectedKlant = computed(() =>
  klanten.value.find((klant) => (klant.id ?? klant._id) === form.klant),
)
const selectedAdres = computed(() =>
  beschikbareAdressen.value.find((adres) => (adres.id ?? adres._id) === form.leverAdres),
)

/* --------------------------
   LEEFTIJD: GET KLANTEN
-------------------------- */
onMounted(async () => {
  document.addEventListener('keydown', handleEsc)
  await getKlanten()
})

onUnmounted(() => document.removeEventListener('keydown', handleEsc))

async function getKlanten() {
  try {
    const data = await klantApi.list()
    klanten.value = Array.isArray(data) ? data : (data.items ?? [])
  } catch (e) {
    message.value = e.message || 'Klanten konden niet geladen worden.'
    error.value = true
  } finally {
    loadingKlanten.value = false
  }
}
function handleKlantAdres(klant) {
  form.klant = klant?.id ?? klant?._id ?? ''
  form.leverAdres = ''
  showAdresModal.value = false
  const addresses = [
    ...(klant?.leverAdressen ?? []),
    ...(klant?.factuurAdres ? [klant.factuurAdres] : []),
  ]
  beschikbareAdressen.value = [
    ...new Map(
      addresses
        .filter((adres) => adres.id ?? adres._id)
        .map((adres) => [adres.id ?? adres._id, adres]),
    ).values(),
  ]
  const deliveries = klant?.leverAdressen ?? []
  if (deliveries.length === 1) form.leverAdres = deliveries[0].id ?? deliveries[0]._id
  else if (deliveries.length > 1) showAdresModal.value = true
  else form.leverAdres = klant?.factuurAdres?.id ?? klant?.factuurAdres?._id ?? ''
}
/* --------------------------
   KLANT ADRES LOGICA
-------------------------- */

/* --------------------------
   ESC EN CLOSE
-------------------------- */
function handleEsc(e) {
  if (e.key === 'Escape') {
    if (showAdresModal.value) showAdresModal.value = false
    else close()
  }
}

function close() {
  if (!saving.value) emit('close')
}

/* --------------------------
   SUBMIT
-------------------------- */
async function submitBoeking() {
  if (saving.value) return
  message.value = ''
  error.value = false
  if (!form.toestelType || !form.klant) {
    message.value = 'Kies een toesteltype en een klant.'
    error.value = true
    return
  }
  if (!form.leverAdres) {
    message.value = 'Kies eerst een leveradres'
    error.value = true
    return
  }

  if (
    !form.beginDatum ||
    form.beginDatum < today ||
    (form.eindDatum && form.eindDatum <= form.beginDatum)
  ) {
    message.value = 'Kies een begindatum vanaf vandaag en een einddatum na de begindatum.'
    error.value = true
    return
  }

  saving.value = true
  try {
    const booking = await boekingApi.add({ ...form })

    boekingenstore.invalidateLists()
    await boekingenstore.loadBoekingen(false)

    message.value = 'Boeking succesvol aangemaakt!'
    error.value = false

    emit('update', booking)
    emit('close')
  } catch (err) {
    message.value = err.message || 'Er is een fout opgetreden.'
    error.value = true
  } finally {
    saving.value = false
  }
}
</script>
<style scoped>
/* =========================================
   OVERLAY
========================================= */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.55);
  backdrop-filter: blur(8px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
  animation: fadeIn 0.25s ease-out;
}

/* =========================================
   MODAL CONTAINER
========================================= */
.modal {
  width: 95%;
  max-width: 520px;
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(12px);
  border-radius: 18px;
  padding: 2.2rem;
  box-shadow:
    0 10px 35px rgba(0, 0, 0, 0.18),
    0 4px 12px rgba(0, 0, 0, 0.08);
  animation: slideUp 0.3s ease-out;
  position: relative;
  font-family: 'Inter', sans-serif;
  max-height: 90dvh;
  overflow-y: auto;
}
fieldset {
  border: 0;
  padding: 0;
  margin: 0;
  min-width: 0;
}
button:disabled {
  opacity: 0.55;
  cursor: wait;
}
.autocomplete {
  position: relative;
}

.autocomplete-input {
  padding: 0.7rem 0.9rem;
  border-radius: 10px;
  border: 1px solid #cbd5e1;
}

.autocomplete-list {
  position: absolute;
  left: 0;
  right: 0;
  top: calc(100% + 4px);
  background: white;
  border: 1px solid #cbd5e1;
  border-radius: 10px;
  max-height: 35vh;
  overflow-y: auto;
  z-index: 10;

  /* ✅ bullets weg */
  list-style: none;
  margin: 0;
  padding: 6px 0;
}

.autocomplete-list li {
  padding: 10px;
  cursor: pointer;
}

.autocomplete-list li:hover {
  background: #f1f5f9;
}

/* =========================================
   HEADER
========================================= */
.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.8rem;
}

.modal-header h2 {
  margin: 0;
  font-size: 1.6rem;
  font-weight: 700;
  letter-spacing: 0.5px;
  color: #0f172a;
}

.close-btn {
  background: rgba(0, 0, 0, 0.05);
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: none;
  cursor: pointer;
  font-size: 1.1rem;
  color: #475569;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: 0.2s ease;
}

.close-btn:hover {
  background: #ef4444;
  color: white;
}

/* =========================================
   FORM GROUPS
========================================= */
.form-group {
  display: flex;
  flex-direction: column;
  margin-bottom: 1.3rem;
}

.form-group label {
  font-size: 0.9rem;
  font-weight: 600;
  color: #334155;
  margin-bottom: 0.35rem;
}

/* Inputs / Dropdowns */
.form-group input,
.form-group select {
  padding: 0.7rem 0.9rem;
  font-size: 1rem;
  border: 1px solid #cbd5e1;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.85);
  transition: all 0.25s ease;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg width='14' height='14' viewBox='0 0 20 20' stroke='%236b7280' stroke-width='2' fill='none' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 8 10 12 14 8'%3E%3C/polyline%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 12px center;
}

.form-group input:focus,
.form-group select:focus {
  border-color: #4f73ff;
  background: white;
  box-shadow: 0 0 0 4px rgba(79, 115, 255, 0.15);
}

/* =========================================
   FOOTER BUTTONS
========================================= */
.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.8rem;
  margin-top: 1.8rem;
}

.btn-primary {
  background: #4f73ff;
  color: white;
  border: none;
  padding: 0.65rem 1.3rem;
  border-radius: 10px;
  font-weight: 600;
  cursor: pointer;
  transition: 0.25s ease;
}

.btn-primary:hover {
  background: #355dff;
  box-shadow: 0 5px 14px rgba(79, 115, 255, 0.25);
}

.btn-cancel {
  background: rgba(0, 0, 0, 0.08);
  color: #334155;
  padding: 0.65rem 1.3rem;
  border-radius: 10px;
  border: none;
  cursor: pointer;
  transition: 0.25s ease;
}

.btn-cancel:hover {
  background: rgba(0, 0, 0, 0.12);
}

/* =========================================
   MESSAGES
========================================= */
p {
  margin-top: 1rem;
  font-size: 0.95rem;
  font-weight: 500;
  color: #0f172a;
}

p.error {
  color: #dc2626;
}
.no-results {
  padding: 10px 12px;
  color: #64748b;
  font-style: italic;
}
/* =========================================
   ANIMATIES
========================================= */
@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(25px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
