import { clsx } from 'clsx'
import { Component, JSX, Show, splitProps } from 'solid-js'

interface Props extends JSX.InputHTMLAttributes<HTMLInputElement> {
  label: string
  children?: JSX.Element
}
export const Input: Component<Props> = (props) => {
  const [local, others] = splitProps(props, [
    'label',
    'class',
    'children',
    'type',
  ])
  let generatedId = `input-${Math.random().toString(36).substring(2, 9)}`
  const id = () => props.id || generatedId
  return (
    <Show
      when={props.type !== 'checkbox'}
      fallback={
        <div class="flex gap-1 group px-5 py-3 bg-neutral-900 rounded focus-within:bg-neutral-800 items-center">
          <label
            class="text-xs font-semibold uppercase tracking-wider text-gray-400 group-focus-within:text-gray-100 transition-colors grow cursor-pointer"
            for={id()}
          >
            <span class="">{local.label}</span>
          </label>
          <input
            class={clsx(
              'hidden [&:not(:checked)~label>div]:bg-neutral-700 [&:not(:checked)~label>div]:translate-x-0',
              local.class
            )}
            id={id()}
            type={local.type}
            {...others}
          />
          <label
            class="px-1 w-10 h-6 rounded bg-neutral-800 relative cursor-pointer"
            for={id()}
          >
            <div class="transition-colors transition-transform w-4 h-4 bg-neutral-200 rounded absolute inset-y-1/2 -translate-y-1/2 translate-x-full"></div>
          </label>
        </div>
      }
    >
      <div class="flex flex-col gap-1 group">
        <label
          class="text-xs font-semibold uppercase tracking-wider text-gray-400 group-focus-within:text-gray-100 transition-colors cursor-pointer"
          for={id()}
        >
          <span class="">{local.label}</span>
        </label>
        <input
          class={clsx(
            'rounded bg-neutral-900 px-5 py-3 transition-colors focus:bg-neutral-800 hover:bg-neutral-800 grow outline-none',
            local.class
          )}
          id={id()}
          type={local.type}
          {...others}
        />
      </div>
    </Show>
  )
}
export default Input
