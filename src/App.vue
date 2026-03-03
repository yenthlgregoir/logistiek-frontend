<template>
  <HeaderComponent />
  <router-view />
</template>

<style>
body {
  margin: 0;
  font-family: 'Segoe UI', Roboto, sans-serif;
  background-color: #f6f8fb;
}
</style>
<script setup>
import HeaderComponent from '@/components/HeaderComponent.vue'
</script>
