import clsx from 'clsx'
import { throttle } from 'lodash-es'
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
import Animate from './Animate'

interface Props extends JSX.HTMLAttributes<HTMLDivElement> {
  width: number
  fallbackHeight: number
  y?: number
  alt?: string
  src?: string
  srcSets?: Map<string, string>
  onHasHeight?: (height: number) => void
  onLoad?: (e: Event) => void
  onError?: (e: Event) => void
  fallback?: JSXElement
  style?: JSX.CSSProperties
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
    'fallback',
    'class',
  ])
  const merged = mergeProps(
    {
      srcSets: new Map(),
    },
    local
  )
  const { onHasHeight, onLoad, onError } = local

  const [hasHeight, setHasHeight] = createSignal<boolean>(false)
  const [height, setHeight] = createSignal(props.fallbackHeight)
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
    500
  )

  createRenderEffect(
    on(
      () => props.width,
      () => {
        setHasHeight(false)
        queueMicrotask(checkHeight)
      },
      { defer: true }
    )
  )

  return (
    <Animate
      class={clsx('overflow-hidden group', props.class)}
      immediate={hasHeight()}
      options={{
        stiffness: 0.1,
        damping: 0.2,
      }}
      height={height()}
      width={props.width}
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
    </Animate>
  )
}

export default AutoResizingPicture
