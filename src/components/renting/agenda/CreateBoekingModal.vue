<template>
  <div class="modal-overlay" @click.self="close">
    <div class="modal">
      <div class="modal-header">
        <h2>Nieuwe Boeking</h2>
        <button class="close-btn" @click="close">✕</button>
      </div>

      <form @submit.prevent="submitBoeking">
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

        <!-- Periode -->
        <div class="form-group">
          <label>Begin datum</label>
          <input type="date" v-model="form.beginDatum" required />
        </div>

        <div class="form-group">
          <label>Eind datum</label>
          <input type="date" v-model="form.eindDatum" />
        </div>

        <!-- Service -->
        <div class="form-group">
          <label>Type service</label>
          <select v-model="form.type" required>
            <option disabled value="">Selecteer</option>
            <option value="Transport door logistiek">Transport door logistiek</option>
            <option value="ophaling door klant">Ophaling door klant</option>
          </select>
        </div>

        <div class="modal-footer">
          <button type="button" class="btn-cancel" @click="close">Annuleren</button>
          <button type="submit" class="btn-primary">Opslaan</button>
        </div>
      </form>

      <p v-if="message" :class="{ error: error }">{{ message }}</p>
    </div>
  </div>

  <!-- Adres select modal -->
  <SelectLeverAdresModal
    v-if="showAdresModal"
    :adressen="beschikbareAdressen"
    @select="(adres) => (form.leverAdres = adres._id)"
    @close="showAdresModal = false"
  />
</template>

<script setup>
import { reactive, ref, onMounted, onUnmounted } from 'vue'
import { boekingApi } from '@/api/boeking'
import { klantApi } from '@/api/klant'
import { useBoekingenStore } from '@/stores/renting/boekingen.store.js'
import SelectLeverAdresModal from './SelectLeverAdresModal.vue'
import AutocompleteSelect from '@/components/base/AutocompleteSelect.vue'

defineProps({ types: Object })
const emit = defineEmits(['close', 'update'])
const boekingenstore = useBoekingenStore();

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

/* --------------------------
   LEEFTIJD: GET KLANTEN
-------------------------- */
onMounted(async () => {
  await getKlanten()
  document.addEventListener('keydown', handleEsc)
})

onUnmounted(() => document.removeEventListener('keydown', handleEsc))

async function getKlanten() {
  try {
    const data = await klantApi.list()
    klanten.value = Array.isArray(data) ? data : data.items ?? []
  } catch (e) {
    console.error(e)
  }
}
function handleKlantAdres(klant) {
  form.klant = klant._id

  if (klant.leverAdressen?.length > 1) {
    beschikbareAdressen.value = klant.leverAdressen
    showAdresModal.value = true
  } else if (klant.leverAdressen?.length === 1) {
    form.leverAdres = klant.leverAdressen[0]._id
  } else {
    form.leverAdres = klant.factuurAdres?._id || null
  }
}
/* --------------------------
   KLANT ADRES LOGICA
-------------------------- */


/* --------------------------
   ESC EN CLOSE
-------------------------- */
function handleEsc(e) {
  if (e.key === 'Escape') close()
}

function close() {
  emit('close')
}

/* --------------------------
   SUBMIT
-------------------------- */
async function submitBoeking() {
  if (!form.leverAdres) {
    message.value = 'Kies eerst een leveradres'
    error.value = true
    return
  }

  if (!form.eindDatum) {
    const begin = new Date(form.beginDatum)
    begin.setFullYear(begin.getFullYear() + 5)
    form.eindDatum = begin.toISOString().split('T')[0]
  }

  try {
    await boekingApi.add(JSON.stringify(form))

    // 🔥 BELANGRIJK: refresh lijst/cache
    await boekingenstore.loadBoekingen(false)

    message.value = 'Boeking succesvol aangemaakt!'
    error.value = false

    emit('update')
    setTimeout(() => close(), 800)

  } catch (err) {
    message.value = err.message || 'Er is een fout opgetreden.'
    error.value = true
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
