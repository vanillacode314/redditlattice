import { fetchRequestHandler } from '@trpc/server/adapters/fetch'
import { APIEvent } from 'solid-start/api'
import { appRouter } from '~/server/router'

export async function GET({ request }: APIEvent) {
  return await fetchRequestHandler({
    createContext: () => ({}),
    endpoint: '/trpc',
    router: appRouter,
    req: request,
  })
}
