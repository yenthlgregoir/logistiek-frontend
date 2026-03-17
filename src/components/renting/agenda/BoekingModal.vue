<template>
  <div class="modal-overlay">
    <div class="modal">
      <!-- HEADER -->
      <div class="modal-header">
        <h3>Boeking</h3>
        <button class="close-btn" @click="close">✖</button>
      </div>

      <!-- BODY -->
      <div v-if="boeking" class="modal-body">
        <!-- TOP INFO -->
        <div class="top-info">
          <div>
            <div class="title">
              {{ boeking.leverAdresDetails?.naam || boeking.klant?.naam || 'Onbekende klant' }}
            </div>
            <div class="ref">Ref: {{ boeking.ref }}</div>
          </div>
        </div>

        <!-- DETAILS GRID -->
        <div class="details-grid">
          <!-- LEVERADRES -->
          <div class="detail-card">
            <div class="card-header">
              <span>Leveradres</span>
              <button class="ghost-btn" @click="showLeveradresModal = true">Wijzigen</button>
            </div>
            <div class="card-value">
              {{ boeking.leverAdresDetails?.straat }} {{ boeking.leverAdresDetails?.huisnummer }} <br />
              {{ boeking.leverAdresDetails?.postcode }} {{ boeking.leverAdresDetails?.gemeente }}
            </div>
          </div>

          <!-- PERIODE -->
          <div class="detail-card">
            <div class="card-header">
              <span>Periode</span>
              <button class="ghost-btn" @click="showDatumAanpassen = true">Wijzigen</button>
            </div>
            <div class="card-value">
              {{ boeking.beginDatumFormatted || boeking.beginDatum }} — {{ boeking.eindDatumFormatted || boeking.eindDatum }}
            </div>
          </div>

          <!-- TOESTEL -->
          <div class="detail-card">
            <div class="card-header">
              <span>Toestel</span>
              <button class="ghost-btn" @click="$emit('assignToestel', boeking._id)">Toewijzen</button>
            </div>
            <div class="card-value">
              <template v-if="boeking.toestel">
                {{ boeking.toestel.Ref }}
              </template>
              <template v-else>
                <span class="muted">Geen toestel toegewezen</span>
              </template>
            </div>
          </div>

          <!-- TRANSPORT -->
          <div class="detail-card">
            <div class="card-header"><span>Transport</span></div>
            <div class="card-value">{{ boeking.type }}</div>
          </div>

          <!-- OPMERKINGEN -->
          <div class="detail-card opmerkingen">
            <div class="card-header">Opmerkingen:</div>
            <textarea
              v-model="boeking.comment"
              class="card-textarea"
              placeholder="Voer hier opmerkingen in"
            ></textarea>
          </div>
        </div>

        <!-- STATUS -->
        <div class="status-wrapper">
          <label>Status</label>
          <select
            v-model="localStatus"
            class="status-select"
            :class="localStatus"
            @change="updateStatus"
          >
            <option value="Aangevraagd">Aangevraagd</option>
            <option value="Bevestigd">Bevestigd</option>
            <option value="Leveren">Leveren</option>
            <option value="Geleverd">Geleverd</option>
            <option value="Opgehaald">Opgehaald door klant</option>
            <option value="Afgewerkt">Afgewerkt</option>
          </select>
          <p v-if="statusError" class="error">{{ statusError.message }}</p>
        </div>

        <!-- FOOTER -->
        <div class="modal-footer">
          <button class="toevoegen-btn" @click="save">Opslaan</button>
          <button class="btn btn-secondary download" @click="toPDF">
            <i class="fa fa-download"></i>
          </button>
          <button class="danger-btn" @click="verwijderen">Verwijderen</button>
        </div>
      </div>

      <!-- LAADSTATUS -->
      <div v-else class="modal-body">
        <p>Laden...</p>
      </div>
    </div>
  </div>

  <!-- POPUPS -->
  <ConfirmationPopup
    v-if="showConfirmAfgewerkt"
    title="Afgewerkt"
    message="Wil je de boeking afronden? De einddatum wordt dan op vandaag gezet."
    @confirm="confirmAfgewerkt"
    @cancel="cancelAfgewerkt"
  />
  <SelectLeverAdresModal
    v-if="showLeveradresModal"
    :adressen="boeking?.klant?.leverAdressen || []"
    @select="updateLeverAdres"
    @close="showLeveradresModal = false"
  />
  <DatumAanpassenModal
    v-if="showDatumAanpassen"
    :boeking="boeking"
    @close="showDatumAanpassen = false"
    @update="loadBoeking(boekingId)"
  />
