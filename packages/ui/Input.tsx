import { clsx } from 'clsx'
import { Component, JSX, splitProps } from 'solid-js'

interface Props extends JSX.InputHTMLAttributes<HTMLInputElement> {
  label: string
  children?: JSX.Element
}
export const Input: Component<Props> = (props) => {
  const [local, others] = splitProps(props, ['label', 'class', 'children'])
  const id = `input-${Math.random()}`
  return (
    <div class="flex flex-col gap-1 group">
      <label
        class="text-xs font-semibold uppercase tracking-wider text-gray-400 group-focus-within:text-gray-100 transition-colors"
        for={id}
      >
        <span class="">{local.label}</span>
      </label>
      <input
        class={clsx(
          'rounded bg-neutral-900 px-5 py-3 transition-colors focus:bg-neutral-800 hover:bg-neutral-800 grow outline-none',
          local.class
        )}
        id={id}
        {...others}
      />
    </div>
  )
}
export default Input
