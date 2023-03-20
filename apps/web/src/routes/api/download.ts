import { APIEvent } from 'solid-start/api'

export function GET({ fetch, request }: APIEvent) {
  const url = new URL(request.url).searchParams.get('url') as string
  return fetch(url, {})
}
