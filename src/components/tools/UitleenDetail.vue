<template>
  <ToolsDrawer :title="loan.ontlener" :busy="saving" width="850px" @close="$emit('close')">
    <div class="tools-actions" style="margin-bottom: 12px">
      <ToolsStatus :value="loan.status" /><span v-if="loan.achterstallig" class="tools-badge late"
        >Te laat</span
      ><span class="tools-muted">{{ loan.referentie }}</span>
    </div>
    <p v-if="error || localError" class="tools-error" role="alert">{{ localError || error }}</p>
    <template v-if="mode === 'detail'">
      <section class="tools-section">
        <dl class="tools-detail-grid">
          <div>
            <dt>Locatie</dt>
            <dd>{{ loan.locatie || loan.werfNaam || '-' }}</dd>
          </div>
          <div>
            <dt>Projectleider</dt>
            <dd>{{ loan.projectleiderNaam || '-' }}</dd>
          </div>
          <div>
            <dt>Geplande periode</dt>
            <dd>{{ period(loan) }}</dd>
          </div>
          <div>
            <dt>Werkelijk uitgegeven</dt>
            <dd>{{ formatDate(loan.uitgegevenOp) }}</dd>
          </div>
        </dl>
      </section>
      <section class="tools-section" style="margin-top: 16px">
        <h3>Materiaal</h3>
        <BaseTable
          :items="loan.regels"
          columns="1.5fr .6fr .6fr .6fr"
          item-key="id"
          min-width="530px"
          :hover="false"
          ><template #header
            ><div>Materiaal</div>
            <div>Uitgeleend</div>
            <div>Retour</div>
            <div>Open</div></template
          ><template #row="{ item }"
            ><div>
              <strong>{{ item.materiaalNaam }}</strong
              ><span class="tools-row-sub">{{ item.materiaalNummer || 'Per aantal' }}</span>
            </div>
            <div>{{ number(item.aantal) }}</div>
            <div>{{ number(item.retourAantal) }}</div>
            <div>
              <strong>{{ number(item.openstaandAantal) }}</strong>
            </div></template
          ></BaseTable
        >
      </section>
      <p v-if="loan.opmerking" class="tools-comment">{{ loan.opmerking }}</p>
      <section v-if="loan.retouren?.length" class="tools-section" style="margin-top: 16px">
        <h3>Geregistreerde retouren</h3>
        <div
          v-for="receipt in [...loan.retouren].reverse()"
          :key="idOf(receipt)"
          class="tools-receipt"
        >
          <strong>{{ formatDate(receipt.datum) }}</strong
          ><span class="tools-row-sub">{{ receipt.geregistreerdDoor }}</span>
          <p v-for="line in receipt.regels" :key="line.regelId">
            {{ lineName(line.regelId) }}: {{ line.aantal }} retour<span v-if="line.beschadigdAantal"
              >, waarvan {{ line.beschadigdAantal }} beschadigd en geblokkeerd</span
            >
          </p>
          <p v-if="receipt.opmerking">{{ receipt.opmerking }}</p>
        </div>
      </section>
      <p class="tools-muted">
        Geregistreerd op {{ formatDate(loan.createdAt)
        }}<span v-if="loan.afgeslotenOp"> · Afgesloten op {{ formatDate(loan.afgeslotenOp) }}</span>
      </p>
    </template>
    <form
      v-else-if="mode === 'retour'"
      id="tools-return-form"
      class="tools-form"
      @submit.prevent="returnLoan"
    >
      <p class="tools-notice">
        Vul in wat werkelijk is teruggebracht. Niet teruggebrachte aantallen blijven open.
        Beschadigd materiaal wordt geblokkeerd.
      </p>
      <fieldset :disabled="saving">
        <button class="tool-btn" type="button" @click="fillAll">
          Alles nog openstaand retour nemen
        </button>
        <div style="overflow-x: auto">
          <table class="tools-return-table">
            <thead>
              <tr>
                <th>Materiaal</th>
                <th>Open</th>
                <th>Retour</th>
                <th>Beschadigd</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in returns" :key="row.regelId">
                <td>{{ row.naam }}</td>
                <td>{{ row.open }}</td>
                <td>
                  <input
                    v-model.number="row.aantal"
                    :aria-label="'Retouraantal ' + row.naam"
                    type="number"
                    min="0"
                    :max="row.open"
                    step="1"
                    required
                  />
                </td>
                <td>
                  <input
                    v-model.number="row.beschadigdAantal"
                    :aria-label="'Beschadigd aantal ' + row.naam"
                    type="number"
                    min="0"
                    :max="row.aantal"
                    step="1"
                    required
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <label class="tools-field"
          >Opmerking bij ontvangst<textarea v-model.trim="returnNote" />
        </label>
      </fieldset>
    </form>
    <form v-else id="tools-expected-form" class="tools-form" @submit.prevent="expectedReturn">
      <p class="tools-notice">
        Hier wijzig je alleen de verwachting. Het materiaal blijft uitgeleend tot je de echte retour
        registreert.
      </p>
      <fieldset :disabled="saving">
        <label class="tools-field"
          >Verwachte retourdatum<input
            v-model="expected.datum"
            type="date"
            :min="loan.startDatum"
            :disabled="expected.permanent"
          /><small>Leeg laten als de einddatum nog onbekend is.</small></label
        ><label class="tools-checkbox"
          ><input
            v-model="expected.permanent"
            type="checkbox"
            @change="expected.permanent && (expected.datum = '')"
          />Permanente toewijzing</label
        >
      </fieldset>
    </form>
    <template #footer>
      <template v-if="mode === 'detail'"
        ><button class="tool-btn" :disabled="saving" @click="$emit('close')">Sluiten</button
        ><template v-if="loan.status === 'GERESERVEERD'"
          ><button class="tool-btn danger" :disabled="saving" @click="confirmCancel = true">
            Annuleren</button
          ><button class="tool-btn" :disabled="saving" @click="$emit('edit')">Bewerken</button
          ><button class="tool-btn primary" :disabled="saving" @click="$emit('issue')">
            Materiaal uitgeven
          </button></template
        ><template v-if="isIssued(loan)"
          ><button class="tool-btn" :disabled="saving" @click="mode = 'expected'">
            Verwachte retour wijzigen</button
          ><button class="tool-btn primary" :disabled="saving" @click="mode = 'retour'">
            Retour registreren
          </button></template
        ></template
      >
      <template v-else
        ><button class="tool-btn" :disabled="saving" @click="backToDetail">Terug</button
        ><button
          class="tool-btn primary"
          type="submit"
          :form="mode === 'retour' ? 'tools-return-form' : 'tools-expected-form'"
          :disabled="saving"
        >
          {{
            saving ? 'Opslaan…' : mode === 'retour' ? 'Retour registreren' : 'Verwachting opslaan'
          }}
        </button></template
      >
    </template>
    <ConfirmationPopup
      v-if="confirmCancel"
      title="Reservering annuleren"
      message="Wil je deze reservering annuleren? Het gereserveerde materiaal wordt weer vrijgegeven."
      @confirm="cancel"
      @cancel="confirmCancel = false"
    />
  </ToolsDrawer>
