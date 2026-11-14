<template>
  <ToolsDrawer
    :title="loan ? 'Reservering bewerken' : 'Nieuwe uitleen'"
    :busy="saving"
    width="820px"
    @close="$emit('close')"
  >
    <form id="tools-loan-form" class="tools-form" @submit.prevent="submit">
      <p v-if="error || localError" class="tools-error" role="alert">{{ localError || error }}</p>
      <p v-if="referenceError" class="tools-notice">{{ referenceError }}</p>
      <p v-if="!materials.length" class="tools-notice">
        Registreer eerst materiaal via het scherm Materiaal. Daarna kun je het hier selecteren.
      </p>
      <fieldset :disabled="saving">
        <div class="tools-fields">
          <label class="tools-field full"
            >Ontlener *<input
              v-model.trim="form.ontlener"
              required
              placeholder="Naam van de persoon of ploeg"
          /></label>
          <label class="tools-field"
            >Werf<select v-model="form.werfId">
              <option value="">Vrije locatie / geen bestaande werf</option>
              <option v-for="site in werven" :key="idOf(site)" :value="idOf(site)">
                {{ site.naam }}
              </option>
            </select></label
          >
          <label class="tools-field"
            >Projectleider<select v-model="form.projectleiderId">
              <option value="">Geen projectleider geselecteerd</option>
              <option v-for="leader in projectleiders" :key="idOf(leader)" :value="idOf(leader)">
                {{ leader.naam }}
              </option>
            </select></label
          >
          <label class="tools-field full"
            >Locatie {{ form.werfId ? '' : '*'
            }}<input
              v-model.trim="form.locatie"
              :required="!form.werfId"
              :placeholder="
                form.werfId
                  ? 'Leeg laten om de werfnaam te gebruiken'
                  : 'Werf, vestiging of andere bestemming'
              "
          /></label>
          <label class="tools-field"
            >Startdatum *<input v-model="form.startDatum" type="date" required
          /></label>
          <label class="tools-field"
            >Verwachte einddatum<input
              v-model="form.verwachteEindDatum"
              type="date"
              :min="form.startDatum"
              :disabled="form.permanent"
            /><small>Optioneel. Een einddatum registreert geen retour.</small></label
          >
          <label class="tools-checkbox"
            ><input
              v-model="form.permanent"
              type="checkbox"
              @change="form.permanent && (form.verwachteEindDatum = '')"
            />Permanente toewijzing</label
          >
        </div>
        <section class="tools-section">
          <h3>Materiaalregels</h3>
          <div class="tools-lines">
            <div v-for="(line, index) in form.regels" :key="line.key" class="tools-line">
              <label class="tools-field"
                >Materiaal {{ index + 1 }} *<select
                  v-model="line.materiaalId"
                  required
                  @change="materialChanged(line)"
                >
                  <option value="" disabled>Selecteer materiaal</option>
                  <option
                    v-for="item in materialOptions"
                    :key="idOf(item)"
                    :value="idOf(item)"
                    :disabled="
                      form.regels.some(
                        (other) => other !== line && other.materiaalId === idOf(item),
                      )
                    "
                  >
                    {{ item.nummer ? item.nummer + ' · ' : '' }}{{ item.naam
                    }}{{ item.status && item.status !== 'ACTIEF' ? ' · Niet actief' : '' }}
                  </option></select
                ><small v-if="!loan && capacity[line.materiaalId] != null"
                  >{{ capacity[line.materiaalId] }} beschikbaar in deze periode</small
                ></label
              >
              <label class="tools-field"
                >Aantal *<input
                  v-model.number="line.aantal"
                  type="number"
                  min="1"
                  step="1"
                  :max="selectedMaterial(line)?.beheerwijze === 'INDIVIDUEEL' ? 1 : undefined"
                  required
              /></label>
              <button
                class="tool-btn"
                type="button"
                :disabled="form.regels.length === 1"
                :aria-label="'Materiaalregel ' + (index + 1) + ' verwijderen'"
                @click="form.regels.splice(index, 1)"
              >
                ×
              </button>
            </div>
          </div>
          <button class="tool-btn" type="button" style="margin-top: 12px" @click="addLine">
            Materiaalregel toevoegen
          </button>
          <p v-if="loan" class="tools-muted">
            Beschikbaarheid wordt bij opslaan opnieuw gecontroleerd, met uitsluiting van deze
            reservering.
          </p>
          <p v-if="capacityError" class="tools-muted">{{ capacityError }}</p>
        </section>
        <label class="tools-field">Opmerking<textarea v-model.trim="form.opmerking" /></label>
      </fieldset>
    </form>
    <template #footer
      ><button class="tool-btn" :disabled="saving" @click="$emit('close')">Annuleren</button
      ><button
        class="tool-btn primary"
        type="submit"
        form="tools-loan-form"
        :disabled="saving || !materialOptions.length"
      >
        {{ saving ? 'Opslaan…' : loan ? 'Reservering opslaan' : 'Uitleen reserveren' }}
      </button></template
    >
  </ToolsDrawer>
