<template>
  <div class="page">
    <main class="center-wrapper">
      <div class="content">
        <img src="../assets/logo-bumacogroup.svg" alt="Bumaco" class="logo-large" />

        <h1>Ops Platform</h1>
        <p class="subtitle">Welkom bij het centrale dashboard</p>
        <div class="cards">
          <RouterLink v-if="role === 'admin' || role === 'purchase'" to="/purchase" class="card">
            <div class="icon">🛒</div>
            <span>Purchase</span>
          </RouterLink>
          <RouterLink v-if="role === 'admin' || role === 'renting'" to="/renting/agenda/planning" class="card">
            <div class="icon">❄️</div>
            <span>Renting</span>
          </RouterLink>
          <RouterLink v-if="role === 'admin' || role === 'tools'" to="/tools" class="card">
            <div class="icon">🛠️</div>
            <span>Tools</span>
          </RouterLink>
          <RouterLink v-if="role === 'admin' || role === 'logistics'" to="/logistics/schaarlift/planning" class="card">
            <div class="icon">🚚</div>
            <span>Logistiek</span>
          </RouterLink>
          <RouterLink
            v-if="role === 'admin' || role === 'facilities'"
            to="/facilities"
            class="card"
          >
            <div class="icon">🏢</div>
            <span>Facilities</span>
          </RouterLink>
          <RouterLink v-if="role === 'admin'" to="/admin/users" class="card">
            <div class="icon">⚙️</div>
            <span>Admin</span>
          </RouterLink>
        </div>
        <div class="logout-btn" @click="logout()">Logout</div>
      </div>
    </main>
  </div>
</template>

<script setup>
import router from '@/router'
const role = localStorage.getItem('role')

function logout() {
  localStorage.removeItem('token')
  router.push('/login')
}
</script>

<style scoped>
.page {
  min-height: 100vh;
  background: linear-gradient(135deg, #f9fbff, #e6f0ff);
  display: flex;
  flex-direction: column;
}

.center-wrapper {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 48px 24px;
}

.content {
  max-width: 80vw;
  margin: 0 auto;
  text-align: center;
  width: 100%;
}

.logo-large {
  width: 55vw;
  max-width: 280px;
  height: auto;
  margin-bottom: 28px;
  filter: drop-shadow(0 0 2px rgba(47, 128, 237, 0.3));
}

h1 {
  font-size: 48px;
  color: #0f2e4d;
  margin-bottom: 6px;
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  user-select: none;
}

.subtitle {
  font-size: 18px;
  color: #7fa6c5;
  margin-bottom: 40px;
  font-weight: 400;
  letter-spacing: 0.03em;
}

.cards {
  display: grid;
  grid-auto-flow: column; /* kaarten op één rij */
  grid-auto-columns: 140px; /* vaste breedte van elke kaart */
  justify-content: center; /* belangrijk: centreren van alle kaarten als groep */
  gap: 24px;
  margin-bottom: 40px;
}
.card {
  background: white;
  padding: 24px;
  border-radius: 20px;
  box-shadow: 0 12px 25px rgba(47, 128, 237, 0.15);
  text-decoration: none;
  color: #0f2e4d;
  display: flex;
  flex-direction: column;
  align-items: center;
  font-weight: 600;
  transition:
    transform 0.3s cubic-bezier(0.4, 0, 0.2, 1),
    box-shadow 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  user-select: none;
  cursor: pointer;
}

.card:hover {
  transform: translateY(-10px) scale(1.05);
  box-shadow: 0 20px 35px rgba(47, 128, 237, 0.3);
  color: #2f80ed;
}

.card .icon {
  font-size: 40px;
  margin-bottom: 14px;
  transition: color 0.3s;
}

.card:hover .icon {
  color: #2563c9;
}

.logout-btn {
  margin: 0 auto;
  display: inline-block;
  cursor: pointer;
  background: #2f80ed;
  color: white;
  padding: 14px 38px;
  border-radius: 30px;
  font-weight: 700;
  font-size: 16px;
  box-shadow: 0 6px 12px rgba(47, 128, 237, 0.4);
  transition:
    background 0.3s ease,
    box-shadow 0.3s ease;
  user-select: none;
}

.logout-btn:hover {
  background: #1f5fb8;
  box-shadow: 0 8px 18px rgba(31, 95, 184, 0.6);
}
@media (max-width: 1024px) {
  .cards {
    grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  }
}
@media (max-width: 700px) {
  .cards {
    grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
    gap: 16px;
    justify-items: center; /* centreren van de kaarten per kolom */
  }
}
@media (max-width: 600px) {
  .cards {
    grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
    gap: 16px;
  }
}
</style>
