<template>
  <div>
    <!-- 画像プレビュー -->
    <div v-if="previewUrl" class="relative inline-block mb-2">
      <img :src="previewUrl" class="w-32 h-32 object-cover rounded-lg border" />
      <UButton
        icon="i-heroicons-x-mark"
        size="2xs"
        color="red"
        variant="solid"
        class="absolute -top-1 -right-1 rounded-full"
        @click="removeImage"
      />
    </div>

    <!-- アップロードボタン -->
    <div v-else class="flex gap-2">
      <UButton
        icon="i-heroicons-camera"
        size="sm"
        color="gray"
        :loading="uploading"
        @click="openCamera"
      >
        撮影
      </UButton>
      <UButton
        icon="i-heroicons-photo"
        size="sm"
        color="gray"
        :loading="uploading"
        @click="openGallery"
      >
        選択
      </UButton>
    </div>

    <!-- Hidden inputs -->
    <input
      ref="cameraInput"
      type="file"
      accept="image/*"
      capture="environment"
      class="hidden"
      @change="onFileSelected"
    />
    <input
      ref="galleryInput"
      type="file"
      accept="image/*"
      class="hidden"
      @change="onFileSelected"
    />

    <!-- アップロード中 -->
    <UProgress v-if="uploading" :value="undefined" animation="carousel" size="xs" class="mt-2" />
    <p v-if="uploadError" class="text-xs text-red-500 mt-1">{{ uploadError }}</p>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  modelValue: string
}>()

const emit = defineEmits<{
  'update:modelValue': [uuid: string]
}>()

const { uploadImage } = useFileUpload()
const { getImageUrl } = useImageCache()

const cameraInput = ref<HTMLInputElement>()
const galleryInput = ref<HTMLInputElement>()
const uploading = ref(false)
const uploadError = ref('')
const localPreviewUrl = ref<string | null>(null)

// 既存画像の読み込み
const existingImageUrl = ref<string | null>(null)
watch(() => props.modelValue, async (uuid) => {
  if (uuid && !localPreviewUrl.value) {
    existingImageUrl.value = await getImageUrl(uuid)
  }
}, { immediate: true })

const previewUrl = computed(() => localPreviewUrl.value || existingImageUrl.value)

function openCamera() {
  cameraInput.value?.click()
}

function openGallery() {
  galleryInput.value?.click()
}

async function onFileSelected(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return

  // ローカルプレビュー即表示
  localPreviewUrl.value = URL.createObjectURL(file)
  uploadError.value = ''
  uploading.value = true

  try {
    const uuid = await uploadImage(file)
    if (uuid) {
      emit('update:modelValue', uuid)
    } else {
      uploadError.value = 'アップロードに失敗しました'
      removePreview()
    }
  } catch (e: any) {
    uploadError.value = e.message || 'アップロードに失敗しました'
    removePreview()
  } finally {
    uploading.value = false
    input.value = ''
  }
}

function removeImage() {
  removePreview()
  existingImageUrl.value = null
  emit('update:modelValue', '')
}

function removePreview() {
  if (localPreviewUrl.value) {
    URL.revokeObjectURL(localPreviewUrl.value)
    localPreviewUrl.value = null
  }
}

onUnmounted(() => {
  if (localPreviewUrl.value) {
    URL.revokeObjectURL(localPreviewUrl.value)
  }
})
</script>
