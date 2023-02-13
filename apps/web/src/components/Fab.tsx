import { Motion } from '@motionone/solid'
import { throttle } from 'lodash-es'
import { spring } from 'motion'
import {
  batch,
  Component,
  createSignal,
  For,
  onCleanup,
  onMount,
} from 'solid-js'

interface Props {
  icon: string
  actions: TAction[]
  selected: TAction['id']
  onSelect: (id: TAction['id']) => void
}

const Fab: Component<Props> = (props) => {
  const [width, setWidth] = createSignal<number>(0)
  const [open, setOpen] = createSignal<boolean>(false)
  const [hidden, setHidden] = createSignal<boolean>(false)

  let scrollStart = 0
  let lastKnownScrollPos = 0
  let lastScrollDirection: 'up' | 'down' = 'down'
  const threshold = 100 // in pixels
  const onScroll = throttle((e: Event) => {
    const el = e.currentTarget as HTMLElement
    if (!el) return
    const dy = scrollStart - lastKnownScrollPos
    const newScrollDirection =
      el.scrollTop - lastKnownScrollPos > 0 ? 'down' : 'up'
    lastKnownScrollPos = el.scrollTop
    if (newScrollDirection !== lastScrollDirection) {
      scrollStart = el.scrollTop
      lastScrollDirection = newScrollDirection
    }
    batch(() => {
      setOpen(false)
      setHidden(dy < 0 && Math.abs(dy) > threshold)
    })
  }, 100)

  onMount(() => {
    const scroller = document.getElementById('scroller')
    if (!scroller) return
    scroller.addEventListener('scroll', onScroll, { passive: true })
    onCleanup(() => scroller.removeEventListener('scroll', onScroll))
  })

  return (
    <Motion.div
      animate={{ transform: `scale(${hidden() ? 0 : 1})` }}
      transition={{ duration: .25 }}
      class="flex fixed bottom-0 right-0 overflow-hidden"
    >
      <div class="p-5 grid gap-3">
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
          class="flex flex-col-reverse items-center gap-2"
        >
          <For each={open() ? props.actions : []}>
            {({ icon, id }) => (
              <Motion.button
                animate={{ transform: [`scale(0)`, `scale(1)`] }}
                transition={{ duration: 0.25 }}
                class={
                  'text-2xl grid place-items-center h-13 w-13 outline-none rounded-xl shadow ' +
                  (props.selected === id
                    ? 'bg-purple-800 hover:bg-purple-700 focus:bg-purple-700'
                    : 'bg-gray-900 hover:bg-gray-800 focus:bg-gray-800')
                }
                onClick={() => {
                  if (props.selected === id) return
                  props?.onSelect(id)
                  setOpen(false)
                }}
              >
                <div class={icon} />
              </Motion.button>
            )}
          </For>
        </div>
        <button
          classList={{
            'rotate-90 bg-pink-800': open(),
            'bg-gray-900': !open(),
          }}
          style={{ '-webkit-tap-highlight-color': 'transparent' }}
          class="transition-transform transition-colors outline-none w-15 h-15 shadow rounded-xl preserve-3d"
          onClick={() => setOpen(!open())}
        >
          <div class={open() ? 'i-mdi-close' : props.icon} text="2xl"></div>
        </button>
      </div>
    </Motion.div>
  )
}

export default Fab
