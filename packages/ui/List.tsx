import { Key } from '@solid-primitives/keyed'
import {
  children,
  Component,
  createMemo,
  For,
  JSXElement,
  mergeProps,
  Show,
} from 'solid-js'
import { TransitionSlide } from './transitions'

interface ListProps {
  title?: string
  reverse?: boolean
  ref?: ((el: HTMLUListElement) => void) | HTMLUListElement
  fallback?: JSXElement
  children: JSXElement
}

export const List: Component<ListProps> = (props) => {
  const listItems = children(() => props.children)
  const evaluatedListItems = createMemo<ListItemProps[]>(() => {
    return listItems.toArray() as unknown as ListItemProps[]
  })

  return (
    <div
      class="flex gap-2 overflow-hidden"
      classList={{
        'flex-col': !props.reverse,
        'flex-col-reverse': props.reverse,
      }}
    >
      <Show when={props.title}>
        <span class="px-5 text-xs font-bold uppercase tracking-wide text-gray-500">
          {props.title}
        </span>
      </Show>
      <Show when={evaluatedListItems().length > 0} fallback={props.fallback}>
        <ul
          ref={props.ref}
          class="flex overflow-auto"
          classList={{
            'flex-col': !props.reverse,
            'flex-col-reverse': props.reverse,
          }}
        >
          <TransitionSlide duration={120}>
            <Key each={evaluatedListItems()} by="key">
              {(item) => {
                const { onClick, onRemove } = item()

                return (
                  <li class="w-full block">
                    <button
                      class="flex cursor-pointer items-center gap-5 px-5 py-2 transition-colors focus-within:bg-neutral-800 hover:bg-neutral-800 tap-highlight-none w-full text-left"
                      onClick={onClick}
                      tabindex="-1"
                      onMouseDown={(e) =>
                        item().focusable || e.preventDefault()
                      }
                      onTouchStart={(e) =>
                        item().focusable || e.preventDefault()
                      }
                    >
                      <div class="grow" tabindex="0">
                        {item().children}
                      </div>
                      <For each={item().buttons}>{(Button) => Button}</For>
                      <Show when={onRemove}>
                        <button
                          class="group outline-none tap-highlight-none"
                          onClick={(e) => {
                            e.stopPropagation()
                            onRemove?.(e)
                          }}
                        >
                          <span class="i-mdi-close-circle text-xl text-gray-700 transition-colors group-hover:text-white group-focus:text-white"></span>
                        </button>
                      </Show>
                    </button>
                  </li>
                )
              }}
            </Key>
          </TransitionSlide>
        </ul>
      </Show>
    </div>
  )
}

interface ListItemProps {
  key?: string
  onClick: (e: MouseEvent) => void
  onRemove?: (e: MouseEvent) => void
  buttons?: JSXElement[]
  focusable?: boolean
  children: JSXElement
}

export const ListItem: Component<ListItemProps> = (props) => {
  const merged = mergeProps({ focusable: true }, props)
  return merged as unknown as JSXElement
}

export default List
