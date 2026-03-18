import { ref } from 'vue'

export const collapsed = ref(false)

export function toggleSidebar() {
  collapsed.value = !collapsed.value
}