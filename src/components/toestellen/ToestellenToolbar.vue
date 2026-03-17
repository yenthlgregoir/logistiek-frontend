<template>
  <div class="toolbar">
    <div class="search">
      <i class="fa fa-search"></i>
      <input type="text" placeholder="Zoek" v-model="searchProxy" />
    </div>
    <div class="actions">
      <div class="filter-container">
        <button class="btn btn-secondary" @click="showFilters = !showFilters">
          <i class="fa fa-filter"></i> Filter
        </button>
        <!-- POPUP -->
        <div v-if="showFilters" class="filter-popup">
          <div class="filter-grid">
            <div>
              <label>Type</label>
              <select v-model="typeProxy">
                <option value="">Alle</option>
                <option v-for="t in types" :key="t._id" :value="t.naam">
                  {{ t.naam }}
                </option>
              </select>
            </div>

            <div>
              <label>Klant</label>
              <select v-model="klantProxy">
                <option value="">Alle</option>
                <option v-for="k in klanten" :key="k._id" :value="k.naam">
                  {{ k.naam }}
                </option>
              </select>
            </div>
          </div>

          <div class="daterange">
            <label>Vrije Toestellen</label>
            <el-date-picker
              v-model="dateRange"
              type="daterange"
              start-placeholder="Startdatum"
              end-placeholder="Einddatum"
              format="YYYY-MM-DD"
              :picker-options="pickerOptions"
              style="width: 100%"
            />
          </div>
          <button class="btn btn-primary reset-btn" @click="resetFilters">
            Reset filter
          </button>
          <button class="btn btn-primary close-btn" @click="showFilters = false">
            Sluiten
          </button>
        </div>
      </div>

      <button class="btn btn-primary" @click="onCreate">
        <i class="fa fa-plus"></i> Add
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { ElDatePicker } from 'element-plus'
import 'element-plus/dist/index.css'

const props = defineProps({
  search: String,
  type: String,
  klant: String,
  types: Array,
  klanten: Array,
})

const emit = defineEmits([
  'update:search',
  'update:type',
  'update:klant',
  'update:vrijToestel',
  'create',
  'resetFilters'
])

const searchProxy = computed({
  get: () => props.search,
  set: (v) => emit('update:search', v),
})

const typeProxy = computed({
  get: () => props.type,
  set: (v) => emit('update:type', v || ''),
})

const klantProxy = computed({
  get: () => props.klant,
  set: (v) => emit('update:klant', v),
})

const showFilters = ref(false)
const dateRange = ref([])

const pickerOptions = {
  disabledDate(date) {
    if (!dateRange.value?.[0]) return false
    const start = new Date(dateRange.value[0])
    const maxDate = new Date(start)
    maxDate.setDate(maxDate.getDate() + 30)
    return date > maxDate
  },
}

watch(dateRange, (range) => {
  if (!range || range.length !== 2) {
    emit('update:vrijToestel', null)
    return
  }


  const beginDatum = new Date(range[0]).toISOString().slice(0, 10)
  const eindDatum = new Date(range[1]).toISOString().slice(0, 10)

  emit('update:vrijToestel', {
    beginDatum,
    eindDatum
  })
})
function onCreate() {
  emit('create')
}
function resetFilters() {
  dateRange.value = []

  emit('update:type', '')
  emit('update:klant', '')
  emit('update:vrijToestel', null)

  showFilters.value = false
}
</script>

<style scoped>
.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.search {
  position: relative;
  flex: 1;
  max-width: 300px;
}

.search input {
  padding: 8px 12px 8px 32px;
  border-radius: 6px;
  border: 1px solid #d1d5db;
  width: 100%;
}

.search i {
  position: absolute;
  left: 10px;
  top: 50%;
  transform: translateY(-50%);
  color: #9ca3af;
}

.actions {
  display: flex;
  gap: 8px;
  align-items: center;
}

.btn {
  padding: 8px 14px;
  border-radius: 4px;
  border: none;
  cursor: pointer;
}

.btn-primary {
  background: #2f80ed;
  color: white;
}

.btn-secondary {
  background: #e6f0fa;
  color: #1f4e79;
}

.filter-container {
  position: relative;
}

.filter-popup {
  position: absolute;
  top: 42px;
  right: 0;
  background: white;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  padding: 14px;
  width: 350px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 200;
}

.filter-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  margin-bottom: 10px;
}

.filter-grid label {
  display: block;
  margin-bottom: 4px;
  font-size: 12px;
  font-weight: 500;
}

select {
  padding: 6px 10px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 12px;
  width: 100%;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

select:focus {
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.2);
  outline: none;
}

.daterange {
  margin-bottom: 10px;
}

.daterange label {
  display: block;
  margin-bottom: 4px;
  font-size: 12px;
  font-weight: 500;
}

.close-btn {
  width: 100%;
}
.reset-btn {
  width: 100%;
  background-color: rgb(128, 181, 228);
  margin-bottom: 10px;
  color:rgb(255, 255, 255);
}
.reset-btn:hover{
  background-color: #62a0f1;
}
</style>