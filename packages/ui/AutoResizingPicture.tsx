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
  JSX,
  splitProps,
} from 'solid-js'
import { config, animated, createSpring } from 'solid-spring'
import * as _ from 'lodash-es'

interface Props extends JSX.HTMLAttributes<HTMLDivElement> {
  width: number
  fallbackHeight: number
  alt?: string
  src?: string
  srcSets?: Map<string, string>
  onHasHeight?: (height: number) => void
  onLoad?: () => void
  onError?: () => void
  fallback?: JSXElement
}

export const AutoResizingPicture: Component<Props> = (props) => {
  const [local, others] = splitProps(props, [
    'width',
    'fallbackHeight',
    'alt',
    'src',
    'srcSets',
    'onHasHeight',
    'onLoad',
    'onError',
    'ref',
    'fallback',
    'style',
  ])
  let imgElement: HTMLImageElement
  const merged = mergeProps(
    {
      onLoad: () => {},
      onHasHeight: () => {},
      onError: () => {},
      srcSets: new Map(),
    },
    local
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
        (imgElement.naturalHeight / imgElement.naturalWidth) * local.width
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
    config: config.stiff,
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
    <animated.div
      style={{ ...local.style, ...expand() }}
      class="overflow-hidden relative"
      ref={props.ref}
      {...others}
    >
      <Show when={!hasImage() && count() > 1}>
        <div class="absolute inset-0">{props.fallback}</div>
      </Show>
      <picture>
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
