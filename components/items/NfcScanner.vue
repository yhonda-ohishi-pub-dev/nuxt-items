<template>
  <UModal v-model="isOpen" :fullscreen="isMobile" @close="close">
    <UCard>
      <template #header>
        <div class="flex items-center justify-between">
          <h3 class="text-lg font-semibold">NFCスキャン</h3>
          <UButton icon="i-heroicons-x-mark" variant="ghost" color="gray" size="sm" @click="close" />
        </div>
      </template>

      <div class="flex flex-col items-center gap-4 py-6">
        <div
          :class="[
            'w-24 h-24 rounded-full flex items-center justify-center',
            isScanning ? 'bg-primary-50 animate-pulse' : 'bg-gray-100',
          ]"
        >
          <UIcon
            name="i-heroicons-signal"
            :class="['text-4xl', isScanning ? 'text-primary-500' : 'text-gray-400']"
          />
        </div>

        <p v-if="isScanning" class="text-sm text-gray-600 text-center">
          NFCタグにスマートフォンをかざしてください
        </p>
        <p v-else-if="error" class="text-sm text-red-500 text-center">
          {{ error }}
        </p>
        <p v-else class="text-sm text-gray-500 text-center">
          スキャンを開始しています...
        </p>

        <p v-if="lastResult" class="text-sm font-medium text-green-600 text-center">
          検出しました
        </p>
      </div>

      <template #footer>
        <div class="flex justify-end">
          <UButton color="gray" variant="ghost" @click="close">
            閉じる
          </UButton>
        </div>
      </template>
    </UCard>
  </UModal>
</template>

<script setup lang="ts">
import type { NfcReadResult } from '~/composables/useNfc'

const props = defineProps<{
  modelValue: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'scanned': [itemId: string]
  'scanned-text': [text: string]
}>()

const isMobile = useMediaQuery('(max-width: 640px)')
const { isScanning, error, startScan, stopScan } = useNfc()

const isOpen = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v),
})

const lastResult = ref(false)

watch(isOpen, (open) => {
  if (open) {
    lastResult.value = false
    startScan(onNfcRead)
  } else {
    stopScan()
  }
})

function onNfcRead(result: NfcReadResult) {
  lastResult.value = true
  if (result.type === 'item' && result.itemId) {
    emit('scanned', result.itemId)
    close()
  } else if (result.type === 'text' && result.text) {
    emit('scanned-text', result.text)
    close()
  } else if (result.type === 'url' && result.url) {
    emit('scanned-text', result.url)
    close()
  }
}

function close() {
  isOpen.value = false
}

onUnmounted(() => {
  stopScan()
})
</script>
