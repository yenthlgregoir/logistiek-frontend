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
          <RouterLink
            v-if="role === 'admin' || role === 'renting'"
            to="/renting/agenda/planning"
            class="card"
          >
            <div class="icon">❄️</div>
            <span>Renting</span>
          </RouterLink>
          <RouterLink v-if="role === 'admin' || role === 'tools'" to="/tools" class="card">
            <div class="icon">🛠️</div>
            <span>Tools</span>
          </RouterLink>
          <RouterLink
            v-if="role === 'admin' || role === 'logistics'"
            to="/logistics/schaarlift/planning"
            class="card"
          >
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
/* ================= PAGE BASE ================= */
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
  padding: 3rem 1.5rem;
}

.content {
  max-width: 900px;
  width: 100%;
  text-align: center;
}

/* ================= LOGO ================= */
.logo-large {
  width: 250px;
  max-width: 40vw;
  height: auto;
  margin-bottom: 1.75rem;
  filter: drop-shadow(0 0 6px rgba(47, 128, 237, 0.3));
  transition: width 0.3s ease;
}

/* ================= HEADINGS ================= */
h1 {
  font-size: 3.5rem;
  color: #0f2e4d;
  margin-bottom: 0.5rem;
  font-weight: 900;
  letter-spacing: 0.07em;
  text-transform: uppercase;
  user-select: none;
  line-height: 1.1;
  transition: font-size 0.3s ease;
}

.subtitle {
  font-size: 1.25rem;
  color: #7fa6c5;
  margin-bottom: 2.5rem;
  font-weight: 400;
  letter-spacing: 0.04em;
  user-select: none;
  transition: font-size 0.3s ease;
}

/* ================= CARDS GRID ================= */
.cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
  gap: 1.5rem;
  justify-items: center;
  margin-bottom: 2.5rem;
}

.card {
  background: #fff;
  padding: 1.5rem 1.75rem;
  border-radius: 1.5rem;
  box-shadow: 0 12px 25px rgba(47, 128, 237, 0.15);
  text-decoration: none;
  color: #0f2e4d;
  display: flex;
  flex-direction: column;
  align-items: center;
  font-weight: 600;
  cursor: pointer;
  user-select: none;
  transition:
    transform 0.3s cubic-bezier(0.4, 0, 0.2, 1),
    box-shadow 0.3s cubic-bezier(0.4, 0, 0.2, 1),
    color 0.3s ease;
  min-height: 140px;
  width: 140px;
}

.card:hover {
  transform: translateY(-8px) scale(1.07);
  box-shadow: 0 20px 40px rgba(47, 128, 237, 0.3);
  color: #2f80ed;
}

.card .icon {
  font-size: 3rem;
  margin-bottom: 1rem;
  transition: color 0.3s ease;
}

.card:hover .icon {
  color: #2563c9;
}

/* ================= LOGOUT BUTTON ================= */
.logout-btn {
  margin: 0 auto;
  display: inline-block;
  cursor: pointer;
  background: #2f80ed;
  color: #fff;
  padding: 0.875rem 2.5rem;
  border-radius: 9999px; /* pill shape */
  font-weight: 700;
  font-size: 1rem;
  box-shadow: 0 6px 12px rgba(47, 128, 237, 0.4);
  transition:
    background 0.3s ease,
    box-shadow 0.3s ease;
  user-select: none;
  min-width: 130px;
}

.logout-btn:hover {
  background: #1f5fb8;
  box-shadow: 0 8px 18px rgba(31, 95, 184, 0.6);
}

/* ================= MEDIA QUERIES ================= */

/* Tablet & kleinere desktops */
@media (max-width: 1024px) {
  .cards {
    grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
    gap: 1.25rem;
  }
  h1 {
    font-size: 2.75rem;
  }
  .subtitle {
    font-size: 1.1rem;
    margin-bottom: 2rem;
  }
  .logo-large {
    width: 220px;
  }
  .card {
    width: 130px;
    min-height: 130px;
  }
}

/* Mobiel */
@media (max-width: 768px) {
  .logo-large {
    width: 180px;
  }
  h1 {
    font-size: 2.25rem;
  }
  .subtitle {
    font-size: 1rem;
    margin-bottom: 1.5rem;
  }
  .cards {
    grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
    gap: 1rem;
  }
  .card {
    width: 120px;
    min-height: 120px;
    padding: 1.25rem 1.5rem;
  }
}

/* Klein mobiel */
@media (max-width: 480px) {
  .logo-large {
    width: 140px;
  }
  h1 {
    font-size: 1.75rem;
  }
  .subtitle {
    font-size: 0.9rem;
    margin-bottom: 1.25rem;
  }
  .cards {
    grid-template-columns: 1fr;
    gap: 1rem;
    max-width: 280px;
    margin-left: auto;
    margin-right: auto;
  }
  .card {
    width: 100%;
    min-height: 100px;
    padding: 1rem 1.5rem;
    border-radius: 1.25rem;
  }
  .logout-btn {
    width: 100%;
    max-width: 280px;
    padding: 1rem 0;
    font-size: 1rem;
  }
}
</style>
