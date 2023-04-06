import { Motion } from '@motionone/solid'
import { throttle } from 'lodash-es'
import { spring } from 'motion'
import {
  batch,
  createRenderEffect,
  createSignal,
  For,
  JSX,
  JSXElement,
  mergeProps,
  on,
  ParentComponent,
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

export const AutoResizingPicture: ParentComponent<Props> = (props) => {
  let imgRef!: HTMLImageElement

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
  const [hasHeight, setHasHeight] = createSignal<boolean>(false)
  const [error, setError] = createSignal<boolean>(false)
  const [tries, setTries] = createSignal(0)

  const checkHeight = throttle(
    () =>
      batch(() => {
        setTries(tries() + 1)
        if (error()) return
        if (!imgRef.naturalHeight) {
          queueMicrotask(checkHeight)
          return
        }

        const height =
          (imgRef.naturalHeight / imgRef.naturalWidth) * props.width
        onHasHeight?.(height)
        setHeight(height)
        setHasHeight(true)
      }),
    100
  )

  createRenderEffect(
    on(
      () => props.width,
      () => queueMicrotask(checkHeight),
      { defer: true }
    )
  )

  return (
    <Motion.div
      class="overflow-hidden group relative"
      ref={props.ref}
      animate={{ height: `${height()}px`, ...local.style }}
      initial={false}
      transition={
        !hasHeight()
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
      <Show when={!hasHeight() && tries() > 1}>
        <div class="absolute inset-0">{props.fallback}</div>
      </Show>
      <picture>
        <For each={[...merged.srcSets]}>
          {([format, url]) => <source srcset={url} type={format} />}
        </For>
        <img
          src={props.src}
          ref={(el) => {
            if (imgRef) return
            imgRef = el
            queueMicrotask(checkHeight)
          }}
          onError={(e) => {
            batch(() => {
              setError(true)
              setHasHeight(false)
            })
            onError?.(e)
          }}
          onLoad={onLoad}
          alt={merged.alt}
          referrerpolicy="no-referrer"
          decoding="async"
        />
      </picture>
      {props.children}
    </Motion.div>
  )
}

export default AutoResizingPicture
