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
import { throttle } from 'lodash-es'

interface Props extends JSX.HTMLAttributes<HTMLDivElement> {
  width: number
  fallbackHeight: number
  alt?: string
  src?: string
  srcSets?: Map<string, string>
  onHasHeight?: (height: number) => void
  onLoad?: (e: Event) => void
  onError?: (e: Event) => void
  fallback?: JSXElement
}

export const AutoResizingPicture: Component<Props> = (props) => {
  let imgElement: HTMLImageElement

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
  const merged = mergeProps(
    {
      srcSets: new Map(),
    },
    local
  )
  const { onHasHeight, onLoad, onError } = local

  const [height, setHeight] = createSignal<number>(props.fallbackHeight)
  const [hasImage, setHasImage] = createSignal<boolean>(false)
  const [error, setError] = createSignal<boolean>(false)
  const [tries, setTries] = createSignal(0)
  const [animate, setAnimate] = createSignal<boolean>(false)

  const checkHeight = throttle(() => {
    setTries((_) => _ + 1)
    if (tries() > 1) setAnimate(true)
    if (error()) return
    if (!imgElement) return
    if (!imgElement.naturalHeight) {
      checkHeight()
      return
    }

    const height =
      (imgElement.naturalHeight / imgElement.naturalWidth) * local.width
    setHeight(height)
    setHasImage(true)
    onHasHeight?.(height)
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
        setTries(0)
        queueMicrotask(() => checkHeight())
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
      <Show when={!hasImage() && tries() > 1}>
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
            queueMicrotask(() => checkHeight())
          }}
          onError={(e) => {
            batch(() => {
              setError(true)
              setHasImage(false)
            })
            onError?.(e)
          }}
          onLoad={(e) => onLoad?.(e)}
          alt={merged.alt}
          referrerpolicy="no-referrer"
        />
      </picture>
    </animated.div>
  )
}

export default AutoResizingPicture
