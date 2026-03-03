<template>
  <div class="page">
    <div class="container">
      <h1 class="page-title">Bestanden</h1>

      <div class="toolbar">
        <button class="btn btn-primary" @click="onCreate"><i class="fa fa-plus"></i> Add</button>
      </div>
      <FilesTable :files="filesTable" @open-file="openFile" @delete-file="deleteFile" />

      <!-- ===== Upload Modal ===== -->
      <div v-if="showUploadModal" class="modal-backdrop" @click.self="closeModal">
        <div class="modal">
          <div class="modal-header">
            <h2>Bestanden uploaden</h2>
            <button class="btn-close" @click="closeModal">&times;</button>
          </div>

          <!-- Dropzone -->
          <div
            class="dropzone"
            :class="{ 'drag-over': isDragOver }"
            @dragover.prevent="onDragOver"
            @dragleave.prevent="onDragLeave"
            @drop.prevent="onDrop"
            @click="openFilePicker"
          >
            <p>
              Sleep hier je bestanden naartoe of
              <span class="browse">klik om te selecteren</span>
            </p>
            <input ref="fileInput" type="file" multiple hidden @change="onFileSelect" />
          </div>

          <!-- Bestandenlijst -->
          <ul class="file-list" v-if="files.length">
            <li v-for="(f, idx) in files" :key="idx">
              {{ f.name }} <small>({{ formatSize(f.size) }})</small>
              <button class="link" @click="removeFile(idx)">verwijder</button>
            </li>
          </ul>

          <!-- Acties -->
          <div class="modal-actions">
            <button class="btn btn-secondary" @click="closeModal">Annuleer</button>
            <button
              class="btn btn-primary"
              :disabled="!files.length || uploading"
              @click="uploadFiles"
            >
              <span v-if="uploading"> <i class="fa fa-spinner fa-spin"></i> Uploaden... </span>
              <span v-else>Upload</span>
            </button>
          </div>

          <p class="error" v-if="error">{{ error }}</p>
        </div>
      </div>
      <!-- ===== /Upload Modal ===== -->
    </div>
  </div>
</template>

<script setup>
import FilesTable from '@/components/files/FilesTable.vue'
import { uploadApi } from '@/api/upload'
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'

// Tables data
const filesTable = ref([])

// Files selected IN the modal
const files = ref([])

const route = useRoute()
const orderId = route.params.id

// Laad bestanden bij openen pagina
onMounted(async () => {
  try {
    const response = await uploadApi.get(orderId)
    filesTable.value = response || []
  } catch (err) {
    console.error(err)
  }
})

// Modal state
const showUploadModal = ref(false)
const isDragOver = ref(false)
const fileInput = ref(null)
const uploading = ref(false)
const error = ref('')

function openFile(f) {
  const url = `${import.meta.env.VITE_API_BASE_URL}/uploads/${orderId}/files/${f.f.name}/open`
  window.open(url, '_blank')
}

async function deleteFile(f) {
  try {
    await uploadApi.remove(orderId, f.f.name)
    const response = await uploadApi.get(orderId)
    filesTable.value = response || []
  } catch (err) {
    console.error(err)
  }
}
function onCreate() {
  showUploadModal.value = true
}

function closeModal() {
  files.value = []
  isDragOver.value = false
  uploading.value = false
  error.value = ''
  showUploadModal.value = false
}

function openFilePicker() {
  fileInput.value?.click()
}

function onDragOver() {
  isDragOver.value = true
}

function onDragLeave() {
  isDragOver.value = false
}

function onDrop(e) {
  isDragOver.value = false
  if (e.dataTransfer?.files?.length) {
    files.value.push(...e.dataTransfer.files)
  }
}

function onFileSelect(e) {
  if (e.target?.files?.length) {
    files.value.push(...e.target.files)
    e.target.value = ''
  }
}

function removeFile(idx) {
  files.value.splice(idx, 1)
}

function formatSize(n) {
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`
  return `${(n / (1024 * 1024)).toFixed(1)} MB`
}

// UPLOAD
async function uploadFiles() {
  if (!files.value.length) return

  try {
    uploading.value = true
    error.value = ''

    const formData = new FormData()
    files.value.forEach((f) => formData.append('files', f))

    await uploadApi.upload(orderId, formData)

    // Refresh de lijst NA upload
    const updatedFiles = await uploadApi.get(orderId)
    filesTable.value = updatedFiles

    closeModal()
  } catch (err) {
    console.error(err)
    error.value = 'Upload mislukt. Probeer opnieuw.'
  } finally {
    uploading.value = false
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
  margin: 0 2%;
  display: block;
}
.toolbar {
  display: flex;
  justify-content: right;
  align-items: center;
  margin-bottom: 16px;
}

/* ===== Modal styles ===== */
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(17, 24, 39, 0.45); /* semi-dark overlay */
  display: grid;
  place-items: center;
  z-index: 999;
}
.modal {
  width: min(720px, 92vw);
  background: #fff;
  border-radius: 10px;
  padding: 18px 18px 14px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.25);
}
.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}
.btn-close {
  border: none;
  background: transparent;
  font-size: 24px;
  cursor: pointer;
  line-height: 1;
}

.dropzone {
  border: 2px dashed #cbd5e1;
  padding: 32px;
  border-radius: 10px;
  text-align: center;
  background: #f8fafc;
  color: #334155;
  transition: 0.15s ease;
  user-select: none;
}
.dropzone.drag-over {
  background: #eef6ff;
  border-color: #3b82f6;
}
.dropzone .browse {
  color: #2563eb;
  text-decoration: underline;
  cursor: pointer;
}

.file-list {
  margin: 12px 0 0 0;
  padding-left: 16px;
}
.file-list li {
  margin: 4px 0;
}
.file-list .link {
  background: none;
  border: none;
  color: #2563eb;
  cursor: pointer;
  margin-left: 8px;
}

.modal-actions {
  margin-top: 14px;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.btn {
  padding: 8px 14px;
  border-radius: 6px;
  border: 1px solid transparent;
  cursor: pointer;
}
.btn-primary {
  background: #2f80ed;
  color: #fff;
}
.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.btn-secondary {
  background: #e6f0fa;
  color: #1f4e79;
}
.error {
  color: #b91c1c;
  margin-top: 8px;
}
</style>
