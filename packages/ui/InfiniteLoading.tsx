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
import _ from 'lodash'

interface Props {
  children: (state: State, load: (firstload?: boolean) => void) => JSXElement
  distance?: number
  target?: string
  firstload?: boolean
  key?: string
  onInfinite: InfiniteHandler
}

export const InfiniteLoading: Component<Props> = (props: Props) => {
  const merged = mergeProps(
    { key: '', distance: 0, target: 'body', firstload: true },
    props
  )
  const [state, setState] = createSignal<State>('idle')

  const onScroll = _.throttle((e: Event) => {
    if (state() !== 'idle') return
    const scrollArea = e.currentTarget as HTMLElement
    if (!scrollArea) return
    const scrollBottom =
      scrollArea.scrollHeight - scrollArea.scrollTop - scrollArea.clientHeight
    if (scrollBottom - 1 <= merged.distance) load()
  }, 16)

  const load = (firstload: boolean = false) => {
    setState('loading')
    merged.onInfinite((s) => {
      setTimeout(() => {
        if (s === 'idle') {
          const scrollArea = document.querySelector(merged.target)
          if (
            scrollArea &&
            scrollArea.scrollHeight === scrollArea.clientHeight
          ) {
            load()
            return
          }
        }
        setState(s)
      }, 1000)
    }, firstload)
  }

  const setup = () => {
    if (merged.firstload) load(true)
  }

  createEffect(
    on(
      () => merged.key,
      () => {
        setTimeout(() => {
          setup()
        })
      }
    )
  )

  onMount(() => {
    const scrollArea = document.querySelector(merged.target)
    if (!scrollArea) return
    scrollArea.addEventListener('scroll', onScroll, { passive: true })
    onCleanup(() => scrollArea.removeEventListener('scroll', onScroll))
  })

  return <div>{props.children(state(), load)}</div>
}

export default InfiniteLoading
