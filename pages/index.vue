<template>
  <div class="max-w-4xl mx-auto p-4">
    <!-- ヘッダー -->
    <div class="flex items-center justify-between mb-4">
      <div class="flex items-center gap-2">
        <h1 class="text-xl font-bold">物品管理</h1>
        <span
          :class="syncConnected ? 'bg-green-400' : 'bg-gray-300'"
          class="w-2 h-2 rounded-full inline-block"
          :title="syncConnected ? '同期中' : '再接続中...'"
        />
      </div>
      <div class="flex items-center gap-2">
        <AuthToolbar :show-copy-url="false" :show-settings="false" :show-logout="false" />
        <ItemsOwnerTypeToggle v-model="ownerType" @update:model-value="onOwnerTypeChange" />
        <AuthToolbar :show-user-info="false" />
      </div>
    </div>

    <!-- パンくずリスト -->
    <div class="mb-3">
      <ItemsItemBreadcrumbs
        :breadcrumbs="breadcrumbs"
        @navigate="navigateToBreadcrumb"
        @navigate-root="navigateToRoot"
      />
    </div>

    <!-- バーコード検索 -->
    <div class="mb-4">
      <ItemsBarcodeSearch
        @search="onBarcodeSearch"
        @clear="onSearchClear"
      />
    </div>

    <!-- エラー表示 -->
    <UAlert
      v-if="error"
      color="red"
      variant="subtle"
      icon="i-heroicons-exclamation-triangle"
      :title="error"
      class="mb-4"
    />

    <!-- 検索結果モード -->
    <div v-if="searchMode" class="mb-3 space-y-2">
      <div class="flex items-center gap-2">
        <UBadge color="yellow" variant="subtle">
          検索結果: {{ searchResults.length }}件
        </UBadge>
        <UButton size="xs" variant="ghost" color="gray" @click="onSearchClear">
          戻る
        </UButton>
      </div>
      <!-- ローカル0件時: 外部API検索 -->
      <div v-if="searchResults.length === 0">
        <!-- 外部API検索中 -->
        <div v-if="lookupStatus === 'loading'" class="flex items-center gap-2 text-sm text-gray-500">
          <UIcon name="i-heroicons-arrow-path" class="animate-spin" />
          外部DBを検索中...
        </div>
        <!-- 外部API結果あり -->
        <UCard v-else-if="externalProduct" class="mb-2">
          <div class="flex items-center justify-between">
            <div>
              <p class="font-medium">{{ externalProduct.name }}</p>
              <p v-if="externalProduct.category" class="text-sm text-gray-500">{{ externalProduct.category }}</p>
              <p class="text-xs text-gray-400">出典: {{ externalProduct.source }}</p>
            </div>
            <UButton
              size="xs"
              icon="i-heroicons-plus"
              @click="openCreateFormWithBarcode(lastSearchBarcode)"
            >
              この商品を登録
            </UButton>
          </div>
        </UCard>
        <!-- 外部APIも見つからない -->
        <div v-else-if="lookupStatus === 'not_found' || lookupStatus === 'error'" class="flex items-center gap-2 text-sm text-gray-500">
          <span>外部DBにも見つかりませんでした</span>
          <UButton
            size="xs"
            icon="i-heroicons-plus"
            @click="openCreateFormWithBarcode(lastSearchBarcode)"
          >
            手動で登録
          </UButton>
        </div>
      </div>
    </div>

    <!-- 物品一覧 -->
    <div class="flex justify-end mb-2">
      <UButton
        icon="i-heroicons-plus"
        label="新規"
        size="sm"
        @click="openCreateForm"
      />
    </div>
    <ItemsItemList
      :items="displayItems"
      :loading="status === 'pending'"
      @navigate="navigateToChild"
      @edit="onEdit"
      @delete="onDelete"
    />

    <!-- 作成/編集モーダル -->
    <UModal v-model="showForm">
      <ItemsItemForm
        :item="editingItem"
        :parent-id="currentParentId"
        :default-owner-type="ownerType || 'org'"
        :initial-barcode="pendingBarcode"
        @submit="onSubmitForm"
        @cancel="showForm = false"
      />
    </UModal>

    <!-- 削除確認 -->
    <UModal v-model="showDeleteConfirm">
      <UCard>
        <template #header>
          <h3 class="text-lg font-semibold text-red-600">削除確認</h3>
        </template>
        <p>「{{ deletingItem?.name }}」を削除しますか？</p>
        <template #footer>
          <div class="flex justify-end gap-2">
            <UButton color="gray" variant="ghost" @click="showDeleteConfirm = false">
              キャンセル
            </UButton>
            <UButton color="red" :loading="deleting" @click="confirmDelete">
              削除
            </UButton>
          </div>
        </template>
      </UCard>
    </UModal>
  </div>
