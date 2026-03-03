<template>
  <div class="modal" @keydown.esc="$emit('close')">
    <div class="modal-content">
      <h3>{{ isEditing ? 'Bestelling aanpassen' : 'Nieuwe bestelling' }}</h3>
      <form @submit.prevent="$emit('save')">
        <input v-model="form.ref" placeholder="Referentie" required />
        <input v-model="form.aanvrager" placeholder="Aanvrager" required />
        <input v-model="form.leverancier" placeholder="Leverancier" required />
        <input v-model="form.categorie" placeholder="Categorie" required />
        <select
          v-model="form.status"
          required
          :style="{
            backgroundColor: statusColor(form.status),
          }"
        >
          <option disabled value="">-- Kies status --</option>
          <option v-for="s in statusOptions" :key="s.label" :value="s.label">{{ s.label }}</option>
        </select>
        <div class="modal-actions">
          <button type="submit" class="btn btn-primary">
            {{ isEditing ? 'Opslaan' : 'Toevoegen' }}
          </button>
          <button type="button" class="btn" @click="$emit('close')">Annuleren</button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  form: Object,
  isEditing: Boolean,
  statusOptions: Array,
})

function statusColor(status) {
  return props.statusOptions.find((s) => s.label === status)?.color || '#fff'
}
</script>

<style scoped>
.modal {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  justify-content: center;
  align-items: center;
}

.modal-content {
  background: white;
  padding: 20px;
  width: 360px;
  border-radius: 6px;
}

.modal-content input,
.modal-content select {
  width: 100%;
  margin-bottom: 10px;
  padding: 8px;
  border: 1px solid black;
  border-radius: 6px;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
</style>
