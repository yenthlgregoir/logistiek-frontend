<template>
  <div class="page">

    <!-- TITLE + SEARCH CENTERED -->
    <div class="title-wrapper">
      <h1>Admin - Users</h1>

      <input
        v-model="search"
        type="text"
        placeholder="Zoek op naam, email of rol..."
        class="search"
      />
    </div>

    <!-- TABLE + CARDS -->
    <div class="user-table-wrapper">

      <div class="table-header">
        <div>Naam</div>
        <div>Email</div>
        <div>Rol</div>
        <div class="right">Actions</div>
      </div>

      <div
        v-for="user in paginatedUsers"
        :key="user.id"
        class="user-card"
        @dblclick="editUser(user)"
      >
        <div class="info">{{ user.naam || 'Onbekend' }}</div>
        <div class="info">{{ user.email || 'Geen email' }}</div>

        <div class="info">
          <span class="role-tag" :class="user.role">
            {{ user.role || 'user' }}
          </span>
        </div>

        <div class="actions">
          <button class="icon-btn" @click.stop="editUser(user)">✏️</button>
          <button class="icon-btn" @click.stop="resetPassword(user)">🔑</button>
        </div>
      </div>

      <div v-if="!paginatedUsers.length" class="no-results">
        Geen users gevonden
      </div>

      <!-- PAGINATION -->
      <div class="pagination" v-if="totalPages > 1">
        <button class="page-btn" :disabled="page === 1" @click="page--">‹</button>

        <button
          v-for="p in totalPages"
          :key="p"
          class="page-number"
          :class="{ active: p === page }"
          @click="page = p"
        >
          {{ p }}
        </button>

        <button class="page-btn" :disabled="page === totalPages" @click="page++">›</button>
      </div>

    </div>

  </div>
</template>
<script setup>
import { ref, onMounted, computed } from 'vue'
import { loginApi } from '@/api/login'

const users = ref([])
const search = ref('')

const page = ref(1)
const perPage = 5

onMounted(() => {
  getUsers()
})

async function getUsers() {
  try {
    users.value = await loginApi.getUsers()
  } catch (err) {
    console.error(err)
  }
}

const gefilterdeUsers = computed(() => {
  const term = search.value.toLowerCase()
  page.value = 1
  return users.value.filter(u =>
    u.naam?.toLowerCase().includes(term) ||
    u.email?.toLowerCase().includes(term) ||
    u.role?.toLowerCase().includes(term)
  )
})

const totalPages = computed(() =>
  Math.ceil(gefilterdeUsers.value.length / perPage)
)

const paginatedUsers = computed(() => {
  const start = (page.value - 1) * perPage
  return gefilterdeUsers.value.slice(start, start + perPage)
})

function editUser(user) {
  console.log('Edit user:', user)
}

function resetPassword(user) {
  console.log('Reset password for:', user)
}
</script>
<style scoped>
.page {
  min-height: 93vh;
  font-family: 'Inter', sans-serif;
  background: linear-gradient(135deg, #f1f5ff, #e8eeff);
  padding: 40px 2rem;
  display: flex;
  flex-direction: column;
  align-items: center;
}

/* TITLE + SEARCH CENTERED */
.title-wrapper {
  width: 100%;
  max-width: 1100px;
  text-align: center;
  margin-bottom: 26px;
}

.title-wrapper h1 {
  font-size: 32px;
  font-weight: 700;
  color: #0f2e4d;
  margin-bottom: 16px;
  text-transform: uppercase;
}

.search {
  padding: 13px 18px;
  width: 100%;
  max-width: 360px;
  border-radius: 14px;
  border: 1px solid #d1d5db;
  background: rgba(255,255,255,0.95);
  transition: 0.3s ease;
  margin: 0 auto;
  display: block;
}

.search:focus {
  outline: none;
  border-color: #4f73ff;
  box-shadow: 0 0 0 4px rgba(79,115,255,0.18);
}

/* TABLE + CARDS CENTERED */
.user-table-wrapper {
  width: 100%;
  max-width: 1100px;
  display: flex;
  flex-direction: column;
  gap: 1.4rem;
  margin: 0 auto;
}

/* HEADER */
.table-header {
  display: grid;
  grid-template-columns: 2fr 2fr 1fr minmax(7rem, 0.4fr);
  padding: 1rem 1.2rem;
  border-radius: 14px;
  background: rgba(255,255,255,0.9);
  border: 1px solid rgba(0,0,0,0.06);
  box-shadow: 0 4px 12px rgba(0,0,0,0.04);
  font-weight: 600;
  color: #3a4b63;
}

/* CARD ROW */
.user-card {
  display: grid;
  grid-template-columns: 2fr 2fr 1fr minmax(7rem,0.4fr);
  background: white;
  padding: 1.1rem 1.2rem;
  border-radius: 18px;
  border: 1px solid rgba(0,0,0,0.05);
  box-shadow: 0 8px 20px rgba(0,0,70,0.06);
  transition: 0.25s ease;
}

.user-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 12px 28px rgba(0,0,60,0.1);
}

.info {
  font-size: 0.95rem;
  color: #1f2d40;
}

/* ROLE TAGS */
.role-tag {
  padding: 0.35rem 0.75rem;
  border-radius: 12px;
  font-size: 0.78rem;
  font-weight: 600;
  text-transform: capitalize;
}

.role-tag.admin {
  background: #e0e7ff;
  color: #1e3a8a;
}

.role-tag.renting {
  background: #fae8ff;
  color: #86198f;
}

.role-tag.purchase {
  background: #cffafe;
  color: #0f172a;
}

/* ACTION BUTTONS */
.actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.6rem;
}

.icon-btn {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  padding: 0.45rem 0.65rem;
  border-radius: 12px;
  transition: 0.25s ease;
}

.icon-btn:hover {
  background: #4f73ff;
  color: white;
  border-color: #4f73ff;
}

/* PAGINATION */
.pagination {
  display: flex;
  justify-content: center;
  gap: 0.5rem;
  margin-top: 8px;
}

.page-btn,
.page-number {
  padding: 0.45rem 0.9rem;
  border-radius: 10px;
  border: 1px solid #d1d5db;
  background: white;
  cursor: pointer;
  transition: 0.2s;
  font-weight: 500;
}

.page-number.active {
  background: #4f73ff;
  color: white;
}

.page-btn:disabled {
  opacity: 0.4;
  cursor: default;
}
</style>