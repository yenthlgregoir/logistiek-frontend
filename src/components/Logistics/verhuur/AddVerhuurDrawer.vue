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

      <!-- Asset Type -->
      <div class="info-block">
        <label>Type</label>
        <div v-if="isEditMode && !isEditing">
          {{ verhuurCopy.assetType }}
        </div>
        <select v-else v-model="verhuurCopy.assetType">
          <option disabled value="">Selecteer type</option>
          <option v-for="a in assets" :key="a._id" :value="a.naam">
            {{ a.naam }}
          </option>
        </select>
      </div>

      <!-- Werkhoogte (specifiek voor Hoogtewerker) -->
      <div
        v-if="verhuurCopy.assetModel === 'Hoogtewerker'"
        class="info-block"
      >
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
        />
      </div>

      <!-- Entiteit (specifiek voor WerfContainer) -->
      <div
        v-if="verhuurCopy.assetModel === 'WerfContainer'"
        class="info-block"
      >
        <label>Entiteit</label>
        <div v-if="isEditMode && !isEditing">
          {{ verhuurCopy.entiteit?.naam }}
        </div>
        <AutocompleteSelect
          v-else
          v-model="verhuurCopy.entiteit"
          :options="entiteiten"
          label-key="naam"
          placeholder="Selecteer entiteit..."
          @select="(e) => (verhuurCopy.entiteit = e)"
        />
      </div>

      <!-- Werf -->
      <div class="info-block">
        <label>Werf</label>
        <div v-if="isEditMode && !isEditing">
          {{ verhuurCopy.werf?.naam }}
        </div>
        <AutocompleteSelect
          v-else
          v-model="verhuurCopy.werf"
          :options="werven"
          label-key="naam"
          placeholder="Zoek werf..."
          @select="(w) => (verhuurCopy.werf = w)"
        />
      </div>

      <!-- Projectleider -->
      <div class="info-block">
        <label>Projectleider</label>
        <div v-if="isEditMode && !isEditing">
          {{ verhuurCopy.projectleider?.naam }}
        </div>
        <AutocompleteSelect
          v-else
          v-model="verhuurCopy.projectleider"
          :options="projectleiders"
          label-key="naam"
          placeholder="Zoek projectleider..."
          @select="(p) => (verhuurCopy.projectleider = p)"
        />
      </div>

      <!-- Datums -->
      <div class="info-block">
        <label>Startdatum</label>
        <input type="date" v-model="verhuurCopy.leverDatum" />
      </div>

      <div class="info-block">
        <label>Einddatum</label>
        <input type="date" v-model="verhuurCopy.ophaalDatum" />
      </div>

      <!-- Error -->
      <div v-if="error" class="error-box">
        {{ error }}
      </div>
    </div>

    <template #footer>
      <button class="btn btn-secondary" @click="$emit('close')">
        Cancel
      </button>
      <button class="btn btn-primary" @click="saveVerhuur" :disabled="loading">
        {{ loading ? "Bezig..." : "Opslaan" }}
      </button>
    </template>
  </BaseDrawer>
</template>

<script setup>
import { ref, watch } from "vue";
import BaseDrawer from "@/components/base/BaseDrawer.vue";
import AutocompleteSelect from "@/components/base/AutocompleteSelect.vue";

const props = defineProps({
  show: Boolean,
  verhuur: Object,
  assets: Array,
  werven: Array,
  projectleiders: Array,
  entiteiten: Array,
  error: String,
  assetModel: String,
});

const emit = defineEmits(["close", "save", "edit"]);

const isEditMode = ref(false);
const isEditing = ref(true);
const loading = ref(false);
const verhuurCopy = ref({});

// Init / edit mode
watch(
  () => props.verhuur,
  (val) => {
    if (val) {
      isEditMode.value = true;
      verhuurCopy.value = JSON.parse(JSON.stringify(val));
      isEditing.value = false;
    } else {
      isEditMode.value = false;
      resetForm();
      isEditing.value = true;
    }
  },
  { immediate: true }
);

// Reset bij model switch
watch(
  () => props.assetModel,
  () => resetForm()
);

// Reset form
function resetForm() {
  verhuurCopy.value = {
    logistiekeReferentie: "",
    assetModel: props.assetModel,
    assetType: null,
    werf: null,
    projectleider: null,
    leverDatum: "",
    ophaalDatum: "",
    werkhoogte: "",
    entiteit: null,
  };
}

// Save verhuur
async function saveVerhuur() {
  if (!verhuurCopy.value.leverDatum) {
    return alert("Startdatum is verplicht");
  }

  if (
    verhuurCopy.value.ophaalDatum &&
    new Date(verhuurCopy.value.ophaalDatum) <= new Date(verhuurCopy.value.leverDatum)
  ) {
    return alert("Einddatum moet na startdatum liggen");
  }

  if (!verhuurCopy.value.assetType) {
    return alert("Selecteer een type");
  }

  if (verhuurCopy.value.assetModel === "Hoogtewerker" && !verhuurCopy.value.werkhoogte) {
    return alert("Werkhoogte is verplicht");
  }

  if (verhuurCopy.value.assetModel === "WerfContainer" && !verhuurCopy.value.entiteit) {
    return alert("Entiteit is verplicht");
  }

  try {
    loading.value = true;

    if (isEditMode.value) {
      emit("edit", verhuurCopy.value);
    } else {
      emit("save", verhuurCopy.value);
      resetForm();
    }
  } finally {
    loading.value = false;
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