
<template>
  <div class="page">
  </div>
</template>
<script setup>
import { onMounted, ref } from 'vue';
import { loginApi } from '@/api/login';

const users = ref([])

onMounted(async () => {
  await getUsers()
})

async function getUsers(){
try {
    users.value = await loginApi.getUsers();
    console.log(users.value
    )
  } catch (err) {
    console.error(err)
  }
}
</script>

<style scoped>
</style>