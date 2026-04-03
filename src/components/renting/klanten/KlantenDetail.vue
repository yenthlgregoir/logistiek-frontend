<template>
  <Transition name="drawer">
    <div v-if="show" class="drawer-wrapper">
      <div class="drawer">
        <!-- Header -->
        <div class="drawer-header">
          <h3>Detail</h3>
          <button class="close-btn" @click="$emit('close')">✕</button>
        </div>

        <!-- Content -->
        <div class="drawer-content">
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
                <button class="delete" v-if="localSelected" @click="$emit('delete')">
                  Verwijderen
                </button>
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
                  <div
                    v-for="adres in filteredLeverAdressen"
                    :key="adres._id"
                    class="leveradres-card"
                  >
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
        </div>

        <!-- Nieuw leveradres modal -->
        <NieuwLeveradresModal
          :show="showModal"
          :model-value="editingAdres"
          @close="closeModal"
          @save="saveEditedAdres"
        />
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { reactive, ref, watch, computed, onBeforeUnmount } from 'vue'
import NieuwLeveradresModal from './NieuwLeveradresModal.vue'

const props = defineProps({
  form: { type: Object, required: true },
  selectedKlant: { type: Object, default: null },
  show: { type: Boolean, default: false },
})

const emit = defineEmits([
  'save',
  'cancel',
  'delete',
  'close',
  'leveradresToevoegen',
  'update-lever-adres',
  'remove-lever-adres',
])

function clone(data) {
  return JSON.parse(JSON.stringify(data))
}

const localForm = ref(clone(props.form))
watch(
  () => props.form,
  (v) => (localForm.value = clone(v)),
  { deep: true },
)

const localSelected = ref(props.selectedKlant)
watch(
  () => props.selectedKlant,
  (v) => (localSelected.value = v),
)

const touched = reactive({ naam: false, klantNummer: false })
const isValid = computed(
  () => localForm.value?.naam?.trim() && localForm.value?.klantNummer?.trim(),
)

const zoekTerm = ref('')
const filteredLeverAdressen = computed(() => {
  const q = zoekTerm.value.toLowerCase().trim()
  const list = localForm.value?.leverAdressen || []
  return !q ? list : list.filter((a) => (a?.naam || '').toLowerCase().includes(q))
})

function emitSave() {
  emit('save', clone(localForm.value))
}
function onDelete(adres) {
  emit('remove-lever-adres', adres)
}

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
function saveEditedAdres(adres) {
  if (adresIndex.value !== null) {
    if (props.selectedKlant?._id) emit('update-lever-adres', { adres })
    else localForm.value.leverAdressen[adresIndex.value] = { ...adres }
  }
  closeModal()
}

// Lock scroll when drawer open
const lockScroll = () => (document.body.style.overflow = 'hidden')
const unlockScroll = () => (document.body.style.overflow = '')
watch(
  () => props.show,
  (val) => (val ? lockScroll() : unlockScroll()),
)
onBeforeUnmount(unlockScroll)
</script>

<style scoped>
/* WRAPPER */
.drawer-wrapper {
  position: fixed;
  top: 0;
  right: 0;
  height: 100vh;
  z-index: 1000;
}

/* DRAWER */
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

/* BUTTONS OP KAART */
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
