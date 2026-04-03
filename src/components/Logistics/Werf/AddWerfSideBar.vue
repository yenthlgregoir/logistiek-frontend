<template>
  <BaseDrawer :show="show" title="Nieuwe Werf Aanmaken" @close="$emit('close')">
    <!-- CONTENT -->
    <form @submit.prevent="handleSubmit" class="werf-form">
      <!-- Naam -->
      <div class="info-block">
        <label>Naam</label>
        <input type="text" v-model="form.naam" placeholder="Naam van de werf" required />
      </div>

      <!-- Adres -->
      <div class="info-block">
        <label>Straat</label>
        <input type="text" v-model="form.adres.straat" placeholder="Straat" required />
      </div>
      <div class="info-block">
        <label>Huisnummer</label>
        <input type="number" v-model="form.adres.huisnummer" placeholder="Huisnummer" />
      </div>
      <div class="info-block">
        <label>Postcode</label>
        <input type="number" v-model="form.adres.postcode" placeholder="Postcode" />
      </div>
      <div class="info-block">
        <label>Gemeente</label>
        <input type="text" v-model="form.adres.gemeente" placeholder="Gemeente" />
      </div>
      <div class="info-block">
        <label>Contact persoon</label>
        <input type="text" v-model="form.contactPersoon" placeholder="Contact persoon" />
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
import { reactive, watch } from 'vue'
import BaseDrawer from '@/components/base/BaseDrawer.vue'

const props = defineProps({ show: { type: Boolean, default: false } })
const emit = defineEmits(['close', 'save'])

// Form state
const form = reactive({
  naam: '',
  adres: {
    straat: '',
    huisnummer: '',
    postcode: '',
    gemeente: '',
  },
  contactPersoon: '',
})

// Reset form bij sluiten
watch(
  () => props.show,
  (val) => {
    if (!val) {
      form.naam = ''
      form.adres = { straat: '', huisnummer: '', postcode: '', gemeente: '' }
      form.contactPersoon = ''
    }
  },
)

function handleSubmit() {
  if (!form.naam || !form.adres.straat) {
    alert('Naam en straat zijn verplicht.')
    return
  }

  emit('save', JSON.parse(JSON.stringify(form)))
  // reset form
  form.naam = ''
  form.adres = { straat: '', huisnummer: '', postcode: '', gemeente: '' }
  form.contactPersoon = ''
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
.info-block input {
  padding: 8px 10px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 14px;
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
