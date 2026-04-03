<template>
  <BaseModal @close="close">
    <!-- HEADER -->
    <template #header>
      <h2>Kies Leveradres</h2>
    </template>

    <!-- BODY -->
    <input type="text" v-model="search" placeholder="Zoek adres..." class="search-input" />

    <ul class="list">
      <li
        v-for="adres in gefilterdeAdressen"
        :key="adres._id"
        @click="selectAdres(adres)"
        class="list-item"
      >
        <div class="adres-title">{{ adres.naam || 'Onbekend' }}</div>
        <div class="adres-sub">
          {{ adres.straat }} {{ adres.huisnummer || '' }}, {{ adres.postcode }} {{ adres.stad }}
        </div>
      </li>
    </ul>

    <!-- FOOTER -->
    <template #footer>
      <button class="btn-cancel" @click="close">Annuleren</button>
    </template>
  </BaseModal>
</template>

<script setup>
import { ref, computed } from 'vue'
import BaseModal from '@/components/base/BaseModal.vue'

const props = defineProps({
  adressen: { type: Array, required: true },
})

const emit = defineEmits(['select', 'close'])

const search = ref('')

const gefilterdeAdressen = computed(() => {
  if (!search.value) return props.adressen

  const q = search.value.toLowerCase()
  return props.adressen.filter(
    (a) =>
      (a.naam && a.naam.toLowerCase().includes(q)) ||
      (a.straat && a.straat.toLowerCase().includes(q)) ||
      (a.stad && a.stad.toLowerCase().includes(q)),
  )
})

function selectAdres(adres) {
  emit('select', adres)
  close()
}

function close() {
  emit('close')
}
</script>

<style scoped>
/* ✅ AL jouw originele CSS blijft EXACT behouden */
/* Je hoeft niets aan te passen, alle klasses bestaan nog steeds */

/* Alles uit jouw stylesheet kan 1 op 1 blijven staan */
</style>
<style scoped>
/* =========================================
   ADRES LIJST
========================================= */
/* =========================================
   FOOTER
========================================= */
.modal-footer {
  display: flex;
  justify-content: flex-end;
  margin-top: 8px;
}

.btn-cancel {
  background: rgba(0, 0, 0, 0.06);
  border: none;
  padding: 10px 18px;
  border-radius: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: 0.25s ease;
  color: #374151;
}

.btn-cancel:hover {
  background: rgba(0, 0, 0, 0.12);
}
</style>
