import { throttle } from 'lodash-es'
import {
  Component,
  createEffect,
  createSignal,
  JSXElement,
  mergeProps,
  on,
  onCleanup,
  onMount,
} from 'solid-js'

export type State = 'idle' | 'error' | 'loading' | 'completed'
export type InfiniteHandler = (
  setState: (state: State) => void,
  firstload: boolean
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
  const merged = mergeProps(
    { key: '', distance: 0, target: 'body', firstload: true },
    props
  )

  const { onInfinite } = props

  const [state, setState] = createSignal<State>('idle')

  const onScroll = throttle((e: Event) => {
    if (state() !== 'idle') return

    let scrollTarget: HTMLElement
    if (merged.target instanceof HTMLElement) {
      scrollTarget = merged.target
    } else {
      scrollTarget = document.querySelector(merged.target) as HTMLElement
    }
    if (!scrollTarget)
      throw new Error(
        `scroll-target ${props.target} not found for infinite loading`
      )

    const scrollBottom = Math.round(
      scrollTarget.scrollHeight -
        scrollTarget.scrollTop -
        scrollTarget.clientHeight
    )
    if (scrollBottom - 1 <= merged.distance) load()
  }, 16)

  const updateState = (newState: State) => {
    if (newState !== 'idle') {
      setState(newState)
      return
    }

    let scrollTarget: HTMLElement
    if (merged.target instanceof HTMLElement) {
      scrollTarget = merged.target
    } else {
      scrollTarget = document.querySelector(merged.target) as HTMLElement
    }
    if (!scrollTarget)
      throw new Error(
        `scroll-target ${props.target} not found for infinite loading`
      )

    const noScrollbar = scrollTarget.scrollHeight === scrollTarget.clientHeight
    noScrollbar ? load() : setState('idle')
  }

  const load = (firstload: boolean = false) => {
    setState('loading')
    onInfinite(updateState, firstload)
  }

  const setup = () => merged.firstload && load(true)

  createEffect(
    on(
      () => merged.key,
      () => setup()
    )
  )

  onMount(() => {
    let scrollTarget: HTMLElement
    if (merged.target instanceof HTMLElement) {
      scrollTarget = merged.target
    } else {
      scrollTarget = document.querySelector(merged.target) as HTMLElement
    }
    if (!scrollTarget)
      throw new Error(
        `scroll-target ${props.target} not found for infinite loading`
      )

    scrollTarget.addEventListener('scroll', onScroll, { passive: true })
    onCleanup(() => scrollTarget.removeEventListener('scroll', onScroll))
  })

  return <div>{props.children(state(), load)}</div>
}

export default InfiniteLoading
