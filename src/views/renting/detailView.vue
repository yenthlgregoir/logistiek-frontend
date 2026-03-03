<template>
  <div class="page">
    <div class="container">
      <!-- Boeking Details (read-only) -->
      <section class="boeking card" v-if="boeking">
        <div class="header">
          <h2>Boeking</h2>
        </div>
        <div class="body">
          <div class="line">
            <p>
              <strong>Klant</strong><br />
              {{ boeking.leverAdresDetails?.naam }}
            </p>
            <p>
              <strong>REF</strong><br />
              {{ boeking.ref }}
            </p>
          </div>
          <div class="line">
            <p>
              <strong>Adres :</strong><br />
              {{ boeking.leverAdresDetails?.straat }}
              {{ boeking.leverAdresDetails?.huisnummer }},
              {{ boeking.leverAdresDetails?.postcode }}
              {{ boeking.leverAdresDetails?.gemeente }}
            </p>
          </div>
          <div class="line">
            <p>
              <strong>Toestel Type:</strong><br />
              {{ boeking.toestelType.naam }}
            </p>
          </div>
          <div class="line">
            <p>
              <strong>Periode:</strong><br />
              {{ boeking.beginDatumFormatted }} - {{ boeking.eindDatumFormatted }}
            </p>
          </div>

          <div class="status-section">
            <label for="status-select"><strong>Status</strong></label>
            <select
              id="status-select"
              v-model="boeking.status"
              class="status-select"
              :class="boeking.status"
              @change="changeStatus"
            >
              <option value="Aangevraagd">Aangevraagd</option>
              <option value="Bevestigd">Bevestigd</option>
              <option value="Leveren">Leveren</option>
              <option value="Geleverd">Geleverd</option>
            </select>
          </div>
        </div>
      </section>

      <!-- Toestel Details (read-only) -->
      <section class="toestel card">
        <div class="header">
          <h2>Toestel</h2>
        </div>
        <div class="body">
          <template v-if="details">
            <p>
              <strong>Type</strong><br />
              {{ details.type?.naam }}
            </p>
            <p>
              <strong>ID</strong><br />
              {{ details.Ref }}
            </p>
            <p>
              <strong>Chasisnummer</strong><br />
              {{ details.chasisnummer }}
            </p>
            <p>
              <strong>Nummerplaat</strong><br />
              {{ details.nrplaat }}
            </p>

            <div class="status-section">
              <label for="toestel-status"><strong>Status Toestel</strong></label>
              <select
                id="toestel-status"
                v-model="details.status.statusType"
                class="status-select"
                :class="details.status.statusType"
                @change="changeToestelStatus"
              >
                <option value="Actief">Actief</option>
                <option value="Kapot">Kapot</option>
              </select>
            </div>
          </template>

          <template v-else>
            <p class="no-toestel">Toestel nog niet toegewezen</p>
          </template>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { boekingApi } from '@/api/boeking'
import { toestelApi } from '@/api/toestel'

const { boekingId } = defineProps({ boekingId: String })

const boeking = ref(null)
const details = ref(null)

onMounted(async () => {
  await getBoeking()
})

async function getBoeking() {
  try {
    const response = await boekingApi.get(boekingId)
    boeking.value = response
    details.value = boeking.value.toestel || null
    console.log(boeking.value)
  } catch (err) {
    console.log(err)
  }
}

async function changeStatus() {
  try {
    await boekingApi.changeState(boeking.value._id, { status: boeking.value.status })
  } catch (err) {
    console.log(err)
  }
}

async function changeToestelStatus() {
  try {
    await toestelApi.changeStatus(details.value._id, {
      statusType: details.value.status.statusType,
    })
  } catch (err) {
    console.log(err)
  }
}
</script>

<style scoped>
.page {
  min-height: 90vh;
  background: #f5f7fa;
  font-family: Arial, sans-serif;
  color: #111;
  padding: 20px;
}

.container {
  display: flex;
  gap: 20px;
  height: 90vh;
  overflow: hidden;
}

.card {
  background: white;
  border-radius: 8px;
  box-shadow: 0 0 8px rgb(0 0 0 / 0.1);
  flex: 1 1 50%;
  display: flex;
  flex-direction: column;
  padding: 16px;
  overflow-y: auto;
}

.card .header {
  margin-bottom: 12px;
}

.card .header h2 {
  margin: 0;
  font-weight: 700;
}

.card .body p {
  margin: 8px 0;
}

.line {
  display: flex;
  justify-content: space-between;
}

.status-section {
  margin-top: 16px;
}

.status-select {
  width: 100%;
  padding: 6px;
  border-radius: 4px;
  border: 1px solid #ccc;
  font-size: 16px;
  outline-offset: 2px;
  transition: background-color 0.3s ease;
}

.status-select.Aangevraagd,
.status-select.Kapot {
  background-color: lightcoral;
}

.status-select.Bevestigd {
  background-color: lightblue;
}
.status-select.Leveren {
  background-color: orange;
}

.status-select.Geleverd,
.status-select.Actief {
  background-color: #67cf63;
}

.no-toestel {
  text-align: center;
  align-items: center;
  font-style: italic;
  color: #888;
  font-weight: 600;
}
</style>
