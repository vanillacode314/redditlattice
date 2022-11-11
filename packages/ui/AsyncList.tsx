import { Component, createResource } from 'solid-js'
import List from './List'

interface Item {
  id: string
  title: string
}

interface Props {
  key: () => string | string[]
  fetcher: (key: string, ac: AbortController) => Promise<Item[]>
  onClick: (id: Item['id']) => void
  onRemove?: (id: Item['id']) => void
  title?: string
  reverse?: boolean
  focusable?: boolean
}

export const AsyncList: Component<Props> = (props) => {
  type Params = ReturnType<typeof props.key>
  type Item = Awaited<ReturnType<typeof props.fetcher>>[number]

  const { key, fetcher, onClick, onRemove } = props

  let ac: AbortController

  const [items] = createResource<Item[], Params>(
    key,
    async ([, query]) => {
      ac?.abort()
      ac = new AbortController()
      return await fetcher(query, ac)
    },
    { initialValue: [] }
  )

  return (
    <List
      items={items()}
      focusable={props.focusable}
      title={props.title}
      reverse={props.reverse}
      onClick={onClick}
      onRemove={onRemove}
    />
  )
}

export default AsyncList
