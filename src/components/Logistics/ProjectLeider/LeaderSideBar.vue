<template>
  <BaseDrawer
    :show="show"
    :title="isEditMode ? 'Projectleider' : 'Nieuwe Projectleider'"
    @close="$emit('close')"
  >
    <div class="form-container">
      <!-- Fields except entiteit -->
      <div
        class="info-block"
        v-for="field in visibleFields"
        :key="field.key"
      >
        <label>{{ field.label }}</label>
        <div v-if="isEditMode && !isEditing">{{ leaderCopy[field.key] || 'N/A' }}</div>
        <input v-else v-model="leaderCopy[field.key]" :type="field.type" />
      </div>

      <!-- Entiteit select with full object -->
      <div class="info-block">
        <label>Entiteit</label>
        <div v-if="isEditMode && !isEditing">
          <span class="material-icons" :style="{ color: leaderCopy.entiteit?.kleur }">
            {{ leaderCopy.entiteit?.icon }}
          </span>
          {{ leaderCopy.entiteit?.naam || 'Onbekend' }}
        </div>
        <div v-else>
         <select v-model="leaderCopy.entiteit">
  <option disabled value="">Selecteer entiteit</option>
  <option
    v-for="entiteit in entiteiten"
    :key="entiteit._id"
    :value="entiteit"
  >
    {{ entiteit.naam }}
  </option>
</select>
        </div>
      </div>
    </div>

    <!-- Confirm delete -->
    <template v-if="isEditMode" #confirm-popup>
      <ConfirmationPopup
        v-if="showConfirm"
        title="Verwijderen"
        message="Weet je zeker dat je deze projectleider wilt verwijderen?"
        @confirm="confirmDelete"
        @cancel="showConfirm = false"
      />
    </template>

    <!-- Header actions -->
    <template v-if="isEditMode" #header-actions>
      <button class="edit-btn" v-if="!isEditing" @click="startEdit">✏️</button>
      <button class="delete-btn" @click="showConfirm = true">🗑️</button>
      <button class="close-btn" @click="$emit('close')">✕</button>
    </template>

    <!-- Footer -->
    <template #footer>
      <button class="btn btn-secondary" @click="$emit('close')">Cancel</button>
      <button class="btn btn-primary" @click="saveLeader">
        {{ isEditMode ? (isEditing ? 'Save' : 'Edit') : 'Create' }}
      </button>
    </template>
</BaseDrawer>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import ConfirmationPopup from '@/components/popup/ConfirmationPopup.vue'
import BaseDrawer from '@/components/base/BaseDrawer.vue'

const props = defineProps({
  leader: { type: Object, default: null },
  show: Boolean,
  entiteiten: { type: Array, default: () => [] }
})
const emit = defineEmits(['close', 'save', 'edit', 'delete'])

const isEditMode = ref(!!props.leader)
const isEditing = ref(false)
const showConfirm = ref(false)

const leaderCopy = ref({
  naam: '',
  mailAdres: '',
  telefoonnummer: '',
  entiteit: null
})

const fields = [
  { key: 'naam', label: 'Naam', type: 'text' },
  { key: 'mailAdres', label: 'Mail', type: 'email' },
  { key: 'telefoonnummer', label: 'Telefoon', type: 'text' }
]

const visibleFields = computed(() => fields)

watch(
  () => props.leader,
  (val) => {
    if (val) {
      isEditMode.value = true
      // Deep copy van leader
      const copy = JSON.parse(JSON.stringify(val))

      // Vervang entiteit ID/object door volledig object uit props.entiteiten
      if (copy.entiteit) {
        const fullEntiteit = props.entiteiten.find(e => e._id === copy.entiteit._id || e._id === copy.entiteit)
        copy.entiteit = fullEntiteit || null
      } else {
        copy.entiteit = null
      }

      leaderCopy.value = copy
      isEditing.value = false
    } else {
      isEditMode.value = false
      leaderCopy.value = { naam: '', mailAdres: '', telefoonnummer: '', entiteit: null }
      isEditing.value = true
    }
  },
  { immediate: true }
)

watch(
  () => props.show,
  (val) => {
    if (!val) {
      leaderCopy.value = { naam: '', mailAdres: '', telefoonnummer: '', entiteit: null }
      isEditing.value = false
      showConfirm.value = false
    }
  }
)

function startEdit() {
  isEditing.value = true
}

function saveLeader() {
  if (isEditMode.value) {
    if (!isEditing.value) return startEdit()
    emit('edit', leaderCopy.value)
    isEditing.value = false
  } else {
    emit('save', leaderCopy.value)
    leaderCopy.value = { naam: '', mailAdres: '', telefoonnummer: '', entiteit: null }
  }
}

function confirmDelete() {
  emit('delete', props.leader._id)
  showConfirm.value = false
}
</script>

<style scoped>
.form-container {
  display: flex;
  flex-direction: column;
  gap: 15px;
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

.edit-btn,
.delete-btn,
.close-btn {
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

.btn-primary {
  background: #5786f7;
  color: white;
}

.btn-primary:hover {
  background: #5077d3;
}

.btn-secondary {
  background: #e5e7eb;
  color: #111827;
}

.btn-secondary:hover {
  background: #d1d5db;
}

.info-block input,
.info-block select {
  padding: 8px 10px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 14px;
}
.material-icons {
  vertical-align: middle;
  margin-right: 6px;
}
</style>