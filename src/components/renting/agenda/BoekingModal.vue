<template>
  <div class="modal-overlay">
    <div class="modal">
      <!-- HEADER -->
      <div class="modal-header">
        <h3>Boeking</h3>
        <button class="close-btn" @click="close">✖</button>
      </div>

      <!-- BODY -->
      <div v-if="boekingenStore.currentBoeking" class="modal-body">
        <div class="top-info">
          <div>
            <div class="title">
              {{
                boekingenStore.currentBoeking.leverAdresDetails?.naam ||
                boekingenStore.currentBoeking.klant?.naam ||
                'Onbekende klant'
              }}
            </div>
            <div class="ref">Ref: {{ boekingenStore.currentBoeking.ref }}</div>
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
              {{ boekingenStore.currentBoeking.leverAdresDetails?.straat }}
              {{ boekingenStore.currentBoeking.leverAdresDetails?.huisnummer }}
              <br />
              {{ boekingenStore.currentBoeking.leverAdresDetails?.postcode }}
              {{ boekingenStore.currentBoeking.leverAdresDetails?.gemeente }}
            </div>
          </div>

          <!-- PERIODE -->
          <div class="detail-card">
            <div class="card-header">
              <span>Periode</span>
              <button class="ghost-btn" @click="showDatumAanpassen = true">Wijzigen</button>
            </div>
            <div class="card-value">
              {{
                boekingenStore.currentBoeking.beginDatumFormatted ||
                boekingenStore.currentBoeking.beginDatum
              }}
              —
              {{
                boekingenStore.currentBoeking.eindDatumFormatted ||
                boekingenStore.currentBoeking.eindDatum
              }}
            </div>
          </div>

          <!-- TOESTEL -->
          <div class="detail-card">
            <div class="card-header">
              <span>Toestel</span>
              <button class="ghost-btn" @click="assignToestel(boekingenStore.currentBoeking._id)">
                Toewijzen
              </button>
            </div>
            <div class="card-value">
              <template v-if="boekingenStore.currentBoeking.toestel">
                {{ boekingenStore.currentBoeking.toestel.Ref }}
              </template>
              <template v-else>
                <span class="muted">Geen toestel toegewezen</span>
              </template>
            </div>
          </div>

          <!-- TRANSPORT -->
          <div class="detail-card">
            <div class="card-header"><span>Transport</span></div>
            <div class="card-value">{{ boekingenStore.currentBoeking.type }}</div>
          </div>

          <!-- OPMERKINGEN -->
          <div class="detail-card opmerkingen">
            <div class="card-header">Opmerkingen:</div>
            <textarea
              v-model="boekingenStore.currentBoeking.comment"
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
      :adressen="boekingenStore.currentBoeking?.klant?.leverAdressen || []"
      @select="updateLeverAdres"
      @close="showLeveradresModal = false"
    />
    <DatumAanpassenModal
      v-if="showDatumAanpassen"
      :boeking="boekingenStore.currentBoeking"
      @close="showDatumAanpassen = false"
      @update="updatePeriode"
    />
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useBoekingenStore } from '@/stores/renting/boekingen.store.js'
import SelectLeverAdresModal from './SelectLeverAdresModal.vue'
import DatumAanpassenModal from './DatumAanpassenModal.vue'
import ConfirmationPopup from '@/components/popup/ConfirmationPopup.vue'
import { uploadApi } from '@/api/upload'

const props = defineProps({ boekingId: String })
const emit = defineEmits(['close', 'update', 'verwijderen', 'save', 'assignToestel'])

const boekingenStore = useBoekingenStore()
const localStatus = ref('')
const statusError = ref('')
const pendingStatus = ref(null)
const showLeveradresModal = ref(false)
const showDatumAanpassen = ref(false)
const showConfirmAfgewerkt = ref(false)

watch(
  () => props.boekingId,
  (id) => {
    if (id) boekingenStore.loadBoeking(id)
  },
  { immediate: true },
)
watch(
  () => boekingenStore.currentBoeking,
  (b) => {
    localStatus.value = b?.status || ''
  },
  { immediate: true },
)

function close() {
  emit('close')
}
function verwijderen() {
  if (
    window.confirm(
      'Weet je zeker dat je deze boeking wilt verwijderen? Dit kan niet ongedaan gemaakt worden.',
    )
  ) {
    emit('verwijderen', boekingenStore.currentBoeking._id)
  }
}
function save() {
  emit('save', boekingenStore.currentBoeking)
}

async function updateLeverAdres(adres) {
  await boekingenStore.updateLeverAdres(adres)
  showLeveradresModal.value = false
}

async function toPDF() {
  const blob = await uploadApi.exportBoeking(boekingenStore.currentBoeking._id)
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'boekingen.pdf'
  a.click()
  window.URL.revokeObjectURL(url)
}

