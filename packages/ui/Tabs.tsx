import { Motion } from '@motionone/solid'
import { DragGesture, Gesture } from '@use-gesture/vanilla'
import { spring } from 'motion'
import {
  batch,
  children,
  Component,
  createEffect,
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
    const el = tabButtonElements[index]
    const { width, left } = el.getBoundingClientRect()
    const scrollLeft = el.parentElement?.scrollLeft ?? 0
    const center = left + width / 2 + scrollLeft
    el.scrollIntoView({ behavior: 'smooth' })
    if (state.activeTab < index) {
      setState({
        activeTab: index,
        indicatorRight: center + INDICATOR_WIDTH_PIXELS / 2,
        animating: 'forward',
      })
    } else if (state.activeTab > index) {
      setState({
        activeTab: index,
        indicatorLeft: center - INDICATOR_WIDTH_PIXELS / 2,
        animating: 'backwards',
      })
    } else {
      setState({
        activeTab: index,
        indicatorLeft: center - INDICATOR_WIDTH_PIXELS / 2,
        indicatorRight: center + INDICATOR_WIDTH_PIXELS / 2,
        animating: 'none',
      })
    }
  }

  function handleSwipe(swipe: number) {
    setState({ contentOffsetX: 0, down: false })
    setActiveTab(
      clamp(state.activeTab - swipe, 0, tabButtons.toArray().length - 1)
    )
  }

  function handleDrag(offset: number) {
    const distance = Math.abs(offset)
    const direction = offset / distance
    const index = state.activeTab
    setState({
      contentOffsetX: offset,
      down: true,
    })
    const scrollLeft = tabButtonElements[index].parentElement?.scrollLeft ?? 0
    const current = tabButtonElements[index].getBoundingClientRect()
    if (direction < 0 && state.activeTab < tabButtons.toArray().length - 1) {
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
    } else if (direction > 0 && state.activeTab > 0) {
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
      setState({ down: false })
      setState({
        indicatorLeft:
          current.left + current.width / 2 - INDICATOR_WIDTH_PIXELS / 2,
        indicatorRight:
          current.left + current.width / 2 + INDICATOR_WIDTH_PIXELS / 2,
      })
    }
  }

  onMount(() => {
    const gesture = new Gesture(
      contentElement,
      {
        onDrag({ swipe, offset, direction, down }) {
          batch(() => {
            if (swipe[0] !== 0) {
              handleSwipe(swipe[0])
              return
            }
            handleDrag(offset[0])
            if (down) return
            const index = state.activeTab
            const current = tabButtonElements[index].getBoundingClientRect()
            setState({
              down: false,
              contentOffsetX: 0,
              indicatorLeft:
                current.left + current.width / 2 - INDICATOR_WIDTH_PIXELS / 2,
              indicatorRight:
                current.left + current.width / 2 + INDICATOR_WIDTH_PIXELS / 2,
            })
            if (Math.abs(offset[0]) < contentElement.clientWidth / 3) return
            setActiveTab(
              clamp(index - direction[0], 0, tabButtons.toArray().length - 1)
            )
          })
        },
      },
      {
        drag: {
          axis: 'x',
          preventScroll: true,
        },
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
                transform: `translateX(calc(-${state.activeTab * 100}% + ${
                  state.contentOffsetX
                }px))`,
              }}
              transition={{ duration: state.down ? 0 : 1 }}
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
              class="uppercase font-bold text-sm tracking-wider shrink-0 transition-colors p-5 tap-highlight-none"
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
          class="border-b-2 absolute bottom-3 will-change-[left_width]"
          animate={{
            left: state.indicatorLeft + 'px',
            width: state.indicatorRight - state.indicatorLeft + 'px',
          }}
          onMotionComplete={() => {
            if (state.animating === 'none') return
            if (state.animating === 'forward') {
              setState({
                indicatorLeft: state.indicatorRight - 80,
                animating: 'none',
              })
            } else {
              setState({
                indicatorRight: state.indicatorLeft + 80,
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
