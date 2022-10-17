import {
  JSXElement,
  Show,
  createSignal,
  on,
  For,
  mergeProps,
  Component,
  createRenderEffect,
  batch,
} from 'solid-js'
import { animated, createSpring } from 'solid-spring'
import _ from 'lodash'

interface Props {
  width: number
  fallbackHeight: number
  alt?: string
  src?: string
  srcSets?: Map<string, string>
  onHasHeight?: (height: number) => void
  onLoad?: () => void
  onError?: () => void
  ref?: HTMLPictureElement | ((el: HTMLPictureElement) => void)
  fallback?: JSXElement
}

export const AutoResizingPicture: Component<Props> = (props) => {
  let imgElement: HTMLImageElement
  const merged = mergeProps(
    {
      onLoad: () => {},
      onHasHeight: () => {},
      onError: () => {},
      srcSets: new Map(),
    },
    props
  )

  const [height, setHeight] = createSignal<number>(props.fallbackHeight)
  const [hasImage, setHasImage] = createSignal<boolean>(false)
  const [error, setError] = createSignal<boolean>(false)
  const [count, setCount] = createSignal(0)
  const [animate, setAnimate] = createSignal<boolean>(false)

  const checkSize = _.throttle(() => {
    setCount((c) => c + 1)
    if (count() > 1) setAnimate(true)
    if (error()) return
    if (!imgElement) return
    if (imgElement.naturalHeight) {
      const height =
        (imgElement.naturalHeight / imgElement.naturalWidth) * props.width
      setHeight(height)
      setHasImage(true)
      merged.onHasHeight(height)
      return
    }
    checkSize()
  }, 100)

  const expand = createSpring(() => ({
    height: height(),
    immediate: !animate(),
  }))

  createRenderEffect(
    on(
      () => props.width,
      () => {
        setCount(0)
        queueMicrotask(() => checkSize())
      }
    )
  )

  return (
    <animated.div style={expand()} class="overflow-hidden relative">
      <Show when={!hasImage() && count() > 1}>
        <div class="absolute inset-0">{props.fallback}</div>
      </Show>
      <picture ref={props.ref}>
        <For each={[...merged.srcSets]}>
          {([format, url]) => <source srcset={url} type={format} />}
        </For>
        <img
          src={props.src}
          ref={(el) => {
            if (imgElement) return
            imgElement = el
            queueMicrotask(() => checkSize())
          }}
          onError={() => {
            batch(() => {
              setError(true)
              setHasImage(false)
            })
            merged.onError()
          }}
          alt={merged.alt}
        />
      </picture>
    </animated.div>
  )
}

export default AutoResizingPicture
