<template>
  <div class="page">
    <!-- HEADER -->
    <header class="page-header">
      <div>
        <h1>Entiteiten</h1>
        <p class="subtitle">
          {{ loading ? 'Laden…' : `${entities.length} ${entities.length === 1 ? 'entiteit' : 'entiteiten'}` }}
        </p>
      </div>

      <div class="actions">
        <label class="search">
          <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
            <circle cx="7" cy="7" r="4.5" fill="none" stroke="currentColor" stroke-width="1.6" />
            <path d="M10.5 10.5L14 14" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" />
          </svg>
          <input v-model.trim="search" type="search" placeholder="Zoek entiteit…" />
        </label>

        <button class="add-btn" @click="openCreate">+ Toevoegen</button>
      </div>
    </header>

    <!-- FOUT -->
    <div v-if="loadError" class="banner" role="alert">
      <span>{{ loadError }}</span>
      <button type="button" @click="load">Opnieuw proberen</button>
    </div>

    <!-- LADEN -->
    <div v-if="loading" class="grid">
      <div v-for="n in 6" :key="n" class="card skeleton" />
    </div>

    <!-- LIJST -->
    <div v-else-if="filtered.length" class="grid">
      <button
        v-for="entity in filtered"
        :key="entity.id"
        type="button"
        class="card"
        :style="{ '--c': entity.color || '#94a3b8' }"
        @click="openEdit(entity)"
      >
        <span class="card__icon">
          <span v-if="entity.icon" class="material-icons">{{ entity.icon }}</span>
          <span v-else class="card__initial">{{ initial(entity.naam) }}</span>
        </span>
        <span class="card__name">{{ entity.naam }}</span>
        <span class="card__edit" aria-hidden="true">Bewerken</span>
      </button>
    </div>

    <!-- LEEG -->
    <div v-else-if="!loadError" class="empty">
      <template v-if="search">
        <p class="empty__title">Geen resultaten voor "{{ search }}"</p>
        <button class="link-btn" @click="search = ''">Zoekopdracht wissen</button>
      </template>
      <template v-else>
        <p class="empty__title">Nog geen entiteiten</p>
        <p class="empty__text">Voeg je eerste entiteit toe om te beginnen.</p>
        <button class="add-btn" @click="openCreate">+ Toevoegen</button>
      </template>
    </div>

    <EntiteitDrawer
      :show="showDrawer"
      :entity="selectedEntity"
      @created="handleCreate"
      @updated="handleUpdate"
      @close="closeDrawer"
    />
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import EntiteitDrawer from '@/components/Logistics/ProjectLeider/EntiteitDrawer.vue'
import { entiteitApi } from '@/api/entiteit.js'

const entities = ref([])
const loading = ref(true)
const loadError = ref('')
const search = ref('')

const showDrawer = ref(false)
const selectedEntity = ref(null)

// API geeft soms de axios-response, soms de data zelf
const unwrap = (res) => (res && 'data' in res ? res.data : res)

const filtered = computed(() => {
  const q = search.value.toLowerCase()
  return [...entities.value]
    .filter((e) => !q || (e.naam || '').toLowerCase().includes(q))
    .sort((a, b) => (a.naam || '').localeCompare(b.naam || '', 'nl'))
})

const initial = (naam) => (naam || '?').trim().charAt(0).toUpperCase()

/* DATA */
async function load() {
  loading.value = true
  loadError.value = ''
  try {
    const data = unwrap(await entiteitApi.getEntiteiten())
    entities.value = Array.isArray(data) ? data : []
  } catch (err) {
    console.error(err)
    loadError.value = 'Kon de entiteiten niet laden.'
  } finally {
    loading.value = false
  }
}
onMounted(load)

/* DRAWER */
function openCreate() {
  selectedEntity.value = null
  showDrawer.value = true
}
function openEdit(entity) {
  selectedEntity.value = entity
  showDrawer.value = true
}
function closeDrawer() {
  showDrawer.value = false
  selectedEntity.value = null
}

/* CRUD */
async function handleCreate(data) {
  try {
    const created = unwrap(await entiteitApi.createEniteit(data))
    entities.value.push(created)
    closeDrawer()
  } catch (err) {
    console.error(err)
  }
}

async function handleUpdate({ id, data }) {
  try {
    const updated = unwrap(await entiteitApi.updateEntiteit(id, data))
    const i = entities.value.findIndex((e) => e.id === id)
    if (i !== -1) entities.value[i] = updated
    closeDrawer()
  } catch (err) {
    console.error(err)
  }
}
</script>

