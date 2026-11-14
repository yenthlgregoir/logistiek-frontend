<template>
  <div class="page">
    <!-- Toolbar -->
    <div class="toolbar">
      <SearchBar
        placeholder="Zoek"
        width="300px"
        icon="fa fa-search"
        @update:modelValue="emit('search', $event)"
      />

      <button class="btn btn-primary" @click="emit('openAdd')">+ Werfcontainer</button>
    </div>

    <!-- Table -->
    <ExpandedBaseTable
      :items="assets"
      :expand-on-row-click="true"
      columns="2fr 2fr 1fr 1fr"
      itemKey="id"
      :rowStyle="rowStyle"
    >
      <template #header>
        <div>nummer</div>
        <div>type</div>
        <div>entiteit</div>
        <div class="right">status</div>
      </template>

      <template #row="{ item }">
        <div class="clickable">
          {{ item.nummer }}
        </div>

        <div>{{ item.machineType?.naam || 'Onbekend' }}</div>
        <div
          class="col-entiteit"
          :style="{
            backgroundColor: item.entiteit?.color || '#1b4965',
            color: getContrastColor(item.entiteit?.color || '#1b4965'),
          }"
        >
          <span v-if="item.entiteit?.icon" class="material-icons entiteit-icon">
            {{ item.entiteit.icon }}
          </span>
          <span>{{ item.entiteit?.naam || 'Onbekend' }}</span>
        </div>
        <div class="right">
          <span :class="['status', getStatus(item)]">
            {{ getStatusLabel(item) }}
          </span>
        </div>
      </template>

      <!-- EXPANDED -->
      <template #expanded="{ item }">
        <div class="expanded-row-container">
          <!-- LINKS -->
          <div class="expanded-row-left">
            <div class="section-header">
              <div class="section-title">Werfcontainer info</div>
<button
  type="button"
  class="edit-btn"
  aria-label="Werfcontainer bewerken"
  @click.stop="editAsset(item)"
>
  ✏️
</button>            </div>

            <div class="devider"></div>

            <div class="info-grid">
              <div class="column">
                <div><strong>nummer</strong></div>
                <div>{{ item.nummer }}</div>

                <div><strong>type</strong></div>
                <div>{{ item.machineType?.naam || '-' }}</div>

                <div><strong>verantwoordelijke</strong></div>
                <div>{{ item.verantwoordelijke || '-' }}</div>
              </div>
              <div class="column">
                <div><strong>status</strong></div>
                <div>{{ getStatusLabel(item) }}</div>

                <div><strong>entiteit</strong></div>
                <div>{{ item.entiteit?.naam || '-' }}</div>
              </div>

              <div class="comments">
                <div class="comments-title"><strong>Opmerking</strong></div>
                <div class="comments-text">
                  {{ item.comment || 'Geen opmerking' }}
                </div>
              </div>
            </div>
          </div>

          <!-- RECHTS -->
          <div class="expanded-row-right">
            <div class="section-header">
              <div class="section-title">Boekingen</div>
            </div>

            <div class="devider"></div>

            <div v-if="item.huidigeBoekingen?.length > 0">
<div
  v-for="boeking in item.huidigeBoekingen"
  :key="boeking.id"
  class="info-grid"
>                <div class="column">
                  <div><strong>Leverdatum</strong></div>
                  <div>{{ formatDate(boeking.leverDatum) }}</div>

                  <div><strong>Ophaaldatum</strong></div>
                  <div>{{ formatDate(boeking.ophaalDatum) || 'Geen' }}</div>

                  <div><strong>Ref</strong></div>
<div>{{ boeking.reference || '-' }}</div>                </div>

                <div class="column">
                  <div><strong>Projectleider</strong></div>
                  <div>{{ boeking.projectleider?.naam || '-' }}</div>

                  <div><strong>Werf</strong></div>
                  <div>{{ boeking.werf?.naam || '-' }}</div>
                </div>
              </div>
            </div>

            <div v-else class="coming-soon-placeholder">Geen actieve boekingen</div>
          </div>
        </div>
      </template>
    </ExpandedBaseTable>
  </div>
</template>

<script setup>
import ExpandedBaseTable from '@/components/base/ExpandedBaseTable.vue'
import SearchBar from '@/components/base/SearchBar.vue'

defineProps({
  assets: { type: Array, default: () => [] },
})

const emit = defineEmits(['search', 'openAdd', 'edit-asset'])

function getContrastColor(hex) {
  let kleur = String(hex ?? '').trim()

  // Ondersteun bijvoorbeeld ook #fff.
  if (/^#[0-9a-f]{3}$/i.test(kleur)) {
    kleur = '#' + [...kleur.slice(1)]
      .map((teken) => teken + teken)
      .join('')
  }

  if (!/^#[0-9a-f]{6}$/i.test(kleur)) {
    return '#fff'
  }

  const rgb = Number.parseInt(kleur.slice(1), 16)
  const r = (rgb >> 16) & 255
  const g = (rgb >> 8) & 255
  const b = rgb & 255

  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255

  return luminance > 0.5 ? '#000' : '#fff'
}

