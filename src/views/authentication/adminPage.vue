<template>
  <div class="access-page">
    <header class="access-head">
      <div>
        <h1>Toegangsbeheer</h1>
        <p>Beoordeel aanvragen en beheer de moduletoegang van Microsoft-gebruikers.</p>
      </div>
      <button class="access-button" :disabled="loading || saving" @click="load">Vernieuwen</button>
    </header>
    <p v-if="error" class="access-error" role="alert">{{ error }}</p>
    <p v-if="notice" class="access-success" role="status">{{ notice }}</p>
    <nav class="access-tabs" aria-label="Toegangsbeheer">
      <button
        v-for="item in tabs"
        :key="item.key"
        class="access-button"
        :class="{ active: tab === item.key }"
        @click="tab = item.key"
      >
        {{ item.label
        }}{{
          item.key === 'requests'
            ? ' (' + requests.filter((request) => request.status === 'PENDING').length + ')'
            : ''
        }}
      </button>
    </nav>
    <div class="access-toolbar">
      <input
        v-model="search"
        aria-label="Toegangsbeheer zoeken"
        placeholder="Zoek gebruiker, module of reden"
      /><select v-if="tab === 'requests'" v-model="status" aria-label="Aanvraagstatus">
        <option value="PENDING">In behandeling</option>
        <option value="">Alle aanvragen</option>
        <option value="APPROVED">Goedgekeurd</option>
        <option value="REJECTED">Afgewezen</option>
      </select>
    </div>
    <p v-if="loading" class="access-note" role="status">Toegangsbeheer laden…</p>
    <template v-if="tab === 'requests'">
      <BaseTable
        :items="paginatedItems"
        item-key="id"
        columns="1.3fr .8fr 1.5fr 1.2fr"
        min-width="850px"
        :hover="false"
        ><template #header
          ><div>Gebruiker / module</div>
          <div>Status</div>
          <div>Reden / beoordeling</div>
          <div>Actie</div></template
        ><template #row="{ item }"
          ><div>
            <strong>{{ item.name || item.username }}</strong
            ><span class="access-sub">{{ item.username }}</span
            ><span class="access-sub"
              >{{ roleLabels[item.role] }} · {{ stamp(item.createdAt) }}</span
            >
          </div>
          <div>
            <span class="access-badge" :class="item.status">{{ requestLabels[item.status] }}</span>
          </div>
          <div class="access-reason">
            {{ item.reason
            }}<span v-if="item.reviewNote" class="access-sub"
              >{{ item.reviewNote }} · {{ item.reviewedByName }}</span
            >
          </div>
          <div>
            <button
              v-if="item.status === 'PENDING'"
              class="access-button primary"
              :disabled="saving || item.userId === currentId"
              @click="openReview(item)"
            >
              {{ item.userId === currentId ? 'Eigen aanvraag' : 'Beoordelen' }}</button
            ><span v-else class="access-sub">{{ stamp(item.reviewedAt) }}</span>
          </div></template
        ><template #empty>{{ emptyText }}</template></BaseTable
      >
    </template>
    <template v-else-if="tab === 'users'">
      <p class="access-note">
        Gebruikers verschijnen na hun eerste Microsoft-aanmelding. Moduletoegang wordt afzonderlijk
        beheerd. Je kunt een gebruiker ook adminrechten geven; die krijgt dan toegang tot alle
        modules en het gebruikersbeheer.
      </p>
      <BaseTable
        :items="paginatedItems"
        item-key="id"
        columns="1fr 1.3fr 1.7fr"
        min-width="780px"
        :hover="false"
        ><template #header
          ><div>Naam</div>
          <div>E-mail</div>
          <div>Moduletoegang</div></template
        ><template #row="{ item }"
          ><div>
            <strong>{{ item.name || 'Onbekend' }}</strong>
          </div>
          <div>{{ item.username }}</div>
          <div>
            <span v-if="!item.roles.length" class="access-sub">Nog geen moduletoegang</span>
            <div v-for="role in item.roles" :key="role" class="access-role-row">
              <span class="access-badge">{{ roleLabels[role] || role }}</span
              ><button
                v-if="role !== 'admin' && !item.roles.includes('admin')"
                class="access-button danger"
                :disabled="saving"
                @click="openRevoke(item, role)"
              >
                Intrekken
              </button>
            </div>
            <button
              v-if="!item.roles.includes('admin') && item.id !== currentId"
              class="access-button"
              :disabled="saving || loading"
              @click="openGrantAdmin(item)"
            >
              Adminrechten geven
            </button>
          </div></template
        ><template #empty>{{ emptyText }}</template></BaseTable
      >
    </template>
    <template v-else>
      <p class="access-note">
        Laatste 250 gebeurtenissen. Beslissingen, adminrechten en intrekkingen worden samen met de
        rechtenwijziging opgeslagen.
      </p>
      <BaseTable
        :items="paginatedItems"
        item-key="id"
        columns="1fr 1.3fr 1fr 1.6fr"
        min-width="850px"
        :hover="false"
        ><template #header
          ><div>Datum / actie</div>
          <div>Gebruiker / module</div>
          <div>Uitgevoerd door</div>
          <div>Reden</div></template
        ><template #row="{ item }"
          ><div>
            {{ stamp(item.at) }}<span class="access-sub">{{ auditLabels[item.action] }}</span>
          </div>
          <div>
            {{ item.userName }}<span class="access-sub">{{ roleLabels[item.role] }}</span>
          </div>
          <div>{{ item.actorName }}</div>
          <div class="access-reason">{{ item.reason }}</div></template
        ><template #empty>{{ emptyText }}</template></BaseTable
      >
    </template>
    <BasePagination
      :current-page="currentPage"
      :total-pages="totalPages"
      @next="next"
      @prev="prev"
    />

    <BaseModal
      v-if="reviewing"
      title="Toegangsaanvraag beoordelen"
      :busy="saving"
      @close="closeDialog"
    >
      <p class="access-note">
        <strong>{{ reviewing.name || reviewing.username }}</strong
        ><br />{{ reviewing.username }}<br />Vraagt toegang tot {{ roleLabels[reviewing.role] }}
      </p>
      <p class="access-reason">{{ reviewing.reason }}</p>
      <form id="access-review-form" class="access-form" @submit.prevent="review">
        <fieldset :disabled="saving">
          <label class="access-field"
            >Beslissing<select v-model="decision" required>
              <option value="APPROVED">Goedkeuren</option>
              <option value="REJECTED">Afwijzen</option>
            </select></label
          ><label class="access-field"
            >Reden voor je beslissing<textarea v-model.trim="note" required maxlength="1000" />
          </label>
        </fieldset>
        <p v-if="dialogError" class="access-error" role="alert">{{ dialogError }}</p>
      </form>
      <template #footer
        ><button class="access-button" :disabled="saving" @click="closeDialog">Annuleren</button
        ><button
          class="access-button primary"
          type="submit"
          form="access-review-form"
          :disabled="saving"
        >
          {{ saving ? 'Opslaan…' : 'Beslissing opslaan' }}
        </button></template
      >
    </BaseModal>
    <BaseModal v-if="grantingAdmin" title="Adminrechten geven" :busy="saving" @close="closeDialog">
      <p class="access-note">
        Je maakt <strong>{{ grantingAdmin.name || grantingAdmin.username }}</strong> ({{
          grantingAdmin.username
        }}) beheerder. Deze gebruiker krijgt toegang tot alle modules en kan toegangsaanvragen
        beoordelen en andere gebruikers adminrechten geven.
      </p>
      <form id="access-admin-form" class="access-form" @submit.prevent="grantAdmin">
        <label class="access-field"
          >Reden voor adminrechten
          <textarea
            v-model.trim="note"
            aria-label="Reden voor adminrechten"
            required
            maxlength="1000"
            :disabled="saving"
          />
        </label>
        <p v-if="dialogError" class="access-error" role="alert">{{ dialogError }}</p>
      </form>
      <template #footer>
        <button class="access-button" :disabled="saving" @click="closeDialog">Annuleren</button>
        <button
          class="access-button primary"
          type="submit"
          form="access-admin-form"
          :disabled="saving || !note.trim()"
        >
          {{ saving ? 'Opslaan…' : 'Adminrechten toekennen' }}
        </button>
      </template>
    </BaseModal>
    <BaseModal v-if="revoking" title="Moduletoegang intrekken" :busy="saving" @close="closeDialog">
      <p class="access-note">
        Je trekt {{ roleLabels[revoking.role] }} in voor
        <strong>{{ revoking.user.name || revoking.user.username }}</strong
        >. Dit geldt vanaf de volgende API-aanroep, ook in bestaande sessies. Andere rollen kunnen
        nog toegang tot dezelfde module geven.
      </p>
      <form id="access-revoke-form" class="access-form" @submit.prevent="revoke">
        <label class="access-field"
          >Reden voor intrekken<textarea
            v-model.trim="note"
            required
            maxlength="1000"
            :disabled="saving"
          />
        </label>
        <p v-if="dialogError" class="access-error" role="alert">{{ dialogError }}</p>
      </form>
      <template #footer
        ><button class="access-button" :disabled="saving" @click="closeDialog">Annuleren</button
        ><button
          class="access-button danger"
          type="submit"
          form="access-revoke-form"
          :disabled="saving"
        >
          {{ saving ? 'Opslaan…' : 'Toegang intrekken' }}
        </button></template
      >
    </BaseModal>
  </div>
