import { Motion } from '@motionone/solid'
import { throttle } from 'lodash-es'
import { spring } from 'motion'
import {
  batch,
  Component,
  createMemo,
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
  onHasHeight?: (rect: DOMRect) => void
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
  const heightMemo = createMemo(() => height())
  const [gotHeight, setGotHeight] = createSignal<boolean>(false)
  const [error, setError] = createSignal<boolean>(false)
  const [tries, setTries] = createSignal(0)
  const [animate, setAnimate] = createSignal<boolean>(false)

  const checkHeight = throttle(() => {
    batch(() => {
      setTries(tries() + 1)
      if (tries() > 1) setAnimate(true)
      if (error()) return
      if (!imgElement) return
      if (!imgElement.naturalHeight) {
        checkHeight()
        return
      }

      const height =
        (imgElement.naturalHeight / imgElement.naturalWidth) * local.width
      onHasHeight?.({
        ...imgElement.getBoundingClientRect().toJSON(),
        height,
      })
      setHeight(height)
      setGotHeight(true)
    })
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
      class="relative overflow-hidden"
      ref={props.ref}
      animate={{ height: `${heightMemo()}px`, ...local.style }}
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
      <Show when={!gotHeight() && tries() > 1}>
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
              setGotHeight(false)
            })
            onError?.(e)
          }}
          onLoad={onLoad}
          alt={merged.alt}
          referrerpolicy="no-referrer"
          decoding="async"
        />
      </picture>
    </Motion.div>
  )
}

export default AutoResizingPicture
