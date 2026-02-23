<template>
  <UModal v-model="isOpen" @close="close">
    <UCard>
      <template #header>
        <div class="flex items-center justify-between">
          <h3 class="text-lg font-semibold">バーコードスキャン</h3>
          <UButton icon="i-heroicons-x-mark" variant="ghost" color="gray" size="sm" @click="close" />
        </div>
      </template>

      <!-- カメラビュー -->
      <div id="barcode-reader" class="w-full overflow-hidden rounded-lg" />

      <p v-if="lastResult" class="mt-3 text-center text-sm font-medium text-green-600">
        検出: {{ lastResult }}
      </p>
      <p v-if="error" class="mt-3 text-center text-sm text-red-500">
        {{ error }}
      </p>

      <!-- 手動入力フォールバック -->
      <div class="mt-4 border-t pt-3">
        <p class="text-xs text-gray-500 mb-2">カメラが使えない場合は手入力</p>
        <div class="flex gap-2">
          <UInput v-model="manualInput" placeholder="バーコードを入力..." class="flex-1" @keyup.enter="submitManual" />
          <UButton :disabled="!manualInput.trim()" @click="submitManual">
            入力
          </UButton>
        </div>
      </div>
    </UCard>
  </UModal>
</template>

<script setup lang="ts">
const props = defineProps<{
  modelValue: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  scanned: [code: string]
}>()

const isOpen = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v),
})

const lastResult = ref('')
const error = ref('')
const manualInput = ref('')
let html5QrCode: any = null

watch(isOpen, async (open) => {
  if (open) {
    await nextTick()
    startScanner()
  } else {
    stopScanner()
  }
})

async function startScanner() {
  lastResult.value = ''
  error.value = ''

  try {
    const { Html5Qrcode } = await import('html5-qrcode')
    html5QrCode = new Html5Qrcode('barcode-reader')

    await html5QrCode.start(
      { facingMode: 'environment' },
      {
        fps: 10,
        qrbox: { width: 250, height: 150 },
        aspectRatio: 1.0,
      },
      (decodedText: string) => {
        lastResult.value = decodedText
        emit('scanned', decodedText)
        close()
      },
      () => {
        // スキャン失敗（ノイズ）は無視
      },
    )
  } catch (e: any) {
    error.value = 'カメラの起動に失敗しました。手動入力をご利用ください。'
  }
}

async function stopScanner() {
  if (html5QrCode) {
    try {
      const state = html5QrCode.getState()
      if (state === 2) { // Html5QrcodeScannerState.SCANNING
        await html5QrCode.stop()
      }
    } catch {
      // 既に停止済み
    }
    html5QrCode = null
  }
}

function close() {
  isOpen.value = false
}

function submitManual() {
  if (manualInput.value.trim()) {
    emit('scanned', manualInput.value.trim())
    manualInput.value = ''
    close()
  }
}

onUnmounted(() => {
  stopScanner()
})
</script>
