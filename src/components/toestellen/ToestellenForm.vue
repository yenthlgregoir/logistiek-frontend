<template>
  <div class="modal-overlay" @click.self="$emit('cancel')">
    <div class="modal">
      <!-- Header -->
      <div class="modal-header">
        <h2>{{ isEdit ? 'Toestel Bewerken' : 'Toestel Toevoegen' }}</h2>
        <button class="close-btn" @click="$emit('cancel')">✕</button>
      </div>

      <!-- Formulier -->
      <form @submit.prevent="submit">
        <!-- Type toestel -->
        <div class="form-group">
          <label>Type toestel</label>
          <div class="type-select-wrapper">
            
              <template v-if="addingType">
                <input v-model="localForm.newType" placeholder="Nieuw type invoeren" />
                <button type="button" class="btn-small cancel" @click="cancelNewType">❌</button>
              </template>
              <template v-else>
                <select v-model="localForm.type" required>
                  <option disabled value="">Selecteer type</option>
                  <option v-for="type in types" :key="type._id" :value="type._id">
                    {{ type.naam }}
                  </option>
                </select>
                <button type="button" class="btn-small" @click="addingType = true">➕</button>
              </template>
          </div>
        </div>

        <!-- Nummerplaat -->
        <div class="form-group">
          <label>Nummerplaat</label>
          <input v-model="localForm.nrplaat" placeholder="Bv: 1-ABC-123" />
        </div>

        <!-- Ref -->
        <div class="form-group">
          <label>Volgnummer</label>
          <input v-model="localForm.Ref" required />
        </div>

        <!-- Chasisnummer -->
        <div class="form-group">
          <label>Identificatie</label>
          <input v-model="localForm.chasisnummer" />
        </div>

        <!-- Klant -->
        <div class="form-group">
          <label>Klant</label>
          <select v-model="localForm.klant">
            <option disabled value="">Selecteer klant</option>
            <option value=null>Geen klant geselecteerd</option>
            <option v-for="klant in klanten" :key="klant._id" :value="klant._id">
              {{ klant.naam }}
            </option>
          </select>
        </div>

        <div v-if="isEdit" class="form-group">
          <label>Status</label>
          <select v-model="localForm.status.statusType" class= "select" :class="localForm.status.statusType">
            <option>
              Actief
            </option>
            <option>
              Kapot
            </option>
          </select>
        </div>

        <!-- Knoppen -->
        <div class="modal-footer">
          <button type="button" class="btn-secondary" @click="$emit('cancel')">Annuleren</button>
          <button type="submit" class="btn-primary">{{ isEdit ? 'Opslaan' : 'Toevoegen' }}</button>
        </div>
      </form>

      <!-- Eventuele foutmelding -->
      <p v-if="message" :class="{ error: error }">{{ message }}</p>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref, watch, computed } from 'vue'

const props = defineProps({
  form: Object,
  klanten: Array,
  types: Array,
  isEdit: Boolean,
})

const emit = defineEmits(['save', 'cancel'])

const localForm = reactive({
  type: '',
  newType: '',
  nrplaat: '',
  Ref: '',
  chasisnummer: '',
  klant: null,
  status: '',
})

const addingType = ref(false)
const message = ref('')
const error = ref(false)

watch(
  () => props.form,
  (val) => {
    if (val) Object.assign(localForm, val)
  },
  { immediate: true }
)

const typeName = computed(() => {
  const typeObj = props.types.find((t) => t._id === localForm.type)
  return typeObj?.naam || localForm.type || ''
})

function cancelNewType() {
  addingType.value = false
  localForm.newType = ''
}

function submit() {
  if (!props.isEdit && addingType.value && localForm.newType.trim() !== '') {
    localForm.type = localForm.newType.trim()
  }

  const cleanedForm = {}
  Object.entries(localForm).forEach(([key, value]) => {
    if (typeof value === 'string') {
      const trimmed = value.trim()
      cleanedForm[key] = trimmed === '' ? undefined : trimmed
    } else if (value === null) {
      cleanedForm[key] = undefined
    } else {
      cleanedForm[key] = value
    }
  })
  emit('save', cleanedForm)
  addingType.value = false
  localForm.newType = ''
}
</script>

<style scoped>
/* Overlay */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 2000;
}

/* Mdal */
.modal {
  background: #fff;
  padding: 2rem;
  border-radius: 12px;
  width: 90%;
  max-width: 500px;
  box-shadow: 0 12px 24px rgba(0,0,0,0.15);
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  animation: fadeIn 0.25s ease-out;
}
.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.modal-header h2 {
  font-size: 1.5rem;
  font-weight: 600;
  color: #111827;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.3rem;
  cursor: pointer;
  color: #888;
  transition: color 0.2s;
}
.close-btn:hover {
  color: #4f46e5;
}

/* Form groups */
.form-group {
  display: flex;
  flex-direction: column;
  margin-bottom: 1rem;
}

label {
  font-size: 0.9rem;
  font-weight: 500;
  color: #6b7280;
  margin-bottom: 0.25rem;
}

input,
select {
  padding: 0.6rem 0.9rem;
  font-size: 1rem;
  border-radius: 10px;
  border: 1px solid #d1d5db;
  background: #f9fafb;
  transition: all 0.2s;
}

input:focus,
select:focus {
  outline: none;
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37,99,235,0.15);
  background: #fff;
}

/* Type select wrapper */
.type-select-wrapper {
  display: flex;
  gap: 8px;
  width: 100%;
}
.type-select-wrapper input,
.type-select-wrapper select {
  flex-grow: 1;
}

/* Kleine knoppen naast input/select */
.btn-small {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  border: 1px solid #3a6ea5;
  background: #5b9bd5;
  color: #fff;
  font-size: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background 0.2s ease;
}
.btn-small:hover { background: #4a89c2; }
.btn-small.cancel {
  background: #ef4444;
  border-color: #c0392b;
}
.btn-small.cancel:hover { background: #dc2626; }

/* Footer knoppen */
.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  margin-top: 1.5rem;
}

.btn-primary {
  background-color: #2563eb;
  color: #fff;
  border: none;
  padding: 0.65rem 1.2rem;
  border-radius: 10px;
  font-size: 1rem;
  cursor: pointer;
  transition: background 0.2s ease;
}
.btn-primary:hover { background-color: #1d4ed8; }

.btn-secondary {
  background-color: #f3f4f6;
  color: #111827;
  border: 1px solid #d1d5db;
  padding: 0.65rem 1.2rem;
  border-radius: 10px;
  font-size: 1rem;
  cursor: pointer;
  transition: background 0.2s ease;
}
.btn-secondary:hover { background-color: #e5e7eb; }

/* Foutmelding */
p.error {
  color: #dc2626;
  margin-top: 0.5rem;
}

/* Animatie */
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-10px); }
  to { opacity: 1; transform: translateY(0); }
}
.select.Actief{
   background: #9be470;
  color: #024908;
}
.select.Kapot{
   background: #fca5a5;
  color: #7f1d1d;
}
</style>