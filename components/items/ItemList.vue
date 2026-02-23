<template>
  <div>
    <UTable
      :rows="items"
      :columns="columns"
      :loading="loading"
      :empty-state="{ icon: 'i-heroicons-cube', label: '物品がありません' }"
      :ui="{ td: { base: 'whitespace-nowrap' } }"
      @select="onRowClick"
    >
      <template #image-data="{ row }">
        <ItemsImageThumbnail v-if="row.imageUrl" :uuid="row.imageUrl" />
        <div v-else class="w-8 h-8 bg-gray-100 dark:bg-gray-800 rounded flex items-center justify-center">
          <UIcon name="i-heroicons-photo" class="text-gray-300 text-xs" />
        </div>
      </template>

      <template #name-data="{ row }">
        <div class="flex items-center gap-2">
          <UIcon
            :name="row.parentId === '' ? 'i-heroicons-folder' : 'i-heroicons-cube'"
            class="text-gray-400"
          />
          <span>{{ row.name }}</span>
        </div>
      </template>

      <template #ownerType-data="{ row }">
        <UBadge
          :color="row.ownerType === 'org' ? 'green' : 'blue'"
          variant="subtle"
          size="xs"
        >
          {{ row.ownerType === 'org' ? '組織' : '個人' }}
        </UBadge>
      </template>

      <template #category-data="{ row }">
        <UBadge v-if="row.category" color="gray" variant="subtle" size="xs">
          {{ row.category }}
        </UBadge>
      </template>

      <template #actions-data="{ row }">
        <div class="flex gap-1" @click.stop>
          <UButton
            icon="i-heroicons-arrow-right"
            size="xs"
            variant="ghost"
            color="gray"
            title="中を見る"
            @click="$emit('navigate', row)"
          />
          <UButton
            icon="i-heroicons-pencil-square"
            size="xs"
            variant="ghost"
            color="gray"
            title="編集"
            @click="$emit('edit', row)"
          />
          <UButton
            icon="i-heroicons-trash"
            size="xs"
            variant="ghost"
            color="red"
            title="削除"
            @click="$emit('delete', row)"
          />
        </div>
      </template>
    </UTable>
  </div>
</template>

<script setup lang="ts">
import type { Item } from '@yhonda-ohishi-pub-dev/logi-proto'

defineProps<{
  items: Item[]
  loading: boolean
}>()

const emit = defineEmits<{
  navigate: [item: Item]
  edit: [item: Item]
  delete: [item: Item]
}>()

const columns = [
  { key: 'image', label: '' },
  { key: 'name', label: '名前' },
  { key: 'ownerType', label: '種別' },
  { key: 'category', label: 'カテゴリ' },
  { key: 'quantity', label: '数量' },
  { key: 'actions', label: '' },
]

function onRowClick(row: Item) {
  emit('navigate', row)
}
</script>
