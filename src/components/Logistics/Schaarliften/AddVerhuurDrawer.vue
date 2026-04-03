<template>
  <BaseDrawer
    :show="show"
    :title="isEditMode ? 'Verhuur' : 'Nieuwe Verhuur'"
    @close="$emit('close')"
  >
    <div class="form-container">
      <!-- Logistieke referentie -->
      <div class="info-block">
        <label>Logistieke referentie</label>
        <div v-if="isEditMode && !isEditing">
          {{ verhuurCopy.logistiekeReferentie }}
        </div>
        <input v-else v-model="verhuurCopy.logistiekeReferentie" />
      </div>

      <!-- Asset selectie -->
      <div class="info-block">
        <label>Asset</label>
        <div v-if="isEditMode && !isEditing">
          {{ verhuurCopy.assetType?.nummer }}
        </div>
        <select v-else v-model="verhuurCopy.assetType">
          <option disabled value="">Selecteer Schaarlift / Knikarm</option>
          <option value="Schaarlift">Schaarlift</option>
          <option value="Knikarm">Knikarm</option>
        </select>
      </div>

      <!-- Werkhoogte verplicht -->
      <div class="info-block">
        <label>Werkhoogte (m)</label>
        <div v-if="isEditMode && !isEditing">
          {{ verhuurCopy.werkhoogte }}
        </div>
        <input
          v-else
          v-model="verhuurCopy.werkhoogte"
          type="number"
          min="0"
          step="0.1"
          placeholder="Verplicht"
        />
      </div>

      <!-- Werf -->
      <div class="info-block">
        <label>Werf</label>
        <div v-if="isEditMode && !isEditing">
          {{ verhuurCopy.werf?.naam }}
        </div>
        <select v-else v-model="verhuurCopy.werf">
          <option disabled value="">Selecteer werf</option>
          <option v-for="w in werven" :key="w._id" :value="w">
            {{ w.naam }}
          </option>
        </select>
      </div>

      <!-- Projectleider -->
      <div class="info-block">
        <label>Projectleider</label>
        <div v-if="isEditMode && !isEditing">
          {{ verhuurCopy.projectleider?.naam }}
        </div>
        <select v-else v-model="verhuurCopy.projectleider">
          <option disabled value="">Selecteer projectleider</option>
          <option v-for="p in projectleiders" :key="p._id" :value="p">
            {{ p.naam }}
          </option>
        </select>
      </div>

      <!-- Datums -->
      <div class="info-block">
        <label>Startdatum</label>
        <input type="date" v-model="verhuurCopy.leverDatum" />
      </div>

      <div class="info-block">
        <label>Einddatum (optioneel)</label>
        <input type="date" v-model="verhuurCopy.ophaalDatum" />
      </div>

      <!-- Error -->
      <div v-if="error" class="error-box">
        {{ error }}
      </div>
    </div>

    <template #footer>
      <button class="btn btn-secondary" @click="$emit('close')">Cancel</button>
      <button class="btn btn-primary" @click="saveVerhuur" :disabled="loading">
        {{ loading ? 'Bezig...' : 'Opslaan' }}
      </button>
    </template>
  </BaseDrawer>
</template>

<script setup>
import { ref, watch } from 'vue'
import BaseDrawer from '@/components/base/BaseDrawer.vue'

const props = defineProps({
  show: Boolean,
  verhuur: Object,
  assets: Array,
  werven: Array,
  projectleiders: Array,
  error: String,
})

const emit = defineEmits(['close', 'save', 'edit'])

const isEditMode = ref(false)
const isEditing = ref(true)
const loading = ref(false)
const verhuurCopy = ref({})

watch(
  () => props.verhuur,
  (val) => {
    if (val) {
      isEditMode.value = true
      verhuurCopy.value = JSON.parse(JSON.stringify(val))
      isEditing.value = false
    } else {
      isEditMode.value = false
      resetForm()
      isEditing.value = true
    }
  },
  { immediate: true },
)

function resetForm() {
  verhuurCopy.value = {
    logistiekeReferentie: '',
    assetModel: 'Hoogtewerker',
    assetType: null,
    werf: null,
    projectleider: null,
    leverDatum: '',
    ophaalDatum: '',
    werkhoogte: '',
  }
}

async function saveVerhuur() {
  if (!verhuurCopy.value.leverDatum) return alert('Startdatum is verplicht')

  if (
    verhuurCopy.value.ophaalDatum &&
    new Date(verhuurCopy.value.ophaalDatum) <= new Date(verhuurCopy.value.leverDatum)
  )
    return alert('Einddatum moet na de startdatum liggen')

  if (!verhuurCopy.value.assetModel) return alert('Selecteer een Schaarlift of Knikarm')

  if (!verhuurCopy.value.werkhoogte) return alert('Werkhoogte is verplicht voor Schaarlift/Knikarm')

  try {
    loading.value = true

    if (isEditMode.value) {
      emit('edit', verhuurCopy.value)
    } else {
      emit('save', verhuurCopy.value)
      resetForm()
    }
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.error-box {
  background: #fee2e2;
  color: #7f1d1d;
  padding: 10px;
  border-radius: 8px;
}

.form-container {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.info-block {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.info-block label {
  font-size: 13px;
  color: #6b7280;
}

input,
select {
  padding: 8px;
  border-radius: 8px;
  border: 1px solid #d1d5db;
}
</style>
