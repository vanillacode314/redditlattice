import { QueryClient } from '@tanstack/solid-query'
import { createTRPCProxyClient, httpBatchLink } from '@trpc/client'
import { AppRouter } from '~/server/router'

export const trpc = createTRPCProxyClient<AppRouter>({
  links: [
    httpBatchLink({
      url: '/trpc',
    }),
  ],
})
export const queryClient = new QueryClient()
