<template>
  <Transition name="drawer">
    <div v-if="show" class="drawer-wrapper">
      <div class="drawer">
        <!-- HEADER -->
        <div class="drawer-header">
          <h3>Werf</h3>
          <div class="header-actions">
            <button v-if="!isEditing" class="edit-btn" @click="startEdit">✏️</button>
            <button v-if="!isEditing" class="delete-btn" @click="showConfirm = true">🗑️</button>
            <button class="close-btn" @click="$emit('close')">✕</button>
          </div>
        </div>

        <!-- CONTENT -->
        <div class="drawer-content">
          <div class="werf-container">
            <!-- VIEW MODE -->
            <template v-if="!isEditing">
              <div class="info-block">
                <label>Naam</label>
                <div class="value">{{ werf.naam }}</div>
              </div>

              <div class="info-block">
                <label>Adres</label>
                <div class="value">{{ formatLocatie(werf) }}</div>
              </div>

              <div class="info-block">
                <label>Status</label>
                <div class="value status" :class="werf.status">
                  {{ werf.status }}
                </div>
              </div>

              <div class="info-block">
                <label>Contact persoon</label>
                <div class="value">{{ werf.contactPersoon }}</div>
              </div>
            </template>

            <!-- EDIT MODE -->
            <template v-else>
              <div class="info-block">
                <label>Naam</label>
                <input v-model="editableWerf.naam" />
              </div>

              <div class="info-block">
                <label>Straat</label>
                <input v-model="editableWerf.adres.straat" />
              </div>

              <div class="info-block">
                <label>Huisnummer</label>
                <input v-model="editableWerf.adres.huisnummer" />
              </div>

              <div class="info-block">
                <label>Postcode</label>
                <input v-model="editableWerf.adres.postcode" />
              </div>

              <div class="info-block">
                <label>Gemeente</label>
                <input v-model="editableWerf.adres.gemeente" />
              </div>

              <div class="info-block">
                <label>Status</label>
                <select v-model="editableWerf.status">
                  <option>Bezig</option>
                  <option>Afgerond</option>
                  <option>Onderhoud</option>
                </select>
              </div>

              <div class="info-block">
                <label>Contact persoon</label>
                <input v-model="editableWerf.contactPersoon" />
              </div>

              <div class="form-actions">
                <button class="save-btn" @click="saveEdit">💾 Opslaan</button>
                <button class="cancel-btn" @click="cancelEdit">Annuleren</button>
              </div>
            </template>

            <!-- MAP -->
            <div class="info-block">
              <label>Kaart</label>
              <div v-if="show" class="map-container">
                <iframe
                  :src="mapUrl"
                  width="100%"
                  height="300"
                  style="border: 0"
                  allowfullscreen
                  loading="lazy"
                ></iframe>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- DELETE CONFIRM -->
      <ConfirmationPopup
        v-if="showConfirm"
        title="Verwijderen"
        message="Weet je zeker dat je deze werf wilt verwijderen?"
        @confirm="confirmDelete"
        @cancel="showConfirm = false"
      />
    </div>
  </Transition>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import ConfirmationPopup from '@/components/popup/ConfirmationPopup.vue'

const API_BASE = import.meta.env.VITE_MAPS_API_KEY

const props = defineProps({
  werf: { type: Object, required: true },
  show: { type: Boolean, default: false },
})

const emit = defineEmits(['close', 'delete', 'edit'])

const showConfirm = ref(false)
const isEditing = ref(false)
const editableWerf = ref({})

// Sync props → editable copy
watch(
  () => props.werf,
  (val) => {
    editableWerf.value = JSON.parse(JSON.stringify(val))

    // fallback voor adres
    if (!editableWerf.value.adres) {
      editableWerf.value.adres = {
        straat: '',
        huisnummer: '',
        postcode: '',
        gemeente: '',
      }
    }
  },
  { immediate: true },
)

function formatLocatie(w) {
  if (!w.adres) return 'Onbekend'
  return `${w.adres.straat || ''} ${w.adres.huisnummer || ''}, ${
    w.adres.postcode || ''
  } ${w.adres.gemeente || ''}`
}

const mapUrl = computed(() => {
  const { straat, huisnummer, postcode, gemeente } = editableWerf.value.adres || {}
  if (!straat) return ''
  const address = `${straat} ${huisnummer || ''}, ${postcode || ''} ${gemeente || ''}`.trim()
  return `https://www.google.com/maps/embed/v1/place?key=${API_BASE}&q=${encodeURIComponent(address)}`
})

// DELETE
function confirmDelete() {
  emit('delete', props.werf._id)
  showConfirm.value = false
}

// EDIT
function startEdit() {
  isEditing.value = true
}

function cancelEdit() {
  isEditing.value = false
  editableWerf.value = JSON.parse(JSON.stringify(props.werf))
}

function saveEdit() {
  emit('edit', editableWerf.value)
  isEditing.value = false
  emit('close')
}
</script>

<style scoped>
.drawer-wrapper {
  position: fixed;
  top: 0;
  right: 0;
  height: 100vh;
  z-index: 1000;
}

.drawer {
  width: 400px;
  height: 100%;
  background: #fff;
  border-radius: 12px 0 0 12px;
  box-shadow: -10px 0 30px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
}

.drawer-enter-from,
.drawer-leave-to {
  transform: translateX(100%);
}
.drawer-enter-active,
.drawer-leave-active {
  transition: transform 0.3s ease;
}

.drawer-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #e5e7eb;
}

.header-actions {
  display: flex;
  gap: 10px;
}

.close-btn,
.delete-btn,
.edit-btn {
  width: 36px;
  height: 36px;
  border: none;
  border-radius: 10px;
  cursor: pointer;
}

.close-btn {
  background: #f3f4f6;
}
.close-btn:hover {
  background: #ef4444;
  color: white;
}

.delete-btn {
  background: #fee2e2;
  color: #7f1d1d;
}
.delete-btn:hover {
  background: #f87171;
  color: white;
}

.edit-btn {
  background: #e0e7ff;
}
.edit-btn:hover {
  background: #6366f1;
  color: white;
}

.drawer-content {
  padding: 20px;
  overflow-y: auto;
}

.werf-container {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.info-block {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.info-block label {
  font-size: 13px;
  color: #6b7280;
}

.value {
  font-size: 15px;
  font-weight: 500;
  color: #111827;
}

.status {
  display: inline-block;
  padding: 6px 10px;
  border-radius: 8px;
  width: fit-content;
}

.status.Bezig {
  background: #9add91;
  color: #065f46;
}
.status.Afgerond {
  background: #fee2e2;
  color: #7f1d1d;
}
.status.Onderhoud {
  background: #5786f7;
  color: #e0f2fe;
}

input,
select {
  padding: 8px;
  border-radius: 8px;
  border: 1px solid #d1d5db;
  font-size: 14px;
}

input:focus,
select:focus {
  outline: none;
  border-color: #6366f1;
}

.form-actions {
  display: flex;
  gap: 10px;
  margin-top: 10px;
}

.save-btn {
  background: #10b981;
  color: white;
  padding: 8px 12px;
  border-radius: 8px;
  border: none;
  cursor: pointer;
}

.cancel-btn {
  background: #e5e7eb;
  padding: 8px 12px;
  border-radius: 8px;
  border: none;
  cursor: pointer;
}

@media (max-width: 768px) {
  .drawer {
    width: 90vw;
  }
}
</style>
