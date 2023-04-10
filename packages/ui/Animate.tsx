import {
  createContext,
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
  style?: JSX.CSSProperties
  tag?: string
}

export const Animate: ParentComponent<AnimateProps> = (props) => {
  let el!: HTMLElement
  const [animation] = useAnimation()
  const merged = mergeProps({ tag: 'div' }, props)
  const x = createDerivedSpring(
    () => animation.x,
    () => !!animation.immediate,
    () => animation.options
  )

  const y = createDerivedSpring(
    () => animation.y,
    () => !!animation.immediate,
    () => animation.options
  )
  const width = createDerivedSpring(
    () => animation.width,
    () => !!animation.immediate,
    () => animation.options
  )
  const height = createDerivedSpring(
    () => animation.height,
    () => !!animation.immediate,
    () => animation.options
  )

  const [local, others] = splitProps(props, ['style', 'tag'])

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
      ref={el}
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
