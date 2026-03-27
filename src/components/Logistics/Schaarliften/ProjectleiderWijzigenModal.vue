<template>
  <BaseModal @close="$emit('close')">
    <template #header>
      <h3>Projectleider wijzigen</h3>
    </template>

    <input
      v-model="search"
      placeholder="Zoek projectleider..."
      class="search-input"
      type="text"
    />

    <ul class="list">
      <li
        v-for="p in filtered"
        :key="p._id"
        class="list-item"
        @click="select(p)"
      >
        {{ p.naam }}
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
  projectleiders: Array
})

const emit = defineEmits(['close', 'select'])

const search = ref('')

const filtered = computed(() =>
  !search.value
    ? props.projectleiders
    : props.projectleiders.filter(p =>
        p.naam.toLowerCase().includes(search.value.toLowerCase())
      )
)

function select(p) {
  emit('select', p)
  emit('close')
}
</script>
