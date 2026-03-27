
<template>
  <BaseDrawer
    :show="show"
    :title="isEditMode ? 'Verhuur' : 'Nieuwe Verhuur'"
    @close="$emit('close')"
  >
    <div class="form-container">
      <!-- Reference -->
      <div class="info-block">
        <label>Logistieke referentie</label>
        <div v-if="isEditMode && !isEditing">
          {{ verhuurCopy.logistiekeReferentie }}
        </div>
        <input v-else v-model="verhuurCopy.logistiekeReferentie" />
      </div>

      <!-- Machine type -->
      <div class="info-block">
        <label>Machine type</label>
        <div v-if="isEditMode && !isEditing">
          {{ verhuurCopy.machineType?.naam }}
        </div>
        <select v-else v-model="verhuurCopy.machineType">
          <option disabled value="">Selecteer type</option>
          <option v-for="t in machineTypes" :key="t._id" :value="t">
            {{ t.naam }} ({{ t.type }})
          </option>
        </select>
      </div>

      <!-- Werkhoogte -->
      <div class="info-block">
        <label>Werkhoogte</label>
        <div v-if="isEditMode && !isEditing">
          {{ verhuurCopy.werkhoogte }}
        </div>
        <input v-else v-model="verhuurCopy.werkhoogte" type="number" />
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
<!-- ERROR -->
      <div v-if="error" class="error-box">
        {{ error.message }}
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
  machineTypes: Array,
  werven: Array,
  projectleiders: Array,
  error: String,
})

const emit = defineEmits(['close', 'save', 'edit', 'delete'])

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
  { immediate: true }
)

function resetForm() {
  verhuurCopy.value = {
    logistiekeReferentie: '',
    machineType: null,
    werf: null,
    projectleider: null,
    ophaalDatum: '',
    leverDatum: '',
    werkhoogte: ''
  }
}

async function saveVerhuur() {
  // Leverdatum is verplicht
  if (!verhuurCopy.value.leverDatum) {
    return alert('Startdatum is verplicht');
  }

  // Alleen checken als er een einddatum is
  if (
    verhuurCopy.value.ophaalDatum &&
    new Date(verhuurCopy.value.ophaalDatum) <= new Date(verhuurCopy.value.leverDatum)
  ) {
    return alert('Einddatum moet na de startdatum liggen');
  }

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

/* knoppen identiek */
.edit-btn,
.delete-btn,
.close-btn {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  border: none;
  cursor: pointer;
}

.delete-btn {
  background: #fee2e2;
}

.edit-btn {
  background: #e0e7ff;
}

.close-btn {
  background: #f3f4f6;
}
</style>