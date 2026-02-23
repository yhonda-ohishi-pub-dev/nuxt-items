/**
 * 画像アップロード/ダウンロード Composable
 * FilesService 経由で GCS に保存
 */
export function useFileUpload() {
  const { $grpc } = useNuxtApp()

  /**
   * 画像をクライアント側でリサイズしてJPEGに変換
   */
  async function resizeImage(file: File, maxWidth: number): Promise<ArrayBuffer> {
    return new Promise((resolve, reject) => {
      const img = new Image()
      const url = URL.createObjectURL(file)
      img.onload = () => {
        URL.revokeObjectURL(url)
        let { width, height } = img
        if (width > maxWidth) {
          height = Math.round(height * (maxWidth / width))
          width = maxWidth
        }
        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')!
        ctx.drawImage(img, 0, 0, width, height)
        canvas.toBlob(
          (blob) => {
            if (!blob) return reject(new Error('リサイズに失敗しました'))
            blob.arrayBuffer().then(resolve, reject)
          },
          'image/jpeg',
          0.85,
        )
      }
      img.onerror = () => {
        URL.revokeObjectURL(url)
        reject(new Error('画像の読み込みに失敗しました'))
      }
      img.src = url
    })
  }

  /**
   * 画像をアップロードしてファイルUUIDを返す
   */
  async function uploadImage(file: File): Promise<string> {
    const resized = await resizeImage(file, 1200)
    const content = new Uint8Array(resized)
    const res: any = await $grpc.files.createFile({
      filename: file.name || 'image.jpg',
      type: 'image/jpeg',
      content,
    })
    return (res?.file?.uuid as string) || ''
  }

  /**
   * ファイルUUIDからObject URLを取得（DownloadFile ストリーミング）
   */
  async function downloadImageAsObjectUrl(uuid: string): Promise<string | null> {
    try {
      const parts: Uint8Array<ArrayBuffer>[] = []
      for await (const chunk of $grpc.files.downloadFile({ uuid })) {
        const data = (chunk as any).data as Uint8Array
        // コピーして ArrayBuffer 型を保証
        parts.push(new Uint8Array(data))
      }
      if (parts.length === 0) return null
      const blob = new Blob(parts, { type: 'image/jpeg' })
      return URL.createObjectURL(blob)
    } catch {
      return null
    }
  }

  return { uploadImage, downloadImageAsObjectUrl }
}
