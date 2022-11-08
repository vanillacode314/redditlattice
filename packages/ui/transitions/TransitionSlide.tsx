import { Component, createSignal, JSXElement, mergeProps } from 'solid-js'
import { TransitionGroup } from 'solid-transition-group'

interface Props {
  direction?: 'x' | 'y'
  duration?: number
  children: JSXElement
}

export const TransitionSlide: Component<Props> = (props) => {
  const merged = mergeProps({ direction: 'y', duration: 300 }, props)
  const [size, setSize] = createSignal<number>(0)

  const animationOptions: KeyframeAnimationOptions = {
    duration: merged.duration,
    fill: 'forwards',
  }

  const keyframes = () => {
    switch (merged.direction) {
      case 'x':
        return [
          {
            opacity: 0,
            width: 0,
          },
          { opacity: 1, width: `${size()}px` },
        ]
      case 'y':
        return [
          {
            opacity: 0,
            height: 0,
          },
          { opacity: 1, height: `${size()}px` },
        ]
    }
    return []
  }

  return (
    <TransitionGroup
      onBeforeEnter={(el) => {
        setSize(
          merged.direction === 'x'
            ? el.getBoundingClientRect().width
            : el.getBoundingClientRect().height
        )
        merged.direction === 'x'
          ? (el.style.width = `0px`)
          : (el.style.height = `0px`)
      }}
      onEnter={(el, done) => {
        el.animate(keyframes(), animationOptions).finished.then(done)
      }}
      onExit={(el, done) => {
        setSize(
          merged.direction === 'x'
            ? el.getBoundingClientRect().width
            : el.getBoundingClientRect().height
        )
        el.animate(keyframes(), {
          ...animationOptions,
          direction: 'reverse',
        }).finished.then(done)
      }}
    >
      {props.children}
    </TransitionGroup>
  )
}
