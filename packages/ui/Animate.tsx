import {
  createEffect,
  JSX,
  mergeProps,
  ParentComponent,
  splitProps,
} from 'solid-js'
import { Dynamic } from 'solid-js/web'
import { createDerivedSpring } from './utils/spring'

interface Props extends JSX.HTMLAttributes<HTMLDivElement> {
  x?: number
  y?: number
  width?: number
  height?: number
  style?: JSX.CSSProperties
  immediate?: boolean
  options?: {
    stiffness?: number
    damping?: number
    precision?: number
  }
  tag?: string
}

export const Animate: ParentComponent<Props> = (props) => {
  const merged = mergeProps({ tag: 'div', options: {} }, props)
  const x = createDerivedSpring(
    () => props.x,
    () => !!props.immediate,
    merged.options
  )
  const y = createDerivedSpring(
    () => props.y,
    () => !!props.immediate,
    merged.options
  )
  const width = createDerivedSpring(
    () => props.width,
    () => !!props.immediate,
    merged.options
  )
  const height = createDerivedSpring(
    () => props.height,
    () => !!props.immediate,
    merged.options
  )

  const [local, others] = splitProps(props, [
    'style',
    'x',
    'y',
    'options',
    'tag',
    'immediate',
    'width',
    'height',
  ])

  return (
    <Dynamic
      component={merged.tag}
      style={{
        'will-change': 'transform',
        transform: `translate(${x() ?? 0}px, ${y() ?? 0}px)`,
        width: width() ? `${width()}px` : undefined,
        height: height() ? `${height()}px` : undefined,
        ...local.style,
      }}
      {...others}
    >
      {props.children}
    </Dynamic>
  )
}

export default Animate
