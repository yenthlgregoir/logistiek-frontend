<template>
  <div class="table-wrapper">
    <table class="table">
      <colgroup>
        <col style="width: 10%" />
        <!-- productcode -->
        <col style="width: 70%" />
        <!-- omschrijving -->
        <col style="width: 10%" />
        <!-- Aantal -->
        <col style="width: 10%" />
        <!-- Prijs -->
      </colgroup>

      <thead>
        <tr>
          <th>Productcode</th>
          <th>omschrijving</th>
          <th>prijs</th>
          <th class="right"></th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="!products.length">
          <td colspan="5" class="empty">Geen resultaten</td>
        </tr>

        <template v-for="product in products" :key="product.ref">
          <!-- producten -->
          <tr>
            <td>{{ product.productcode }}</td>
            <td>{{ product.omschrijving }}</td>
            <td>€{{ product.eenheidsprijs }}</td>
            <!-- delete -->
            <td>
              <template v-if="activeProduct === product._id">
                <input type="number" v-model="amount" min="1" style="width: 60px" />
                <button @click="confirmAdd(product)">✔</button>
                <button @click="activeProduct = null">✖</button>
              </template>

              <template v-else>
                <button @click="startAdding(product)">+</button>
              </template>
            </td>
          </tr>
        </template>
      </tbody>
    </table>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const props = defineProps({
  products: { type: Array, required: true },
})

const emit = defineEmits(['add-product'])

// Houd bij welk product actief is
const activeProduct = ref(null)
const amount = ref(1)

function startAdding(product) {
  activeProduct.value = product._id
  amount.value = 1
}

function confirmAdd(product) {
  emit('add-product', {
    productId: product._id,
    aantal: amount.value,
  })

  activeProduct.value = null
}
</script>

<style scoped>
.table-wrapper {
  background: white;
  border-radius: 8px;
  overflow: hidden;
}

.table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  table-layout: fixed;
}

thead tr {
  background: #8ec6f7;
}

th,
td {
  padding: 12px 14px;
  border-bottom: 1px solid #e5e7eb;
  text-align: left;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.right {
  text-align: right;
}

.empty {
  text-align: center;
  color: #9ca3af;
  padding: 24px;
}
</style>
