<template>
  <div class="home-root">
    <header class="home-topbar">
      <div class="home-topbar-inner">
        <img src="../assets/logo_ops_home.svg" class="home-logo" alt="Bumaco" />
        <div ref="account" class="home-account">
          <button
            ref="accountButton"
            class="home-account-toggle"
            type="button"
            aria-label="Mijn account"
            :aria-expanded="menuOpen"
            aria-controls="home-account-panel"
            @click="menuOpen = !menuOpen"
          >
            <span class="home-avatar" aria-hidden="true">
              <img
                v-if="auth.photoUrl"
                :src="auth.photoUrl"
                class="home-avatar-photo"
                alt=""
                @error="auth.discardPhoto()"
              />
              <template v-else>{{ initials }}</template>
            </span>
            <span class="home-account-name">{{ firstName || 'Mijn account' }}</span>
            <ChevronDown :size="15" :class="{ rotated: menuOpen }" aria-hidden="true" />
          </button>
          <section
            v-if="menuOpen"
            id="home-account-panel"
            class="home-account-panel"
            aria-label="Accountgegevens"
          >
            <strong>{{ fullName || 'Mijn account' }}</strong>
            <span v-if="auth.user?.username" class="home-account-email">{{
              auth.user.username
            }}</span>
            <span class="home-signin">Aangemeld met Microsoft</span>
            <div class="home-account-actions">
              <RouterLink to="/toegang"
                ><KeyRound :size="16" aria-hidden="true" />Mijn toegang</RouterLink
              >
              <button type="button" :disabled="loggingOut" @click="logout">
                <LogOut :size="16" aria-hidden="true" />{{
                  loggingOut ? 'Uitloggen…' : 'Uitloggen'
                }}
              </button>
            </div>
            <p v-if="logoutError" class="home-error" role="alert">{{ logoutError }}</p>
          </section>
        </div>
      </div>
    </header>

    <main class="home-content">
      <div class="home-intro">
        <p class="home-greeting">
          {{ greeting }}<template v-if="firstName">, {{ firstName }}</template>
        </p>
        <h1>Waar wil je werken?</h1>
        <p class="home-description">Kies een module om aan de slag te gaan.</p>
      </div>

      <nav v-if="workModules.length" class="home-modules" aria-label="Werkmodules">
        <RouterLink
          v-for="module in workModules"
          :key="module.key"
          :to="module.to"
          class="home-module"
        >
          <span class="home-module-icon"
            ><component :is="module.icon" :size="22" :stroke-width="1.7" aria-hidden="true"
          /></span>
          <span class="home-module-text">
            <span class="home-module-title"
              >{{ module.label
              }}<span v-if="module.adminOnly" class="home-admin-tag">Admin</span></span
            >
            <span class="home-module-description">{{ module.description }}</span>
          </span>
          <ArrowUpRight
            class="home-module-arrow"
            :size="17"
            :stroke-width="1.6"
            aria-hidden="true"
          />
        </RouterLink>
      </nav>
      <section v-else class="home-empty" aria-label="Toegang tot werkmodules">
        <span class="home-empty-icon"><KeyRound :size="23" aria-hidden="true" /></span>
        <div>
          <h2>Je werkmodules staan nog niet klaar</h2>
          <p>
            Vraag toegang aan via Mijn toegang. Je kunt alvast bekijken welke hoogtewerkers er zijn.
          </p>
        </div>
      </section>

      <div class="home-secondary">
        <p class="home-secondary-label">Ook beschikbaar</p>
        <nav class="home-links" aria-label="Overige opties">
          <RouterLink to="/hoogtewerkerselectie"
            ><MoveVertical :size="17" :stroke-width="1.7" aria-hidden="true" />Hoogtewerker
            kiezen</RouterLink
          >
          <RouterLink to="/toegang"
            ><KeyRound :size="17" :stroke-width="1.7" aria-hidden="true" />Mijn toegang</RouterLink
          >
          <RouterLink v-if="isAdmin" to="/admin/users"
            ><Settings :size="17" :stroke-width="1.7" aria-hidden="true" />Beheer</RouterLink
          >
        </nav>
      </div>
    </main>
  </div>
