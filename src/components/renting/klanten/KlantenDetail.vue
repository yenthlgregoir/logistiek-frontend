<template>
  <div class="detail-pane">
    <h3>Detail</h3>

    <div class="adres-row">
      <!-- Factuuradres -->
      <div class="factuuradres">
        <div class="form-group">
          <label>Naam</label>
          <input v-model="localForm.naam" @blur="touched.naam = true" />
          <p v-if="touched.naam && !localForm.naam" class="error">Naam is verplicht</p>
        </div>

        <div class="form-group">
          <label>Klantnummer</label>
          <input v-model="localForm.klantNummer" @blur="touched.klantNummer = true" />
          <p v-if="touched.klantNummer && !localForm.klantNummer" class="error">
            Klantnummer is verplicht
          </p>
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
          <input v-model="localForm.BTWnummer" />
        </div>

        <h4>Factuuradres</h4>

        <div class="form-group-inline">
          <div class="input-large">
            <label>Straat</label>
            <input v-model="localForm.factuurAdres.straat" />
          </div>
          <div class="input-small">
            <label>Huisnummer</label>
            <input v-model="localForm.factuurAdres.huisnummer" />
          </div>
        </div>

        <div class="form-group-inline">
          <div class="input-small">
            <label>Postcode</label>
            <input v-model="localForm.factuurAdres.postcode" />
          </div>
          <div class="input-large">
            <label>Gemeente</label>
            <input v-model="localForm.factuurAdres.gemeente" />
          </div>
        </div>

        <div class="buttons">
          <button class="save" :disabled="!isValid" @click="emitSave">Opslaan</button>
          <button class="cancel" @click="$emit('cancel')">Annuleren</button>
          <button class="delete" v-if="localSelected" @click="$emit('delete')">Verwijderen</button>
        </div>
      </div>

      <div class="divider"></div>

      <!-- Leveradressen -->
      <div class="leveradressen">
        <h4>Leveradressen</h4>

        <div class="search-row">
          <input
            class="search-input"
            type="search"
            v-model="zoekTerm"
            placeholder="Zoek op naam…"
          />
          <button @click="$emit('leveradresToevoegen')" class="add-adres">+ Add</button>
        </div>

        <div class="leveradressen-container">
          <template v-if="filteredLeverAdressen.length">
            <div v-for="adres in filteredLeverAdressen" :key="adres._id" class="leveradres-card">
              <div class="adres-info" @click="onEdit(adres)">
                <strong>{{ adres.naam }}</strong>
                <div>{{ adres.straat }} {{ adres.huisnummer }}</div>
                <div>{{ adres.postcode }} {{ adres.gemeente }}</div>
              </div>

              <div class="card-buttons">
                <button class="edit-small" @click.stop="onEdit(adres)">✎</button>
                <button class="delete-small" @click.stop="onDelete(adres)">✕</button>
              </div>
            </div>
          </template>

          <p v-else class="no-results">Geen resultaten voor “{{ zoekTerm }}”.</p>
        </div>
      </div>
    </div>

    <NieuwLeveradresModal
      :show="showModal"
      :model-value="editingAdres"
      @close="closeModal"
      @save="saveEditedAdres"
    />
  </div>
</template>

<script setup>
import { reactive, ref, watch, computed } from 'vue'
import NieuwLeveradresModal from './NieuwLeveradresModal.vue'

/* ================== PROPS ================== */
const props = defineProps({
  form: {
    type: Object,
    required: true,
  },
  selectedKlant: {
    type: Object,
    default: null,
  },
})

/* ================== EMITS ================== */
const emit = defineEmits([
  'save',
  'cancel',
  'delete',
  'leveradresToevoegen',
  'update-lever-adres',
  'remove-lever-adres',
])

/* ================== LOCAL STATE ================== */
// ✅ VEILIGE clone (geen structuredClone crash)
function clone(data) {
  return JSON.parse(JSON.stringify(data))
}

const localForm = ref(clone(props.form))

watch(
  () => props.form,
  (newVal) => {
    localForm.value = clone(newVal)
  },
  { deep: true },
)

const localSelected = ref(props.selectedKlant)

watch(
  () => props.selectedKlant,
  (val) => {
    localSelected.value = val
  },
)

/* ================== VALIDATIE ================== */
const touched = reactive({
  naam: false,
  klantNummer: false,
})

const isValid = computed(() => {
  return localForm.value?.naam?.trim() && localForm.value?.klantNummer?.trim()
})

/* ================== ZOEK ================== */
const zoekTerm = ref('')

const filteredLeverAdressen = computed(() => {
  const q = zoekTerm.value.toLowerCase().trim()
  const list = localForm.value?.leverAdressen || []

  if (!q) return list

  return list.filter((a) => (a?.naam || '').toLowerCase().includes(q))
})