</template>

<script setup lang="ts">
import type { Item } from '@yhonda-ohishi-pub-dev/logi-proto'
import { AuthToolbar, useAuth } from '@yhonda-ohishi-pub-dev/auth-client'

const { setOwnerType: setAuthOwnerType } = useAuth()
const { status: lookupStatus, product: externalProduct, lookup, reset: resetLookup } = useProductLookup()

const {
  items,
  status,
  error,
  currentParentId,
  ownerType,
  breadcrumbs,
  syncConnected,
  fetchItems,
  createItem,
  updateItem,
  deleteItem,
  searchByBarcode,
  navigateToChild,
  navigateToRoot,
  navigateToBreadcrumb,
  setOwnerType,
  initSync,
} = useItems()

// フォーム状態
const showForm = ref(false)
const editingItem = ref<Item | null>(null)

// 削除確認状態
const showDeleteConfirm = ref(false)
const deletingItem = ref<Item | null>(null)
const deleting = ref(false)

// 検索状態
const searchMode = ref(false)
const searchResults = ref<Item[]>([])
const lastSearchBarcode = ref('')
const pendingBarcode = ref('')

const displayItems = computed(() =>
  searchMode.value ? searchResults.value : items.value
)

// 初回読み込み + WebSocket同期開始
onMounted(() => {
  fetchItems()
  initSync()
})

function onOwnerTypeChange(type: string) {
  searchMode.value = false
  setOwnerType(type as any)
  setAuthOwnerType(type)
}

function openCreateForm() {
  editingItem.value = null
  pendingBarcode.value = ''
  showForm.value = true
}

function openCreateFormWithBarcode(barcode: string) {
  editingItem.value = null
  searchMode.value = false
  searchResults.value = []
  pendingBarcode.value = barcode
  showForm.value = true
}

function onEdit(item: Item) {
  editingItem.value = item
  showForm.value = true
}

async function onSubmitForm(data: {
  name: string
  ownerType: string
  barcode: string
  category: string
  description: string
  imageUrl: string
  quantity: number
}) {
  try {
    if (editingItem.value) {
      await updateItem(editingItem.value.id, data)
    } else {
      await createItem(data)
    }
    showForm.value = false
    editingItem.value = null
    pendingBarcode.value = ''
  } catch (e: any) {
    // エラーは useItems 内で処理済み
  }
}

function onDelete(item: Item) {
  deletingItem.value = item
  showDeleteConfirm.value = true
}

async function confirmDelete() {
  if (!deletingItem.value) return
  deleting.value = true
  try {
    await deleteItem(deletingItem.value.id)
    showDeleteConfirm.value = false
    deletingItem.value = null
  } catch (e: any) {
    // エラーは useItems 内で処理済み
  } finally {
    deleting.value = false
  }
}

async function onBarcodeSearch(barcode: string) {
  lastSearchBarcode.value = barcode
  resetLookup()
  try {
    searchResults.value = await searchByBarcode(barcode)
    searchMode.value = true
    // ローカル0件 → 外部API検索
    if (searchResults.value.length === 0) {
      await lookup(barcode)
    }
  } catch (e: any) {
    // エラーは useItems 内で処理済み
  }
}

function onSearchClear() {
  searchMode.value = false
  searchResults.value = []
  resetLookup()
}
</script>
