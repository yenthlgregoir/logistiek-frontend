<template>
  <BaseModal @close="$emit('close')">
    <template #header>
      <h3>Werf wijzigen</h3>
    </template>

    <input v-model="search" placeholder="Zoek werf..." class="search-input" type="text" />

    <ul class="list">
      <li v-for="w in filtered" :key="w._id" class="list-item" @click="select(w)">
        {{ w.naam }}
      </li>
    </ul>

    <template #footer>
      <button class="btn-cancel" @click="$emit('close')">Annuleren</button>
    </template>
  </BaseModal>
</template>

<script setup>
import { computed, ref } from 'vue'
import BaseModal from '@/components/base/BaseModal.vue'

const props = defineProps({
  werven: Array,
})

const emit = defineEmits(['close', 'select'])

const search = ref('')

const filtered = computed(() =>
  !search.value
    ? props.werven
    : props.werven.filter((w) => w.naam.toLowerCase().includes(search.value.toLowerCase())),
)

function select(w) {
  emit('select', w)
  emit('close')
}
</script>
