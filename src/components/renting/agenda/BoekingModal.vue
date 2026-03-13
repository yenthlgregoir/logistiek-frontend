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
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}
.close-btn {
  background: transparent;
  border: none;
  font-size: 20px;
  cursor: pointer;
  color: #6b7280;
}
.close-btn:hover {
  color: #1f2125;
}
p.error {
  color: #dc2626;
  font-size: 0.85rem;
  margin-top: 0.25rem;
}
.modal-header h3 {
  font-size: 20px;
  font-weight: 600;
}
.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 12px;
  border-bottom: 1px solid #e5e7eb;
  margin-bottom: 20px;
}
.modal {
  width: 680px;
  background: white;
  border-radius: 14px;
  padding: 28px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08), 0 2px 10px rgba(0, 0, 0, 0.06);
  max-height: 90vh;
  overflow-y: auto;
  animation: fadeIn 0.25s ease-out;
}
.top-info {
  margin-bottom: 24px;
}
.title {
  font-size: 20px;
  font-weight: 600;
  color: #111827;
}
.ref {
  font-size: 13px;
  color: #6b7280;
  margin-top: 2px;
}
.details-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}
.detail-card {
  background: #fafafa;
  border: 1px solid #ececec;
  border-radius: 10px;
  padding: 18px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  transition: box-shadow 0.2s ease;
}
.detail-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}
.detail-card.toestel {
  grid-column: 1 / -1;
}
.card-header {
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.03em;
  color: #6b7280;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.card-value {
  font-size: 15px;
  font-weight: 700;
  color: #111827;
  line-height: 1.5;
}
.muted {
  color: #9ca3af;
  font-style: italic;
}
.primary-btn {
  background: #2563eb;
  color: white;
  border: none;
  padding: 8px 14px;
  border-radius: 8px;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.15s ease;
}
.primary-btn:hover {
  background: #1d4ed8;
}
.ghost-btn {
  background: transparent;
  border: none;
  color: #2563eb;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
}
.ghost-btn:hover {
  text-decoration: underline;
}
.status-wrapper {
  margin-top: 22px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.status-wrapper label {
  font-weight: 600;
  letter-spacing: 0.03em;
  color: #6b7280;
}
.status-select {
  padding: 12px;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  font-weight: 600;
  font-size: 14px;
}
.status-select.Aangevraagd {
  background: #fef3c7;
}
.status-select.Bevestigd {
  background: #dbeafe;
}
.status-select.Leveren {
  background: #fde68a;
}
.status-select.Geleverd {
  background: #d1fae5;
}
.status-select.Opgehaald {
  background: #d1fae5;
}
.modal-footer {
  margin-top: 26px;
  display: flex;
  justify-content: flex-end;
}
.danger-btn {
  background: #ef4444;
  color: white;
  border: none;
  padding: 8px 14px;
  border-radius: 8px;
  font-size: 13px;
  cursor: pointer;
}
.danger-btn:hover {
  background: #dc2626;
}
.toevoegen-btn {
  background: #4447ef;
  color: white;
  border: none;
  padding: 8px 14px;
  border-radius: 8px;
  font-size: 13px;
  cursor: pointer;
  margin-right: 10px;
}
.error {
  font-size: 13px;
  color: #dc2626;
}
.ghost-btn,
.danger-btn,
.primary-btn,
.status-select {
  transition: background-color 0.2s ease, color 0.2s ease, box-shadow 0.2s ease;
}
.status-select:focus {
  outline: none;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.3);
  border-color: #2563eb;
}
.ghost-btn:focus,
.primary-btn:focus,
.danger-btn:focus,
.status-select:focus {
  outline: none;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.4);
  border-color: #2563eb;
}
.card-textarea {
  width: 100%;
  min-height: 80px;
  padding: 10px 12px;
  font-size: 14px;
  font-weight: 500;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  resize: vertical;
  background-color: #fafafa;
  color: #111827;
  font-family: inherit;
  box-sizing: border-box;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}
.card-textarea:focus {
  outline: none;
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.2);
}
.detail-card.opmerkingen {
  grid-column: 1 / -1;
}
.download {
  margin-right: 10px;
}
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