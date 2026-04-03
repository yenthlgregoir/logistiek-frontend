<template>
  <BaseModal @close="close">
    <!-- HEADER -->
    <template #header>
      <h3>Datum aanpassen</h3>
    </template>

    <!-- BODY -->
    <div class="form-group">
      <label>Begin datum</label>
      <input type="date" v-model="form.leverDatum" required />
    </div>

    <div class="form-group">
      <label>Eind datum</label>
      <input type="date" v-model="form.ophaalDatum" />
    </div>

    <div v-if="errorMessage" class="error-box">
      {{ errorMessage }}
    </div>

    <!-- FOOTER -->
    <template #footer>
      <button class="toevoegen-btn" @click="save">Opslaan</button>
    </template>
  </BaseModal>
</template>

<script setup>
import { reactive, ref, watch } from 'vue'
import BaseModal from '@/components/base/BaseModal.vue'

const props = defineProps({
  boeking: Object,
})

const emit = defineEmits(['close', 'save'])

const errorMessage = ref('')

// Lokaal kopie van de data
const form = reactive({
  leverDatum: '',
  ophaalDatum: '',
})

// Vul lokale kopie bij mount of wanneer boeking verandert
watch(
  () => props.boeking,
  (v) => {
    if (!v) return
    form.leverDatum = v.leverDatum?.split('T')[0] || ''
    form.ophaalDatum = v.ophaalDatum?.split('T')[0] || ''
  },
  { immediate: true },
)

function close() {
  emit('close')
}

// Save stuurt de lokale kopie terug naar de parent (drawer)
function save() {
  if (!form.leverDatum) {
    errorMessage.value = 'Begin datum is verplicht'
    return
  }

  // Als einddatum leeg is → 5 jaar later
  const lever = form.leverDatum
  const ophaal =
    form.ophaalDatum ||
    (() => {
      const d = new Date(lever)
      d.setFullYear(d.getFullYear() + 5)
      return d.toISOString().split('T')[0]
    })()

  emit('save', { leverDatum: lever, ophaalDatum: ophaal })
  emit('close')
}
</script>
<style scoped>
/* ✅ AL JE ORIGINELE CSS BLIJFT GELDIG — BaseModal vervangt alleen overlay & container */

/* =========================================
   FORM GROUPS
========================================= */
.form-group {
  display: flex;
  flex-direction: column;
  margin-bottom: 20px;
}

.form-group label {
  font-size: 14px;
  font-weight: 600;
  color: #475569;
  margin-bottom: 6px;
}

.form-group input {
  padding: 12px 14px;
  font-size: 15px;
  border-radius: 12px;
  border: 1px solid #cbd5e1;
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(4px);
  transition: 0.25s ease;
}

.form-group input:focus {
  outline: none;
  border-color: #4f73ff;
  background: white;
  box-shadow: 0 0 0 4px rgba(79, 115, 255, 0.2);
}

/* =========================================
   ERROR BOX
========================================= */
.error-box {
  background: #fee2e2;
  color: #b91c1c;
  border: 1px solid #fca5a5;
  padding: 12px 14px;
  border-radius: 10px;
  font-size: 14px;
  margin-top: -4px;
  margin-bottom: 18px;
  font-weight: 500;
  animation: shake 0.25s ease-out;
}

/* =========================================
   FOOTER
========================================= */
.toevoegen-btn {
  background: #4f73ff;
  color: white;
  border: none;
  padding: 10px 18px;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: 0.25s ease;
}

.toevoegen-btn:hover {
  background: #355dff;
  box-shadow: 0 4px 14px rgba(79, 115, 255, 0.25);
}

/* =========================================
   ANIMATIONS
========================================= */
@keyframes shake {
  0% {
    transform: translateX(0);
  }
  25% {
    transform: translateX(-3px);
  }
  50% {
    transform: translateX(3px);
  }
  75% {
    transform: translateX(-3px);
  }
  100% {
    transform: translateX(0);
  }
}
</style>
