import { Show, Component } from 'solid-js'
import ListItem from './ListItem'
import { TransitionSlide } from './transitions'
import { Key } from '@solid-primitives/keyed'

interface Item {
  id: string
  title: string
  actions?: Component[]
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
  const { onClick, onRemove } = props

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
        {/* <TransitionSlide duration={200}> */}
        <Key each={props.items} by="id">
          {(item) => {
            const title = () => item().title
            const id = () => item().id
            const actions = () => item().actions
            return (
              <li class="w-full overflow-hidden">
                <ListItem
                  actions={actions()}
                  focusable={props.focusable}
                  onClick={() => onClick(id())}
                  onRemove={
                    /* TODO: Possible bug */
                    onRemove ? () => onRemove!(id()) : undefined
                  }
                >
                  {title()}
                </ListItem>
              </li>
            )
          }}
        </Key>
        {/* </TransitionSlide> */}
      </ul>
    </div>
  )
}

export default List
