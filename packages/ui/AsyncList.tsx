import {
  createQuery,
  QueryClient,
  QueryClientProvider,
  QueryFunction,
} from '@tanstack/solid-query'
import { Accessor, createMemo, createResource, For, JSXElement } from 'solid-js'
import List from './List'

interface Props<T, U extends readonly string[]> {
  key: U
  fetcher: QueryFunction<T[], U>
  title?: string
  reverse?: boolean
  fallback?: JSXElement
  ref?: ((el: HTMLUListElement) => void) | HTMLUListElement
  children: (data: T, stale: Accessor<boolean>) => JSXElement
}

const queryClient = new QueryClient()

export function AsyncList<T, U extends readonly string[]>(
  props: Props<T, U>
): JSXElement {
  const items = createQuery(() => props.key, props.fetcher, {
    keepPreviousData: true,
  })

  return (
    <QueryClientProvider client={queryClient}>
      <List
        ref={props.ref}
        title={props.title}
        reverse={props.reverse}
        fallback={props.fallback}
      >
        <For each={items.data}>
          {(item) => props.children(item, () => items.isPreviousData)}
        </For>
      </List>
    </QueryClientProvider>
  )
}

export default AsyncList
