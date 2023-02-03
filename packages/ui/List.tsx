import { Key } from '@solid-primitives/keyed'
import { Component, JSXElement, Show } from 'solid-js'
import ListItem from './ListItem'
import { TransitionSlide } from './transitions'

interface Item {
  id: string
  title: string
}

interface Props {
  onClick: (id: Item['id']) => void
  onRemove?: (id: Item['id']) => void
  title?: string
  buttons?: ((id: Item['id']) => JSXElement)[]
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
        <span class="px-5 text-xs font-bold uppercase tracking-wide text-gray-500">
          {props.title}
        </span>
      </Show>
      <ul
        class="flex flex-col"
        classList={{ 'flex-col-reverse': props.reverse }}
      >
        <TransitionSlide duration={120}>
          <Key each={props.items} by="id">
            {(item) => {
              const title = () => item().title
              const id = () => item().id

              return (
                <li class="w-full overflow-hidden">
                  <ListItem
                    id={id()}
                    buttons={props.buttons}
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
        </TransitionSlide>
      </ul>
    </div>
  )
}

export default List