function formatDate(value) {
  if (!value) return ''

  // De backend geeft LocalDate terug als YYYY-MM-DD.
  const match = String(value).match(/^(\d{4})-(\d{2})-(\d{2})$/)

  if (!match) return ''

  return `${match[3]}/${match[2]}/${match[1]}`
}

function vandaagInBrussel() {
  const delen = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/Brussels',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date())

  const waarden = Object.fromEntries(
    delen.map(({ type, value }) => [type, value]),
  )

  return `${waarden.year}-${waarden.month}-${waarden.day}`
}

function getBoekingStatus(boekingen) {
  if (!Array.isArray(boekingen)) return null

  const vandaag = vandaagInBrussel()

  const actief = boekingen.some((boeking) => {
    const leverDatum = boeking.leverDatum
    const ophaalDatum = boeking.ophaalDatum

    if (!leverDatum) return false

    // ISO-kalenderdatums zijn rechtstreeks vergelijkbaar.
    // De ophaaldag telt mee, zoals in je backend.
    return (
      leverDatum <= vandaag &&
      (!ophaalDatum || ophaalDatum >= vandaag) &&
      (!ophaalDatum || ophaalDatum >= leverDatum)
    )
  })

  return actief ? 'bezet' : null
}

function getStatus(item) {
  const status = String(item.status ?? '').trim().toUpperCase()

  // Technische status heeft voorrang op de boekingen.
  if (status === 'KAPOT') return 'kapot'
  if (status === 'ONGEKEURD') return 'ongekeurd'

  if (getBoekingStatus(item.huidigeBoekingen) === 'bezet') {
    return 'bezet'
  }

  if (status === 'VRIJ') return 'vrij'

  return 'onbekend'
}

function getStatusLabel(item) {
  const status = getStatus(item)

  const labels = {
    vrij: 'Vrij',
    bezet: 'Bezet',
    kapot: 'Kapot',
    ongekeurd: 'Ongekeurd',
  }

  return labels[status] ?? (item.status || 'Onbekend')
}

function rowStyle(item) {
  const kleuren = {
    vrij: {
      background: '#d1fae5',
      color: '#065f46',
    },
    bezet: {
      background: '#fef3c7',
      color: '#92400e',
    },
    kapot: {
      background: '#fee2e2',
      color: '#991b1b',
    },
    ongekeurd: {
      background: '#f0f0f0',
      color: '#6b7280',
    },
    onbekend: {
      background: '#f3f4f6',
      color: '#374151',
    },
  }

  // Behoudt het bestaande formaat voor ExpandedBaseTable.
  return [kleuren[getStatus(item)]]
}

function editAsset(asset) {
  emit('edit-asset', asset)
}
</script>
<style scoped>
.page {
  width: 100%;
}
.comments {
  grid-column: 1 / -1;
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 14px;
  color: #333;
}

.comments-title {
  font-weight: 600;
}

.comments-text {
  background: #f9fafb;
  border-radius: 6px;
  white-space: pre-wrap; 
}
.status.gepland {
  background: #91b7f0;
  color: #0153f7;
}
/* Toolbar */
.toolbar {
  display: flex;
  justify-content: space-between;
  margin-bottom: 15px;
}

/* Table */
.clickable {
  cursor: pointer;
  font-weight: 500;
}

/* Expanded layout */
.expanded-row-container {
  display: flex;
  gap: 20px;
  padding: 20px;
  border-radius: 8px;
}

.expanded-row-left,
.expanded-row-right {
  flex: 1;
  display: flex;
  flex-direction: column;
}

/* Section header */
.section-header {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  font-weight: 700;
  font-size: 16px;
  margin-bottom: 12px;
  height: 32px;
}

.section-title {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  pointer-events: none;
}
.status.onbekend {
  background: #f3f4f6;
  color: #374151;
}
.edit-btn {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 16px;
  color: #555;
}

/* Info grid */
.info-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px 40px;
  font-size: 14px;
  color: #333;
}

.column {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.column > div {
  display: flex;
  justify-content: space-between;
}

.column strong {
  font-weight: 600;
}

.col-entiteit {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 10px;
  font-weight: 600;
  font-size: 13px;
  background: #e5e7eb;
}

.entiteit-icon {
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Divider */
.devider {
  width: 100%;
  border: 1px solid rgb(194, 190, 190);
  margin-bottom: 1rem;
}

/* Boekingen placeholder */
.coming-soon-placeholder {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  font-style: italic;
  color: #888;
  border: 2px dashed #ccc;
  border-radius: 8px;
  user-select: none;
  min-height: 120px;
}

/* Status badges */
.status {
  padding: 4px 10px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 600;
}

.status.vrij {
  background: #d1fae5;
  color: #065f46;
}

.status.bezet {
  background: #fef3c7;
  color: #92400e;
}

.status.kapot {
  background: #fee2e2;
  color: #991b1b;
}

.status.ongekeurd {
  background: #f0f0f0;
  color: #6b7280;
}
</style>
