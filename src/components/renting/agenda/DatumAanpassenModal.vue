<template>
  <div class="modal-overlay" @click.self="close">
    <div class="modal">
      <!-- HEADER -->
      <div class="modal-header">
        <h3>Datum aanpassen</h3>
        <button class="close-btn" @click="close">✖</button>
      </div>

      <!-- BEGIN DATUM -->
      <div class="form-group">
        <label>Begin datum</label>
        <input type="date" v-model="form.beginDatum" required />
      </div>

      <!-- EIND DATUM -->
      <div class="form-group">
        <label>Eind datum</label>
        <input type="date" v-model="form.eindDatum" />
      </div>

      <!-- ERROR -->
      <div v-if="errorMessage" class="error-box">
        {{ errorMessage }}
      </div>

      <div class="modal-footer">
        <button class="toevoegen-btn" @click="save">Opslaan</button>
      </div>
    </div>
  </div>
</template>
<script setup>
import { reactive, onMounted, ref } from 'vue'
import { boekingApi } from '@/api/boeking'

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
  console.log(props.boeking)

  form.beginDatum = props.boeking.beginDatum?.split('T')[0]
  form.eindDatum = props.boeking.eindDatum?.split('T')[0]
})

function close() {
  emit('close')
}

async function save() {
  errorMessage.value = ''

  // als einddatum leeg → 5 jaar later
  if (!form.eindDatum) {
    const begin = new Date(form.beginDatum)
    begin.setFullYear(begin.getFullYear() + 5)
    form.eindDatum = begin.toISOString().split('T')[0]
  }

  try {
    await boekingApi.updatePeriode(props.boeking._id, form.beginDatum, form.eindDatum)

    emit('update')
    emit('close')
  } catch (e) {
    const parsed = JSON.parse(e.message)
    errorMessage.value = parsed.message
  }
}
</script>

<style scoped>
/* =========================================
   OVERLAY
========================================= */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.55);
  backdrop-filter: blur(8px);
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 1.5rem;
  z-index: 9999;
  animation: fadeIn 0.25s ease-out;
}

/* =========================================
   MODAL CONTAINER
========================================= */
.modal {
  width: 95%;
  max-width: 520px;
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(14px);
  border-radius: 22px;
  padding: 32px;
  box-shadow:
    0 12px 40px rgba(0, 0, 0, 0.16),
    0 4px 12px rgba(0, 0, 0, 0.08);
  animation: slideUp 0.3s ease-out;
  font-family: 'Inter', sans-serif;
}

/* =========================================
   HEADER
========================================= */
.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 14px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
  margin-bottom: 24px;
}

.modal-header h3 {
  font-size: 22px;
  font-weight: 700;
  color: #0f172a;
}

/* Close Button */
.close-btn {
  width: 38px;
  height: 38px;
  border: none;
  background: rgba(0, 0, 0, 0.06);
  border-radius: 12px;
  cursor: pointer;
  font-size: 18px;
  color: #475569;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: 0.25s;
}

.close-btn:hover {
  background: #ef4444;
  color: #fff;
}

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
.modal-footer {
  margin-top: 28px;
  display: flex;
  justify-content: flex-end;
}

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
@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(26px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

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
