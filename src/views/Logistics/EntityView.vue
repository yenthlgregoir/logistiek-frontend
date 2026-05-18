<template>
  <div class="page">
    <h3>Entiteiten</h3>

    <SearchBar />

    <div class="body">
      <!-- Toevoegen kaart -->
      <div class="card add-card" @click="openEntiteitDrawer">
        <div class="add-circle">+</div>
        <span>Toevoegen</span>
      </div>

      <!-- Dynamische kaarten -->
      <div
        v-for="entity in entities"
        :key="entity._id"
        class="card entity-card"
        @click="openEdit(entity)"
      >
        <!-- status bolletje -->
        <div
          class="status-dot"
          :style="{ backgroundColor: entity.color }"
        ></div>

        <!-- icon -->
        <span v-if="entity.icon" class="material-icons icon">
          {{ entity.icon }}
        </span>

        <!-- naam -->
        <p>{{ entity.naam }}</p>
      </div>
    </div>

    <EntiteitDrawer
      :show="showEntiteitDrawer"
      :entity="selectedEntity"
      @created="handleCreate"
      @updated="handleUpdate"
      @close="closeDrawer"
    />
  </div>
</template>

<script setup>
import SearchBar from '@/components/base/SearchBar.vue'
import EntiteitDrawer from '@/components/Logistics/ProjectLeider/EntiteitDrawer.vue'
import { entiteitApi } from '@/api/entiteit.js'
import { onMounted, ref } from 'vue'

const showEntiteitDrawer = ref(false)
const selectedEntity = ref(null)

const entities = ref([])

/* DATA LOAD */
onMounted(async () => {
  try {
    entities.value = await entiteitApi.getEntiteiten()
  } catch (error) {
    console.log(error)
  }
})

/* OPEN CREATE */
function openEntiteitDrawer() {
  selectedEntity.value = null
  showEntiteitDrawer.value = true
}

/* OPEN EDIT */
function openEdit(entity) {
  selectedEntity.value = entity
  showEntiteitDrawer.value = true
}

/* CLOSE DRAWER */
function closeDrawer() {
  showEntiteitDrawer.value = false
  selectedEntity.value = null
}

/* CREATE */
const handleCreate = async (data) => {
  try {
    const created = await entiteitApi.createEniteit(data)

    entities.value.unshift(created)

    closeDrawer()
  } catch (err) {
    console.error(err)
  }
}

/* UPDATE */
const handleUpdate = async ({ id, data }) => {
  try {
    const updated = await entiteitApi.updateEntiteit(id, data)

    const index = entities.value.findIndex(
      e => e._id === id
    )

    if (index !== -1) {
      entities.value[index] = updated
    }

    closeDrawer()
  } catch (err) {
    console.error(err)
  }
}
</script>

<style scoped>
.page {
  padding: 24px;
  background: #eef0f8;
  min-height: 100vh;
}

h3 {
  font-size: 32px;
  margin-bottom: 20px;
  font-weight: 700;
}

.body {
  margin-top: 24px;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 20px;
}

/* CARD */
.card {
  position: relative;
  height: 150px;
  background: white;
  border-radius: 6px;
  border: 1px solid #cfcfcf;

  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;

  cursor: pointer;
  transition: 0.2s ease;

  padding: 10px;
  box-sizing: border-box;
}

.card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

/* ADD CARD */
.add-card {
  border: 1px solid #7ea1ff;
}

.add-circle {
  width: 54px;
  height: 54px;
  border-radius: 50%;
  background: #9bb6ff;

  display: flex;
  align-items: center;
  justify-content: center;

  color: white;
  font-size: 32px;
  margin-bottom: 10px;
}

.add-card span {
  color: #5a84ff;
  font-weight: 600;
}

/* ENTITY CARD */
.status-dot {
  position: absolute;
  top: 10px;
  right: 10px;

  width: 12px;
  height: 12px;
  border-radius: 50%;
}

.icon {
  font-size: 50px;
  color: #111;

  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
}

.entity-card p {
  font-size: 18px;
  font-weight: 700;
}
</style>