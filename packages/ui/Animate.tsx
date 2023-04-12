import { createMediaQuery } from '@solid-primitives/media'
import {
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

interface AnimationConfig {
  x?: number
  y?: number
  width?: number
  height?: number
  immediate?: boolean
  options: {
    stiffness?: number
    damping?: number
    precision?: number
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
  const immediate = () =>
    animation.immediate ||
    (merged.respectPrefersReducedMotion && prefersReducedMotion())
  const options = () => animation.options
  const x = createDerivedSpring(() => animation.x, immediate, options)
  const y = createDerivedSpring(() => animation.y, immediate, options)
  const width = createDerivedSpring(() => animation.width, immediate, options)
  const height = createDerivedSpring(() => animation.height, immediate, options)

  return (
    <Dynamic
      component={merged.tag}
      style={{
        'will-change': 'transform width height',
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
