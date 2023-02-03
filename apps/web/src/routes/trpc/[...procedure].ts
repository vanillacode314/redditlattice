import { fetchRequestHandler } from '@trpc/server/adapters/fetch'
import { appRouter } from 'api'
import { APIEvent } from 'solid-start/api'

export async function GET({ request }: APIEvent) {
  return await fetchRequestHandler({
    endpoint: '/trpc',
    router: appRouter,
    req: request,
  })
}
