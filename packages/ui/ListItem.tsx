import { Component, mergeProps, Show } from 'solid-js'

interface Props {
  onClick: (e?: Event) => void
  onRemove?: (e?: Event) => void
  focusable?: boolean
  children: Element | string
}

export const ListItem: Component<Props> = (props) => {
  const merged = mergeProps({ focusable: true }, props)
  return (
    <div
      bg="hover:gray-800 focus-within:gray-800"
      cursor-pointer
      flex
      items-center
      gap-5
      transition-colors
      px-5
      py-2
      onClick={() => props.onClick()}
      tabindex="-1"
      onMouseDown={(e) => merged.focusable || e.preventDefault()}
    >
      <div class="grow" tabindex="0">
        {props.children}
      </div>
      <Show when={props.onRemove}>
        <button
          outline-none
          class="i-mdi-close-circle"
          text="gray-700 hover:white focus:white xl"
          transition-colors
          onClick={(e) => {
            e.stopPropagation()
            props.onRemove()
          }}
        ></button>
      </Show>
    </div>
  )
}

export default ListItem