/* ================== ACTIONS ================== */
function emitSave() {
  emit('save', clone(localForm.value))
}

function onDelete(adres) {
  emit('remove-lever-adres', adres)
}

/* ================== MODAL ================== */
const showModal = ref(false)
const editingAdres = ref(null)
const adresIndex = ref(null)

function onEdit(adres) {
  adresIndex.value = localForm.value.leverAdressen.findIndex((a) => a === adres)
  editingAdres.value = { ...adres }
  showModal.value = true
}

function closeModal() {
  showModal.value = false
  adresIndex.value = null
}

/* ================== SAVE ADRES ================== */
function saveEditedAdres(adres) {
  if (adresIndex.value !== null) {
    if (props.selectedKlant?._id) {
      // bestaande klant → backend
      emit('update-lever-adres', { adres })
    } else {
      // nieuwe klant → lokaal aanpassen
      localForm.value.leverAdressen[adresIndex.value] = {
        ...adres,
      }
    }
  }

  closeModal()
}
</script>

<style scoped>
/* (je styles zijn al goed, ongewijzigd gelaten) */
</style>
<style scoped>
/* Container voor factuur + leveradressen */
.adres-row {
  display: flex;
  gap: 24px;
  margin-bottom: 15px;
}

/* Factuuradres 70% */
.factuuradres {
  flex: 2;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* Leveradressen 30% */
.leveradressen {
  flex: 2;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* Divider */
.divider {
  width: 1px;
  background-color: #e5e7eb;
}

/* Inputs moderniseren */
input {
  width: 100%;
  padding: 8px 12px;
  border-radius: 10px;
  border: 1px solid #d1d5db;
  font-size: 14px;
  transition: all 0.2s ease;
}
input:focus {
  outline: none;
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.15);
}

/* Form-groups */
.form-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.form-group-inline {
  display: flex;
  gap: 10px;
  margin-bottom: 10px;
}
.input-small {
  flex: 2;
}
.input-large {
  flex: 5;
}

/* Foutmelding */
.error {
  color: #ef4444;
  font-size: 12px;
  margin-top: 4px;
}

/* Kopjes */
h3,
h4 {
  margin: 10px 0;
  font-weight: 600;
}

/* Buttons */
button {
  padding: 10px 16px;
  border: none;
  border-radius: 10px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}
.buttons button {
  margin-right: 10px;
}
button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  filter: grayscale(0.2);
}
button.save {
  background: #2563eb;
  color: white;
}
button.save:hover {
  background: #1d4ed8;
}
button.cancel {
  background: #9ca3af;
  color: white;
}
button.cancel:hover {
  background: #6b7280;
}
button.delete {
  background: #ef4444;
  color: white;
}
button.delete:hover {
  background: #dc2626;
}

/* Leveradressen container modern */
.leveradressen-container {
  max-height: 400px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

/* Leveradres kaarten */
.leveradres-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #f9fafb;
  border-radius: 12px;
  padding: 12px;
  transition: all 0.15s ease;
  cursor: pointer;
}
.leveradres-card:hover {
  background: #f3f4f6;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}
.adres-info strong {
  font-weight: 600;
  font-size: 14px;
}
.card-buttons button {
  padding: 6px 10px;
  border-radius: 8px;
  font-size: 12px;
}
.edit-small {
  background: #3b82f6;
  color: white;
}
.edit-small:hover {
  background: #2563eb;
}
.delete-small {
  background: #ef4444;
  color: white;
}
.delete-small:hover {
  background: #dc2626;
}

/* Zoekbalk leveradressen */
.search-row {
  display: flex;
  gap: 6px;
}
.search-input {
  flex: 1;
  padding: 8px 12px;
  border-radius: 10px;
  border: 1px solid #d1d5db;
  font-size: 14px;
}
.add-adres {
  background: #3b82f6;
  color: white;
  padding: 8px 12px;
  border-radius: 10px;
}
.add-adres:hover {
  background: #2563eb;
}

/* Responsive: stacken bij kleinere schermen */
@media (max-width: 1024px) {
  .adres-row {
    flex-direction: column;
  }
  .divider {
    width: 100%;
    height: 1px;
    margin: 16px 0;
  }
  .leveradressen-container {
    max-height: none;
  }
}

/* Scrollbar styling */
.leveradressen-container::-webkit-scrollbar {
  width: 6px;
}
.leveradressen-container::-webkit-scrollbar-thumb {
  background: #ccc;
  border-radius: 10px;
}

/* Detail pane achtergrond en padding */
.detail-pane {
  flex: 2;
  border: 1px solid #ddd;
  border-radius: 12px;
  padding: 20px;
  background: #fff;
}
</style>
