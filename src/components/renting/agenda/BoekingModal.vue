<template>
  <div  class="modal-overlay">
    <div class="modal">
      <div class="modal-header">
        <h3>Boeking</h3>
        <button class="close-btn" @click="close">✖</button>
      </div>

      <div v-if="boeking" class="modal-body">
        <!-- KLANT EN REF -->
        <div class="line">
          <p>
            <strong>Klant</strong><br />
            {{ boeking.leverAdresDetails?.naam || 'Niet bekend' }}
          </p>

          <p>
            <strong>REF</strong><br />
            {{ boeking.ref }}
          </p>
        </div>

        <!-- ADRES -->
        <div class="line">
          <p>
            <strong>Adres</strong><br />
            {{ boeking.leverAdresDetails?.straat || '' }}
            {{ boeking.leverAdresDetails?.huisnummer || '' }},
            {{ boeking.leverAdresDetails?.postcode || '' }}
            {{ boeking.leverAdresDetails?.gemeente || '' }}
          </p>
          
<button

  class="assign-btn btn-leveradres"
  @click="showLeveradresModal = true"
>
  Leveradres wijzigen
</button>

        </div>

        <!-- PERIODE -->
        <div class="line">
          <p>
            <strong>Periode</strong><br />
            {{ boeking.beginDatumFormatted || boeking.beginDatum }} -
            {{ boeking.eindDatumFormatted || boeking.eindDatum }}
          </p>
        </div>

        <!-- TOESTEL -->
        <div class="line toestel-line">
  <div class="toestel-info">
    <strong>Toestel</strong><br />

    <template v-if="boeking.toestel">
      {{ boeking.toestel.Ref }}
    </template>

    <template v-else>
      <span class="geen-toestel">Geen toestel toegewezen</span>
    </template>
  </div>

  <button

  class="assign-btn"
  @click="$emit('assignToestel', boeking._id)"
>
  Toestel toewijzen
</button>
</div>
      
        <!-- STATUS -->
        <!-- STATUS -->
<div class="status-section">
  <label><strong>Status</strong></label>
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
  <p v-if="statusError" class="error">{{ statusError.message }}</p>
</div>
<div class="verwijderen">
  <button class="btn delete" @click="verwijderen">Verwijderen</button>
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
    console.log(adres._id)
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
    console.log(res)
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
function verwijderen(){
  emit('verwijderen' , props.boekingId);
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
p.error {
  color: #dc2626;
  font-size: 0.85rem;
  margin-top: 0.25rem;
}
.modal {
  background: #ffffff;
  width: 600px;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
  max-height: 90vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.close-btn {
  background: transparent;
  border: none;
  font-size: 20px;
  cursor: pointer;
  color: #6b7280;
}

.line {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.status-section {
  margin-top: 16px;
}

select {
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 14px;
  width: 100%;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

select:focus {
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.2);
  outline: none;
}

/* Status kleuren */
.status-select.Aangevraagd {
  background: #fef3c7;
  color: #92400e;
}

.status-select.Bevestigd {
  background: #dbeafe;
  color: #1e3a8a;
}

.status-select.Leveren {
  background: #fde68a;
  color: #78350f;
}

.status-select.Geleverd {
  background: #d1fae5;
  color: #065f46;
}
.toestel-line {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
}

.toestel-info {
  flex: 1;
}

.geen-toestel {
  color: #9ca3af;
  font-style: italic;
}

.assign-btn {
  padding: 6px 12px;
  background-color: #2563eb;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
  white-space: nowrap;
  transition: 0.2s ease;
}

.assign-btn:hover {
  background-color: #1d4ed8;
}
.btn-leveradres{
  height: 50%;
}
.delete{
  background-color: red;
}
.verwijderen{
  padding-top: 1rem;
}
</style>