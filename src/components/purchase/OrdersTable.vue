<template>
  <div class="table-wrapper">
    <table class="table">
      <colgroup>
        <col style="width: 10%" />
        <!-- ID -->
        <col style="width: 30%" />
        <!-- Referentie -->
        <col style="width: 10%" />
        <!-- Aanvrager -->
        <col style="width: 10%" />
        <!-- Leverancier -->
        <col style="width: 10%" />
        <!-- Categorie -->
        <col style="width: 15%" />
        <!-- Status -->
        <col style="width: 5%" />
        <!-- Kebab -->
      </colgroup>

      <thead>
        <tr>
          <th>ID</th>
          <th>Referentie</th>
          <th>Aanvrager</th>
          <th>Leverancier</th>
          <th>Categorie</th>
          <th class="right">Status</th>
          <th class="right"></th>
        </tr>
      </thead>

      <tbody>
        <tr v-if="!orders.length">
          <td colspan="7" class="empty">Geen resultaten</td>
        </tr>

        <template v-for="group in orders" :key="group.ref">
          <!-- Groepsheader -->
          <tr v-if="group.isGrouped" class="group-row">
            <td colspan="7">
              Referentie: <strong>{{ group.ref }}</strong>
              <span class="group-count">({{ group.orders.length }} items)</span>
            </td>
          </tr>

          <!-- Orders -->
          <tr
            v-for="(order, index) in group.orders"
            :key="order._id"
            :class="[
              'row',
              { grouped: group.isGrouped },
              { 'group-end': group.isGrouped && index === group.orders.length - 1 },
            ]"
          >
            <td>{{ order._id }}</td>
            <td>{{ order.ref }}</td>
            <td>{{ order.aanvrager }}</td>
            <td>{{ order.leverancier }}</td>
            <td>{{ order.categorie }}</td>

            <!-- STATUS -->
            <td class="right">
              <select
                class="status-select"
                v-model="order.status"
                @change="$emit('update-status', order)"
                :style="statusStyle(order.status)"
                :aria-label="`Wijzig status voor order ${order._id}`"
              >
                <option v-for="s in statusOptions" :key="s.label" :value="s.label">
                  {{ s.label }}
                </option>
              </select>
            </td>

            <!-- KEBAB -->
            <td class="right">
              <button
                class="kebab-btn"
                :ref="(el) => (kebabRefs[order._id] = el)"
                @click.stop="toggleMenu(order._id)"
                aria-haspopup="menu"
                :aria-expanded="openMenu === order._id ? 'true' : 'false'"
                :aria-controls="openMenu === order._id ? `kebab-menu-${order._id}` : undefined"
              >
                ⋯
              </button>

              <Teleport to="body">
                <div
                  v-if="openMenu === order._id"
                  class="kebab-menu"
                  :style="menuPosition"
                  role="menu"
                  :id="`kebab-menu-${order._id}`"
                >
                  <button @click="emitAndClose('edit', order)" role="menuitem">✏️ Bewerken</button>
                  <button @click="emitAndClose('open-products', order)" role="menuitem">
                    🧩 Producten
                  </button>
                  <button @click="emitAndClose('archive', order)" role="menuitem">
                    📦 Archief
                  </button>
                  <button @click="emitAndClose('open-files', order)" role="menuitem">
                    📎 Bestanden
                  </button>
                  <button @click="emitAndClose('delete-file', order)" role="menuitem">
                    🗑️ Verwijderen
                  </button>
                </div>
              </Teleport>
            </td>
          </tr>
        </template>
      </tbody>
    </table>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, toRefs, computed } from 'vue'

const props = defineProps({
  orders: { type: Array, required: true },
  // Voorbeeldvorm: [{ label: 'Open', color: '#E5F0FF' }, ...]
  statusOptions: { type: Array, required: true },
})

const emit = defineEmits([
  'edit',
  'archive',
  'open-products',
  'open-files',
  'delete-file',
  'update-status',
])

/* ---------- PROP REFS ---------- */
const { statusOptions } = toRefs(props)

/* ---------- STATUS LOOKUP (O(1)) ---------- */
const statusIndex = computed(() => {
  // Bouw een map: label -> { label, color }
  const idx = Object.create(null)
  for (const s of statusOptions.value || []) {
    if (!s || !s.label) continue
    idx[s.label] = s
  }
  return idx
})

