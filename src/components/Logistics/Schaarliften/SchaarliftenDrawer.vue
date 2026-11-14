<template>
  <BaseDrawer :show="show" :title="model?.id ? 'Hoogtewerker bewerken' : 'Hoogtewerker toevoegen'" @close="close">
    <form id="hoogtewerker-form" class="lift-form" @submit.prevent="handleSubmit">
      <div class="info-block">
        <label for="lift-nummer">Nummer *</label>
        <input id="lift-nummer" v-model="form.nummer" type="text" placeholder="Bijv. LFT-001" required :disabled="saving" />
      </div>
      <div class="info-block type-block">
        <label for="lift-type">Type *</label>
        <div class="type-select-wrapper">
          <select id="lift-type" v-model="form.machineTypeId" required :disabled="saving || loadingTypes || creatingType">
            <option disabled value="">Selecteer een type</option>
            <option v-for="type in types" :key="type.id" :value="type.id">
              {{ type.naam }} ({{ type.type }})
            </option>
          </select>
          <button type="button" class="btn-add" :disabled="saving || creatingType" @click="showTypeForm = !showTypeForm">+</button>
        </div>
        <p v-if="loadingTypes" role="status">Types laden…</p>
        <div v-if="showTypeForm" class="new-type-form">
          <input v-model="newType.naam" type="text" placeholder="Naam type" :disabled="creatingType" />
          <select v-model="newType.type" :disabled="creatingType">
            <option value="Knikarm">Knikarm</option>
            <option value="Schaarlift">Schaarlift</option>
          </select>
          <button type="button" class="btn-save-type" :disabled="creatingType || saving" @click="addType">
            {{ creatingType ? 'Bezig…' : 'Type opslaan' }}
          </button>
        </div>
      </div>
      <div class="info-block">
        <label for="lift-serie">Serienummer</label>
        <input id="lift-serie" v-model="form.serienummer" type="text" :disabled="saving" />
      </div>
      <div class="info-block">
        <label for="lift-bouwjaar">Bouwjaar</label>
        <input id="lift-bouwjaar" v-model.number="form.bouwjaar" type="number" step="1" :disabled="saving" />
      </div>
      <div class="info-block">
        <label for="lift-platform">Platformhoogte (m) *</label>
        <input id="lift-platform" v-model.number="form.platformhoogte" type="number" min="0" step="any" required :disabled="saving" />
      </div>
      <div class="info-block">
        <label for="lift-werkhoogte">Werkhoogte (m) *</label>
        <input id="lift-werkhoogte" v-model.number="form.werkhoogte" type="number" min="0" step="any" required :disabled="saving" />
      </div>
      <div class="info-block">
        <label for="lift-keuring">Keuringsdatum</label>
        <input id="lift-keuring" v-model="form.keuringDatum" type="date" :disabled="saving" />
      </div>
      <div class="info-block">
        <label for="lift-comment">Opmerkingen</label>
        <input id="lift-comment" v-model="form.comment" type="text" :disabled="saving" />
      </div>
      <div class="info-block">
        <label for="lift-status">Status</label>
        <select id="lift-status" v-model="form.status" :disabled="saving">
          <option value="VRIJ">Vrij</option>
          <option value="BEZET">Bezet</option>
          <option value="KAPOT">Kapot</option>
          <option value="ONGEKEURD">Ongekeurd</option>
        </select>
      </div>
      <div v-if="localError || error" class="form-error" role="alert">{{ localError || error }}</div>
    </form>
    <template #footer>
      <button type="button" class="btn btn-secondary" :disabled="saving || creatingType" @click="close">Annuleren</button>
      <button type="submit" form="hoogtewerker-form" class="btn btn-primary"
        :disabled="saving || loadingTypes || creatingType">{{ saving ? 'Opslaan…' : 'Opslaan' }}</button>
    </template>
  </BaseDrawer>
</template>

<script setup>
import { reactive, watch, ref } from 'vue'
import BaseDrawer from '@/components/base/BaseDrawer.vue'
import { schaarliftenApi } from '@/api/schaarliften.js'

const props = defineProps({
  show: { type: Boolean, default: false },
  model: { type: Object, default: null },
  saving: Boolean,
  error: { type: String, default: '' },
})
const emit = defineEmits(['close', 'save'])
const defaults = () => ({ nummer: '', machineTypeId: '', serienummer: '', bouwjaar: '',
  platformhoogte: '', werkhoogte: '', keuringDatum: '', status: 'VRIJ', comment: '' })
const form = reactive(defaults())
const types = ref([])
const showTypeForm = ref(false)
const newType = reactive({ naam: '', type: 'Schaarlift' })
const loadingTypes = ref(false)
const creatingType = ref(false)
const localError = ref('')
let typeRequest = 0

function message(error) { return error?.response?.data?.message || error?.message || 'De aanvraag is mislukt' }

async function getTypes() {
  const request = ++typeRequest
  loadingTypes.value = true
  try {
    const response = await schaarliftenApi.getTypes()
    if (!Array.isArray(response.data)) throw new Error('Geen typeslijst onder response.data')
    if (request === typeRequest) types.value = response.data
  } catch (error) {
    if (request === typeRequest) localError.value = message(error)
  } finally {
    if (request === typeRequest) loadingTypes.value = false
  }
}

