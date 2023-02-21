import { createResource, For, JSXElement, Show } from 'solid-js'
import List from './List'

interface Props<T, U> {
  key: () => U
  fetcher: (key: U, ac: AbortController) => Promise<T[]>
  title?: string
  reverse?: boolean
  fallback?: JSXElement
  ref?: ((el: HTMLUListElement) => void) | HTMLUListElement
  children: (data: T) => JSXElement
}

export const AsyncList: <T, U>(props: Props<T, U>) => JSXElement = (props) => {
  type Params = ReturnType<typeof props.key>
  type Item = Awaited<ReturnType<typeof props.fetcher>>[number]

  const { key, fetcher } = props

  let ac: AbortController

  const [items] = createResource<Item[], Params>(
    key,
    async (key) => {
      ac?.abort()
      ac = new AbortController()
      return await fetcher(key, ac)
    },
    { initialValue: [] }
  )

  return (
    <List
      ref={props.ref}
      title={props.title}
      reverse={props.reverse}
      fallback={props.fallback}
    >
      <For each={items()}>{(item) => props.children(item)}</For>
    </List>
  )
}

export default AsyncList