<style scoped>
.page {
  display: flex;
  flex-direction: column;
  gap: 20px;
  min-height: 100vh;
  padding: 28px 32px;
  background: #f5f7fb;
  font-family: 'Inter', system-ui, sans-serif;
  color: #0f172a;
}

/* HEADER */
.page-header {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;
}
h1 {
  margin: 0;
  font-size: 28px;
  font-weight: 700;
  letter-spacing: -0.02em;
}
.subtitle {
  margin: 4px 0 0;
  font-size: 14px;
  color: #64748b;
}

.actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.search {
  display: flex;
  align-items: center;
  gap: 8px;
  height: 40px;
  min-width: 240px;
  padding: 0 12px;
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  color: #94a3b8;
}
.search:focus-within {
  border-color: #a5b8ff;
  box-shadow: 0 0 0 3px rgba(53, 83, 242, 0.1);
}
.search input {
  flex: 1;
  border: 0;
  outline: 0;
  background: transparent;
  font: inherit;
  font-size: 14px;
  color: #0f172a;
}

.add-btn {
  height: 40px;
  padding: 0 16px;
  border: 0;
  border-radius: 10px;
  background: #3553f2;
  color: #fff;
  font: inherit;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: background 150ms ease;
}
.add-btn:hover {
  background: #2a45d6;
}

/* GRID */
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 16px;
}

/* CARD */
.card {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  min-height: 160px;
  padding: 20px 14px;
  background: #fff;
  border: 1px solid #e2e8f0;
  border-top: 3px solid var(--c);
  border-radius: 12px;
  font: inherit;
  color: inherit;
  cursor: pointer;
  transition: border-color 150ms ease, box-shadow 150ms ease, transform 150ms ease;
}
.card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px -10px rgba(15, 23, 42, 0.2);
}
.card:focus-visible {
  outline: 2px solid #3553f2;
  outline-offset: 2px;
}

.card__icon {
  display: grid;
  place-items: center;
  width: 56px;
  height: 56px;
  border-radius: 14px;
  background: color-mix(in srgb, var(--c) 14%, white);
  color: var(--c);
}
.card__icon .material-icons {
  font-size: 30px;
}
.card__initial {
  font-size: 22px;
  font-weight: 700;
}

.card__name {
  font-size: 15px;
  font-weight: 600;
  text-align: center;
  line-height: 1.3;
  word-break: break-word;
}

.card__edit {
  position: absolute;
  top: 10px;
  right: 12px;
  font-size: 12px;
  color: #64748b;
  opacity: 0;
  transition: opacity 150ms ease;
}
.card:hover .card__edit,
.card:focus-visible .card__edit {
  opacity: 1;
}

/* SKELETON */
.skeleton {
  cursor: default;
  border-top-color: #e2e8f0;
  background: linear-gradient(90deg, #f1f5f9 25%, #f8fafc 50%, #f1f5f9 75%);
  background-size: 200% 100%;
  animation: shimmer 1.4s infinite;
}
.skeleton:hover {
  transform: none;
  box-shadow: none;
}
@keyframes shimmer {
  to { background-position: -200% 0; }
}

/* EMPTY + ERROR */
.empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 56px 16px;
  background: #fff;
  border: 1px dashed #cbd5e1;
  border-radius: 12px;
  text-align: center;
}
.empty__title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
}
.empty__text {
  margin: 0 0 10px;
  font-size: 14px;
  color: #64748b;
}
.link-btn {
  border: 0;
  background: none;
  color: #3553f2;
  font: inherit;
  font-weight: 600;
  cursor: pointer;
}

.banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 16px;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 10px;
  color: #b91c1c;
  font-size: 14px;
}
.banner button {
  border: 0;
  background: none;
  color: inherit;
  font: inherit;
  font-weight: 600;
  text-decoration: underline;
  cursor: pointer;
}

@media (max-width: 768px) {
  .page {
    padding: 20px 16px;
  }
  .actions,
  .search {
    width: 100%;
    min-width: 0;
  }
  .search {
    flex: 1;
  }
  .grid {
    grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  }
}

@media (prefers-reduced-motion: reduce) {
  .card,
  .skeleton {
    transition: none;
    animation: none;
  }
}
</style>
