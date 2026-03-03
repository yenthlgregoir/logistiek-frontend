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
              <div class="adres-info">
                <strong>{{ adres.naam }}</strong>
                <div>{{ adres.straat }} {{ adres.huisnummer }}</div>
                <div>{{ adres.postcode }} {{ adres.gemeente }}</div>
              </div>
              <button class="delete-small" @click="removeLeverAdres(adres._id)">✕</button>
            </div>
          </template>
          <p v-else class="no-results">Geen resultaten voor “{{ zoekTerm }}”.</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref, watch, computed } from 'vue'

const props = defineProps({
  form: Object,
  selectedKlant: Object,
})

const emit = defineEmits(['save', 'cancel', 'delete', 'leveradresToevoegen', 'remove-lever-adres'])

const touched = reactive({
  naam: false,
  klantNummer: false,
})
const localSelected = ref(props.selectedKlant)

// Watch zodat localSelected altijd update als parent wijzigt
watch(
  () => props.selectedKlant,
  (newVal) => {
    localSelected.value = newVal
  },
)
// lokale kopie die we kunnen aanpassen
const localForm = reactive(JSON.parse(JSON.stringify(props.form)))

// geldigheid: minimaal naam + klantnummer
const isValid = computed(() => {
  return Boolean(
    localForm.naam &&
    localForm.naam.trim() &&
    localForm.klantNummer &&
    localForm.klantNummer.trim(),
  )
})

// Zoekterm + filter
const zoekTerm = ref('')

const filteredLeverAdressen = computed(() => {
  const q = (zoekTerm.value || '').toString().trim().toLowerCase()
  const list = Array.isArray(localForm.leverAdressen) ? localForm.leverAdressen : []
  if (!q) return list
  return list.filter((a) => (a?.naam || '').toString().toLowerCase().includes(q))
})

// sync met parent form
watch(
  () => props.form,
  (newVal) => {
    Object.assign(localForm, JSON.parse(JSON.stringify(newVal)))
  },
  { deep: true },
)

function emitSave() {
  emit('save', JSON.parse(JSON.stringify(localForm)))
}

function removeLeverAdres(id) {
  // emit naar parent component (id of index, afhankelijk van jouw data)
  emit('remove-lever-adres', id)
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
