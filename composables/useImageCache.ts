/**
 * 画像URLキャッシュ Composable（シングルトン）
 * UUID → Object URL のマッピングをグローバルに保持し、重複ダウンロードを防止
 */
export function useImageCache() {
  const cache = useState<Record<string, string>>('imageCache', () => ({}))
  const loading = useState<Record<string, boolean>>('imageCacheLoading', () => ({}))

  async function getImageUrl(uuid: string): Promise<string | null> {
    if (!uuid) return null
    if (cache.value[uuid]) return cache.value[uuid]
    if (loading.value[uuid]) return null

    loading.value[uuid] = true
    try {
      const { downloadImageAsObjectUrl } = useFileUpload()
      const url = await downloadImageAsObjectUrl(uuid)
      if (url) {
        cache.value[uuid] = url
      }
      return url
    } finally {
      delete loading.value[uuid]
    }
  }

  function isLoading(uuid: string): boolean {
    return !!loading.value[uuid]
  }

  return { getImageUrl, isLoading, cache }
}
