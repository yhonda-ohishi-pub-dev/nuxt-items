/**
 * Amazon 商品情報取得 API Route
 *
 * Amazon URL から商品情報を取得する。
 * 1. OG meta タグからの抽出を試行（Amazon がブロックする場合あり）
 * 2. フォールバック: URL パスから商品名を抽出（/商品名/dp/ASIN/ 形式）
 */

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const rawUrl = (query.url as string)?.trim()

  if (!rawUrl) {
    throw createError({ statusCode: 400, message: 'url parameter is required' })
  }

  if (!isAmazonUrl(rawUrl)) {
    throw createError({ statusCode: 400, message: 'Not a recognized Amazon URL' })
  }

  const asin = extractAsin(rawUrl)

  try {
    const res = await fetch(rawUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'ja,en-US;q=0.9,en;q=0.8',
      },
      redirect: 'follow',
    })

    const finalUrl = res.url
    const resolvedAsin = extractAsin(finalUrl) || asin

    if (res.ok) {
      const html = await res.text()
      const result = extractProductInfo(html)
      if (result.name) {
        return {
          found: true,
          name: result.name,
          imageUrl: result.imageUrl || '',
          description: result.description || '',
          asin: resolvedAsin || '',
        }
      }
    }

    // OG 抽出失敗 → URL パスから商品名を抽出
    const urlName = extractNameFromPath(finalUrl) || extractNameFromPath(rawUrl)
    return {
      found: !!urlName,
      name: urlName || '',
      imageUrl: '',
      description: '',
      asin: resolvedAsin || '',
    }
  } catch (e: any) {
    // ネットワークエラー時も URL パスからの抽出を試行
    const urlName = extractNameFromPath(rawUrl)
    return {
      found: !!urlName,
      name: urlName || '',
      imageUrl: '',
      description: '',
      asin: asin || '',
    }
  }
})

function isAmazonUrl(url: string): boolean {
  try {
    const parsed = new URL(url)
    return /^(www\.)?amazon\.(co\.jp|jp|com|co\.uk|de|fr|it|es|ca)$/.test(parsed.hostname)
      || parsed.hostname === 'amzn.asia'
      || parsed.hostname === 'amzn.to'
  } catch {
    return false
  }
}

function extractAsin(url: string): string | null {
  const match = url.match(/\/(?:dp|gp\/product)\/([A-Z0-9]{10})/)
  return match ? match[1] : null
}

/** URL パスから商品名を抽出: /商品名/dp/ASIN/ の形式 */
function extractNameFromPath(url: string): string {
  try {
    const parsed = new URL(url)
    const pathMatch = parsed.pathname.match(/^\/([^/]+)\/dp\/[A-Z0-9]{10}/)
    if (pathMatch && pathMatch[1]) {
      const decoded = decodeURIComponent(pathMatch[1]).replace(/-/g, ' ')
      // ref= や技術的パスを除外
      if (decoded.length > 2 && !decoded.startsWith('ref=') && !decoded.startsWith('gp/')) {
        return decoded
      }
    }
  } catch { /* ignore */ }
  return ''
}

function extractProductInfo(html: string): { name: string; imageUrl: string; description: string } {
  const titleMatch = html.match(/<meta\s+(?:property|name)="og:title"\s+content="([^"]*)"/)
    || html.match(/<meta\s+content="([^"]*)"\s+(?:property|name)="og:title"/)
  const name = titleMatch ? decodeHtmlEntities(titleMatch[1]) : ''

  const imageMatch = html.match(/<meta\s+(?:property|name)="og:image"\s+content="([^"]*)"/)
    || html.match(/<meta\s+content="([^"]*)"\s+(?:property|name)="og:image"/)
  const imageUrl = imageMatch ? imageMatch[1] : ''

  const descMatch = html.match(/<meta\s+(?:property|name)="og:description"\s+content="([^"]*)"/)
    || html.match(/<meta\s+content="([^"]*)"\s+(?:property|name)="og:description"/)
  const description = descMatch ? decodeHtmlEntities(descMatch[1]) : ''

  return { name, imageUrl, description }
}

function decodeHtmlEntities(str: string): string {
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&#x27;/g, "'")
}
