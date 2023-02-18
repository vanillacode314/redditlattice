import { Component, createSignal, JSX, Show, splitProps } from 'solid-js'
import { TransitionFade } from 'ui/transitions'

interface Props
  extends Omit<JSX.InputHTMLAttributes<HTMLInputElement>, 'onSubmit' | 'type'> {
  onSubmit?: (value: string) => void
  ref?: HTMLInputElement | ((instance: HTMLInputElement) => void)
  onFocus?: () => void
  onBlur?: () => void
  value: string
  setValue: (value: string) => void
  flashing?: boolean
  setFlashing?: (flashing: boolean) => void
  prefix: string
}
export const SearchInput: Component<Props> = (props) => {
  const [_, others] = splitProps(props, [
    'onSubmit',
    'ref',
    'onFocus',
    'onBlur',
    'value',
    'flashing',
    'prefix',
    'setValue',
    'setFlashing',
  ])

  return (
    <form
      class="grid grid-cols-[1fr_auto] gap-3 items-center px-5"
      onSubmit={(e) => {
        e.preventDefault()
        props.onSubmit?.(props.value)
      }}
    >
      <div
        class="transitions-colors duration-250 grid grid-cols-[auto_1fr_auto] gap-3 outline-none rounded-xl py-3 px-5 items-center hover:outline-2 hover:outline-pink-900 focus-within:outline-2 focus-within:outline-pink-900"
        classList={{
          'bg-neutral-800': props.flashing,
          'bg-neutral-900': !props.flashing,
        }}
        onTransitionEnd={() => {
          if (props.flashing) props.setFlashing?.(false)
        }}
      >
        <span font="bold" text="gray-500">
          {props.prefix}
        </span>
        <input
          ref={props.ref}
          value={props.value}
          onInput={(e) => {
            const inp = e.currentTarget
            const start = inp.selectionStart
            props.setValue(inp.value.toLowerCase())
            inp.setSelectionRange(start, start)
          }}
          type="text"
          class="outline-none bg-transparent min-w-0 placeholder:text-gray-500"
          {...others}
        />
        <TransitionFade blur duration={100}>
          <Show when={props.value}>
            <button
              aria-label="search"
              type="button"
              class="grid place-items-center"
              onClick={() => props.setValue('')}
              onFocus={(e) => (e.relatedTarget as HTMLInputElement)?.focus?.()}
            >
              <span class="i-mdi-close-circle text-xl"></span>
            </button>
          </Show>
        </TransitionFade>
      </div>
      <button class="text-white text-xl rounded-xl w-12 h-12 outline-none grid place-items-center bg-pink-800 hover:bg-pink-700 focus:bg-pink-700 focus:ring focus:ring-blue transition-colors shrink-0 tap-highlight-none">
        <div class="i-mdi-magnify"></div>
      </button>
    </form>
  )
}

export default SearchInput