</template>

<script setup>
import { computed, ref, onMounted, onBeforeUnmount } from 'vue'
import { useAuthStore } from '@/stores/authentication/auth.store.js'
import {
  ShoppingCart,
  Snowflake,
  Wrench,
  Truck,
  Settings,
  KeyRound,
  MoveVertical,
  LogOut,
  CalendarRange,
  ChevronDown,
  ArrowUpRight,
} from 'lucide-vue-next'

const auth = useAuthStore()
const menuOpen = ref(false),
  account = ref(null),
  accountButton = ref(null)
const loggingOut = ref(false),
  logoutError = ref('')
const roles = computed(() => auth.user?.roles ?? [])
const isAdmin = computed(() => roles.value.includes('admin'))
const fullName = computed(() => String(auth.user?.name || auth.user?.displayName || '').trim())
const firstName = computed(() => fullName.value.split(/\s+/)[0])
const initials = computed(() => {
  const parts = fullName.value.split(/\s+/).filter(Boolean)
  return parts.length
    ? (parts[0][0] + (parts.length > 1 ? parts.at(-1)[0] : '')).toLocaleUpperCase('nl-BE')
    : 'M'
})
const greeting = computed(() => {
  const hour = Number(
    new Intl.DateTimeFormat('en-GB', {
      hour: '2-digit',
      hourCycle: 'h23',
      timeZone: 'Europe/Brussels',
    }).format(new Date()),
  )
  return hour < 12 ? 'Goedemorgen' : hour < 18 ? 'Goedemiddag' : 'Goedenavond'
})
const modules = [
  {
    key: 'purchase',
    label: 'Purchase',
    to: { name: 'purchase' },
    icon: ShoppingCart,
    description: 'Bestellingen en aankopen',
  },
  {
    key: 'renting',
    label: 'Renting',
    to: '/renting/agenda/planning',
    icon: Snowflake,
    description: 'Boekingen en toestelplanning',
  },
  {
    key: 'logistics',
    label: 'Logistiek',
    to: '/logistics/schaarlift/planning',
    icon: Truck,
    description: 'Verhuringen en transport',
  },
  {
    key: 'tools',
    label: 'Tools',
    to: '/tools',
    icon: Wrench,
    description: 'Materiaal en uitleningen',
  },
  {
    key: 'vandaag',
    label: 'Vandaag',
    to: '/vandaag',
    icon: CalendarRange,
    description: 'Openstaande acties van de dag',
    adminOnly: true,
  },
]
const workModules = computed(() =>
  modules.filter((module) =>
    module.adminOnly
      ? isAdmin.value
      : isAdmin.value ||
        roles.value.includes(module.key),
  ),
)

function outsideAccount(event) {
  if (menuOpen.value && account.value && !account.value.contains(event.target))
    menuOpen.value = false
}
function onKey(event) {
  if (event.key === 'Escape' && menuOpen.value) {
    menuOpen.value = false
    accountButton.value?.focus()
  }
}
async function logout() {
  if (loggingOut.value) return
  loggingOut.value = true
  logoutError.value = ''
  try {
    await auth.logout()
  } catch {
    logoutError.value = 'Uitloggen mislukt. Probeer opnieuw.'
  } finally {
    loggingOut.value = false
  }
}
onMounted(() => {
  document.addEventListener('pointerdown', outsideAccount)
  document.addEventListener('keydown', onKey)
})
onBeforeUnmount(() => {
  document.removeEventListener('pointerdown', outsideAccount)
  document.removeEventListener('keydown', onKey)
})
</script>

