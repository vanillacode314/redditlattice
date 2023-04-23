import { createVisibilityObserver } from '@solid-primitives/intersection-observer'
import {
  Component,
  createEffect,
  createMemo,
  createSignal,
  JSXElement,
  mergeProps,
  on,
  Show,
  untrack,
} from 'solid-js'
import { isServer } from 'solid-js/web'
export type State = 'idle' | 'error' | 'loading' | 'completed'
export type InfiniteHandler = (
  setState: (state: State) => void,
  firstload: boolean,
  reload: () => void
) => void

interface Props {
  children: (state: State, load: (firstload?: boolean) => void) => JSXElement
  distance?: number
  target?: string | HTMLElement
  firstload?: boolean
  key?: string
  onInfinite: InfiniteHandler
}

const InfiniteLoadingInner: Component<Props> = (props: Props) => {
  let el!: HTMLDivElement

  const merged = mergeProps({ key: '', distance: 0, firstload: true }, props)
  const { onInfinite } = props
  const [state, setState] = createSignal<State>('idle')
  const [target, setTarget] = createSignal<HTMLElement | null>(null)
  createEffect(() => {
    if (merged.target instanceof HTMLElement) {
      setTarget(merged.target)
      return
    }
    setTarget(
      merged.target
        ? (document.querySelector(merged.target) as HTMLElement)
        : null
    )
  })

  const [visible, setVisible] = createSignal<boolean>(false)
  createEffect(() => {
    new IntersectionObserver(
      (entries) => setVisible(entries.some((entry) => entry.isIntersecting)),
      {
        threshold: 0.8,
        root: target(),
        rootMargin: `0px 0px ${merged.distance}px 0px`,
      }
    ).observe(el)
  })

  let isFirstLoad: boolean = true
  createEffect(
    on(
      visible,
      (visible) => {
        if (isFirstLoad && visible) {
          isFirstLoad = false
          return
        }
        if (!visible) return
        untrack(() => {
          if (state() !== 'idle') return
          load()
        })
      },
      { defer: true }
    )
  )

  const updateState = (newState: State) => {
    setState(newState)
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (visible() && state() == 'idle') load()
      })
    })
  }

  const load = (firstload: boolean = false) => {
    setState('loading')
    onInfinite(updateState, firstload, load)
  }

  createEffect(() => {
    merged.key
    if (merged.firstload) load(true)
  })

  return <div ref={el}>{props.children(state(), load)}</div>
}

export const InfiniteLoading: Component<Props> = (props: Props) => {
  return (
    <Show when={!isServer}>
      <InfiniteLoadingInner {...props} />
    </Show>
  )
}
export default InfiniteLoading
