<template>
  <div class="detail-pane">
    <h3>Detail</h3>

    <div class="adres-row">
      <!-- Factuuradres -->
      <div class="factuuradres">
        <div class="form-group">
          <label>Naam</label>
          <input v-model="form.naam" @blur="touched.naam = true" />
          <p v-if="touched.naam && !form.naam" class="error">Naam is verplicht</p>
        </div>

        <div class="form-group">
          <label>Klantnummer</label>
          <input v-model="form.klantNummer" @blur="touched.klantNummer = true" />
          <p v-if="touched.klantNummer && !form.klantNummer" class="error">
            Klantnummer is verplicht
          </p>
        </div>

        <div class="form-group">
          <label>Telefoonnummer</label>
          <input v-model="form.telefoonnummer" />
        </div>

        <div class="form-group">
          <label>Mailadres</label>
          <input v-model="form.mailadres" />
        </div>

        <div class="form-group">
          <label>BTW-nummer</label>
          <input v-model="form.BTWnummer" />
        </div>

        <h4>Factuuradres</h4>
        <div class="form-group-inline">
          <div class="input-large">
            <label>Straat</label>
            <input v-model="form.factuurAdres.straat" />
          </div>
          <div class="input-small">
            <label>Huisnummer</label>
            <input v-model="form.factuurAdres.huisnummer" />
          </div>
        </div>

        <div class="form-group-inline">
          <div class="input-small">
            <label>Postcode</label>
            <input v-model="form.factuurAdres.postcode" />
          </div>
          <div class="input-large">
            <label>Gemeente</label>
            <input v-model="form.factuurAdres.gemeente" />
          </div>
        </div>

        <div class="buttons">
          <button class="save" :disabled="!isValid" @click="emitSave">Opslaan</button>
          <button class="cancel" @click="$emit('cancel')">Annuleren</button>
          <button class="delete" v-if="localSelected" @click="$emit('delete')">Verwijderen</button>
        </div>
      </div>

      <!-- Verticale scheidingslijn -->
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
            aria-label="Zoek leveradres op naam"
          />
          <button @click="$emit('leveradresToevoegen')" class="add-adres">+ Add</button>
        </div>

        <div class="leveradressen-container">
          <template v-if="filteredLeverAdressen.length">
            <div
              v-for="(adres, index) in filteredLeverAdressen"
              :key="adres._id || index"
              class="leveradres-card"
            >
              <div class="adres-info" @click="editLeverAdres(adres, index)">
                <strong>{{ adres.naam }}</strong>
                <div>{{ adres.straat }} {{ adres.huisnummer }}</div>
                <div>{{ adres.postcode }} {{ adres.gemeente }}</div>
              </div>

              <div style="display: flex; gap: 6px">
                <!-- delete knop: stuur het adres object en index mee -->
                <button class="edit-small" @click.stop="editLeverAdres(adres, index)">✎</button>

                <button class="delete-small" @click.stop="removeLeverAdres(adres)">✕</button>
              </div>
            </div>
          </template>
          <p v-else class="no-results">Geen resultaten voor “{{ zoekTerm }}”.</p>
        </div>
      </div>
    </div>
  </div>
  <NieuwLeveradresModal
    :show="showModal"
    :model-value="editingAdres"
    @close="showModal = false"
    @save="saveEditedAdres"
  />
</template>

<script setup>
import { reactive, ref, watch, computed } from 'vue'
import NieuwLeveradresModal from './NieuwLeveradresModal.vue'

const props = defineProps({
  form: Object,
  selectedKlant: Object,
})

const emit = defineEmits([
  'save',
  'cancel',
  'delete',
  'leveradresToevoegen',
  'update-lever-adres',
  'remove-lever-adres',
])

const touched = reactive({
  naam: false,
  klantNummer: false,
})

const localSelected = ref(props.selectedKlant)

watch(
  () => props.selectedKlant,
  (newVal) => {
    localSelected.value = newVal
  },
)

// ✅ VALIDATIE rechtstreeks op props.form
const isValid = computed(() => {
  return Boolean(props.form?.naam?.trim() && props.form?.klantNummer?.trim())
})

// Zoekterm + filter
const zoekTerm = ref('')

const filteredLeverAdressen = computed(() => {
  const q = (zoekTerm.value || '').toLowerCase().trim()
  const list = Array.isArray(props.form?.leverAdressen) ? props.form.leverAdressen : []

  if (!q) return list

  return list.filter((a) => (a?.naam || '').toLowerCase().includes(q))
})

function emitSave() {
  emit('save', { ...props.form })
}

function removeLeverAdres(adres) {
  emit('remove-lever-adres', adres)
}

