<template>
  <span class="tools-badge" :class="value">{{ statusLabel(value) }}</span>
</template>
<script setup>
import { statusLabel } from '@/utils/uitleen'
defineProps({ value: String })
</script>
