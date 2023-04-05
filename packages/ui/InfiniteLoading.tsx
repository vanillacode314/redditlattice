import { createVisibilityObserver } from '@solid-primitives/intersection-observer'
import {
  Component,
  createEffect,
  createMemo,
  createSignal,
  JSXElement,
  mergeProps,
  untrack,
} from 'solid-js'
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

export const InfiniteLoading: Component<Props> = (props: Props) => {
  let el!: HTMLDivElement

  const merged = mergeProps(
    { key: '', distance: 0, target: 'body', firstload: true },
    props
  )

  const { onInfinite } = props

  const [state, setState] = createSignal<State>('idle')
  const target = createMemo<HTMLElement>(() => {
    if (merged.target instanceof HTMLElement) {
      return merged.target
    } else {
      return document.querySelector(merged.target) as HTMLElement
    }
  })
  const useVisibilityObserver = createVisibilityObserver({
    threshold: 0.8,
    root: target(),
    rootMargin: `0px 0px ${merged.distance}px 0px`,
  })

  const visible = useVisibilityObserver(() => el)

  createEffect(() => {
    if (!visible()) return
    untrack(() => {
      if (state() !== 'idle') return
      load()
    })
  })

  const updateState = (newState: State) => {
    setState(newState)
    if (visible() && state() == 'idle') load()
  }

  const load = (firstload: boolean = false) => {
    setState('loading')
    onInfinite(updateState, firstload, load)
  }

  const setup = () => load(merged.firstload)

  createEffect(() => {
    merged.key
    untrack(setup)
  })

  return <div ref={el}>{props.children(state(), load)}</div>
}

export default InfiniteLoading
