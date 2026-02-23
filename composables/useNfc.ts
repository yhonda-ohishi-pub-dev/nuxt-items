const ITEMS_DOMAIN = 'items.mtamaramu.com'

export function useNfc() {
  const isSupported = ref(false)
  const isScanning = ref(false)
  const error = ref<string | null>(null)

  let ndef: NDEFReader | null = null
  let abortController: AbortController | null = null

  onMounted(() => {
    isSupported.value = typeof window !== 'undefined' && 'NDEFReader' in window
  })

  async function startScan(onRead: (result: NfcReadResult) => void) {
    if (!isSupported.value) {
      error.value = 'このデバイスはNFCに対応していません'
      return
    }
    try {
      ndef = new NDEFReader()
      abortController = new AbortController()

      ndef.onreading = (event: NDEFReadingEvent) => {
        const result = parseNdefMessage(event.message)
        onRead(result)
      }

      ndef.onreadingerror = () => {
        error.value = 'NFCタグのデータを読み取れませんでした'
      }

      await ndef.scan({ signal: abortController.signal })
      isScanning.value = true
      error.value = null
    } catch (e: any) {
      if (e.name === 'AbortError') return
      error.value = e.message || 'NFCスキャンの開始に失敗しました'
      isScanning.value = false
    }
  }

  async function writeItemUrl(itemId: string): Promise<boolean> {
    if (!isSupported.value) {
      error.value = 'このデバイスはNFCに対応していません'
      return false
    }
    try {
      const writer = new NDEFReader()
      const url = `https://${ITEMS_DOMAIN}/?nfc=${itemId}`
      await writer.write({
        records: [{ recordType: 'url', data: url }],
      })
      error.value = null
      return true
    } catch (e: any) {
      if (e.name === 'AbortError') return false
      error.value = e.message || 'NFCタグへの書き込みに失敗しました'
      return false
    }
  }

  function stopScan() {
    abortController?.abort()
    abortController = null
    isScanning.value = false
  }

  onUnmounted(() => {
    stopScan()
  })

  return { isSupported, isScanning, error, startScan, writeItemUrl, stopScan }
}

export interface NfcReadResult {
  type: 'item' | 'text' | 'url' | 'unknown'
  itemId?: string
  text?: string
  url?: string
}

function parseNdefMessage(message: NDEFMessage): NfcReadResult {
  const decoder = new TextDecoder()

  for (const record of message.records) {
    if (record.recordType === 'url' && record.data) {
      const url = decoder.decode(record.data)
      const itemId = extractItemIdFromUrl(url)
      if (itemId) {
        return { type: 'item', itemId, url }
      }
      return { type: 'url', url }
    }

    if (record.recordType === 'text' && record.data) {
      const text = new TextDecoder(record.encoding || 'utf-8').decode(record.data)
      // UUID形式チェック
      if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(text)) {
        return { type: 'item', itemId: text, text }
      }
      return { type: 'text', text }
    }
  }

  return { type: 'unknown' }
}

function extractItemIdFromUrl(url: string): string | null {
  try {
    const parsed = new URL(url)
    if (parsed.hostname === ITEMS_DOMAIN) {
      return parsed.searchParams.get('nfc')
    }
  } catch {
    // invalid URL
  }
  return null
}
