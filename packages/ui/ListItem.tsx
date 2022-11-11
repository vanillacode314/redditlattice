import { Component, mergeProps, Show } from 'solid-js'

interface Props {
  onClick: (e?: Event) => void
  onRemove?: (e?: Event) => void
  focusable?: boolean
  children: Element | string
}

export const ListItem: Component<Props> = (props) => {
  const merged = mergeProps({ focusable: true }, props)

  const { onClick, onRemove } = props

  return (
    <div
      class="cursor-pointer flex items-center gap-5 transition-colors px-5 py-2 hover:bg-gray-800 focus-within:bg-gray-800"
      style={{ '-webkit-tap-highlight-color': 'transparent' }}
      onClick={onClick}
      tabindex="-1"
      onMouseDown={(e) => merged.focusable || e.preventDefault()}
    >
      <div class="grow" tabindex="0">
        {props.children}
      </div>
      <Show when={onRemove}>
        <button
          class="outline-none group"
          style={{ '-webkit-tap-highlight-color': 'transparent' }}
          onClick={(e) => {
            e.stopPropagation()
            onRemove!()
          }}
        >
          <span class="i-mdi-close-circle text-gray-700 group-hover:text-white group-focus:text-white text-xl transition-colors"></span>
        </button>
      </Show>
    </div>
  )
}

export default ListItem