/* ---------- CONTRAST HELPER ---------- */
function getTextColorForBg(hex) {
  const norm = hex.trim().toLowerCase()

  // 2. Expliciete check voor wit (als hex of als naam)
  if (norm === '#ffffff' || norm === 'ffffff' || norm === 'white') return '#111'

  // Check of het een geldig hex-formaat is
  if (!/^#?[0-9a-fA-F]{3,6}$/.test(norm)) return '#111'

  // 3. Omzetten naar RGB
  const bg = norm.startsWith('#') ? norm : `#${norm}`

  // Ondersteuning voor korte hex zoals #FFF
  let r, g, b
  if (bg.length === 4) {
    r = parseInt(bg[1] + bg[1], 16)
    g = parseInt(bg[2] + bg[2], 16)
    b = parseInt(bg[3] + bg[3], 16)
  } else {
    const rgb = parseInt(bg.substring(1), 16)
    r = (rgb >> 16) & 255
    g = (rgb >> 8) & 255
    b = rgb & 255
  }

  // 4. Helderheid berekenen
  const brightness = (r * 299 + g * 587 + b * 114) / 1000

  // Als brightness > 125 is de kleur licht -> geef zwarte tekst
  // Anders is de kleur donker -> geef witte tekst
  return brightness > 125 ? '#111' : '#fff'
}

/* ---------- STATUS STYLE (via CSS vars) ---------- */
function statusStyle(statusLabel) {
  const opt = statusIndex.value[statusLabel]
  if (!opt || !opt.color) return {}

  const bg = opt.color
  const fg = getTextColorForBg(bg)

  // Gebruik CSS-variabelen zodat CSS het afhandelt
  return {
    '--status-bg': bg,
    '--status-fg': fg,
  }
}

/* ---------- KEBAB STATE ---------- */
const openMenu = ref(null)
const kebabRefs = ref({})
const menuPosition = ref({})

/* ---------- MENU LOGIC ---------- */
function toggleMenu(id) {
  if (openMenu.value === id) {
    openMenu.value = null
    return
  }

  const btn = kebabRefs.value[id]
  if (!btn) return

  const rect = btn.getBoundingClientRect()
  const menuHeight = 180
  const spaceBelow = window.innerHeight - rect.bottom

  const top = spaceBelow < menuHeight ? rect.top - menuHeight - 6 : rect.bottom + 6

  menuPosition.value = {
    position: 'fixed',
    top: `${top}px`,
    left: `${rect.right - 200}px`,
  }

  openMenu.value = id
}

function emitAndClose(event, order) {
  emit(event, order)
  openMenu.value = null
}

/* ---------- CLICK BUITEN ---------- */
function closeOnOutsideClick() {
  openMenu.value = null
}

onMounted(() => {
  document.addEventListener('click', closeOnOutsideClick)
})

onUnmounted(() => {
  document.removeEventListener('click', closeOnOutsideClick)
})
</script>

<style scoped>
.table-wrapper {
  background: white;
  border-radius: 8px;
  overflow: hidden;
}

.table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  table-layout: fixed;
}

thead tr {
  background: #8ec6f7;
}

th,
td {
  padding: 12px 14px;
  border-bottom: 1px solid #e5e7eb;
  text-align: left;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.right {
  text-align: right;
}

.empty {
  text-align: center;
  color: #9ca3af;
  padding: 24px;
}

/* STATUS */
.status-select {
  /* CSS-variabelen komen uit inline style via statusStyle(...) */
  --status-bg: #fff;
  --status-fg: #111;

  padding: 0.5rem 2.2rem 0.5rem 0.75rem;
  border-radius: 8px;
  border: 1px solid #d1d5db;
  font-weight: 500;
  cursor: pointer;

  background-color: var(--status-bg);
  color: var(--status-fg);
}

/* KEBAB */
.kebab-btn {
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
}

.kebab-menu {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  min-width: 200px;
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.15);
  z-index: 10000;
}

.kebab-menu button {
  width: 100%;
  padding: 10px 12px;
  border: none;
  background: none;
  text-align: left;
  cursor: pointer;
}

.kebab-menu button:hover {
  background: #f3f4f6;
}

/* GROEPEN */
.group-row {
  background: #e6f0fa;
  font-weight: 600;
  color: #1f4e79;
}

.group-count {
  font-weight: normal;
  color: #4b5563;
  margin-left: 6px;
}

.row:hover {
  background: #f0f7ff;
}

.row.grouped td:first-child {
  padding-left: 24px;
}

.row.group-end td {
  border-bottom: 2px solid #2f80ed;
}
</style>
