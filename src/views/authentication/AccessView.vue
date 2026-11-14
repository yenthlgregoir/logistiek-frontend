<template>
  <div class="access-page personal-access">
    <header class="access-head">
      <div>
        <span class="access-eyebrow">Account · Toegangsrechten</span>
        <h1>Mijn toegang</h1>
        <p>Vraag toegang aan tot de modules die je voor je werk nodig hebt.</p>
      </div>
      <button class="access-button" :disabled="loading || saving" @click="load">
        <RefreshCw :size="15" aria-hidden="true" />
        Rechten vernieuwen
      </button>
    </header>
    <p v-if="error" class="access-error" role="alert">{{ error }}</p>
    <p v-if="notice" class="access-success" role="status">{{ notice }}</p>
    <p v-if="loading" class="access-note" role="status">Toegangsrechten laden…</p>
    <div class="access-section-heading">
      <div>
        <h2>Jouw modules</h2>
        <p>De toegang tot elke module wordt afzonderlijk beheerd.</p>
      </div>
      <span v-if="!loading && roles.length" class="access-count"
        >{{ roles.filter((role) => hasModule(userRoles, role)).length }} van
        {{ roles.length }} actief</span
      >
    </div>
    <section class="access-grid" aria-label="Toegang per module" :aria-busy="loading">
      <div v-for="role in roles" :key="role" class="access-module">
        <span class="access-module-icon" aria-hidden="true"
          ><component :is="moduleIcons[role] || ShieldCheck" :size="20" :stroke-width="1.7"
        /></span>
        <h2>{{ roleLabels[role] }}</h2>
        <p class="access-module-description">{{ moduleDescriptions[role] }}</p>
        <span
          class="access-badge"
          :class="hasModule(userRoles, role) ? 'APPROVED' : pending(role) ? 'PENDING' : ''"
          >{{
            hasModule(userRoles, role)
              ? 'Toegang actief'
              : pending(role)
                ? 'Aanvraag in behandeling'
                : 'Nog geen toegang'
          }}</span
        >
      </div>
    </section>
    <section
      v-if="available.length"
      class="access-section"
      aria-labelledby="access-request-heading"
    >
      <div class="access-form-intro">
        <span class="access-module-icon" aria-hidden="true"><KeyRound :size="19" /></span>
        <div>
          <h2 id="access-request-heading">Toegang aanvragen</h2>
          <p>Kies de module die je nodig hebt en licht je aanvraag kort toe.</p>
        </div>
      </div>
      <form class="access-form" @submit.prevent="submit">
        <fieldset :disabled="saving || loading">
          <div class="access-form-row">
            <label class="access-field"
              >Module<select v-model="selectedRole" aria-label="Module" required>
                <option value="" disabled>Kies een module</option>
                <option v-for="role in available" :key="role" :value="role">
                  {{ roleLabels[role] }}
                </option>
              </select></label
            ><label class="access-field"
              >Waarom heb je toegang nodig?<textarea
                v-model.trim="reason"
                aria-label="Waarom heb je toegang nodig?"
                aria-describedby="access-reason-help"
                required
                maxlength="1000"
                placeholder="Beschrijf kort waarvoor je deze module nodig hebt."
              /><small id="access-reason-help"
                >Je aanvraag wordt beoordeeld door een beheerder.</small
              ></label
            >
          </div>
          <button class="access-button primary" :disabled="!selectedRole" type="submit">
            <Send :size="15" aria-hidden="true" />
            {{ saving ? 'Aanvraag versturen…' : 'Aanvraag versturen' }}
          </button>
        </fieldset>
      </form>
    </section>
    <p v-else-if="!loading && roles.length" class="access-note">
      Je hebt al toegang of een openstaande aanvraag voor alle modules.
    </p>
    <section class="access-requests" aria-labelledby="access-requests-heading">
      <div class="access-section-heading">
        <div>
          <h2 id="access-requests-heading">Mijn aanvragen</h2>
          <p>Volg de status van je aanvragen en lees de beoordeling.</p>
        </div>
        <span v-if="requests.length" class="access-count"
          >{{ requests.length }} {{ requests.length === 1 ? 'aanvraag' : 'aanvragen' }}</span
        >
      </div>
      <BaseTable
        :items="requests"
        item-key="id"
        columns=".8fr 1fr 1.5fr 1.6fr"
        min-width="780px"
        :hover="false"
        ><template #header
          ><div>Module</div>
          <div>Status / datum</div>
          <div>Je reden</div>
          <div>Beoordeling</div></template
        ><template #row="{ item }"
          ><div>{{ roleLabels[item.role] }}</div>
          <div>
            <span class="access-badge" :class="item.status">{{ requestLabels[item.status] }}</span
            ><span class="access-sub">{{ stamp(item.createdAt) }}</span>
          </div>
          <div class="access-reason">{{ item.reason }}</div>
          <div>
            <span class="access-reason">{{ item.reviewNote || 'Wacht op beoordeling' }}</span
            ><span v-if="item.reviewedAt" class="access-sub"
              >{{ item.reviewedByName }} · {{ stamp(item.reviewedAt) }}</span
            >
          </div></template
        ><template #empty>{{
          loading
            ? 'Aanvragen laden…'
            : error
              ? 'Aanvragen konden niet geladen worden.'
              : 'Je hebt nog geen toegang aangevraagd.'
        }}</template></BaseTable
      >
    </section>
  </div>
