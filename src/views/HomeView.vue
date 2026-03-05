<template>
  <div class="page">
    <!-- Content -->
    <main class="center-wrapper">
      <div class="content">
        <img src="../assets/logo-bumacogroup.svg" alt="Bumaco" class="logo-large" />
        <h2>Logistiek Platform</h2>

        <div class="buttons">
    <RouterLink v-if="role === 'admin' || role === 'purchase'" to="/purchase" class="btn">Purchase</RouterLink>
    <RouterLink v-if="role === 'admin' || role === 'renting'" to="/renting" class="btn">Renting</RouterLink>
    <RouterLink v-if="role === 'admin' || role === 'tools'" to="/tools" class="btn">Tools</RouterLink>
    <RouterLink v-if="role === 'admin' || role === 'logistiek'" to="/logistiek" class="btn">Logistiek</RouterLink>
    <RouterLink v-if="role === 'admin' || role === 'facilities'" to="/facilities" class="btn">Facilities</RouterLink>
    <div class="btn" @click="logout(); router.push('/login')">Logout</div>
  </div>
      </div>
    </main>
  </div>
</template>
<script setup>
import router from '@/router';
const role = localStorage.getItem("role");
function logout(){
  localStorage.removeItem("token")
  router.push('/login')
}
</script>
<style scoped>
.page {
  min-height: 90vh;
  background: #f6f8fb;
  display: flex;
  flex-direction: column;
}


.center-wrapper {
  flex: 1;
  display: flex;
  align-items: center; 
  justify-content: center; 
}

.content {
  text-align: center;
}

.logo-large {
  width: 90%;
  margin-bottom: 16px;
}

h1 {
  font-size: 48px;
  margin: 0;
  color: #0f2e4d;
}

.subtitle {
  color: #7fa6c5;
  margin-bottom: 24px;
}

h2 {
  margin-bottom: 32px;
  font-weight: 500;
}

.buttons {
  display: flex;
  gap: 12px;
  justify-content: center;
  flex-wrap: wrap;
}

.btn {
  background: #2f80ed;
  color: white;
  padding: 8px 18px;
  border-radius: 999px;
  text-decoration: none;
  font-size: 14px;
}

.btn:hover {
  background: #2563c9;
}
</style>
