<template>
  <div class="table-wrapper">
    <table class="table">
      <colgroup>
        <col style="width: 10%" />
        <col style="width: 60%" />
        <col style="width: 10%" />
        <col style="width: 10%" />
        <col style="width: 10%" />
      </colgroup>

      <thead>
        <tr>
          <th>Productcode</th>
          <th>omschrijving</th>
          <th>Aantal</th>
          <th>Prijs</th>
          <th class="right">actions</th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="!products.length">
          <td colspan="5" class="empty">Geen resultaten</td>
        </tr>

        <template v-for="item in products" :key="item._id">
          <tr>
            <td>{{ item.product.productcode }}</td>
            <td>{{ item.product.omschrijving }}</td>
            <td>{{ item.aantal }}</td>
            <td>{{ item.product.eenheidsprijs * item.aantal }}</td>
            <td class="right"><button>-</button></td>
          </tr>
        </template>
      </tbody>
    </table>
  </div>
</template>

<script setup>
defineProps({
  products: { type: Array, required: true },
})

defineEmits(['delete-file'])
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
