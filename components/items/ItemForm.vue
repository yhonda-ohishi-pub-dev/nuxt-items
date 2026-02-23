<template>
  <UCard>
    <template #header>
      <h3 class="text-lg font-semibold">
        {{ isEdit ? '物品を編集' : '物品を追加' }}
      </h3>
    </template>

    <div class="space-y-4">
      <UFormGroup label="名前" required>
        <UInput v-model="form.name" placeholder="物品名を入力" />
      </UFormGroup>

      <UFormGroup label="画像">
        <ItemsImagePicker v-model="form.imageUrl" />
      </UFormGroup>

      <UFormGroup v-if="!isEdit" label="種別">
        <USelectMenu
          v-model="form.ownerType"
          :options="ownerTypeOptions"
          value-attribute="value"
          option-attribute="label"
        />
      </UFormGroup>

      <UFormGroup label="カテゴリ">
        <UInput v-model="form.category" placeholder="カテゴリ（任意）" />
      </UFormGroup>

      <UFormGroup label="バーコード">
        <div class="flex gap-2">
          <UInput v-model="form.barcode" placeholder="バーコード（任意）" class="flex-1" />
          <UButton
            icon="i-heroicons-camera"
            size="sm"
            color="gray"
            title="カメラでスキャン"
            @click="showBarcodeScanner = true"
          />
        </div>
      </UFormGroup>
      <ItemsBarcodeScanner
        v-model="showBarcodeScanner"
        @scanned="(code: string) => form.barcode = code"
      />

      <UFormGroup label="説明">
        <UTextarea v-model="form.description" placeholder="説明（任意）" :rows="2" />
      </UFormGroup>

      <UFormGroup label="数量">
        <UInput v-model.number="form.quantity" type="number" :min="0" />
      </UFormGroup>
    </div>

    <template #footer>
      <div class="flex justify-end gap-2">
        <UButton color="gray" variant="ghost" @click="$emit('cancel')">
          キャンセル
        </UButton>
        <UButton :disabled="!form.name.trim()" :loading="submitting" @click="onSubmit">
          {{ isEdit ? '更新' : '作成' }}
        </UButton>
      </div>
    </template>
  </UCard>
</template>

<script setup lang="ts">
import type { Item } from '@yhonda-ohishi-pub-dev/logi-proto'

const props = defineProps<{
  item?: Item | null
  parentId?: string
  defaultOwnerType?: string
}>()

const emit = defineEmits<{
  submit: [data: {
    name: string
    ownerType: string
    barcode: string
    category: string
    description: string
    imageUrl: string
    quantity: number
  }]
  cancel: []
}>()

const isEdit = computed(() => !!props.item)
const submitting = ref(false)
const showBarcodeScanner = ref(false)

const ownerTypeOptions = [
  { value: 'org', label: '組織' },
  { value: 'personal', label: '個人' },
]

const form = reactive({
  name: props.item?.name ?? '',
  ownerType: props.item?.ownerType ?? props.defaultOwnerType ?? 'org',
  barcode: props.item?.barcode ?? '',
  category: props.item?.category ?? '',
  description: props.item?.description ?? '',
  imageUrl: props.item?.imageUrl ?? '',
  quantity: props.item?.quantity ?? 1,
})

watch(() => props.item, (newItem) => {
  if (newItem) {
    form.name = newItem.name
    form.ownerType = newItem.ownerType
    form.barcode = newItem.barcode
    form.category = newItem.category
    form.description = newItem.description
    form.imageUrl = newItem.imageUrl
    form.quantity = newItem.quantity
  } else {
    form.name = ''
    form.ownerType = props.defaultOwnerType ?? 'org'
    form.barcode = ''
    form.category = ''
    form.description = ''
    form.imageUrl = ''
    form.quantity = 1
  }
})

async function onSubmit() {
  if (!form.name.trim()) return
  submitting.value = true
  try {
    emit('submit', { ...form })
  } finally {
    submitting.value = false
  }
}
</script>
