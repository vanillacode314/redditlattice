import { createMediaQuery } from '@solid-primitives/media'
import clsx from 'clsx'
import { isObject } from 'lodash-es'
import {
  Accessor,
  createContext,
  createMemo,
  createRenderEffect,
  JSX,
  mergeProps,
  ParentComponent,
  splitProps,
  useContext,
} from 'solid-js'
import { createStore } from 'solid-js/store'
import { Dynamic } from 'solid-js/web'
import { createDerivedSpring } from './utils/spring'

type TAnimationValue<T> =
  | (T | undefined)
  | { value: T | undefined; immediate: boolean }
const parseValue = <T,>(value: TAnimationValue<T>) =>
  isObject(value) ? value : { value, immediate: false }

interface AnimationConfig {
  x?: TAnimationValue<number>
  y?: TAnimationValue<number>
  width?: TAnimationValue<number>
  height?: TAnimationValue<number>
  immediate?: boolean
  options?: {
    stiffness?: number
    damping?: number
    precision?: number
  }
  transition?: {
    durationMs: number
    easing: 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out' | (string & {})
  }
}
const AnimationContext = createContext(
  createStore<AnimationConfig>({ options: {} })
)
interface AnimateProps extends JSX.HTMLAttributes<HTMLDivElement> {
  respectPrefersReducedMotion?: boolean
  style?: JSX.CSSProperties
  tag?: string
}

export const Animate: ParentComponent<AnimateProps> = (props) => {
  const merged = mergeProps(
    { respectPrefersReducedMotion: true, tag: 'div' },
    props
  )
  const [local, others] = splitProps(props, ['style', 'tag'])

  const prefersReducedMotion = createMediaQuery(
    '(prefers-reduced-motion: reduce)'
  )
  const [animation] = useAnimation()
  const immediate = (parsedValue: Accessor<{ immediate: boolean }>) =>
    parsedValue().immediate ||
    animation.transition !== undefined ||
    animation.immediate ||
    (merged.respectPrefersReducedMotion && prefersReducedMotion())
  const options = () => animation.options ?? {}
  const parsedX = () => parseValue(animation.x)
  const parsedY = () => parseValue(animation.y)
  const parsedWidth = () => parseValue(animation.width)
  const parsedHeight = () => parseValue(animation.height)
  console.log(immediate(parsedHeight))
  const x = createDerivedSpring(
    () => parsedX().value,
    () => immediate(parsedX),
    options
  )
  const y = createDerivedSpring(
    () => parsedY().value,
    () => immediate(parsedY),
    options
  )
  const width = createDerivedSpring(
    () => parsedWidth().value,
    () => immediate(parsedWidth),
    options
  )
  const height = createDerivedSpring(
    () => parsedHeight().value,
    () => immediate(parsedHeight),
    options
  )
  // const x = createMemo(() => animation.x)
  // const y = createMemo(() => animation.y)
  // const width = createMemo(() => animation.width)
  // const height = createMemo(() => animation.height)

  return (
    <Dynamic
      component={merged.tag}
      style={{
        'will-change': 'transform width height',
        transform: `translate(${x() ?? 0}px, ${y() ?? 0}px)`,
        width: width() ? `${width()}px` : undefined,
        height: height() ? `${height()}px` : undefined,
        'transition-property': animation.transition
          ? clsx(
              (x() !== undefined || y() !== undefined) && 'transform',
              width() !== undefined && !parsedWidth().immediate && 'width',
              height() !== undefined && !parsedHeight().immediate && 'height'
            )
              .split(' ')
              .join(',')
          : undefined,
        'transition-duration': animation.transition?.durationMs
          ? `${animation.transition.durationMs}ms`
          : undefined,
        'transition-timing-function': animation.transition?.easing,
        ...local.style,
      }}
      {...others}
    >
      {props.children}
    </Dynamic>
  )
}

export default Animate

export const AnimationProvider: ParentComponent<{ config: AnimationConfig }> = (
  props
) => {
  const [animation, setAnimation] = createStore<AnimationConfig>(props.config)
  createRenderEffect(() => setAnimation(props.config))
  return (
    <AnimationContext.Provider value={[animation, setAnimation]}>
      {props.children}
    </AnimationContext.Provider>
  )
}
export const useAnimation = () => useContext(AnimationContext)
