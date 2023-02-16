import { Motion } from '@motionone/solid'
import { throttle } from 'lodash-es'
import { spring } from 'motion'
import {
  batch,
  Component,
  createRenderEffect,
  createSignal,
  For,
  JSX,
  JSXElement,
  mergeProps,
  on,
  Show,
  splitProps,
} from 'solid-js'

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
  style: JSX.CSSProperties
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
    <Motion.div
      style={{ ...local.style, 'will-change': 'height' }}
      class="relative overflow-hidden"
      ref={props.ref}
      animate={{ height: `${height()}px` }}
      initial={false}
      transition={
        animate()
          ? {
              easing: spring({
                damping: 12,
                stiffness: 210,
              }),
            }
          : { duration: 0 }
      }
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
    </Motion.div>
  )
}

export default AutoResizingPicture