const adresIndex = ref(null) // Houd bij welk adres we bewerken
const editingAdres = reactive({
  naam: '',
  straat: '',
  huisnummer: '',
  postcode: '',
  gemeente: '',
})
const showModal = ref(false)

function editLeverAdres(adres, index) {
  adresIndex.value = index
  Object.assign(editingAdres, { ...adres }) // kopie maken van geselecteerd adres
  showModal.value = true
}

// Save adres vanuit de modal
function saveEditedAdres(adres) {
  if (adresIndex.value !== null) {
    // Bestaande klant → backend update
    if (props.selectedKlant?._id) {
      // Eventueel emit naar parent om backend te updaten
      emit('update-lever-adres', {adres })
    } else {
      // Nieuwe klant → lokaal updaten
      props.form.leverAdressen[adresIndex.value] = { ...adres }
    }
  }
  showModal.value = false
  adresIndex.value = null
}
</script>

<style scoped>
/* Container voor factuur + leveradressen */
.adres-row {
  display: flex;
  gap: 20px;
  margin-bottom: 15px;
}

/* Factuuradres 70% */
.factuuradres {
  flex: 5;
  display: flex;
  flex-direction: column;
}

/* Leveradressen 30% */
.leveradressen {
  flex: 5;
  display: flex;
  flex-direction: column;
}

/* Verticale scheidingslijn */
.divider {
  width: 1px;
  background-color: #ddd;
}

/* Kleine & grote input velden */
.input-small {
  flex: 2;
}
button.edit-small {
  background: #3498db;
  color: white;
  border-radius: 6px;
  padding: 4px 8px;
  font-size: 12px;
}
button.edit-small:hover {
  background: #2774a7;
}
.input-large {
  flex: 5;
}

/* Inline form-groups */
.form-group-inline {
  display: flex;
  gap: 10px;
  margin-bottom: 10px;
}

/* Standaard form-groups */
.form-group {
  margin-bottom: 10px;
}

/* Input styling */
input {
  width: 100%;
  padding: 6px;
  border-radius: 4px;
  border: 1px solid #ccc;
}

/* Foutmelding */
.error {
  color: red;
  font-size: 12px;
  margin-top: 4px;
}

/* Kopjes */
h4 {
  margin: 10px 0 5px;
}

/* Knoppen */
.buttons {
  margin-top: 15px;
  display: flex;
  gap: 10px;
}

button {
  padding: 10px 16px;
  border: none;
  border-radius: 6px;
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  filter: grayscale(0.2);
}

/* Opslaan knop */
button.save {
  background-color: #2ecc71;
  color: white;
}
button.save:hover {
  background-color: #27ae60;
}

/* Annuleren knop */
button.cancel {
  background-color: #95a5a6;
  color: white;
}
button.cancel:hover {
  background-color: #7f8c8d;
}

/* Verwijderen knop */
button.delete {
  background-color: #e74c3c;
  color: white;
}
button.delete:hover {
  background-color: #c0392b;
}

/* Zoekbalk */
.search-row {
  position: relative;
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  gap: 6px;
}

.search-input {
  flex: 1;
  padding-right: 30px; /* ruimte voor clear-knop */
}

.clear {
  position: absolute;
  right: 8px;
  background: transparent;
  color: #666;
  font-size: 18px;
  line-height: 1;
  padding: 0 4px;
}
.clear:hover {
  color: #000;
}

/* Leveradressen lijst */
.leveradressen-container {
  max-height: calc(80px * 7 + 8px);
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 10px;
}

/* Medium schermen / tablets: 3 kaarten */

@media (max-width: 1200px) {
  .adres-row {
    flex-direction: column;
  }

  .factuuradres,
  .leveradressen {
    flex: 1; /* volle breedte */
  }

  .divider {
    width: 100%;
    height: 1px;
    margin: 10px 0;
  }
  .leveradressen-container {
    overflow-y: visible;
  }
}
.leveradressen-container::-webkit-scrollbar {
  width: 6px;
}
.leveradressen-container::-webkit-scrollbar-thumb {
  background: #ccc;
  border-radius: 10px;
}

/* Leveradres kaart */
.leveradres-card {
  background: #f4f6f8;
  padding: 10px;
  border-radius: 8px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  min-height: 70px;
}

/* Geen resultaten melding */
.no-results {
  color: #666;
  font-size: 14px;
  padding: 8px 2px;
}

/* Kleine delete knop */
.delete-small {
  background: #e74c3c;
  color: white;
  border-radius: 6px;
  padding: 4px 8px;
  font-size: 12px;
}

/* Toevoeg knop */
.add-adres {
  background: #3498db;
  color: white;
  padding: 8px 12px;
  border-radius: 6px;
}
.add-adres:hover {
  background: #2774a7;
}
/* Detail pane styling */
.detail-pane {
  flex: 2;
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 20px;
  background: #fff;
}
</style>
