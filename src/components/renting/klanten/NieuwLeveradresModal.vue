<template>
  <div v-if="show" class="modal-overlay">
    <div class="modal">
      <h3>Nieuw Leveradres</h3>

      <div class="form-group">
        <label>Naam</label>
        <input v-model="adres.naam" placeholder="Naam van het leveradres" />
      </div>

      <div class="form-group-inline">
        <div class="input-large">
          <label>Straat</label>
          <input v-model="adres.straat" placeholder="Straatnaam" />
        </div>
        <div class="input-small">
          <label>Huisnummer</label>
          <input v-model="adres.huisnummer" placeholder="Nr" />
        </div>
      </div>

      <div class="form-group-inline">
        <div class="input-small">
          <label>Postcode</label>
          <input v-model="adres.postcode" placeholder="1234AB" />
        </div>
        <div class="input-large">
          <label>Gemeente</label>
          <input v-model="adres.gemeente" placeholder="Gemeente" />
        </div>
      </div>

      <div class="modal-buttons">
        <button class="cancel" @click="$emit('close')">Annuleren</button>
        <button class="save" @click="save">Toevoegen</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, watch } from 'vue'

const props = defineProps({
  show: Boolean,
  modelValue: Object,
})
const emit = defineEmits(['close', 'save'])

// Interne kopie van adres
const adres = reactive({
  _id: '',
  naam: '',
  straat: '',
  huisnummer: '',
  postcode: '',
  gemeente: '',
})

// Sync met parent wanneer modal opent
watch(
  () => props.modelValue,
  (newVal) => {
    if (newVal) {
      Object.keys(adres).forEach((key) => {
        adres[key] = newVal[key] || ''
      })
    }
  },
  { immediate: true, deep: true }
)

function save() {
  emit('save', { ...adres })
}
</script>

<style scoped>
/* Overlay */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 2000;
}

/* Modal container */
.modal {
  background: #fff;
  padding: 1.5rem;
  border-radius: 12px;
  width: 90%;
  max-width: 500px;
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.15);
  animation: fadeIn 0.25s ease-out;
}

/* Titel */
.modal h3 {
  margin-bottom: 1.5rem;
  font-size: 1.5rem;
  font-weight: 600;
  color: #111827;
}

/* Form-groups */
.form-group,
.form-group-inline {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 12px;
}

/* Inline inputs */
.form-group-inline {
  flex-direction: row;
}
.input-small {
  flex: 2;
}
.input-large {
  flex: 5;
}

/* Labels */
label {
  font-size: 0.9rem;
  font-weight: 500;
  color: #6b7280;
}

/* Inputs */
input {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 10px;
  font-size: 14px;
  transition: all 0.2s ease;
}
input:focus {
  outline: none;
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.15);
}

/* Buttons container */
.modal-buttons {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 1.5rem;
}

/* Buttons */
button {
  padding: 10px 16px;
  border: none;
  border-radius: 10px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

/* Save */
button.save {
  background-color: #2563eb;
  color: #fff;
}
button.save:hover {
  background-color: #1d4ed8;
}

/* Cancel */
button.cancel {
  background-color: #f3f4f6;
  color: #111827;
}
button.cancel:hover {
  background-color: #e5e7eb;
}

/* Animatie */
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