</template>
<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import {
  ShoppingCart,
  KeyRound,
  Truck,
  Wrench,
  ShieldCheck,
  RefreshCw,
  Send,
} from 'lucide-vue-next'
import BaseTable from '@/components/base/BaseTable.vue'
import { useAuthStore } from '@/stores/authentication/auth.store'
import { accessApi } from '@/api/access'
import { roleLabels, requestLabels, hasModule, stamp } from '@/utils/access'
import '@/assets/access.css'
const auth = useAuthStore()
const moduleIcons = { purchase: ShoppingCart, renting: KeyRound, logistics: Truck, tools: Wrench }
const moduleDescriptions = {
  purchase: 'Bestellingen en aankopen opvolgen.',
  renting: 'Boekingen, klanten en toestellen beheren.',
  logistics: 'Verhuringen en logistieke planning beheren.',
  tools: 'Materiaal en uitleningen opvolgen.',
}
const roles = ref([]),
  requests = ref([]),
  selectedRole = ref(''),
  reason = ref('')
const loading = ref(false),
  saving = ref(false),
  error = ref(''),
  notice = ref('')
const userRoles = computed(() => auth.user?.roles ?? [])
const pending = (role) =>
  requests.value.some((item) => item.role === role && item.status === 'PENDING')
const available = computed(() =>
  roles.value.filter((role) => !hasModule(userRoles.value, role) && !pending(role)),
)
let alive = true
watch(available, (value) => {
  if (!value.includes(selectedRole.value)) selectedRole.value = ''
})
async function load() {
  loading.value = true
  error.value = ''
  try {
    const [catalog, own] = await Promise.all([accessApi.roles(), accessApi.own(), auth.fetchMe()])
    if (alive) {
      roles.value = catalog
      requests.value = own
    }
  } catch (failure) {
    if (alive) error.value = failure.message || 'Toegang laden mislukt.'
  } finally {
    if (alive) loading.value = false
  }
}
async function submit() {
  if (saving.value || !available.value.includes(selectedRole.value)) return
  saving.value = true
  error.value = ''
  try {
    await accessApi.request({ role: selectedRole.value, reason: reason.value })
    if (!alive) return
    reason.value = ''
    notice.value = 'Je aanvraag is verstuurd. Een beheerder zal ze beoordelen.'
    await load()
  } catch (failure) {
    if (alive) error.value = failure.message || 'Aanvraag versturen mislukt.'
  } finally {
    if (alive) saving.value = false
  }
}
onMounted(load)
onBeforeUnmount(() => {
  alive = false
})
</script>

