<template>
  <div class="table-wrapper">
    <table class="table">
      <colgroup>
        <col style="width: 90%" />
        <col style="width: 10%" />
      </colgroup>

      <thead>
        <tr>
          <th>bestand</th>
          <th class="right">actions</th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="!files.length">
          <td colspan="5" class="empty">Geen resultaten</td>
        </tr>

        <template v-for="item in files" :key="item._id">
          <tr>
            <td>{{ item.name }}</td>
            <td class="right">
              <button class="btn" @click="openFile(item)">Open</button>
              <button class="btn" @click="deleteFile(item)">-</button>
            </td>
          </tr>
        </template>
      </tbody>
    </table>
  </div>
</template>

<script setup>
const props = defineProps({
  files: { type: Array, required: true },
})

const emit = defineEmits(['open-file', 'delete-file'])
function openFile(file) {
  emit('open-file', {
    f: file,
  })
}
function deleteFile(file) {
  emit('delete-file', {
    f: file,
  })
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