async function addType() {
  if (creatingType.value || props.saving) return
  localError.value = ''
  if (!newType.naam.trim()) { localError.value = 'Naam van het type is verplicht'; return }
  creatingType.value = true
  try {
    const response = await schaarliftenApi.createType({ naam: newType.naam.trim(), type: newType.type })
    const saved = response.data
    if (!saved?.id) throw new Error('Het aangemaakte type ontbreekt in response.data')
    if (!types.value.some((type) => type.id === saved.id)) types.value.push(saved)
    form.machineTypeId = saved.id
    newType.naam = ''
    newType.type = 'Schaarlift'
    showTypeForm.value = false
  } catch (error) { localError.value = message(error) }
  finally { creatingType.value = false }
}

watch([() => props.show, () => props.model], ([show, model]) => {
  if (!show) { typeRequest++; loadingTypes.value = false; return }
  localError.value = ''
  showTypeForm.value = false
  Object.assign(form, defaults(), model ? {
    nummer: model.nummer ?? '',
    machineTypeId: model.machineTypeId ?? '',
    serienummer: model.serienummer ?? '',
    bouwjaar: model.bouwjaar ?? '',
    platformhoogte: model.platformhoogte ?? '',
    werkhoogte: model.werkhoogte ?? '',
    keuringDatum: model.keuringDatum?.slice(0, 10) ?? '',
    status: model.status?.toUpperCase() || 'VRIJ',
    comment: model.comment ?? '',
  } : {})
  getTypes()
}, { immediate: true })

function handleSubmit() {
  if (props.saving || creatingType.value || loadingTypes.value) return
  localError.value = ''
  const platformhoogte = Number(form.platformhoogte)
  const werkhoogte = Number(form.werkhoogte)
  const bouwjaar = form.bouwjaar === '' || form.bouwjaar == null ? null : Number(form.bouwjaar)
  if (!form.nummer.trim() || !form.machineTypeId) { localError.value = 'Nummer en type zijn verplicht'; return }
  if (!Number.isFinite(platformhoogte) || platformhoogte <= 0 || !Number.isFinite(werkhoogte) || werkhoogte <= 0) {
    localError.value = 'Platformhoogte en werkhoogte moeten positief zijn'; return
  }
  if (bouwjaar != null && !Number.isInteger(bouwjaar)) { localError.value = 'Bouwjaar moet een geheel getal zijn'; return }
  emit('save', {
    nummer: form.nummer.trim(), machineTypeId: form.machineTypeId,
    serienummer: form.serienummer.trim() || null, bouwjaar, platformhoogte, werkhoogte,
    keuringDatum: form.keuringDatum || null, status: form.status, comment: form.comment.trim() || null,
  })
  // De parent sluit pas na een geslaagde API-response; invoer blijft staan bij fouten.
}

function close() { if (!props.saving && !creatingType.value) emit('close') }
</script>
<style scoped>
.info-block {
  display: flex;
  flex-direction: column;
  margin-bottom: 15px;
}
.info-block label {
  font-size: 13px;
  color: #6b7280;
  margin-bottom: 5px;
}
.info-block input,
.info-block select {
  padding: 8px 10px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 14px;
}

.type-block .type-select-wrapper {
  display: flex;
  gap: 8px;
  align-items: center;
}
.type-block .btn-add {
  padding: 4px 8px;
  border-radius: 6px;
  background-color: #3b82f6;
  color: white;
  border: none;
  cursor: pointer;
}
.type-block .btn-add:hover {
  background-color: #2563eb;
}

.new-type-form {
  display: flex;
  gap: 8px;
  margin-top: 8px;
  align-items: center;
}
.new-type-form input,
.new-type-form select {
  flex: 1;
}
.new-type-form .btn-save-type {
  padding: 6px 12px;
  border-radius: 6px;
  background-color: #10b981;
  color: white;
  border: none;
  cursor: pointer;
}
.new-type-form .btn-save-type:hover {
  background-color: #059669;
}

.btn {
  padding: 10px 15px;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  font-weight: 600;
}
.btn-primary {
  background-color: #3b82f6;
  color: white;
}
.btn-primary:hover {
  background-color: #2563eb;
}
.btn-secondary {
  background-color: #e5e7eb;
  color: #111827;
}
.btn-secondary:hover {
  background-color: #d1d5db;
}
</style>


<style scoped>
.form-error { padding: 12px; border-radius: 8px; background: #fee2e2; color: #991b1b; }
button:disabled { opacity: 0.6; cursor: wait; }
</style>

<style scoped>
.info-block {
  display: flex;
  flex-direction: column;
  margin-bottom: 15px;
}
.info-block label {
  font-size: 13px;
  color: #6b7280;
  margin-bottom: 5px;
}
.info-block input,
.info-block select {
  padding: 8px 10px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 14px;
}

.type-block .type-select-wrapper {
  display: flex;
  gap: 8px;
  align-items: center;
}
.type-block .btn-add {
  padding: 4px 8px;
  border-radius: 6px;
  background-color: #3b82f6;
  color: white;
  border: none;
  cursor: pointer;
}
.type-block .btn-add:hover {
  background-color: #2563eb;
}

.new-type-form {
  display: flex;
  gap: 8px;
  margin-top: 8px;
  align-items: center;
}
.new-type-form input,
.new-type-form select {
  flex: 1;
}
.new-type-form .btn-save-type {
  padding: 6px 12px;
  border-radius: 6px;
  background-color: #10b981;
  color: white;
  border: none;
  cursor: pointer;
}
.new-type-form .btn-save-type:hover {
  background-color: #059669;
}

.btn {
  padding: 10px 15px;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  font-weight: 600;
}
.btn-primary {
  background-color: #3b82f6;
  color: white;
}
.btn-primary:hover {
  background-color: #2563eb;
}
.btn-secondary {
  background-color: #e5e7eb;
  color: #111827;
}
.btn-secondary:hover {
  background-color: #d1d5db;
}
</style>
