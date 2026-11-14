<template>
  <ToolsDrawer :title="material.naam" :busy="saving" width="840px" @close="$emit('close')">
    <div class="tools-actions" style="margin-bottom: 18px">
      <ToolsStatus :value="material.status" /><span class="tools-muted">{{
        material.nummer || 'Voorraad per aantal'
      }}</span>
    </div>
    <div class="tools-tabs">
      <button
        v-for="option in tabs"
        :key="option.key"
        class="tool-btn"
        :class="{ active: tab === option.key }"
        @click="selectTab(option.key)"
      >
        {{ option.label }}
      </button>
    </div>
    <p v-if="error || localError" class="tools-error" role="alert">{{ localError || error }}</p>
    <template v-if="tab === 'gegevens'">
      <div class="tools-stats" style="margin-bottom: 18px">
        <div class="tools-stat">
          <strong>{{ number(material.totaalAantal) }}</strong
          ><span>Totaal</span>
        </div>
        <div class="tools-stat">
          <strong>{{ number(material.beschikbaarheid?.beschikbaarAantal) }}</strong
          ><span>Beschikbaar vandaag</span>
        </div>
        <div class="tools-stat">
          <strong>{{ number(material.beschikbaarheid?.uitgeleendAantal) }}</strong
          ><span>Nog uitgeleend</span>
        </div>
        <div class="tools-stat">
          <strong>{{ number(material.geblokkeerdAantal) }}</strong
          ><span>Geblokkeerd</span>
        </div>
      </div>
      <section class="tools-section">
        <dl class="tools-detail-grid">
          <div v-for="(value, label) in details" :key="label">
            <dt>{{ label }}</dt>
            <dd>{{ value || '-' }}</dd>
          </div>
        </dl>
      </section>
      <section
        v-if="Object.keys(material.eigenschappen ?? {}).length"
        class="tools-section"
        style="margin-top: 16px"
      >
        <h3>Eigenschappen</h3>
        <dl class="tools-detail-grid">
          <div v-for="(value, key) in material.eigenschappen" :key="key">
            <dt>{{ key }}</dt>
            <dd>{{ value }}</dd>
          </div>
        </dl>
      </section>
      <p v-if="material.opmerking" class="tools-comment">{{ material.opmerking }}</p>
    </template>
    <template v-else-if="tab === 'voorraad'">
      <p class="tools-notice">
        Registreer elke telling of herstelling met een reden. Uitgeleend materiaal wordt via een
        retour teruggenomen.
      </p>
      <form id="tools-stock-form" class="tools-form" @submit.prevent="correct">
        <fieldset :disabled="saving">
          <div class="tools-fields">
            <label class="tools-field"
              >Nieuw totaal aantal<input
                v-model.number="stock.totaalAantal"
                type="number"
                min="0"
                step="1"
                :readonly="material.beheerwijze === 'INDIVIDUEEL'"
                required /></label
            ><label class="tools-field"
              >Nieuw geblokkeerd aantal<input
                v-model.number="stock.geblokkeerdAantal"
                type="number"
                min="0"
                :max="stock.totaalAantal"
                step="1"
                required /></label
            ><label class="tools-field full"
              >Reden *<textarea
                v-model.trim="stock.reden"
                required
                placeholder="Bijvoorbeeld inventariscontrole of herstelling voltooid"
              />
            </label>
          </div>
          <button class="tool-btn primary" :disabled="saving" type="submit">
            {{ saving ? 'Opslaan…' : 'Voorraadcorrectie opslaan' }}
          </button>
        </fieldset>
      </form>
      <section class="tools-section" style="margin-top: 20px">
        <h3>Voorraadmutaties</h3>
        <div
          v-for="event in [...(material.voorraadHistoriek ?? [])].reverse()"
          :key="event.id"
          class="tools-receipt"
        >
          <strong>{{ event.reden }}</strong>
          <p>
            Totaal: {{ event.oudTotaal }} → {{ event.nieuwTotaal }} · Geblokkeerd:
            {{ event.oudGeblokkeerd }} → {{ event.nieuwGeblokkeerd }}
          </p>
          <span class="tools-muted">{{ formatDate(event.datum) }} · {{ event.door }}</span>
        </div>
      </section>
    </template>
    <template v-else
      ><p v-if="historyLoading" class="tools-muted">Historiek laden…</p>
      <BaseTable
        :items="history"
        columns="1.1fr 1fr 1fr"
        item-key="id"
        min-width="560px"
        @row-click="$emit('open-uitleen', $event.id)"
        ><template #header
          ><div>Ontlener / locatie</div>
          <div>Periode</div>
          <div>Status</div></template
        ><template #row="{ item }"
          ><div>
            <strong>{{ item.ontlener }}</strong
            ><span class="tools-row-sub">{{ item.locatie || item.werfNaam }}</span>
          </div>
          <div>{{ period(item) }}</div>
          <ToolsStatus :value="item.status" /></template
        ><template #empty>Dit materiaal is nog niet in een uitleen gebruikt.</template></BaseTable
      ></template
    >
    <template #footer
      ><button class="tool-btn" :disabled="saving" @click="$emit('close')">Sluiten</button
      ><button class="tool-btn primary" :disabled="saving" @click="$emit('edit')">
        Materiaal bewerken
      </button></template
    >
  </ToolsDrawer>
