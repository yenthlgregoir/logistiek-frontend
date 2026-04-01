<template>
  <div class="page">
    <main class="center-wrapper">
      
      <!-- Loading screen -->
      <div v-if="showLoading" class="loading-screen">
        <div class="loader"></div>
        <p>{{ currentMessage }}</p>
      </div>

      <!-- Error screen -->
      <div v-if="showError" class="error-popup">
        <div class="error-content">
          <p>Steven je hebt weer op vieze sites gezeten! 😱</p>
          <button @click="showAprilFoolPopup">OK</button>
          <button @click="showAprilFoolPopup">NEE</button>
        </div>
      </div>

      <!-- April Fool image -->
      <div v-if="showAprilFool" class="april-popup prank-cursor">
  <div class="april-content">

    <!-- Eerste afbeelding -->
    <template v-if="!showSecondImage && !showThirdImage">
      <img src="/image.png" alt="April Fools" />
      <button @click="goToSecondImage">Ga verder naar renting</button>
    </template>

    <!-- Tweede afbeelding -->
    <template v-else-if="showSecondImage && !showThirdImage">
      <img src="/image2.jpeg" alt="Second Image" />
      <p>Bijna daar... 👀</p>
      <button @click="goToThirdImage">Naar renting</button>
    </template>

    <!-- Derde afbeelding -->
    <template v-else>
      <img src="/image3.jpeg" alt="Third Image" />
      <p>hier ne zwarte</p>
    </template>

  </div>
</div>

      <!-- Main content -->
      <div v-if="!showLoading && !showError && !showAprilFool" class="content">
        <img src="../assets/logo-bumacogroup.svg" alt="Bumaco" class="logo-large" />
        <h1>Ops Platform</h1>
        <p class="subtitle">Welkom bij het centrale dashboard</p>
        <div class="cards">
          <RouterLink v-if="role === 'admin' || role === 'purchase'" to="/purchase" class="card">
            <div class="icon">🛒</div>
            <span>Purchase</span>
          </RouterLink>
          <div v-if="role === 'admin' || role === 'renting'" @click="jokes" class="card">
            <div class="icon">❄️</div>
            <span>Renting</span>
          </div>
          <RouterLink v-if="role === 'admin' || role === 'tools'" to="/tools" class="card">
            <div class="icon">🛠️</div>
            <span>Tools</span>
          </RouterLink>
          <div v-if="role === 'admin' || role === 'logistics'" @click="jokes" class="card">
            <div class="icon">🚚</div>
            <span>Logistiek</span>
          </div>
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
import { ref } from 'vue'

const role = localStorage.getItem('role')

const messages = [
  "Loading renting data...",
  "Connecting to server...",
  "Fetching schedules...",
  "Syncing database...",
  "Almost there...",
  "Dirty sites detected"
]

const currentMessage = ref(messages[0])
const showAprilFool = ref(false)
const showLoading = ref(false)
const showError = ref(false)
const showSecondImage = ref(false)
const showThirdImage = ref(false)

const audio = new Audio('/sound.mp3')

function logout() {
  localStorage.removeItem('token')
  router.push('/login')
}
function goToSecondImage() {
  audio.play().catch(() => console.log('Autoplay geblokkeerd'))
  showSecondImage.value = true
}

function goToThirdImage() {
  showThirdImage.value = true
}

function jokes() {
  if (role === "admin") {
    // start audio en loading
    showLoading.value = true

    const interval = setInterval(() => {
      const randomIndex = Math.floor(Math.random() * messages.length)
      currentMessage.value = messages[randomIndex]
    }, 400)

    // na 2 sec: stop loading, toon error
    setTimeout(() => {
      clearInterval(interval)
      showLoading.value = false
      showError.value = true
    }, 2000)
  } else {
    router.push("/renting/agenda/planning")
  }
}

// wordt aangeroepen bij OK of NEE knop
function showAprilFoolPopup() {
  showError.value = false
  showAprilFool.value = true
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
body {
  cursor: url('/cursor.png'), auto;
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
    justify-items: center; 
  }
}
@media (max-width: 600px) {
  .cards {
    grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
    gap: 16px;
  }
}

/* jokes*/

.april-popup {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(15, 46, 77, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.april-content {
  background: white;
  padding: 20px;
  border-radius: 16px;
  text-align: center;
  width: 80vw;
  box-shadow: 0 10px 30px rgba(0,0,0,0.3);
}

.april-content img {
  width: 100%;
  border-radius: 10px;
  margin-bottom: 12px;
}

.april-content button {
  background: #2f80ed;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 20px;
  cursor: pointer;
}

.loading-screen {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: #0f2e4d;
  color: white;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

/* simpele spinner */
.loader {
  border: 6px solid rgba(255, 255, 255, 0.2);
  border-top: 6px solid #2f80ed;
  border-radius: 50%;
  width: 60px;
  height: 60px;
  animation: spin 1s linear infinite;
  margin-bottom: 20px;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.error-popup {
  position: fixed;
  top:0; left:0;
  width:100%; height:100%;
  background: rgba(0,0,0,0.8);
  display:flex;
  align-items:center;
  justify-content:center;
  z-index:9999;
}

.error-content {
  background: white;
  padding: 20px;
  border-radius: 16px;
  text-align:center;
  max-width: 400px;
  box-shadow: 0 10px 30px rgba(0,0,0,0.3);
}

.error-content p {
  font-size:18px;
  margin-bottom:20px;
}

.error-content button {
  background:#2f80ed;
  color:white;
  border:none;
  padding:10px 20px;
  border-radius:20px;
  margin:0 10px;
  cursor:pointer;
}
</style>
