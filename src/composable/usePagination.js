import { ref, computed } from 'vue'

export function usePagination(items, options = {}) {
  const currentPage = ref(1)

  const pageSize = ref(options.pageSize ?? 10)

  const totalPages = computed(() =>
    Math.max(1, Math.ceil(items.value.length / pageSize.value))
  )

  const paginatedItems = computed(() => {
    const start = (currentPage.value - 1) * pageSize.value
    return items.value.slice(start, start + pageSize.value)
  })

  function next() {
    if (currentPage.value < totalPages.value) currentPage.value++
  }

  function prev() {
    if (currentPage.value > 1) currentPage.value--
  }

  function setPage(page) {
    currentPage.value = Math.min(Math.max(1, page), totalPages.value)
  }

  function reset() {
    currentPage.value = 1
  }

  return {
    currentPage,
    pageSize,
    totalPages,
    paginatedItems,
    next,
    prev,
    setPage,
    reset,
  }
}