async function updatePeriode({ beginDatum, eindDatum }) {
  try {
    await boekingenStore.updatePeriode(boekingenStore.currentBoeking._id, beginDatum, eindDatum)
  } catch (err) {
    console.error(err)
  }
}

async function updateStatus() {
  if (!boekingenStore.currentBoeking) return

  if (localStatus.value === 'Afgewerkt') {
    const beginDatum = new Date(boekingenStore.currentBoeking.beginDatum)
    const vandaag = new Date()
    beginDatum.setHours(0, 0, 0, 0)
    vandaag.setHours(0, 0, 0, 0)

    if (beginDatum > vandaag) {
      statusError.value = {
        message: 'Boeking kan niet op "Afgewerkt" gezet worden voor een toekomstige datum.',
      }
      localStatus.value = boekingenStore.currentBoeking.status
      return
    }

    pendingStatus.value = 'Afgewerkt'
    showConfirmAfgewerkt.value = true
    return
  }

  await boekingenStore.changeStatus(localStatus.value)
}

async function confirmAfgewerkt() {
  showConfirmAfgewerkt.value = false
  await boekingenStore.changeStatus(pendingStatus.value)
}

function cancelAfgewerkt() {
  showConfirmAfgewerkt.value = false
  localStatus.value = boekingenStore.currentBoeking.status
}

function assignToestel(boekingId) {
  emit('assignToestel', boekingId)
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.55);
  backdrop-filter: blur(8px);
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 1rem;
  z-index: 1001;
  animation: fadeIn 0.25s ease-out;
}

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
  font-family: 'Inter', sans-serif;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 14px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
  margin-bottom: 26px;
}

.close-btn {
  width: 38px;
  height: 38px;
  border: none;
  background: rgba(0, 0, 0, 0.06);
  border-radius: 12px;
  cursor: pointer;
  font-size: 18px;
  color: #475569;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: 0.25s ease;
}
.close-btn:hover {
  background: #ef4444;
  color: white;
}

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

.details-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 18px;
  margin-bottom: 22px;
}
.detail-card {
  padding: 18px;
  background: rgba(248, 250, 252, 0.85);
  border-radius: 14px;
  border: 1px solid #e2e8f0;
  box-shadow:
    0 1px 2px rgba(0, 0, 0, 0.04),
    0 2px 6px rgba(0, 0, 0, 0.05);
  transition: 0.25s ease;
}
.detail-card:hover {
  transform: translateY(-2px);
  box-shadow:
    0 4px 12px rgba(0, 0, 0, 0.12),
    0 2px 6px rgba(0, 0, 0, 0.05);
}
.card-header {
  display: flex;
  justify-content: space-between;
  font-size: 14px;
  font-weight: 600;
  color: #475569;
  margin-bottom: 8px;
}
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
.detail-card.opmerkingen {
  grid-column: 1 / -1;
}
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
  box-shadow: 0 0 0 4px rgba(79, 115, 255, 0.25);
  outline: none;
}
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
.status-select.Afgewerkt {
  background: #44f097;
}
.status-select:focus {
  border-color: #4f73ff;
  box-shadow: 0 0 0 4px rgba(79, 115, 255, 0.25);
  outline: none;
}

.modal-footer {
  margin-top: 32px;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}
.toevoegen-btn,
.danger-btn,
.download {
  width: auto;
  padding: 9px 16px;
  border-radius: 10px;
  font-weight: 600;
  cursor: pointer;
  transition: 0.25s ease;
}
.toevoegen-btn {
  background: #4f73ff;
  color: white;
  border: none;
}
.toevoegen-btn:hover {
  background: #355dff;
  box-shadow: 0 4px 14px rgba(79, 115, 255, 0.25);
}
.download {
  background: #696d72;
  border: none;
  color: white;
}
.danger-btn {
  background: #ef4444;
  border: none;
  color: white;
}
.danger-btn:hover {
  background: #dc2626;
  box-shadow: 0 4px 14px rgba(239, 68, 68, 0.25);
}

.error {
  margin-top: 4px;
  font-size: 13px;
  color: #dc2626;
}

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

/* ===== RESPONSIVE ===== */
@media (max-width: 768px) {
  .modal {
    width: 95%;
    padding: 16px;
  }
  .modal-header h3 {
    font-size: 20px;
  }
  .details-grid {
    grid-template-columns: 1fr;
    gap: 12px;
  }
  .card-textarea {
    font-size: 14px;
    min-height: 80px;
  }
  .card-value {
    font-size: 14px;
    word-break: break-word;
  }
  .modal-footer {
    flex-direction: column;
    gap: 10px;
  }
  .toevoegen-btn,
  .danger-btn,
  .download,
  .status-select {
    width: 100%;
    font-size: 14px;
    padding: 10px;
  }
}
</style>
