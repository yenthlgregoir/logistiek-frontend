<template>
  <div class="page">
    <div class="container">
      <h1 class="page-title">Bestelling</h1>
      <ProductToolbar v-model:search="search" @create="onCreate" />
      <ProductTable :products="products" @add-product="AddProductToOrder" />

      <!-- Modal: Product toevoegen -->
      <div v-if="showAddProductPopup" class="modal-backdrop">
        <div class="modal">
          <h2>Nieuw Product</h2>

          <label>Productcode</label>
          <input v-model="newProduct.productcode" type="text" />

          <label>Omschrijving</label>
          <input v-model="newProduct.omschrijving" type="text" />

          <label>Eenheidsprijs</label>
          <input v-model="newProduct.eenheidsprijs" type="number" step="0.01" />

          <label>BTW</label>
          <select v-model="newProduct.btw">
            <option value="21">21%</option>
            <option value="6">6%</option>
          </select>

          <label>Leverancier</label>
          <input v-model="newProduct.leverancier" type="text" />

          <div class="modal-actions">
            <button class="btn btn-secondary" @click="showAddProductPopup = false">Annuleer</button>
            <button class="btn btn-primary" @click="createProduct">Opslaan</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup>
import ProductToolbar from '@/components/products/ProductToolbar.vue'
import { ref, onMounted, watch } from 'vue'
import { productApi } from '@/api/products.js'
import { ordersApi } from '@/api/orders'
import ProductTable from '@/components/products/ProductTable.vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const orderId = route.params.id

const products = ref([])
const search = ref('')
const loading = ref(true)

function buildQuery() {
  const params = new URLSearchParams()
  if (search.value.trim()) params.set('q', search.value.trim())
  return params.toString()
}

async function loadProducts() {
  loading.value = true

  try {
    const data = await productApi.list(buildQuery())
    products.value = Array.isArray(data) ? data : (data.items ?? [])
  } catch (err) {
    console.error(err)
    alert('Laden van producten mislukt')
  }

  loading.value = false
}

onMounted(loadProducts)

let timer
watch(search, () => {
  clearTimeout(timer)
  timer = setTimeout(() => loadProducts(), 300)
})
async function AddProductToOrder(data) {
  try {
    await ordersApi.addProductToOrder(orderId, {
      productId: data.productId,
      aantal: data.aantal,
    })

    alert('Product toegevoegd aan bestelling')
  } catch (err) {
    console.error(err)
    alert('Toevoegen mislukt')
  }
}

const showAddProductPopup = ref(false)

const newProduct = ref({
  productcode: '',
  omschrijving: '',
  eenheidsprijs: '',
  btw: '21',
  leverancier: '',
})

// Toolbar emit
function onCreate() {
  showAddProductPopup.value = true
}

async function createProduct() {
  try {
    await productApi.create({
      productcode: newProduct.value.productcode,
      omschrijving: newProduct.value.omschrijving,
      eenheidsprijs: Number(newProduct.value.eenheidsprijs),
      btw: Number(newProduct.value.btw),
      leverancier: newProduct.value.leverancier,
    })

    alert('Product toegevoegd')
    showAddProductPopup.value = false

    // leeg formulier
    newProduct.value = {
      productcode: '',
      omschrijving: '',
      eenheidsprijs: '',
      btw: '21',
      leverancier: '',
    }

    // reload products in table
    loadProducts()
  } catch (err) {
    console.error(err)
    alert('Opslaan mislukt')
  }
}
</script>

<style scoped>
.page {
  min-height: 90vh;
  overflow-y: auto;
  background: #f5f7fa;
}
.container {
  margin: 0 2% 0 2%;
  display: block;
}
.modal-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  backdrop-filter: blur(3px);
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  justify-content: center;
  align-items: center;
}

.modal {
  background: white;
  padding: 20px;
  width: 400px;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.modal input,
.modal select {
  padding: 8px;
  border: 1px solid #ccc;
  border-radius: 6px;
}
</style>