<style scoped>
.home-root {
  min-height: 100vh;
  min-height: 100dvh;
  background: #f7f9fc;
  color: #26384e;
  font-family: Inter, 'Segoe UI', sans-serif;
}
.home-root * {
  box-sizing: border-box;
}
.home-topbar {
  background: #fff;
  border-bottom: 1px solid #e7ecf2;
}
.home-topbar-inner {
  max-width: 1120px;
  margin: 0 auto;
  min-height: 88px;
  padding: 18px 32px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
}
.home-logo {
  display: block;
  width: 148px;
  max-width: 38vw;
  height: auto;
}
.home-account {
  position: relative;
  min-width: 0;
}
.home-account-toggle {
  display: flex;
  align-items: center;
  gap: 10px;
  min-height: 44px;
  max-width: 100%;
  border: 0;
  border-radius: 9px;
  background: transparent;
  padding: 5px 8px;
  color: #51637a;
  cursor: pointer;
  font: inherit;
  font-size: 12px;
}
.home-account-toggle:hover {
  background: #f5f7fb;
}
.home-account-toggle > svg {
  color: #8d9bb0;
  transition: transform 0.15s;
}
.home-account-toggle > svg.rotated {
  transform: rotate(180deg);
}
.home-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  background: #edf2fa;
  color: #426799;
  font-size: 11px;
  font-weight: 650;
  flex-shrink: 0;
}
.home-avatar {
  overflow: hidden;
}
.home-avatar-photo {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.home-account-name {
  max-width: 150px;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}
.home-account-panel {
  position: absolute;
  right: 0;
  top: calc(100% + 10px);
  z-index: 10;
  width: 280px;
  max-width: calc(100vw - 32px);
  padding: 20px;
  border: 1px solid #e0e7f0;
  border-radius: 12px;
  background: white;
  box-shadow: 0 8px 30px #243c5812;
  font-size: 12px;
}
.home-account-panel > strong {
  display: block;
  font-size: 13px;
  color: #30465f;
  overflow-wrap: anywhere;
}
.home-account-email {
  display: block;
  color: #76879e;
  margin-top: 6px;
  font-size: 11px;
  overflow-wrap: anywhere;
}
.home-signin {
  display: block;
  color: #91a0b3;
  font-size: 10px;
  margin-top: 8px;
}
.home-account-actions {
  display: grid;
  gap: 4px;
  border-top: 1px solid #e9edf3;
  margin-top: 16px;
  padding-top: 12px;
}
.home-account-actions a,
.home-account-actions button {
  display: flex;
  align-items: center;
  gap: 10px;
  min-height: 38px;
  padding: 8px;
  border: 0;
  border-radius: 6px;
  background: transparent;
  color: #516780;
  text-decoration: none;
  font: inherit;
  font-size: 12px;
  cursor: pointer;
  text-align: left;
}
.home-account-actions a:hover {
  background: #f2f6fb;
  color: #315f9e;
}
.home-account-actions button:hover {
  background: #fff4f4;
  color: #a34851;
}
.home-account-actions button:disabled {
  opacity: 0.6;
  cursor: wait;
}
.home-error {
  font-size: 11px;
  line-height: 1.6;
  color: #aa424f;
  background: #fff3f4;
  border-radius: 6px;
  padding: 9px;
  margin: 10px 0 0;
}
.home-content {
  max-width: 1120px;
  margin: 0 auto;
  padding: 64px 32px 80px;
}
.home-intro {
  margin-bottom: 32px;
}
.home-greeting {
  font-size: 12px;
  color: #7a8aa0;
  margin: 0 0 10px;
}
.home-intro h1 {
  font-size: 29px;
  font-weight: 650;
  line-height: 1.25;
  letter-spacing: -0.7px;
  color: #233b57;
  margin: 0 0 12px;
}
.home-description {
  font-size: 13px;
  color: #8190a5;
  line-height: 1.7;
  margin: 0;
}
.home-modules {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
}
.home-module {
  display: flex;
  align-items: center;
  gap: 16px;
  min-height: 130px;
  padding: 24px 22px;
  border: 1px solid #e1e7ef;
  border-radius: 12px;
  background: white;
  color: inherit;
  text-decoration: none;
  transition:
    border-color 0.15s,
    background-color 0.15s;
  min-width: 0;
}
.home-module:hover {
  border-color: #a9bfdc;
  background: #fcfdff;
}
.home-module-icon {
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  flex-shrink: 0;
  border-radius: 10px;
  background: #eff4fb;
  color: #5279ad;
}
.home-module-text {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.home-module-title {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  font-size: 15px;
  font-weight: 650;
  color: #2b4463;
  line-height: 1.4;
}
.home-module-description {
  font-size: 11px;
  line-height: 1.6;
  color: #8190a5;
}
.home-module-arrow {
  flex-shrink: 0;
  margin-left: auto;
  align-self: flex-start;
  color: #a6b4c5;
}
.home-admin-tag {
  font-size: 9px;
  line-height: 1.5;
  font-weight: 500;
  padding: 2px 6px;
  border-radius: 4px;
  color: #758ba8;
  background: #f1f5fa;
}
.home-secondary {
  margin-top: 36px;
  padding-top: 25px;
  border-top: 1px solid #e2e8f0;
}
.home-secondary-label {
  font-size: 10px;
  color: #94a1b3;
  margin: 0 0 13px;
  text-transform: uppercase;
  letter-spacing: 0.8px;
}
.home-links {
  display: flex;
  align-items: center;
  gap: 12px 28px;
  flex-wrap: wrap;
}
.home-links a {
  display: inline-flex;
  align-items: center;
  gap: 9px;
  min-height: 36px;
  padding: 3px 0;
  color: #647b97;
  font-size: 12px;
  text-decoration: none;
}
.home-links a svg {
  color: #8b9fb9;
}
.home-links a:hover {
  color: #2d62b0;
}
.home-links a:hover svg {
  color: #2d62b0;
}
.home-empty {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  padding: 26px;
  border: 1px solid #e1e7ef;
  background: #fff;
  border-radius: 12px;
}
.home-empty-icon {
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  flex-shrink: 0;
  border-radius: 10px;
  background: #f0f4fa;
  color: #7d96b6;
}
.home-empty h2 {
  font-size: 15px;
  font-weight: 600;
  margin: 2px 0 9px;
  color: #38516f;
}
.home-empty p {
  font-size: 12px;
  color: #8190a5;
  margin: 0;
  line-height: 1.8;
  max-width: 490px;
}
.home-root :is(button, a):focus-visible {
  outline: 3px solid #91b0de;
  outline-offset: 4px;
}
@media (max-width: 960px) {
  .home-module {
    padding: 20px 17px;
    gap: 12px;
  }
  .home-module-icon {
    width: 38px;
    height: 38px;
  }
  .home-module-description {
    font-size: 10px;
  }
  .home-module-arrow {
    display: none;
  }
}
@media (max-width: 720px) {
  .home-topbar-inner {
    min-height: 76px;
    padding: 16px 22px;
  }
  .home-logo {
    width: 128px;
  }
  .home-content {
    padding: 44px 22px 60px;
  }
  .home-modules {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 12px;
  }
  .home-module {
    min-height: 132px;
    align-items: flex-start;
    flex-direction: column;
    gap: 15px;
    padding: 20px;
  }
  .home-module-icon {
    width: 36px;
    height: 36px;
  }
  .home-module-description {
    font-size: 11px;
  }
  .home-intro h1 {
    font-size: 26px;
  }
  .home-account-name {
    max-width: 100px;
  }
}
@media (max-width: 400px) {
  .home-topbar-inner {
    padding: 15px 18px;
  }
  .home-content {
    padding: 34px 18px 50px;
  }
  .home-intro h1 {
    font-size: 24px;
  }
  .home-module {
    padding: 16px;
    min-height: 142px;
  }
  .home-module-title {
    font-size: 14px;
  }
  .home-module-description {
    font-size: 10px;
  }
  .home-links {
    gap: 8px;
    flex-direction: column;
    align-items: flex-start;
  }
  .home-empty {
    padding: 20px;
    gap: 12px;
  }
  .home-account-name {
    display: none;
  }
  .home-module-title {
    gap: 5px;
  }
}
@media (prefers-reduced-motion: reduce) {
  .home-root * {
    transition: none !important;
  }
}
</style>
