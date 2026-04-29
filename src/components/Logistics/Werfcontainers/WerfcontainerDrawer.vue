<template>
  <BaseDrawer :show="show" title="Werfcontainer Toevoegen / Bewerken" @close="$emit('close')">
    <!-- CONTENT -->
    <form @submit.prevent="handleSubmit" class="container-form">
      <div class="info-block">
        <label>Nummer *</label>
        <input type="text" v-model="form.nummer" placeholder="Bijv. WC-001" required />
      </div>

      <!-- TYPE SELECT + ADD -->
      <div class="info-block type-block">
        <label>Type *</label>
        <div class="type-select-wrapper">
          <select v-model="form.Type" required>
            <option v-for="type in types" :key="type._id" :value="type._id">
              {{ type.naam }} ({{ type.type }})
            </option>
          </select>
          <button type="button" class="btn-add" @click="showTypeForm = !showTypeForm">+</button>
        </div>

        <!-- INLINE TYPE FORM -->
        <div v-if="showTypeForm" class="new-type-form">
          <input type="text" v-model="newType.naam" placeholder="Naam type" />
          <select v-model="newType.type">
            <option value="Werfcontainer">Werfcontainer</option>
          </select>
          <button type="button" class="btn-save-type" @click="addType">Opslaan</button>
        </div>
      </div>
      <div class="info-block">
        <label>Entiteit</label>
        <select v-model="form.entiteit">
          <option disabled value="">Selecteer entiteit</option>
          <option v-for="entiteit in entiteiten" :key="entiteit._id" :value="entiteit._id">
            {{ entiteit.naam }}
          </option>
        </select>
      </div>
      <div class="info-block">
        <label>Verandwoordelijke</label>
        <input type="text" v-model="form.verantwoordelijke" placeholder="Ploeg van Tom" />
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
import { reactive, ref, watch } from 'vue'
import BaseDrawer from '@/components/base/BaseDrawer.vue'
import { werfcontainerApi } from '@/api/werfcontainer.js'

const props = defineProps({
  show: { type: Boolean, default: false },
  model: { type: Object, default: null },
  entiteiten: { type: Array, default: () => [] },
})

const emit = defineEmits(['close', 'save'])

/* -------------------------
   FORM STATE
------------------------- */
const form = reactive({
  nummer: '',
  Type: '',
  entiteit: '',
  status: 'Vrij',
  verantwoordelijke: '',
  comment: '',
})

/* -------------------------
   TYPES
------------------------- */
const types = reactive([])
const showTypeForm = ref(false)
const newType = reactive({ naam: '', type: 'Werfcontainer' })

async function getTypes() {
  try {
    const res = await werfcontainerApi.getTypes()
    types.splice(0, types.length, ...res)
  } catch (err) {
    console.error(err)
  }
}

async function addType() {
  if (!newType.naam || !newType.type) return alert('Naam en type verplicht!')

  try {
    const saved = await werfcontainerApi.createType({ ...newType })
    types.push(saved)
    form.Type = saved._id

    newType.naam = ''
    newType.type = 'Werfcontainer'
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
      Object.assign(form, {
        ...props.model,
        Type: props.model.Type?._id || props.model.Type || '',
        entiteit: props.model.entiteit?._id || props.model.entiteit || '',
      })
    } else {
      resetForm()
    }
  },
)
function resetForm() {
  form.nummer = ''
  form.Type = ''
  form.entiteit = ''
  ;((form.status = 'Vrij'), (form.verantwoordelijke = ''))
}

/* -------------------------
   SUBMIT
------------------------- */
function handleSubmit() {
  if (!form.nummer || !form.Type) {
    alert('Nummer en Type zijn verplicht.')
    return
  }
  console.log(form)
  emit('save', { ...form })
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

/* TYPE SELECT */
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

/* FOOTER BUTTONS */
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
