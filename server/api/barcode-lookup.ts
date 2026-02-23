/**
 * バーコード商品検索 API Route
 *
 * 楽天製品検索APIを使ってJANコードから商品情報を取得
 * Refererヘッダーが必要なためサーバーサイドでプロキシ
 */

const RAKUTEN_API_URL =
  'https://openapi.rakuten.co.jp/ichibaproduct/api/Product/Search/20250801'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const barcode = (query.code as string)?.trim()

  if (!barcode) {
    throw createError({ statusCode: 400, message: 'code parameter is required' })
  }

  const { cloudflare } = event.context
  const env = cloudflare?.env || {}
  const appId = env.RAKUTEN_APP_ID || ''
  const accessKey = env.RAKUTEN_ACCESS_KEY || ''

  if (!appId || !accessKey) {
    throw createError({ statusCode: 500, message: 'Rakuten API credentials not configured' })
  }

  const url = `${RAKUTEN_API_URL}?format=json&applicationId=${appId}&accessKey=${accessKey}&productCode=${encodeURIComponent(barcode)}`

  const res = await fetch(url, {
    headers: {
      Referer: 'https://items.mtamaramu.com/',
      Origin: 'https://items.mtamaramu.com',
    },
  })

  if (!res.ok) {
    const text = await res.text()
    // 404 = 商品が見つからない（楽天は404ではなく空結果を返すが念のため）
    if (res.status === 404) {
      return { found: false }
    }
    throw createError({ statusCode: res.status, message: text })
  }

  const data = (await res.json()) as {
    count?: number
    Products?: Array<{
      Product: {
        productName?: string
        brandName?: string
        makerName?: string
        productCaption?: string
        genreName?: string
        mediumImageUrl?: string
      }
    }>
  }

  if (!data.count || !data.Products?.length) {
    return { found: false }
  }

  const p = data.Products[0].Product
  return {
    found: true,
    name: p.productName || '',
    brand: p.brandName || '',
    maker: p.makerName || '',
    category: p.genreName || '',
    description: p.productCaption || '',
    imageUrl: p.mediumImageUrl || '',
  }
})
