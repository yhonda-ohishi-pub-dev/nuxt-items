<template>
  <div class="flex gap-2">
    <UInput
      v-model="query"
      placeholder="バーコード or Amazon URL..."
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
      v-if="isNfcSupported"
      size="sm"
      color="gray"
      icon="i-heroicons-signal"
      title="NFCスキャン"
      @click="showNfcScanner = true"
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
    <ItemsNfcScanner
      v-model="showNfcScanner"
      @scanned="onNfcScanned"
      @scanned-text="onNfcScannedText"
    />
  </div>
</template>

<script setup lang="ts">
const query = ref('')
const showScanner = ref(false)
const showNfcScanner = ref(false)
const { isSupported: isNfcSupported } = useNfc()

const emit = defineEmits<{
  search: [barcode: string]
  clear: []
  'nfc-scanned': [itemId: string]
  'url-search': [url: string]
}>()

function isAmazonLikeUrl(url: string): boolean {
  try {
    const parsed = new URL(url)
    return /^(www\.)?amazon\.(co\.jp|jp|com|co\.uk|de|fr|it|es|ca)$/.test(parsed.hostname)
      || parsed.hostname === 'amzn.asia'
      || parsed.hostname === 'amzn.to'
  } catch {
    return false
  }
}

function onSearch() {
  const value = query.value.trim()
  if (!value) return
  if (isAmazonLikeUrl(value)) {
    emit('url-search', value)
  } else {
    emit('search', value)
  }
}

function onScanned(code: string) {
  query.value = code
  onSearch()
}

function onNfcScanned(itemId: string) {
  emit('nfc-scanned', itemId)
}

function onNfcScannedText(text: string) {
  query.value = text
  onSearch()
}

function onClear() {
  query.value = ''
  emit('clear')
}
</script>
