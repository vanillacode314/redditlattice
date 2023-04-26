import { Motion } from '@motionone/solid'
import { ScrollGesture } from '@use-gesture/vanilla'
import { throttle } from 'lodash-es'
import {
  batch,
  Component,
  createEffect,
  createSignal,
  For,
  on,
  onCleanup,
} from 'solid-js'
import { useAppState } from '~/stores'
import { getScrollTop } from '~/utils'

interface Props {
  icon: string
  actions: TAction[]
  selected: TAction['id']
  onSelect: (id: TAction['id']) => void
}

const thresholdPixels = 0
const Fab: Component<Props> = (props) => {
  const [appState, setAppState] = useAppState()
  const [width, setWidth] = createSignal<number>(0)
  const [open, setOpen] = createSignal<boolean>(false)
  const [hidden, setHidden] = createSignal<boolean>(false)

  createEffect(
    on(
      () => appState.scrollElement,
      (scroller) => {
        if (!scroller) return
        const gesture = new ScrollGesture(
          scroller,
          ({ delta: [_, dy] }) =>
            batch(() => {
              if (dy === 0) return
              setOpen(false)
              setHidden(dy > 0 && Math.abs(dy) >= thresholdPixels)
            }),
          {
            preventDefault: false,
            eventOptions: {
              passive: true,
            },
          }
        )
        onCleanup(() => gesture.destroy())
      }
    )
  )

  return (
    <Motion.div
      animate={{ transform: `scale(${hidden() ? 0 : 1})` }}
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
                initial={{ transform: 'scale(0)' }}
                animate={{ transform: 'scale(1)' }}
                class={
                  'text-2xl grid place-items-center h-13 w-13 outline-none rounded-xl shadow ' +
                  (props.selected === id
                    ? 'bg-purple-800 hover:bg-purple-700 focus:bg-purple-700'
                    : 'bg-neutral-900 hover:bg-neutral-800 focus:bg-neutral-800')
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
            'bg-neutral-900': !open(),
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
