<template>
  <div v-if="show" class="modal-overlay">
    <div class="modal">
      <h3>Nieuw Leveradres</h3>

      <div><label>Naam</label><input v-model="adres.naam" /></div>

      <div class="form-group-inline">
        <div id="modal-straat"><label>Straat</label><input v-model="adres.straat" /></div>
        <div id="modal-huisnummer">
          <label>Huisnummer</label><input v-model="adres.huisnummer" />
        </div>
      </div>

      <div class="form-group-inline">
        <div id="modal-postcode"><label>Postcode</label><input v-model="adres.postcode" /></div>
        <div id="modal-gemeente"><label>Gemeente</label><input v-model="adres.gemeente" /></div>
      </div>

      <div class="modal-buttons">
        <button class="cancel" @click="$emit('close')">Annuleren</button>
        <button class="save" @click="save">Toevoegen</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, watch, toRefs } from 'vue'

const props = defineProps({
  show: Boolean,
  modelValue: Object, // adres van parent
})

const emit = defineEmits(['close', 'save'])

// interne reactive kopie
const adres = reactive({
  _id: '',
  naam: '',
  straat: '',
  huisnummer: '',
  postcode: '',
  gemeente: '',
})

// **Sync bij openen modal**
watch(
  () => props.modelValue,
  (newVal) => {
    if (newVal) {
      // vul de reactive kopie met de parent data
      Object.keys(adres).forEach((key) => {
        adres[key] = newVal[key] || ''
      })
    }
  },
  { immediate: true, deep: true },
)

// Save functie → geef adres terug naar parent
function save() {
  emit('save', { ...adres })
}
</script>

<style scoped>
/* Kopieer hier de CSS van je modal uit de originele pagina */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}
.modal {
  background: #fff;
  padding: 2rem;
  border-radius: 12px;
  width: 90%;
  max-width: 500px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
  animation: fadeIn 0.3s ease-out;
}
.modal h3 {
  margin: 0 0 1.5rem;
  font-size: 1.5rem;
  font-weight: 600;
  color: #333;
}
.modal label {
  display: block;
  font-size: 0.9rem;
  color: #555;
  margin-bottom: 0.3rem;
}
.modal input {
  width: 100%;
  padding: 0.5rem 0.7rem;
  margin-bottom: 1rem;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 1rem;
}
.modal input:focus {
  outline: none;
  border-color: #3498db;
  box-shadow: 0 0 0 2px rgba(79, 70, 229, 0.2);
}
.form-group-inline {
  display: flex;
  gap: 1rem;
}
.form-group-inline > div {
  flex: 1;
}
.modal-buttons {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  margin-top: 1rem;
}
.modal-buttons button {
  padding: 0.6rem 1.2rem;
  font-size: 1rem;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}
.modal-buttons .save {
  background-color: #3498db;
  color: #fff;
}
.modal-buttons .save:hover {
  background-color: #2c7db3;
}
.modal-buttons .cancel {
  background-color: #f3f4f6;
  color: #333;
}
.modal-buttons .cancel:hover {
  background-color: #e5e7eb;
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

#modal-straat {
  flex: 5;
}
#modal-huisnummer {
  flex: 2;
}

#modal-gemeente {
  flex: 5;
}
#modal-postcode {
  flex: 2;
}
</style>
