<template>
  <BaseModal @close="$emit('close')">
    <template #header><h3>Periode aanpassen</h3></template>
    <div class="form-group">
      <label>Leveren: datum en tijd</label>
      <input v-model="form.leverDatum" type="datetime-local" step="1" required />
    </div>
    <div class="form-group">
      <label>Ophalen: datum en tijd (optioneel)</label>
      <input v-model="form.ophaalDatum" type="datetime-local" step="1" />
    </div>
    <div v-if="errorMessage" class="error-box" role="alert">{{ errorMessage }}</div>
    <template #footer><button type="button" class="toevoegen-btn" @click="save">Overnemen</button></template>
  </BaseModal>
</template>

<script setup>
import { reactive, ref, watch } from 'vue'
import BaseModal from '@/components/base/BaseModal.vue'
const props = defineProps({ boeking: Object })
const emit = defineEmits(['close', 'save'])
const errorMessage = ref('')
const form = reactive({ leverDatum: '', ophaalDatum: '' })
function localDateTime(value) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  const pad = (number) => String(number).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
}
watch(() => props.boeking, (value) => {
  form.leverDatum = localDateTime(value?.leverDatum)
  form.ophaalDatum = localDateTime(value?.ophaalDatum)
}, { immediate: true })
function save() {
  errorMessage.value = ''
  const start = new Date(form.leverDatum)
  const end = form.ophaalDatum ? new Date(form.ophaalDatum) : null
  if (!form.leverDatum || Number.isNaN(start.getTime()) || (end && Number.isNaN(end.getTime()))) {
    errorMessage.value = 'Vul een geldige datum en tijd in'
    return
  }
  if (end && end < start) { errorMessage.value = 'Ophalen mag niet voor leveren liggen'; return }
  emit('save', { leverDatum: start.toISOString(), ophaalDatum: end?.toISOString() ?? null })
  emit('close')
}
</script>
<style scoped>

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


