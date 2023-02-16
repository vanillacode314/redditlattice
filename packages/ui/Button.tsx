import { clsx } from 'clsx'
import { Component, JSX, JSXElement, splitProps } from 'solid-js'

interface Props extends JSX.ButtonHTMLAttributes<HTMLButtonElement> {
  children: JSXElement
}

export const Button: Component<Props> = (props) => {
  const [local, others] = splitProps(props, ['class', 'children'])

  return (
    <button
      class={clsx(
        'uppercase tracking-wide text-sm font-semibold px-5 py-3 rounded transition-colors tap-highlight-none',
        local.class
      )}
      {...others}
    >
      {local.children}
    </button>
  )
}

export default Button
