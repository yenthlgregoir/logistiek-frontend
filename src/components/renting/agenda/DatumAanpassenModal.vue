<template>
  <BaseModal @close="close">
    <!-- HEADER -->
    <template #header>
      <h3>Datum aanpassen</h3>
    </template>

    <!-- BODY -->
    <div class="form-group">
      <label>Begin datum</label>
      <input type="date" v-model="form.beginDatum" required />
    </div>

    <div class="form-group">
      <label>Eind datum</label>
      <input type="date" v-model="form.eindDatum" />
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
import { reactive, onMounted, ref } from 'vue'
import BaseModal from '@/components/base/BaseModal.vue'

const props = defineProps({
  boeking: Object,
})

const emit = defineEmits(['close', 'update'])

const errorMessage = ref('')
const form = reactive({
  beginDatum: '',
  eindDatum: '',
})

onMounted(() => {
  form.beginDatum = props.boeking.beginDatum?.split('T')[0]
  form.eindDatum = props.boeking.eindDatum?.split('T')[0]
})

function close() {
  emit('close')
}

async function save() {
  errorMessage.value = ''

  emit('update', {
    beginDatum: form.beginDatum,
    eindDatum: form.eindDatum || null,
  })

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
