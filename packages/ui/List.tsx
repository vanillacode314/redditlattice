import { Show, For, Component } from 'solid-js'
import ListItem from './ListItem'

interface Item {
  id: string
  title: string
}

interface Props {
  onClick: (id: Item['id']) => void
  onRemove?: (id: Item['id']) => void
  title?: string
  items: Item[]
  reverse?: boolean
  focusable?: boolean
}

export const List: Component<Props> = (props) => {
  return (
    <div
      class="flex flex-col gap-2"
      classList={{ 'flex-col-reverse': props.reverse }}
    >
      <Show when={props.title}>
        <span class="px-5 text-xs text-gray-500 font-bold tracking-wide uppercase">
          {props.title}
        </span>
      </Show>
      <ul
        class="flex flex-col"
        classList={{ 'flex-col-reverse': props.reverse }}
      >
        <For each={props.items}>
          {({ id, title }) => (
            <li>
              <ListItem
                focusable={props.focusable}
                onClick={() => props.onClick(id)}
                onRemove={props.onRemove ? () => props.onRemove(id) : undefined}
              >
                {title}
              </ListItem>
            </li>
          )}
        </For>
      </ul>
    </div>
  )
}

export default List
