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
          <select v-model="form.toestelType" required>
            <option disabled value="">Selecteer type</option>
            <option v-for="type in types" :key="type._id" :value="type._id">
              {{ type.naam }}
            </option>
          </select>
        </div>

        <!-- Klantnaam -->
        <div class="form-group">
          <label>Klant</label>
          <select v-model="form.klant" required>
            <option disabled value="">Selecteer type</option>
            <option v-for="klant in klanten" :key="klant._id" :value="klant._id">
              {{ klant.naam }}
            </option>
          </select>
        </div>

        <!-- Periode -->
        <div class="form-group">
          <label>Begin datum</label>
          <input type="date" v-model="form.beginDatum" required />
        </div>

        <div class="form-group">
          <label>Eind datum</label>
          <input type="date" v-model="form.eindDatum"/>
        </div>

        <!-- Service -->
        <div class="form-group">
          <label>Type service</label>
          <select v-model="form.type" required>
            <option disabled value="">Selecteer</option>
            <option value="levering door logistiek">Levering door logistiek</option>
            <option value="ophaling door klant">Ophaling door klant</option>
          </select>
        </div>

        <div class="modal-footer">
          <button type="button" class="btn-cancel" @click="close">Annuleren</button>
          <button type="submit" class="btn-primary">Opslaan</button>
        </div>
      </form>

      <p v-if="message" :class="{ error: error }">
        {{ message }}
      </p>
    </div>
  </div>

  <SelectLeverAdresModal
    v-if="showAdresModal"
    :adressen="beschikbareAdressen"
    @select="
      (adres) => {
        form.leverAdres = adres._id
      }
    "
    @close="showAdresModal = false"
  />
</template>

<script setup>
import { reactive, ref, onMounted, onUnmounted, watch } from 'vue'
import { boekingApi } from '@/api/boeking'
import { klantApi } from '@/api/klant'
import SelectLeverAdresModal from './SelectLeverAdresModal.vue'

const showAdresModal = ref(false)
const beschikbareAdressen = ref([])

const emit = defineEmits(['close', 'update'])

const form = reactive({
  toestelType: '',
  klantNaam: '',
  beginDatum: '',
  eindDatum: '',
  type: '',
})

const message = ref('')
const error = ref(false)
const klanten = ref([])

const props = defineProps({
  types: Object,
})

onMounted(async () => {
  await getKlanten()
  document.addEventListener('keydown', handleEsc)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleEsc)
})

function handleEsc(e) {
  if (e.key === 'Escape') close()
}

function close() {
  emit('close')
}
watch(
  () => form.klant,
  async (newKlantId) => {
    if (!newKlantId) return

    const klant = klanten.value.find(k => k._id === newKlantId)
    if (!klant) return

    if (klant.leverAdressen?.length > 1) {
      beschikbareAdressen.value = klant.leverAdressen
      showAdresModal.value = true
    } else if (klant.leverAdressen?.length === 1) {
      form.leverAdres = klant.leverAdressen[0]._id
    } else {
      // geen leveradres → fallback naar factuuradres
      form.leverAdres = klant.factuurAdres?._id || null
    }
  }
)
async function submitBoeking() {
  if (!form.leverAdres) {
    message.value = 'Kies eerst een leveradres'
    error.value = true
    return
  }

  // einddatum automatisch 5 jaar later indien leeg
  if (!form.eindDatum) {
    const begin = new Date(form.beginDatum)
    begin.setFullYear(begin.getFullYear() + 5)
    form.eindDatum = begin.toISOString().split('T')[0] // yyyy-mm-dd
  }

  try {
    // Verstuur het object rechtstreeks, geen JSON.stringify
    await boekingApi.add(JSON.stringify(form))

    message.value = 'Boeking succesvol aangemaakt!'
    error.value = false
    emit('update')
    setTimeout(() => close(), 800)
  } catch (err) {
    // Pak message van JSON of gewone Error
    try {
      const jsonErr = JSON.parse(err.message)
      message.value = jsonErr.message || 'Er is een fout opgetreden.'
    } catch {
      message.value = err.message || 'Er is een fout opgetreden.'
    }
    error.value = true
  }
}
async function getKlanten() {
  try {
    const data = await klantApi.list()
    klanten.value = Array.isArray(data) ? data : (data.items ?? [])
  } catch (e) {
    console.error(e)
  }
}
</script>

<style scoped>
/* Overlay achtergrond */
/* Overlay achtergrond */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5); /* subtiele donkere overlay */
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

/* Modal container */
.modal {
  background: #fff;
  padding: 2rem;
  border-radius: 12px;
  width: 90%;
  max-width: 500px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  animation: fadeIn 0.3s ease-out;
  position: relative;
}

/* Header */
.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.modal-header h2 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 600;
  color: #333;
}

/* Close button */
.close-btn {
  background: none;
  border: none;
  font-size: 1.3rem;
  cursor: pointer;
  color: #888;
  transition: color 0.2s;
}

.close-btn:hover {
  color: #4f46e5;
}

/* Form groups */
.form-group {
  display: flex;
  flex-direction: column;
  margin-bottom: 1rem;
}

.form-group label {
  margin-bottom: 0.3rem;
  font-size: 0.9rem;
  color: #555;
}

.form-group input,
.form-group select {
  padding: 0.5rem 0.7rem;
  font-size: 1rem;
  border: 1px solid #ddd;
  border-radius: 8px;
  transition: border-color 0.2s;
}

.form-group input:focus,
.form-group select:focus {
  outline: none;
  border-color: #4f46e5;
  box-shadow: 0 0 0 2px rgba(79, 70, 229, 0.2);
}

/* Footer buttons */
.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  margin-top: 1.5rem;
}

.btn-primary {
  background-color: #3498db;
  color: #fff;
  border: none;
  padding: 0.6rem 1.2rem;
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.btn-primary:hover {
  background-color: #2c7db3; /* moderne blauwe kleur */
  color: #fff;
}

.btn-cancel {
  background-color: #f3f4f6;
  color: #333;
  border: none;
  padding: 0.6rem 1.2rem;
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.btn-cancel:hover {
  background-color: #e5e7eb;
}

/* Message styling */
p {
  margin-top: 1rem;
  font-size: 0.9rem;
}

p.error {
  color: #dc2626;
}

/* Fade-in animatie */
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