</template>
<script setup>
import { reactive, ref, computed, watch, onBeforeUnmount } from 'vue'
import ToolsDrawer from './ToolsDrawer.vue'
import { materiaalApi } from '@/api/uitleen'
import { idOf, today, whole } from '@/utils/uitleen'
const props = defineProps({
  loan: { type: Object, default: null },
  materials: { type: Array, default: () => [] },
  werven: { type: Array, default: () => [] },
  projectleiders: { type: Array, default: () => [] },
  saving: Boolean,
  error: String,
  referenceError: String,
})
const emit = defineEmits(['close', 'save'])
const form = reactive({ regels: [] }),
  localError = ref(''),
  capacity = ref({}),
  capacityError = ref('')
let nextKey = 0,
  request = 0,
  timer
const materialOptions = computed(() => {
  const map = new Map(props.materials.map((item) => [idOf(item), item]))
  for (const line of props.loan?.regels ?? [])
    if (!map.has(line.materiaalId))
      map.set(line.materiaalId, {
        id: line.materiaalId,
        naam: line.materiaalNaam,
        nummer: line.materiaalNummer,
      })
  return [...map.values()]
})
function addLine() {
  form.regels.push({ key: ++nextKey, materiaalId: '', aantal: 1 })
}
function selectedMaterial(line) {
  return materialOptions.value.find((item) => idOf(item) === line.materiaalId)
}
function materialChanged(line) {
  if (selectedMaterial(line)?.beheerwijze === 'INDIVIDUEEL') line.aantal = 1
}
watch(
  () => props.loan,
  (loan) => {
    Object.assign(form, {
      ontlener: loan?.ontlener ?? '',
      werfId: loan?.werfId ?? '',
      locatie: loan?.locatie ?? '',
      projectleiderId: loan?.projectleiderId ?? '',
      startDatum: loan?.startDatum ?? today(),
      verwachteEindDatum: loan?.verwachteEindDatum ?? '',
      permanent: loan?.permanent ?? false,
      opmerking: loan?.opmerking ?? '',
      regels: (loan?.regels ?? []).map((line) => ({
        key: ++nextKey,
        materiaalId: line.materiaalId,
        aantal: line.aantal,
      })),
    })
    if (!form.regels.length) addLine()
    localError.value = ''
  },
  { immediate: true },
)
watch(
  () => [
    form.startDatum,
    form.verwachteEindDatum,
    form.permanent,
    ...form.regels.map((line) => line.materiaalId),
  ],
  () => {
    clearTimeout(timer)
    const version = ++request
    capacity.value = {}
    capacityError.value = ''
    if (
      props.loan ||
      !form.startDatum ||
      (form.verwachteEindDatum && form.verwachteEindDatum < form.startDatum)
    )
      return
    timer = setTimeout(async () => {
      const ids = [...new Set(form.regels.map((line) => line.materiaalId).filter(Boolean))]
      const results = await Promise.allSettled(
        ids.map((id) =>
          materiaalApi.beschikbaarheid(id, {
            van: form.startDatum,
            tot: form.permanent ? null : form.verwachteEindDatum || null,
          }),
        ),
      )
      if (version !== request) return
      const values = {}
      results.forEach((result, index) => {
        if (result.status === 'fulfilled') values[ids[index]] = result.value.beschikbaarAantal
      })
      capacity.value = values
      if (results.some((result) => result.status === 'rejected'))
        capacityError.value =
          'Beschikbaarheid kon niet overal geladen worden. Bij opslaan volgt opnieuw een controle.'
    }, 200)
  },
)
function submit() {
  localError.value = ''
  if (!form.startDatum || (form.verwachteEindDatum && form.verwachteEindDatum < form.startDatum)) {
    localError.value = 'Controleer de start- en einddatum.'
    return
  }
  const ids = new Set()
  for (const line of form.regels) {
    if (!line.materiaalId || !whole(line.aantal, 1) || ids.has(line.materiaalId)) {
      localError.value = 'Selecteer elk materiaal één keer en gebruik een positief volledig aantal.'
      return
    }
    if (selectedMaterial(line)?.beheerwijze === 'INDIVIDUEEL' && Number(line.aantal) !== 1) {
      localError.value = 'Een individueel toestel kan alleen met aantal 1 worden gereserveerd.'
      return
    }
    ids.add(line.materiaalId)
  }
  emit('save', {
    ontlener: form.ontlener,
    werfId: form.werfId || null,
    locatie: form.locatie || null,
    projectleiderId: form.projectleiderId || null,
    startDatum: form.startDatum,
    verwachteEindDatum: form.permanent ? null : form.verwachteEindDatum || null,
    permanent: form.permanent,
    opmerking: form.opmerking || null,
    regels: form.regels.map((line) => ({
      materiaalId: line.materiaalId,
      aantal: Number(line.aantal),
    })),
  })
}
onBeforeUnmount(() => {
  clearTimeout(timer)
  request++
})
</script>
