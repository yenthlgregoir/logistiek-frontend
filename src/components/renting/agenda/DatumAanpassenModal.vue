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
      <input type="date" v-model="form.eindDatum"  />
    </div>

    <!-- ERROR -->
<div v-if="errorMessage" class="error-box">
  {{ errorMessage }}
</div>

    <div class="modal-footer">
      <button class="toevoegen-btn" @click="save">
        Opslaan
      </button>
    </div>

  </div>
</div>
</template>
<script setup>
import { reactive, onMounted, ref } from "vue"
import { boekingApi } from "@/api/boeking"

const props = defineProps({
  boeking: Object,
})

const emit = defineEmits(["close","update"])
const errorMessage = ref("")
const form = reactive({
  beginDatum: "",
  eindDatum: ""
})

onMounted(() => {
  console.log(props.boeking)

  form.beginDatum = props.boeking.beginDatum?.split("T")[0]
  form.eindDatum = props.boeking.eindDatum?.split("T")[0]
})

function close(){
  emit("close")
}

async function save(){

  errorMessage.value = ""

  // als einddatum leeg → 5 jaar later
  if(!form.eindDatum){
    const begin = new Date(form.beginDatum)
    begin.setFullYear(begin.getFullYear() + 5)
    form.eindDatum = begin.toISOString().split("T")[0]
  }

  try{

    await boekingApi.updatePeriode(
      props.boeking._id,
      form.beginDatum,
      form.eindDatum
    )

    emit("update")
    emit("close")

  }catch(e){
    const parsed = JSON.parse(e.message)
    errorMessage.value = parsed.message
  }
}
</script>

<style scoped>

.modal-overlay{
  position:fixed;
  inset:0;
  background:rgba(0,0,0,0.45);
  display:flex;
  align-items:center;
  justify-content:center;
  z-index:1000;
}

.modal-header h3{
  font-size:20px;
  font-weight:600;
}

.modal-header{
  display:flex;
  justify-content:space-between;
  align-items:center;
  padding-bottom:12px;
  border-bottom:1px solid #e5e7eb;
  margin-bottom:20px;
}

.modal{
  width:680px;
  background:white;
  border-radius:14px;
  padding:28px;
  box-shadow:
    0 10px 30px rgba(0,0,0,0.08),
    0 2px 10px rgba(0,0,0,0.06);
  max-height:90vh;
  overflow-y:auto;
  animation:fadeIn 0.25s ease-out;
}

.form-group{
  display:flex;
  flex-direction:column;
  margin-bottom:16px;
}

.form-group label{
  font-size:14px;
  margin-bottom:4px;
  color:#555;
}

.form-group input{
  padding:8px;
  border-radius:6px;
  border:1px solid #ddd;
}

.modal-footer{
  margin-top:26px;
  display:flex;
  justify-content:flex-end;
  gap:10px;
}

.toevoegen-btn{
  background:#3498db;
  color:white;
  border:none;
  padding:8px 16px;
  border-radius:8px;
  cursor:pointer;
}

.toevoegen-btn:hover{
  background:#2c7db3;
}

.danger-btn{
  background:#ef4444;
  color:white;
  border:none;
  padding:8px 16px;
  border-radius:8px;
  cursor:pointer;
}

.danger-btn:hover{
  background:#dc2626;
}

.close-btn{
  border:none;
  background:none;
  font-size:18px;
  cursor:pointer;
}

@keyframes fadeIn{
  from{
    opacity:0;
    transform:translateY(-10px);
  }
  to{
    opacity:1;
    transform:translateY(0);
  }
}

</style>