</template>
<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import BaseTable from '@/components/base/BaseTable.vue'
import BasePagination from '@/components/base/BasePagination.vue'
import BaseModal from '@/components/base/BaseModal.vue'
import { usePagination } from '@/composable/usePagination'
import { useAuthStore } from '@/stores/authentication/auth.store'
import { accessApi } from '@/api/access'
import { roleLabels, requestLabels, auditLabels, stamp } from '@/utils/access'
import '@/assets/access.css'
const auth = useAuthStore()
const tabs = [
  { key: 'requests', label: 'Aanvragen' },
  { key: 'users', label: 'Gebruikers' },
  { key: 'history', label: 'Historiek' },
]
const tab = ref('requests'),
  search = ref(''),
  status = ref('PENDING')
const users = ref([]),
  requests = ref([]),
  history = ref([])
const loading = ref(false),
  saving = ref(false),
  error = ref(''),
  notice = ref(''),
  dialogError = ref('')
const reviewing = ref(null),
  grantingAdmin = ref(null),
  revoking = ref(null),
  decision = ref('APPROVED'),
  note = ref('')
const currentId = computed(() => auth.user?.tenantId + ':' + auth.user?.objectId)
const rows = computed(() => {
  const term = search.value.trim().toLocaleLowerCase('nl-BE')
  const list =
    tab.value === 'requests'
      ? requests.value.filter((item) => !status.value || item.status === status.value)
      : tab.value === 'users'
        ? users.value
        : history.value
  return list.filter(
    (item) =>
      !term ||
      [
        item.name,
        item.username,
        item.userName,
        item.actorName,
        item.reason,
        item.role,
        roleLabels[item.role],
        ...(item.roles ?? []).map((role) => roleLabels[role]),
      ].some((value) =>
        String(value ?? '')
          .toLocaleLowerCase('nl-BE')
          .includes(term),
      ),
  )
})
const emptyText = computed(() =>
  loading.value
    ? 'Gegevens laden…'
    : error.value
      ? 'Gegevens niet beschikbaar. Vernieuw het overzicht.'
      : 'Geen resultaten voor deze selectie.',
)
const { currentPage, totalPages, paginatedItems, next, prev, reset, setPage } = usePagination(
  rows,
  { pageSize: 15 },
)
watch([tab, search, status], reset)
watch(totalPages, () => setPage(currentPage.value))
let alive = true
async function load() {
  loading.value = true
  error.value = ''
  try {
    const result = await Promise.all([accessApi.users(), accessApi.requests(), accessApi.history()])
    if (alive) [users.value, requests.value, history.value] = result
  } catch (failure) {
    if (alive) error.value = failure.message || 'Toegangsbeheer laden mislukt.'
  } finally {
    if (alive) loading.value = false
  }
}
function openReview(item) {
  if (saving.value) return
  reviewing.value = item
  decision.value = 'APPROVED'
  note.value = ''
  dialogError.value = ''
}
function openRevoke(user, role) {
  if (saving.value) return
  revoking.value = { user, role }
  note.value = ''
  dialogError.value = ''
}
function openGrantAdmin(user) {
  if (saving.value || user.id === currentId.value || user.roles.includes('admin')) return
  grantingAdmin.value = user
  note.value = ''
  dialogError.value = ''
}
function closeDialog() {
  if (!saving.value) {
    reviewing.value = null
    revoking.value = null
    grantingAdmin.value = null
    dialogError.value = ''
  }
}
async function mutate(work, message) {
  if (saving.value) return
  saving.value = true
  dialogError.value = ''
  try {
    await work()
    if (!alive) return
    reviewing.value = null
    revoking.value = null
    grantingAdmin.value = null
    notice.value = message
    await load()
  } catch (failure) {
    if (alive) dialogError.value = failure.message || 'Wijziging opslaan mislukt.'
  } finally {
    if (alive) saving.value = false
  }
}
function review() {
  const item = reviewing.value
  return mutate(
    () =>
      accessApi.review(item.id, {
        revision: item.revision,
        decision: decision.value,
        note: note.value,
      }),
    'De aanvraag is beoordeeld. De beslissing staat in de historiek.',
  )
}
function grantAdmin() {
  const user = grantingAdmin.value
  if (!user || !note.value.trim()) return
  return mutate(
    () => accessApi.grantAdmin(user.id, { reason: note.value }),
    'De adminrechten zijn toegekend en vastgelegd in de historiek.',
  )
}
function revoke() {
  const item = revoking.value
  return mutate(
    () => accessApi.revoke(item.user.id, { role: item.role, reason: note.value }),
    'De moduletoegang is ingetrokken.',
  )
}
onMounted(load)
onBeforeUnmount(() => {
  alive = false
})
</script>
