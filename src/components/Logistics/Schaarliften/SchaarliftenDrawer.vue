<template>
  <BaseDrawer :show="show" title="Schaarlift Toevoegen / Bewerken" @close="$emit('close')">
    <!-- CONTENT -->
    <form @submit.prevent="handleSubmit" class="lift-form">
      <div class="info-block">
        <label>nummer *</label>
        <input type="text" v-model="form.nummer" placeholder="Bijv. LFT-001" required />
      </div>

      <!-- TYPE SELECT + ADD -->
      <div class="info-block type-block">
        <label>type *</label>
        <div class="type-select-wrapper">
          <select v-model="form.Type" v-bind="form.Type._id" required>
            <option v-for="type in types" :key="type._id" :value="type._id">
              {{ type.naam }} ({{ type.type.toLowerCase() }})
            </option>
          </select>
          <button type="button" class="btn-add" @click="showTypeForm = !showTypeForm">+</button>
        </div>

        <!-- INLINE TYPE FORM -->
        <div v-if="showTypeForm" class="new-type-form">
          <input type="text" v-model="newType.naam" placeholder="Naam type" />
          <select v-model="newType.type">
            <option value="Knikarm">knikarm</option>
            <option value="Schaarlift">schaarlift</option>
          </select>
          <button type="button" class="btn-save-type" @click="addType">Opslaan</button>
        </div>
      </div>

      <div class="info-block">
        <label>serienummer</label>
        <input type="text" v-model="form.serienummer" placeholder="Serienummer" />
      </div>

      <div class="info-block">
        <label>bouwjaar</label>
        <input type="number" v-model="form.bouwjaar" placeholder="Bouwjaar" />
      </div>

      <div class="info-block">
        <label>platformhoogte (m) *</label>
        <input type="number" v-model="form.platformhoogte" placeholder="Bijv. 1.5" required />
      </div>

      <div class="info-block">
        <label>werkhoogte (m) *</label>
        <input type="number" v-model="form.werkhoogte" placeholder="Bijv. 12" required />
      </div>

      <div class="info-block">
        <label>keuring Datum</label>
        <input type="date" v-model="form.keuringDatum" />
      </div>
      <div class="info-block">
        <label>Opmerkingen</label>
        <input type="text" v-model="form.comment" placeholder="Opmerkingen" />
      </div>
      <div class="info-block">
        <label>status</label>
        <select v-model="form.status">
          <option value="Vrij">vrij</option>
          <option value="Kapot">kapot</option>
          <option value="Ongekeurd">ongekeurd</option>
        </select>
      </div>
    </form>

    <!-- FOOTER -->
    <template #footer>
      <button class="btn btn-secondary" @click="$emit('close')">Cancel</button>
      <button class="btn btn-primary" @click="handleSubmit">Opslaan</button>
    </template>
  </BaseDrawer>
</template>

<script setup>
import { reactive, watch, ref } from 'vue'
import BaseDrawer from '@/components/base/BaseDrawer.vue'
import { schaarliftenApi } from '@/api/schaarliften.js'

const props = defineProps({
  show: { type: Boolean, default: false },
  model: { type: Object, default: null }, // EDIT MODE
})

const emit = defineEmits(['close', 'save'])

/* -------------------------
   FORM STATE
------------------------- */
const form = reactive({
  nummer: '',
  Type: '',
  serienummer: '',
  bouwjaar: '',
  platformhoogte: '',
  werkhoogte: '',
  keuringDatum: '',
  status: 'Vrij',
})

/* -------------------------
   TYPES
------------------------- */
const types = reactive([])
const showTypeForm = ref(false)
const newType = reactive({ naam: '', type: 'Schaarlift' })

async function getTypes() {
  try {
    const res = await schaarliftenApi.getTypes()
    types.splice(0, types.length, ...res)
  } catch (err) {
    console.error(err)
  }
}

async function addType() {
  if (!newType.naam || !newType.type) return alert('Naam en type verplicht!')

  try {
    const saved = await schaarliftenApi.createType({ ...newType })
    types.push(saved)
    form.Type = saved._id

    newType.naam = ''
    newType.type = 'Schaarlift'
    showTypeForm.value = false
  } catch (err) {
    console.error(err)
  }
}

/* -------------------------
   WATCH DRAWER OPEN
------------------------- */
watch(
  () => props.show,
  (val) => {
    if (!val) return

    getTypes()

    if (props.model) {
      // ✅ FORM INVULLEN VOOR EDIT
      Object.assign(form, {
        ...props.model,
        Type: props.model.Type?._id || props.model.Type || '',
        keuringDatum: props.model.keuringDatum
          ? new Date(props.model.keuringDatum).toISOString().substr(0, 10)
          : '',
      })
    } else {
      resetForm()
    }
  },
)

function resetForm() {
  form.nummer = ''
  form.Type = ''
  form.serienummer = ''
  form.bouwjaar = ''
  form.platformhoogte = ''
  form.werkhoogte = ''
  form.keuringDatum = ''
  form.status = 'Vrij'
  form.comment = ''
}

/* -------------------------
   SUBMIT
------------------------- */
function handleSubmit() {
  if (!form.nummer || !form.Type || !form.platformhoogte || !form.werkhoogte) {
    alert('Nummer, Type, Platformhoogte en Werkhoogte zijn verplicht.')
    return
  }

  emit('save', { ...form })
  resetForm()
  emit('close')
}
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
