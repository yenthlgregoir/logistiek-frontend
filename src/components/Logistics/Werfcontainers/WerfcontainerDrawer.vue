<template>
  <BaseDrawer
    :show="show"
    :title="model ? 'Werfcontainer Bewerken' : 'Werfcontainer Toevoegen'"
    @close="emit('close')"
  >
    <form
      ref="formElement"
      class="container-form"
      @submit.prevent="handleSubmit"
    >
      <div class="info-block">
        <label>Nummer *</label>
        <input
          v-model.trim="form.nummer"
          type="text"
          placeholder="Bijv. WC-001"
          required
        />
      </div>

      <div class="info-block type-block">
        <label>Type *</label>

        <div class="type-select-wrapper">
          <select
            v-model="form.machineTypeId"
            :disabled="loadingTypes"
            required
          >
            <option disabled value="">
              {{ loadingTypes ? 'Types laden...' : 'Selecteer type' }}
            </option>

            <option
              v-for="type in types"
              :key="type.id"
              :value="type.id"
            >
              {{ type.naam }} ({{ type.type }})
            </option>
          </select>

          <button
            type="button"
            class="btn-add"
            :disabled="savingType"
            aria-label="Nieuw type toevoegen"
            @click="showTypeForm = !showTypeForm"
          >
            +
          </button>
        </div>

        <div v-if="showTypeForm" class="new-type-form">
          <input
            v-model.trim="newType.naam"
            type="text"
            placeholder="Naam type"
            :disabled="savingType"
            @keydown.enter.prevent="addType"
          />

          <select v-model="newType.type" :disabled="savingType">
            <option value="Werfcontainer">Werfcontainer</option>
          </select>

          <button
            type="button"
            class="btn-save-type"
            :disabled="savingType || loadingTypes"
            @click="addType"
          >
            {{ savingType ? 'Opslaan...' : 'Opslaan' }}
          </button>
        </div>
      </div>

      <div class="info-block">
        <label>Entiteit *</label>

        <select v-model="form.entiteitId" required>
          <option disabled value="">Selecteer entiteit</option>

          <option
            v-for="entiteit in entiteiten"
            :key="entiteit.id"
            :value="entiteit.id"
          >
            {{ entiteit.naam }}
          </option>
        </select>
      </div>

      <div class="info-block">
        <label>Verantwoordelijke</label>
        <input
          v-model.trim="form.verantwoordelijke"
          type="text"
          placeholder="Ploeg van Tom"
        />
      </div>

      <div class="info-block">
        <label>Opmerkingen</label>
        <input
          v-model.trim="form.comment"
          type="text"
          placeholder="Opmerkingen"
        />
      </div>

      <div class="info-block">
        <label>Status *</label>

        <select v-model="form.status" required>
          <option value="VRIJ">Vrij</option>
          <option value="KAPOT">Kapot</option>
        </select>
      </div>
    </form>

    <template #footer>
      <button
        type="button"
        class="btn btn-secondary"
        @click="emit('close')"
      >
        Annuleren
      </button>

      <button
        type="button"
        class="btn btn-primary"
        :disabled="loadingTypes || savingType"
        @click="submitForm"
      >
        Opslaan
      </button>
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

const formElement = ref(null)
const types = ref([])
const loadingTypes = ref(false)
const savingType = ref(false)
const showTypeForm = ref(false)

const form = reactive({
  nummer: '',
  machineTypeId: '',
  entiteitId: '',
  status: 'VRIJ',
  verantwoordelijke: '',
  comment: '',
})

const newType = reactive({
  naam: '',
  type: 'Werfcontainer',
})

// Ondersteunt zowel een Axios-response als reeds uitgepakte data.
function getResponseData(response) {
  return response?.data ?? response
}

function showError(error, fallback) {
  console.error(error)

  const message = error?.response?.data?.message
  alert(typeof message === 'string' ? message : fallback)
}

async function getTypes() {
  loadingTypes.value = true

  try {
    const response = await werfcontainerApi.getTypes()
    const data = getResponseData(response)

    if (!Array.isArray(data)) {
      throw new Error('De API gaf geen lijst met types terug.')
    }

    types.value = data
  } catch (error) {
    types.value = []
    showError(error, 'Types ophalen is mislukt.')
  } finally {
    loadingTypes.value = false
  }
}

async function addType() {
  if (savingType.value || loadingTypes.value) return

  const naam = newType.naam.trim()

  if (!naam) {
    alert('Vul een naam voor het type in.')
    return
  }

  savingType.value = true

  try {
    const response = await werfcontainerApi.createType({
      naam,
      type: 'Werfcontainer',
    })

    const saved = getResponseData(response)

    if (!saved?.id) {
      throw new Error('De API gaf geen type met een ID terug.')
    }

    const index = types.value.findIndex((type) => type.id === saved.id)

    if (index === -1) {
      types.value.push(saved)
    } else {
      types.value[index] = saved
    }

    form.machineTypeId = saved.id
    newType.naam = ''
    newType.type = 'Werfcontainer'
    showTypeForm.value = false
  } catch (error) {
    showError(error, 'Type opslaan is mislukt.')
  } finally {
    savingType.value = false
  }
}

function resetForm() {
  Object.assign(form, {
    nummer: '',
    machineTypeId: '',
    entiteitId: '',
    status: 'VRIJ',
    verantwoordelijke: '',
    comment: '',
  })

  newType.naam = ''
  newType.type = 'Werfcontainer'
  showTypeForm.value = false
}

function fillForm(model) {
  Object.assign(form, {
    nummer: model.nummer ?? '',
    machineTypeId: model.machineTypeId ?? model.machineType?.id ?? '',
    entiteitId: model.entiteitId ?? model.entiteit?.id ?? '',
    status: String(model.status ?? 'VRIJ').trim().toUpperCase(),
    verantwoordelijke: model.verantwoordelijke ?? '',
    comment: model.comment ?? '',
  })
}

// Werkt ook wanneer het component meteen geopend wordt gemount,
// of wanneer tijdens het openen een ander model wordt geselecteerd.
watch(
  [() => props.show, () => props.model],
  ([show], previous) => {
    if (!show) return

    resetForm()

    if (props.model) {
      fillForm(props.model)
    }

    const wasOpen = previous?.[0] ?? false

    if (!wasOpen) {
      getTypes()
    }
  },
  { immediate: true },
)

function submitForm() {
  // Activeert ook de HTML-validatie vanuit de drawer-footer.
  formElement.value?.requestSubmit()
}

function handleSubmit() {
  if (loadingTypes.value || savingType.value) return

  const nummer = form.nummer.trim()

  if (!nummer || !form.machineTypeId || !form.entiteitId) {
    alert('Nummer, type en entiteit zijn verplicht.')
    return
  }

  if (!form.status) {
    alert('Selecteer een status.')
    return
  }

  emit('save', {
    ...(props.model?.id ? { id: props.model.id } : {}),
    nummer,
    machineTypeId: form.machineTypeId,
    entiteitId: form.entiteitId,
    verantwoordelijke: form.verantwoordelijke.trim(),
    status: form.status,
    comment: form.comment.trim(),
  })
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
