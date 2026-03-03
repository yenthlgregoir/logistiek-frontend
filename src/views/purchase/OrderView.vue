<template>
  <div class="page">
    <div class="container">
      <h1 class="page-title">Bestelling</h1>
      <OrdersToolbar v-model:search="search" @create="openCreate" @download="downloadPdf" />
      <OrderTable :products="products" />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ordersApi } from '@/api/orders'
import OrdersToolbar from '@/components/order/OrderToolbar.vue'
import OrderTable from '@/components/order/OrderTable.vue'

const route = useRoute()
const router = useRouter()

const orderId = route.params.id

const products = ref([])
const order = ref(null)

async function loadOrder() {
  try {
    const data = await ordersApi.getById(orderId)
    order.value = data
    products.value = data.producten || []
  } catch (err) {
    console.error(err)
  }
}

onMounted(loadOrder)

function openCreate() {
  router.push(`/purchase/products/${orderId}`)
}
async function downloadPdf() {
  try {
    const blob = await ordersApi.orderToPdf(orderId)

    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')

    link.href = url
    link.download = `bestelling_${orderId}.pdf`
    link.click()

    URL.revokeObjectURL(url)
  } catch (err) {
    console.error('Fout bij downloaden PDF:', err)
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
</style>
