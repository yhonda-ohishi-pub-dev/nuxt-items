/**
 * gRPC-Web クライアントプラグイン
 *
 * Service Binding経由でrust-logi gRPC-Webサーバーに接続
 * ブラウザ → /api/grpc/* → Service Binding → Durable Object → CloudRun
 */

import { createClient, type Client, type Interceptor } from '@connectrpc/connect'
import { createGrpcWebTransport } from '@connectrpc/connect-web'
import { ItemsService, FilesService } from '@yhonda-ohishi-pub-dev/logi-proto'

type ItemsClient = Client<typeof ItemsService>
type FilesClient = Client<typeof FilesService>

export default defineNuxtPlugin(() => {
  const { token } = useAuth()

  // JWT を x-auth-token ヘッダーとして付与
  const authInterceptor: Interceptor = (next) => async (req) => {
    if (token.value) {
      req.header.set('x-auth-token', token.value)
    }
    return next(req)
  }

  // Nuxtのserver route経由でgRPC-Webにアクセス
  const transport = createGrpcWebTransport({
    baseUrl: '/api/grpc',
    interceptors: [authInterceptor],
  })

  const itemsClient: ItemsClient = createClient(ItemsService, transport)
  const filesClient: FilesClient = createClient(FilesService, transport)

  return {
    provide: {
      grpc: {
        items: itemsClient,
        files: filesClient,
      },
    },
  }
})

declare module '#app' {
  interface NuxtApp {
    $grpc: {
      items: ItemsClient
      files: FilesClient
    }
  }
}

declare module 'vue' {
  interface ComponentCustomProperties {
    $grpc: {
      items: ItemsClient
      files: FilesClient
    }
  }
}
