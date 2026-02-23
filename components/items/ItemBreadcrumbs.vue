<template>
  <nav class="flex items-center gap-1 text-sm text-gray-600">
    <UButton
      variant="ghost"
      size="xs"
      icon="i-heroicons-home"
      @click="$emit('navigateRoot')"
    />
    <template v-for="(crumb, index) in breadcrumbs" :key="crumb.id">
      <span class="text-gray-400">/</span>
      <UButton
        variant="ghost"
        size="xs"
        :label="crumb.name"
        @click="$emit('navigate', index)"
      />
    </template>
  </nav>
</template>

<script setup lang="ts">
import type { BreadcrumbItem } from '~/composables/useItems'

defineProps<{
  breadcrumbs: BreadcrumbItem[]
}>()

defineEmits<{
  navigate: [index: number]
  navigateRoot: []
}>()
</script>
