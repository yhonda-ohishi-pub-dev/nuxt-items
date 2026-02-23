<template>
  <UModal v-model="isOpen" :fullscreen="isMobile" @close="close">
    <UCard>
      <template #header>
        <div class="flex items-center justify-between">
          <h3 class="text-lg font-semibold">NFCタグに書き込み</h3>
          <UButton icon="i-heroicons-x-mark" variant="ghost" color="gray" size="sm" @click="close" />
        </div>
      </template>

      <div class="flex flex-col items-center gap-4 py-6">
        <!-- 書き込み待機中 -->
        <template v-if="writeStatus === 'waiting'">
          <div class="w-24 h-24 rounded-full bg-primary-50 flex items-center justify-center animate-pulse">
            <UIcon name="i-heroicons-signal" class="text-4xl text-primary-500" />
          </div>
          <p class="text-sm text-gray-600 text-center">
            NFCタグにスマートフォンをかざしてください
          </p>
          <p class="text-xs text-gray-400 text-center">
            「{{ itemName }}」を書き込みます
          </p>
        </template>

        <!-- 書き込み成功 -->
        <template v-else-if="writeStatus === 'success'">
          <div class="w-24 h-24 rounded-full bg-green-50 flex items-center justify-center">
            <UIcon name="i-heroicons-check-circle" class="text-4xl text-green-500" />
          </div>
          <p class="text-sm font-medium text-green-600 text-center">
            NFCタグに書き込みました
          </p>
        </template>

        <!-- 書き込み失敗 -->
        <template v-else-if="writeStatus === 'error'">
          <div class="w-24 h-24 rounded-full bg-red-50 flex items-center justify-center">
            <UIcon name="i-heroicons-exclamation-triangle" class="text-4xl text-red-500" />
          </div>
          <p class="text-sm text-red-500 text-center">
            {{ error || '書き込みに失敗しました' }}
          </p>
          <UButton size="sm" @click="startWrite">
            再試行
          </UButton>
        </template>
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
const props = defineProps<{
  modelValue: boolean
  itemId: string
  itemName: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

const isMobile = useMediaQuery('(max-width: 640px)')
const { error, writeItemUrl } = useNfc()

const isOpen = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v),
})

const writeStatus = ref<'waiting' | 'success' | 'error'>('waiting')

watch(isOpen, (open) => {
  if (open) {
    startWrite()
  }
})

async function startWrite() {
  writeStatus.value = 'waiting'
  const success = await writeItemUrl(props.itemId)
  writeStatus.value = success ? 'success' : 'error'
}

function close() {
  isOpen.value = false
}
</script>
