<template>
  <div class="flex gap-2">
    <UInput
      v-model="query"
      placeholder="バーコードで検索..."
      icon="i-heroicons-magnifying-glass"
      size="sm"
      class="flex-1"
      @keyup.enter="onSearch"
    />
    <UButton
      size="sm"
      color="gray"
      :disabled="!query.trim()"
      @click="onSearch"
    >
      検索
    </UButton>
    <UButton
      size="sm"
      color="gray"
      icon="i-heroicons-camera"
      title="カメラでスキャン"
      @click="showScanner = true"
    />
    <UButton
      v-if="query"
      size="sm"
      variant="ghost"
      color="gray"
      icon="i-heroicons-x-mark"
      @click="onClear"
    />
    <ItemsBarcodeScanner
      v-model="showScanner"
      @scanned="onScanned"
    />
  </div>
</template>

<script setup lang="ts">
const query = ref('')
const showScanner = ref(false)

const emit = defineEmits<{
  search: [barcode: string]
  clear: []
}>()

function onSearch() {
  if (query.value.trim()) {
    emit('search', query.value.trim())
  }
}

function onScanned(code: string) {
  query.value = code
  onSearch()
}

function onClear() {
  query.value = ''
  emit('clear')
}
</script>