</template>

<script setup>
import { ref, watch } from 'vue'
import { boekingApi } from '@/api/boeking'
import SelectLeverAdresModal from './SelectLeverAdresModal.vue'
import DatumAanpassenModal from './DatumAanpassenModal.vue'
import { uploadApi } from '@/api/upload'
import ConfirmationPopup from '@/components/popup/ConfirmationPopup.vue'

const props = defineProps({
  boekingId: String,
})

const emit = defineEmits(['close', 'update', 'assignToestel', 'verwijderen', 'save'])

const boeking = ref(null)
const localStatus = ref('')
const statusError = ref('')
const showLeveradresModal = ref(false)
const showDatumAanpassen = ref(false)
const showConfirmAfgewerkt = ref(false)
const pendingStatus = ref(null)

watch(
  () => props.boekingId,
  async (id) => {
    if (id) await loadBoeking(id)
    else boeking.value = null
  },
  { immediate: true }
)

async function updateLeverAdres(adres) {
  try {
    await boekingApi.update(boeking.value._id, { leverAdres: adres._id })
    boeking.value.leverAdresDetails = { ...adres }
    showLeveradresModal.value = false
    emit('update')
  } catch (err) {
    console.error('Fout bij wijzigen leveradres:', err)
    alert('Wijzigen leveradres mislukt')
  }
}

async function toPDF() {
  try {
    const blob = await uploadApi.exportBoeking(props.boekingId)
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'boekingen.pdf'
    a.click()
    window.URL.revokeObjectURL(url)
  } catch (err) {
    console.log(err)
  }
}

async function loadBoeking(id) {
  try {
    const res = await boekingApi.get(id)
    boeking.value = { ...res, comment: res.comment || '' }
    localStatus.value = boeking.value.status
    statusError.value = ''
  } catch (err) {
    console.error(err)
    boeking.value = null
  }
}

function close() {
  emit('close')
}

function verwijderen() {
  if (window.confirm('Weet je zeker dat je deze boeking wilt verwijderen? Dit kan niet ongedaan gemaakt worden.')) {
    emit('verwijderen', props.boekingId)
  }
}

function save() {
  emit('save', boeking)
}

async function updateStatus() {
  if (!props.boekingId || !boeking.value) return

  if (localStatus.value === 'Afgewerkt') {
    const beginDatum = new Date(boeking.value.beginDatum)
    const vandaag = new Date()
    
    beginDatum.setHours(0,0,0,0)
    vandaag.setHours(0,0,0,0)

    if (beginDatum > vandaag) {
      statusError.value = { message: 'Boeking kan niet op "Afgewerkt" gezet worden voor een toekomstige datum.' }
      localStatus.value = boeking.value.status
      return
    }

    // Begin datum oké → popup tonen
    pendingStatus.value = 'Afgewerkt'
    showConfirmAfgewerkt.value = true
    return
  }

  await sendStatus(localStatus.value)
}
async function sendStatus(status) {
  try {
    await boekingApi.changeState(props.boekingId, { status })
    boeking.value.status = status
    statusError.value = '' 
    emit('update')
  } catch (err) {
    localStatus.value = boeking.value.status
    statusError.value =
      err?.response?.data?.message ||
      err?.message ||
      'Fout bij wijzigen status'
  }
}
async function confirmAfgewerkt() {
  showConfirmAfgewerkt.value = false
  await sendStatus(pendingStatus.value)
}

function cancelAfgewerkt() {
  showConfirmAfgewerkt.value = false
  localStatus.value = boeking.value.status
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
  padding: 1.5rem;
z-index: 10; /* lager dan popup */  animation: fadeIn 0.25s ease-out;
}

/* =========================================
   MODAL CONTAINER
========================================= */
.modal {
  width: 95%;
  max-width: 720px;
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(14px);
  border-radius: 22px;
  padding: 32px;
  box-shadow:
    0 12px 40px rgba(0, 0, 0, 0.15),
    0 4px 12px rgba(0, 0, 0, 0.08);
  animation: slideUp 0.3s ease-out;
  font-family: "Inter", sans-serif;
  max-height: 90vh;
  overflow-y: auto;
}

/* =========================================
   HEADER
========================================= */
.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 14px;
  border-bottom: 1px solid rgba(0,0,0,0.08);
  margin-bottom: 26px;
}

