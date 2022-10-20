import {
  batch,
  Component,
  createEffect,
  createMemo,
  createSignal,
  JSX,
  JSXElement,
  Show,
  splitProps,
  untrack,
} from 'solid-js'
import { animated, createSpring } from 'solid-spring'

interface Props extends JSX.HTMLAttributes<HTMLDivElement> {
  when: any
  animation: (
    forward: boolean
  ) => Omit<Parameters<typeof createSpring>[0], 'reverse' | 'onRest'>
  children?: JSXElement
}

export const Animate: Component<Props> = (props) => {
  const [local, others] = splitProps(props, ['when', 'animation', 'children'])
  const [animate, setAnimate] = createSignal<boolean>(false)
  const [active, setActive] = createSignal<boolean>(false)
  const open = createMemo(() => Boolean(local.when))

  createEffect(() => {
    const when = open()
    return untrack(() => {
      if (when && !active()) {
        batch(() => {
          setActive(true)
          setAnimate(true)
        })
      }
      if (!when && active()) {
        batch(() => {
          setActive(true)
          setAnimate(false)
        })
      }
    })
  })

  const spring = createSpring(() => ({
    ...local.animation(open()),
    reverse: !animate(),
    onRest: () => !animate() && setActive(false),
  }))

  return (
    <Show when={active()}>
      <animated.div style={spring()} {...others}>
        {props.children}
      </animated.div>
    </Show>
  )
}

export default Animate