</template>
<script setup>
import { ref, reactive, watch } from 'vue'
import ToolsDrawer from './ToolsDrawer.vue'
import ToolsStatus from './ToolsStatus.vue'
import BaseTable from '@/components/base/BaseTable.vue'
import ConfirmationPopup from '@/components/popup/ConfirmationPopup.vue'
import { formatDate, period, number, idOf, isIssued, validateReturn } from '@/utils/uitleen'
const props = defineProps({
  loan: { type: Object, required: true },
  saving: Boolean,
  error: String,
})
const emit = defineEmits(['close', 'edit', 'issue', 'retour', 'annuleren', 'expected'])
const mode = ref('detail'),
  returns = ref([]),
  returnNote = ref(''),
  localError = ref(''),
  confirmCancel = ref(false)
const expected = reactive({ datum: '', permanent: false })
watch(
  () => props.loan,
  (value) => {
    mode.value = 'detail'
    returnNote.value = ''
    localError.value = ''
    expected.datum = value.verwachteEindDatum ?? ''
    expected.permanent = value.permanent
    returns.value = value.regels
      .filter((line) => line.openstaandAantal > 0)
      .map((line) => ({
        regelId: idOf(line),
        naam: line.materiaalNaam,
        open: line.openstaandAantal,
        aantal: 0,
        beschadigdAantal: 0,
      }))
  },
  { immediate: true },
)
function backToDetail() {
  mode.value = 'detail'
  localError.value = ''
}
function lineName(id) {
  return props.loan.regels.find((line) => idOf(line) === id)?.materiaalNaam || 'Materiaal'
}
function fillAll() {
  for (const row of returns.value) row.aantal = row.open
}
function returnLoan() {
  localError.value = validateReturn(props.loan, returns.value)
  if (localError.value) return
  emit('retour', {
    opmerking: returnNote.value || null,
    regels: returns.value
      .filter((row) => Number(row.aantal) > 0)
      .map((row) => ({
        regelId: row.regelId,
        aantal: Number(row.aantal),
        beschadigdAantal: Number(row.beschadigdAantal),
      })),
  })
}
function expectedReturn() {
  localError.value = ''
  if (expected.datum && expected.datum < props.loan.startDatum) {
    localError.value = 'De verwachte retourdatum mag niet vóór de startdatum liggen.'
    return
  }
  emit('expected', {
    datum: expected.permanent ? null : expected.datum || null,
    permanent: expected.permanent,
  })
}
function cancel() {
  confirmCancel.value = false
  emit('annuleren')
}
</script>