.modal-header h3 {
  font-size: 24px;
  font-weight: 700;
  color: #0f172a;
  margin: 0;
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

/* =========================================
   TOP INFO
========================================= */
.top-info {
  margin-bottom: 26px;
}

.title {
  font-size: 21px;
  font-weight: 700;
  color: #111827;
  margin-bottom: 2px;
}

.ref {
  font-size: 14px;
  color: #64748b;
}

/* =========================================
   DETAILS GRID
========================================= */
.details-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 18px;
  margin-bottom: 22px;
}

/* Card component */
.detail-card {
  padding: 18px;
  background: rgba(248, 250, 252, 0.85);
  border-radius: 14px;
  border: 1px solid #e2e8f0;
  box-shadow:
    0 1px 2px rgba(0,0,0,0.04),
    0 2px 6px rgba(0,0,0,0.05);
  transition: 0.25s ease;
}

.detail-card:hover {
  transform: translateY(-2px);
  box-shadow:
    0 4px 12px rgba(0,0,0,0.12),
    0 2px 6px rgba(0,0,0,0.05);
}

/* Card header */
.card-header {
  display: flex;
  justify-content: space-between;
  font-size: 14px;
  font-weight: 600;
  color: #475569;
  margin-bottom: 8px;
}

/* Card values */
.card-value {
  font-size: 15px;
  color: #0f172a;
  font-weight: 600;
  line-height: 1.5;
}

.muted {
  color: #94a3b8;
  font-style: italic;
}

/* Full width card */
.detail-card.opmerkingen {
  grid-column: 1 / -1;
}

/* Textarea */
.card-textarea {
  width: 100%;
  min-height: 90px;
  background: white;
  border: 1px solid #d4d4d8;
  border-radius: 10px;
  padding: 12px;
  font-size: 15px;
  resize: vertical;
  transition: 0.25s ease;
  font-family: inherit;
}

.card-textarea:focus {
  border-color: #4f73ff;
  box-shadow: 0px 0px 0 4px rgba(79,115,255,0.25);
  outline: none;
}

/* =========================================
   GHOST BUTTON
========================================= */
.ghost-btn {
  font-size: 12px;
  font-weight: 600;
  color: #4f73ff;
  background: none;
  border: none;
  cursor: pointer;
}

.ghost-btn:hover {
  text-decoration: underline;
}

/* =========================================
   STATUS SELECT
========================================= */
.status-wrapper {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-top: 20px;
}

.status-wrapper label {
  font-size: 14px;
  font-weight: 600;
  color: #475569;
}

.status-select {
  padding: 12px;
  border-radius: 10px;
  border: 1px solid #cbd5e1;
  font-weight: 600;
  font-size: 14px;
  transition: 0.25s ease;
}

/* Dynamic colors */
.status-select.Aangevraagd { background: #fef3c7; }
.status-select.Bevestigd   { background: #dbeafe; }
.status-select.Leveren     { background: #fde68a; }
.status-select.Geleverd    { background: #d1fae5; }
.status-select.Opgehaald   { background: #d1fae5; }
.status-select.Afgewerkt   { background: #44f097; }

.status-select:focus {
  border-color: #4f73ff;
  box-shadow: 0 0 0 4px rgba(79,115,255,0.25);
  outline: none;
}

/* =========================================
   FOOTER BUTTONS
========================================= */
.modal-footer {
  margin-top: 32px;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.toevoegen-btn {
  padding: 9px 16px;
  border-radius: 10px;
  font-weight: 600;
  background: #4f73ff;
  color: white;
  border: none;
  cursor: pointer;
  transition: 0.25s ease;
}

.toevoegen-btn:hover {
  background: #355dff;
  box-shadow: 0 4px 14px rgba(79,115,255,0.25);
}

.download {
  background: #696d72;
  border-radius: 10px;
  padding: 9px 16px;
  border: none;
  cursor: pointer;
}

.danger-btn {
  padding: 9px 16px;
  background: #ef4444;
  border: none;
  border-radius: 10px;
  font-weight: 600;
  color: white;
  cursor: pointer;
  transition: 0.25s ease;
}

.danger-btn:hover {
  background: #dc2626;
  box-shadow: 0 4px 14px rgba(239,68,68,0.25);
}

/* =========================================
   ERRORS
========================================= */
.error {
  margin-top: 4px;
  font-size: 13px;
  color: #dc2626;
}

/* =========================================
   ANIMATIONS
========================================= */
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideUp {
  from { opacity: 0; transform: translateY(25px); }
  to   { opacity: 1; transform: translateY(0); }
}
</style>