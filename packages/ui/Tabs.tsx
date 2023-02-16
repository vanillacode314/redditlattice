import { Motion } from '@motionone/solid'
import { DragGesture } from '@use-gesture/vanilla'
import {
  batch,
  children,
  Component,
  For,
  JSXElement,
  onCleanup,
  onMount,
} from 'solid-js'
import { createStore } from 'solid-js/store'
import z from 'zod'
import { clamp } from './utils'

interface TabsProps {
  activeTab?: number
  children: JSXElement
  onChange?: (index: number) => void
}

const INDICATOR_WIDTH_PIXELS = 80
const stateSchema = z.object({
  activeTab: z.number().default(0),
  contentOffsetX: z.number().default(0),
  indicatorLeft: z.number().default(0),
  indicatorRight: z.number().default(0),
  down: z.boolean().default(false),
  animating: z.enum(['none', 'forward', 'backwards']).default('none'),
})
export const Tabs: Component<TabsProps> = (props) => {
  const [state, setState] = createStore<z.infer<typeof stateSchema>>(
    stateSchema.parse({ activeTab: props.activeTab })
  )

  let contentElement!: HTMLDivElement

  let tabButtonElements: HTMLButtonElement[] = []
  const tabButtons = children(() => props.children)
  const setActiveTab = (index: number) => {
    props.onChange?.(index)
    const el = tabButtonElements[index]
    const { width, left } = el.getBoundingClientRect()
    const scrollLeft = el.parentElement?.scrollLeft ?? 0
    const offsetLeft = el.parentElement?.offsetLeft ?? 0
    const center = left + width / 2 + scrollLeft - offsetLeft
    requestAnimationFrame(() => {
      el.scrollIntoView({ behavior: 'smooth' })
    })
    if (state.activeTab < index) {
      setState({
        activeTab: index,
        contentOffsetX: index * -contentElement.offsetWidth,
        indicatorRight: center + INDICATOR_WIDTH_PIXELS / 2,
        animating: 'forward',
      })
    } else if (state.activeTab > index) {
      setState({
        activeTab: index,
        contentOffsetX: index * -contentElement.offsetWidth,
        indicatorLeft: center - INDICATOR_WIDTH_PIXELS / 2,
        animating: 'backwards',
      })
    } else {
      setState({
        activeTab: index,
        contentOffsetX: index * -contentElement.offsetWidth,
        indicatorLeft: center - INDICATOR_WIDTH_PIXELS / 2,
        indicatorRight: center + INDICATOR_WIDTH_PIXELS / 2,
        animating: 'none',
      })
    }
  }

  function handleSwipe(swipe: number) {
    setActiveTab(
      clamp(state.activeTab - swipe, 0, tabButtons.toArray().length - 1)
    )
  }

  function handleDrag(movement: number, offset: number) {
    const distance = Math.abs(movement)
    const index = state.activeTab
    setState({ contentOffsetX: offset })
    const scrollLeft = tabButtonElements[index].parentElement?.scrollLeft ?? 0
    const current = tabButtonElements[index].getBoundingClientRect()
    if (movement < 0 && state.activeTab < tabButtons.toArray().length - 1) {
      const currentIndicatorRight =
        current.left + current.width / 2 + INDICATOR_WIDTH_PIXELS / 2

      const next = tabButtonElements[index + 1].getBoundingClientRect()
      const nextIndicatorRight =
        next.left + next.width / 2 + INDICATOR_WIDTH_PIXELS / 2

      const newIndicatorRight =
        clamp(distance / contentElement.clientWidth, 0, 1) *
          (nextIndicatorRight - currentIndicatorRight) +
        currentIndicatorRight
      scrollLeft
      setState('indicatorRight', newIndicatorRight)
    } else if (movement > 0 && state.activeTab > 0) {
      const currentIndicatorLeft =
        current.left + current.width / 2 - INDICATOR_WIDTH_PIXELS / 2

      const previous = tabButtonElements[index - 1].getBoundingClientRect()
      const previousIndicatorLeft =
        previous.left + previous.width / 2 - INDICATOR_WIDTH_PIXELS / 2

      const newIndicatorLeft =
        clamp(distance / contentElement.clientWidth, 0, 1) *
          (previousIndicatorLeft - currentIndicatorLeft) +
        currentIndicatorLeft
      scrollLeft
      setState('indicatorLeft', newIndicatorLeft)
    } else {
      const current = tabButtonElements[index].getBoundingClientRect()
      setState({
        indicatorLeft:
          current.left + current.width / 2 - INDICATOR_WIDTH_PIXELS / 2,
        indicatorRight:
          current.left + current.width / 2 + INDICATOR_WIDTH_PIXELS / 2,
      })
    }
  }

  onMount(() => {
    const gesture = new DragGesture(
      contentElement,
      ({ movement, swipe, offset, down }) => {
        setState('down', down)
        batch(() => {
          if (swipe[0] !== 0) {
            handleSwipe(swipe[0])
            return
          }
          handleDrag(movement[0], offset[0])
          if (down) return
          const shouldUpdate =
            Math.abs(movement[0]) > contentElement.clientWidth / 3
          const newIndex = shouldUpdate
            ? state.activeTab - Math.sign(movement[0])
            : state.activeTab
          setActiveTab(clamp(newIndex, 0, tabButtons.toArray().length - 1))
        })
      },
      {
        axis: 'x',
        preventScroll: true,
        bounds: {
          left: -contentElement.clientWidth * (tabButtons.toArray().length - 1),
          right: 0,
        },
        from: () => [state.contentOffsetX, 0],
        rubberband: true,
      }
    )
    onCleanup(() => gesture.destroy())
    setActiveTab(state.activeTab)
    const onResize = () => setActiveTab(state.activeTab)
    window.addEventListener('resize', onResize)
    onCleanup(() => window.removeEventListener('resize', onResize))
  })

  return (
    <div class="grid grid-rows-[1fr_auto] h-full overflow-hidden">
      <div
        class="flex items-end overflow-hidden touch-none"
        ref={contentElement}
      >
        <For each={tabButtons.toArray() as unknown as TabProps[]}>
          {(tab) => (
            <Motion.div
              animate={{
                x: state.contentOffsetX,
              }}
              transition={{ duration: state.down ? 0 : 0.5 }}
              class="h-full w-full shrink-0 grow flex justify-end flex-col"
            >
              {tab.children}
            </Motion.div>
          )}
        </For>
      </div>
      <div class="px-5 overflow-auto flex hidescrollbar shrink-0 relative gap-5">
        <For each={tabButtons.toArray() as unknown as TabProps[]}>
          {(tab, index) => (
            <button
              class="uppercase font-bold text-sm tracking-wider shrink-0 transition-colors px-5 py-3 tap-highlight-none"
              ref={tabButtonElements[index()]}
              classList={{
                'text-gray-100': state.activeTab === index(),
                'text-gray-500': state.activeTab !== index(),
              }}
              onClick={() => setActiveTab(index())}
            >
              {tab.title}
            </button>
          )}
        </For>
        <Motion.div
          class="border-b-2 absolute bottom-1 will-change-[left_width]"
          animate={{
            left: state.indicatorLeft + 'px',
            width: state.indicatorRight - state.indicatorLeft + 'px',
          }}
          onMotionComplete={() => {
            if (state.animating === 'none') return
            if (state.animating === 'forward') {
              setState({
                indicatorLeft: state.indicatorRight - INDICATOR_WIDTH_PIXELS,
                animating: 'none',
              })
            } else {
              setState({
                indicatorRight: state.indicatorLeft + INDICATOR_WIDTH_PIXELS,
                animating: 'none',
              })
            }
          }}
          transition={
            state.down
              ? {
                  duration: 0,
                }
              : {
                  easing: 'ease-in-out',
                }
          }
        ></Motion.div>
      </div>
    </div>
  )
}

interface TabProps {
  title: string
  icon?: string
  children: JSXElement
}
export const Tab: Component<TabProps> = (props) => {
  return props as unknown as JSXElement
}
