<template>
  <ToolsDrawer
    :title="material ? 'Materiaal bewerken' : 'Materiaal toevoegen'"
    :busy="saving"
    @close="$emit('close')"
  >
    <form id="tools-material-form" class="tools-form" @submit.prevent="submit">
      <p v-if="error || localError" class="tools-error" role="alert">{{ localError || error }}</p>
      <fieldset :disabled="saving">
        <div class="tools-fields">
          <label class="tools-field full"
            >Naam *<input
              v-model.trim="form.naam"
              required
              maxlength="200"
              placeholder="Naam van het materiaal"
          /></label>
          <label class="tools-field"
            >Categorie *<input
              v-model.trim="form.categorie"
              required
              list="tools-categories"
              placeholder="Bijvoorbeeld gereedschap" /><datalist id="tools-categories">
              <option v-for="category in categories" :key="category" :value="category" /></datalist
          ></label>
          <label class="tools-field"
            >Beheerwijze<select
              v-model="form.beheerwijze"
              :disabled="!!material"
              @change="modeChanged"
            >
              <option value="INDIVIDUEEL">Afzonderlijk genummerd toestel</option>
              <option value="AANTAL">Voorraad per aantal</option>
            </select></label
          >
          <label class="tools-field"
            >Materiaalnummer {{ form.beheerwijze === 'INDIVIDUEEL' ? '*' : ''
            }}<input
              v-model.trim="form.nummer"
              :required="form.beheerwijze === 'INDIVIDUEEL'"
              placeholder="Uniek nummer"
          /></label>
          <label class="tools-field"
            >Toestand<select v-model="form.status">
              <option v-for="(label, key) in materialStatuses" :key="key" :value="key">
                {{ label }}
              </option>
            </select></label
          >
          <label class="tools-field">Merk<input v-model.trim="form.merk" /></label>
          <label class="tools-field">Model / type<input v-model.trim="form.model" /></label>
          <label class="tools-field">Serienummer<input v-model.trim="form.serienummer" /></label>
          <label class="tools-field"
            >Vaste locatie<input
              v-model.trim="form.vasteLocatie"
              placeholder="Magazijn of vestiging"
          /></label>
          <label class="tools-field"
            >Totaal aantal<input
              v-model.number="form.totaalAantal"
              type="number"
              min="0"
              step="1"
              :readonly="!!material || form.beheerwijze === 'INDIVIDUEEL'"
              required
            /><small v-if="material"
              >Wijzig aantallen via Voorraadcorrectie in de materiaalfiche.</small
            ></label
          >
          <label class="tools-field"
            >Geblokkeerd aantal<input
              v-model.number="form.geblokkeerdAantal"
              type="number"
              min="0"
              :max="form.totaalAantal"
              step="1"
              :readonly="!!material"
              required
            /><small>Onbruikbaar materiaal dat niet mag worden uitgeleend.</small></label
          >
        </div>
        <section class="tools-section">
          <h3>Aanvullende eigenschappen</h3>
          <p class="tools-muted">Voeg bijvoorbeeld draagvermogen, hoogte of vermogen toe.</p>
          <div class="tools-lines">
            <div v-for="(attribute, index) in attributes" :key="index" class="tools-attributes">
              <label class="tools-field"
                >Eigenschap<input v-model.trim="attribute.key" placeholder="Hoogte" /></label
              ><label class="tools-field"
                >Waarde<input v-model.trim="attribute.value" placeholder="4 m" /></label
              ><button
                class="tool-btn"
                type="button"
                :aria-label="'Eigenschap ' + (index + 1) + ' verwijderen'"
                @click="attributes.splice(index, 1)"
              >
                ×
              </button>
            </div>
          </div>
          <button
            class="tool-btn"
            type="button"
            style="margin-top: 12px"
            @click="attributes.push({ key: '', value: '' })"
          >
            Eigenschap toevoegen
          </button>
        </section>
        <label class="tools-field">Opmerking<textarea v-model.trim="form.opmerking" /></label>
      </fieldset>
    </form>
    <template #footer
      ><button class="tool-btn" :disabled="saving" @click="$emit('close')">Annuleren</button
      ><button class="tool-btn primary" type="submit" form="tools-material-form" :disabled="saving">
        {{ saving ? 'Opslaan…' : 'Materiaal opslaan' }}
      </button></template
    >
  </ToolsDrawer>
</template>
<script setup>
import { ref, reactive, watch } from 'vue'
import ToolsDrawer from './ToolsDrawer.vue'
import { materialStatuses, whole } from '@/utils/uitleen'
const props = defineProps({
  material: { type: Object, default: null },
  categories: { type: Array, default: () => [] },
  saving: Boolean,
  error: String,
})
const emit = defineEmits(['close', 'save'])
const form = reactive({})
const attributes = ref([])
const localError = ref('')
watch(
  () => props.material,
  (value) => {
    Object.assign(form, {
      naam: '',
      categorie: '',
      nummer: '',
      merk: '',
      model: '',
      serienummer: '',
      vasteLocatie: '',
      beheerwijze: 'INDIVIDUEEL',
      status: 'ACTIEF',
      totaalAantal: 1,
      geblokkeerdAantal: 0,
      opmerking: '',
      ...(value ?? {}),
    })
    attributes.value = Object.entries(value?.eigenschappen ?? {}).map(([key, value]) => ({
      key,
      value,
    }))
    localError.value = ''
  },
  { immediate: true },
)
function modeChanged() {
  if (form.beheerwijze === 'INDIVIDUEEL') {
    form.totaalAantal = 1
    form.geblokkeerdAantal = Math.min(Number(form.geblokkeerdAantal) || 0, 1)
  }
}
function submit() {
  localError.value = ''
  if (
    !whole(form.totaalAantal) ||
    !whole(form.geblokkeerdAantal) ||
    form.geblokkeerdAantal > form.totaalAantal
  ) {
    localError.value = 'Vul geldige volledige voorraadaantallen in.'
    return
  }
  const eigenschappen = {}
  for (const attribute of attributes.value) {
    const key = attribute.key.trim()
    if (!key && !attribute.value.trim()) continue
    if (!key || Object.hasOwn(eigenschappen, key)) {
      localError.value = 'Geef elke eigenschap een unieke naam.'
      return
    }
    eigenschappen[key] = attribute.value.trim()
  }
  const value = Object.fromEntries(
    [
      'naam',
      'categorie',
      'nummer',
      'merk',
      'model',
      'serienummer',
      'vasteLocatie',
      'opmerking',
    ].map((key) => [key, form[key]?.trim() || null]),
  )
  emit('save', {
    ...value,
    beheerwijze: form.beheerwijze,
    status: form.status,
    totaalAantal: Number(form.totaalAantal),
    geblokkeerdAantal: Number(form.geblokkeerdAantal),
    eigenschappen,
  })
}
</script>
