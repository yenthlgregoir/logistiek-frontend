<template>
  <div  class="modal-overlay">
    <div class="modal">
      <div class="modal-header">
        <h3>Boeking</h3>
        <button class="close-btn" @click="close">✖</button>
      </div>

      <div v-if="boeking" class="modal-body">

  <!-- TOP INFO -->
  <div class="top-info">

    <div>
      <div class="title">
        {{ boeking.leverAdresDetails?.naam || 'Onbekende klant' }}
      </div>

      <div class="ref">
        Ref: {{ boeking.ref }}
      </div>
    </div>

  </div>

  <!-- DETAILS -->
  <div class="details-grid">

    <!-- LEVERADRES -->
    <div class="detail-card">
      <div class="card-header">
        <span>Leveradres</span>

        <button
          class="ghost-btn"
          @click="showLeveradresModal = true"
        >
          Wijzigen
        </button>
      </div>

      <div class="card-value">
        {{ boeking.leverAdresDetails?.straat }}
        {{ boeking.leverAdresDetails?.huisnummer }} <br>

        {{ boeking.leverAdresDetails?.postcode }}
        {{ boeking.leverAdresDetails?.gemeente }}
      </div>
    </div>

    <!-- PERIODE -->
    <div class="detail-card">
      <div class="card-header">
        <span>Periode</span>
      </div>

      <div class="card-value">
        {{ boeking.beginDatumFormatted || boeking.beginDatum }}
        —
        {{ boeking.eindDatumFormatted || boeking.eindDatum }}
      </div>
    </div>

    <!-- TOESTEL -->
    <div class="detail-card">

  <div class="card-header">
    <span>Toestel</span>

    <button
      class="ghost-btn"
      @click="$emit('assignToestel', boeking._id)"
    >
      Toewijzen
    </button>
  </div>

  <div class="card-value">
    <template v-if="boeking.toestel">
      {{ boeking.toestel.Ref }}
    </template>

    <template v-else>
      <span class="muted">
        Geen toestel toegewezen
      </span>
    </template>
  </div>

</div>
<div class="detail-card">

  <div class="card-header">
    <span>Transport</span>
  </div>
  <div class="card-value">
      {{ boeking.type }}
  </div>
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
    </select>

    <p v-if="statusError" class="error">
      {{ statusError.message }}
    </p>

  </div>

  <!-- FOOTER -->
  <div class="modal-footer">
    <button
      class="danger-btn"
      @click="verwijderen"
    >
      Verwijderen
    </button>
  </div>

</div>

      <div v-else class="modal-body">
        <p>Laden...</p>
      </div>
    </div>
  </div>

  <SelectLeverAdresModal
  v-if="showLeveradresModal"
  :adressen="boeking?.klant?.leverAdressen || []"
  @select="updateLeverAdres"
  @close="showLeveradresModal = false"
/>
</template>

<script setup>
import { ref, watch } from 'vue'
import { boekingApi } from '@/api/boeking'
import SelectLeverAdresModal from './SelectLeverAdresModal.vue'

const props = defineProps({
  boekingId: String,
})

const emit = defineEmits(['close', 'update', 'assignToestel', 'verwijderen'])

const boeking = ref(null)
const localStatus = ref('')
const statusError = ref('')
const showLeveradresModal = ref(false)

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
    // Bijv. API call om leveradres in de boeking te updaten
    await boekingApi.update(boeking.value._id, { leverAdres: adres._id })

    // Update lokaal zodat de UI direct het nieuwe adres toont
    boeking.value.leverAdresDetails = { ...adres }

    showLeveradresModal.value = false
    emit('update')
  } catch (err) {
    console.error('Fout bij wijzigen leveradres:', err)
    alert('Wijzigen leveradres mislukt')
  }
}
async function loadBoeking(id) {
  try {
    const res = await boekingApi.get(id)
    boeking.value = res
    localStatus.value = res.status // Lokale status instellen
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
async function updateStatus() {
  if (!props.boekingId || !boeking.value) return

  const oldStatus = localStatus.value
  statusError.value = ''

  try {
    await boekingApi.changeState(props.boekingId, { status: localStatus.value })
    emit('update')
    // Backend accepteerde wijziging, update boeking.status
    boeking.value.status = localStatus.value
  } catch (err) {
    // Rollback naar oude status
    localStatus.value = boeking.value.status
    // Foutmelding tonen
    statusError.value =
      err?.response?.data?.message ||
      err?.message ||
      'Fout bij wijzigen status';
      statusError.value = JSON.parse(statusError.value)
      
  }

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

.modal-header h3{
  font-size:20px;
  font-weight:600;
}
.modal-header{
  display:flex;
  justify-content:space-between;
  align-items:center;
  padding-bottom:12px;
  border-bottom: 1px solid #e5e7eb; /* iets lichter dan #eee */
  margin-bottom:20px;
}
.modal {
  width: 680px;
  background: white;
  border-radius: 14px;
  padding: 28px;
  box-shadow:
    0 10px 30px rgba(0,0,0,0.08),
    0 2px 10px rgba(0,0,0,0.06);
  max-height: 90vh;
  overflow-y: auto;
}

/* HEADER */

.top-info{
  margin-bottom:24px;
}

.title{
  font-size:20px;
  font-weight:600;
  color:#111827;
}

.ref{
  font-size:13px;
  color:#6b7280;
  margin-top:2px;
}

/* GRID */

.details-grid{
  display:grid;
  grid-template-columns:1fr 1fr;
  gap:16px;
}

/* CARD */
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


.muted{
  color:#9ca3af;
  font-style:italic;
}

/* BUTTONS */

.primary-btn{
  background:#2563eb;
  color:white;
  border:none;
  padding:8px 14px;
  border-radius:8px;
  font-size:13px;
  cursor:pointer;
  transition:all .15s ease;
}

.primary-btn:hover{
  background:#1d4ed8;
}

.ghost-btn{
  background:transparent;
  border:none;
  color:#2563eb;
  font-size:12px;
  font-weight:500;
  cursor:pointer;
}

.ghost-btn:hover{
  text-decoration:underline;
}

/* STATUS */

.status-wrapper{
  margin-top:22px;
  display:flex;
  flex-direction:column;
  gap:6px;
}

.status-wrapper label {
  font-weight: 600;
  letter-spacing: 0.03em;
  color: #6b7280;
}

.status-select{
  padding:12px;
  border-radius:8px;
  border:1px solid #e5e7eb;
  font-weight:600;
  font-size:14px;
}

/* STATUS COLORS */

.status-select.Aangevraagd{
  background:#fef3c7;
}

.status-select.Bevestigd{
  background:#dbeafe;
}

.status-select.Leveren{
  background:#fde68a;
}

.status-select.Geleverd{
  background:#d1fae5;
}

/* FOOTER */

.modal-footer{
  margin-top:26px;
  display:flex;
  justify-content:flex-end;
}

.danger-btn{
  background:#ef4444;
  color:white;
  border:none;
  padding:8px 14px;
  border-radius:8px;
  font-size:13px;
  cursor:pointer;
}

.danger-btn:hover{
  background:#dc2626;
}

/* ERROR */

.error{
  font-size:13px;
  color:#dc2626;
}

.ghost-btn, .danger-btn, .primary-btn, .status-select {
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


</style>