<style scoped>
.personal-access {
  box-sizing: border-box;
  max-width: none;
  min-height: 100%;
  margin: 0;
  padding: 28px;
  background: #f5f7fb;
}
.access-eyebrow {
  color: #7b899c;
  font-size: 11px;
  letter-spacing: 1px;
  text-transform: uppercase;
}
.personal-access .access-head {
  margin-bottom: 30px;
}
.personal-access .access-head h1 {
  font-size: 25px;
  letter-spacing: -0.5px;
  margin: 6px 0;
}
.personal-access .access-head p {
  margin: 0;
  font-size: 13px;
}
.access-section-heading {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 16px;
}
.access-section-heading h2 {
  margin: 0;
  color: #294768;
  font-size: 16px;
  font-weight: 600;
}
.access-section-heading p,
.access-form-intro p {
  margin: 5px 0 0;
  color: #7b899c;
  font-size: 12px;
  line-height: 1.6;
}
.access-count {
  flex-shrink: 0;
  color: #6e7f96;
  font-size: 12px;
}
.personal-access .access-grid {
  gap: 16px;
  margin-bottom: 28px;
}
.personal-access .access-module {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: 20px;
  border-color: #e1e7ef;
  box-shadow: 0 2px 4px #23426804;
}
.access-module-icon {
  display: inline-grid;
  place-items: center;
  flex-shrink: 0;
  width: 38px;
  height: 38px;
  border: 1px solid #e1e9f5;
  border-radius: 10px;
  background: #f2f6fc;
  color: #5577a6;
}
.personal-access .access-module h2 {
  margin: 14px 0 0;
  font-size: 14px;
  font-weight: 600;
}
.personal-access .access-module-description {
  margin: 7px 0 18px;
  font-size: 12px;
  line-height: 1.65;
  color: #7b899c;
}
.personal-access .access-module .access-badge {
  margin-top: auto;
}
.personal-access .access-section {
  padding: 22px;
  border-color: #e1e7ef;
}
.access-form-intro {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 22px;
}
.access-form-intro h2 {
  margin: 0;
  font-size: 16px;
}
.personal-access .access-form {
  margin: 0;
}
.personal-access .access-form-row {
  grid-template-columns: minmax(180px, 1fr) 2fr;
  gap: 22px;
}
.personal-access .access-field {
  gap: 9px;
}
.personal-access .access-field select,
.personal-access .access-field textarea {
  width: 100%;
  background: #f8fafd;
  border-color: #dce5f0;
  border-radius: 9px;
}
.personal-access .access-field textarea {
  min-height: 96px;
}
.personal-access .access-field :is(select, textarea):focus {
  background: #fff;
}
.access-requests {
  margin-top: 30px;
}
@media (max-width: 1180px) {
  .personal-access .access-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
@media (max-width: 600px) {
  .personal-access {
    padding: 22px 16px;
  }
  .personal-access .access-head {
    gap: 14px;
    margin-bottom: 26px;
  }
  .personal-access .access-head > .access-button {
    width: auto;
  }
  .personal-access .access-grid {
    gap: 10px;
  }
  .personal-access .access-module {
    padding: 15px;
  }
  .personal-access .access-module-description {
    font-size: 11px;
  }
  .personal-access .access-section {
    padding: 18px;
  }
  .personal-access .access-form-row {
    grid-template-columns: 1fr;
    gap: 18px;
  }
  .personal-access .access-form .access-button {
    width: 100%;
  }
  .access-form-intro {
    gap: 10px;
  }
}
@media (max-width: 359px) {
  .personal-access .access-grid {
    grid-template-columns: 1fr;
  }
}
</style>
