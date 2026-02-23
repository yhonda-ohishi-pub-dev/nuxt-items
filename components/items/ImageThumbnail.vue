<template>
  <div ref="el" class="w-8 h-8 flex-shrink-0">
    <img v-if="src" :src="src" class="w-full h-full object-cover rounded" />
    <USkeleton v-else-if="isLoading" class="w-full h-full rounded" />
    <div v-else class="w-full h-full bg-gray-100 dark:bg-gray-800 rounded flex items-center justify-center">
      <UIcon name="i-heroicons-photo" class="text-gray-300 text-xs" />
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  uuid: string
}>()

const { getImageUrl, isLoading: isCacheLoading } = useImageCache()

const el = ref<HTMLElement>()
const src = ref<string | null>(null)
const loading = ref(false)

const isLoading = computed(() => loading.value || isCacheLoading(props.uuid))

onMounted(() => {
  if (!props.uuid) return
  const observer = new IntersectionObserver(
    ([entry]) => {
      if (entry.isIntersecting) {
        loadImage()
        observer.disconnect()
      }
    },
    { rootMargin: '100px' },
  )
  if (el.value) observer.observe(el.value)
  onUnmounted(() => observer.disconnect())
})

async function loadImage() {
  loading.value = true
  src.value = await getImageUrl(props.uuid)
  loading.value = false
}
</script>