</template>
<script setup>
import { ref, reactive, computed, watch } from 'vue'
import BaseTable from '@/components/base/BaseTable.vue'
import ToolsDrawer from './ToolsDrawer.vue'
import ToolsStatus from './ToolsStatus.vue'
import { number, formatDate, period, whole } from '@/utils/uitleen'
const props = defineProps({
  material: { type: Object, required: true },
  saving: Boolean,
  error: String,
  history: { type: Array, default: () => [] },
  historyLoading: Boolean,
})
const emit = defineEmits(['close', 'edit', 'correctie', 'history', 'open-uitleen'])
const tabs = [
  { key: 'gegevens', label: 'Gegevens' },
  { key: 'voorraad', label: 'Voorraadcorrectie' },
  { key: 'historiek', label: 'Uitleenhistoriek' },
]
const tab = ref('gegevens')
const stock = reactive({ totaalAantal: 0, geblokkeerdAantal: 0, reden: '' })
const localError = ref('')
watch(
  () => [props.material.totaalAantal, props.material.geblokkeerdAantal],
  () => {
    stock.totaalAantal = props.material.totaalAantal
    stock.geblokkeerdAantal = props.material.geblokkeerdAantal
    stock.reden = ''
  },
  { immediate: true },
)
const details = computed(() => ({
  Categorie: props.material.categorie,
  Beheerwijze:
    props.material.beheerwijze === 'AANTAL' ? 'Voorraad per aantal' : 'Individueel toestel',
  Materiaalnummer: props.material.nummer,
  Merk: props.material.merk,
  Model: props.material.model,
  Serienummer: props.material.serienummer,
  'Vaste locatie': props.material.vasteLocatie,
}))
function selectTab(value) {
  tab.value = value
  localError.value = ''
  if (value === 'historiek') emit('history')
}
function correct() {
  localError.value = ''
  if (
    !whole(stock.totaalAantal) ||
    !whole(stock.geblokkeerdAantal) ||
    stock.geblokkeerdAantal > stock.totaalAantal
  ) {
    localError.value = 'Vul geldige volledige aantallen in.'
    return
  }
  if (
    stock.totaalAantal - stock.geblokkeerdAantal <
    (props.material.beschikbaarheid?.uitgeleendAantal ?? 0)
  ) {
    localError.value = 'Er staat nog meer materiaal uitgeleend dan deze voorraad toelaat.'
    return
  }
  emit('correctie', {
    totaalAantal: Number(stock.totaalAantal),
    geblokkeerdAantal: Number(stock.geblokkeerdAantal),
    reden: stock.reden,
  })
}
</script>
