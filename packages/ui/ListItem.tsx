import { Component, For, JSXElement, mergeProps, Show } from 'solid-js'

interface Props {
  id: string
  onClick: (e?: Event) => void
  onRemove?: (e?: Event) => void
  buttons?: ((id: string) => JSXElement)[]
  focusable?: boolean
  children: Element | string
}

export const ListItem: Component<Props> = (props) => {
  const merged = mergeProps({ focusable: true }, props)

  const { onClick, onRemove } = props

  return (
    <div
      class="flex cursor-pointer items-center gap-5 px-5 py-2 transition-colors focus-within:bg-gray-800 hover:bg-gray-800"
      style={{ '-webkit-tap-highlight-color': 'transparent' }}
      onClick={onClick}
      tabindex="-1"
      onMouseDown={(e) => merged.focusable || e.preventDefault()}
    >
      <div class="grow" tabindex="0">
        {props.children}
      </div>
      <For each={props.buttons}>{(Comp) => Comp(props.id)}</For>
      <Show when={onRemove}>
        <button
          class="group outline-none"
          style={{ '-webkit-tap-highlight-color': 'transparent' }}
          onClick={(e) => {
            e.stopPropagation()
            onRemove!()
          }}
        >
          <span class="i-mdi-close-circle text-xl text-gray-700 transition-colors group-hover:text-white group-focus:text-white"></span>
        </button>
      </Show>
    </div>
  )
}

export default ListItem
