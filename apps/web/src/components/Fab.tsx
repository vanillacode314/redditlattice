import { throttle } from 'lodash-es'
import {
  batch,
  Component,
  createSignal,
  For,
  onCleanup,
  onMount,
} from 'solid-js'
import { animated, createSpring } from 'solid-spring'
import { TransitionStaggeredEnter } from 'ui/transitions'
import type { IAction } from '~/types'

interface Props {
  icon: string
  actions: IAction[]
  selected: IAction['id']
  onSelect: (id: IAction['id']) => void
}

const Fab: Component<Props> = (props) => {
  const [width, setWidth] = createSignal<number>(0)
  const [open, setOpen] = createSignal<boolean>(false)
  const [hidden, setHidden] = createSignal<boolean>(false)

  let last_known_scroll_position = 0
  const threshold = 30 // in pixels
  const onScroll = throttle((e: Event) => {
    const el = e.currentTarget as HTMLElement
    if (!el) return
    const dy = el.scrollTop - last_known_scroll_position
    last_known_scroll_position = el.scrollTop
    batch(() => {
      setOpen(false)
      if (Math.abs(dy) > threshold) setHidden(dy > 0)
    })
  }, 100)

  const slide = createSpring(() => ({
    to: { marginLeft: 0 },
    from: { marginLeft: -2 * width() },
    reverse: hidden(),
  }))

  onMount(() => {
    const scroller = document.getElementById('scroller')
    if (!scroller) return
    scroller.addEventListener('scroll', onScroll, { passive: true })
    onCleanup(() => scroller.removeEventListener('scroll', onScroll))
  })

  return (
    <div flex fixed bottom-0 right-0 overflow-hidden>
      <div p-5 grid gap-5>
        <div
          ref={(el) => {
            if (width()) return
            requestAnimationFrame(function handler() {
              const style = getComputedStyle(el)
              const w = parseFloat(style.width)
              if (!w) {
                requestAnimationFrame(handler)
                return
              }
              setWidth(w)
            })
          }}
          flex="~ col-reverse"
          items-center
          gap-2
        >
          <TransitionStaggeredEnter
            length={props.actions.length}
            duration={100}
          >
            <For each={open() ? props.actions : []}>
              {({ icon, id }, index) => (
                <button
                  data-index={index()}
                  text="2xl"
                  grid
                  place-items-center
                  h-13
                  w-13
                  outline-none
                  rounded-full
                  shadow
                  class={
                    props.selected === id
                      ? 'bg-purple-800 hover:bg-purple-700 focus:bg-purple-700'
                      : 'bg-gray-900 hover:bg-gray-800 focus:bg-gray-800'
                  }
                  style={{
                    transform: `translateY(100px)`,
                  }}
                  onClick={() => {
                    if (props.selected === id) return
                    props?.onSelect(id)
                    setOpen(false)
                  }}
                >
                  <div class={icon} />
                </button>
              )}
            </For>
          </TransitionStaggeredEnter>
        </div>
        <button
          classList={{
            'rotate-90 bg-pink-800': open(),
            'bg-gray-900': !open(),
          }}
          style={{ '-webkit-tap-highlight-color': 'transparent' }}
          transition-transform
          transition-colors
          outline-none
          w-15
          h-15
          shadow
          rounded-full
          onClick={() => setOpen(!open())}
        >
          <div class={open() ? 'i-mdi-close' : props.icon} text="2xl"></div>
        </button>
      </div>
      <animated.div style={slide()}></animated.div>
    </div>
  )
}

export default Fab
