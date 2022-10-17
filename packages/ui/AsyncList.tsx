import { Component, createResource } from 'solid-js'
import List from './List'

interface Item {
  id: string
  title: string
}

interface Props<T = any> {
  key: T
  fetcher: (key: T, ac: AbortController) => Promise<Item[]>
  onClick: (id: Item['id']) => void
  onRemove?: (id: Item['id']) => void
  title?: string
  reverse?: boolean
  focusable?: boolean
}

export const AsyncList: Component<Props> = (props) => {
  let ac: AbortController
  type Params = typeof props.key
  type Item = Awaited<ReturnType<typeof props.fetcher>>[number]
  const [items] = createResource<Item[], Params>(
    () => props.key,
    (key) => {
      ac?.abort()
      ac = new AbortController()
      return props.fetcher(key, ac)
    }
  )

  return (
    <List
      items={items() || []}
      onClick={props.onClick}
      focusable={props.focusable}
      title={props.title}
      reverse={props.reverse}
      onRemove={props.onRemove}
    />
  )
}

export default AsyncList
