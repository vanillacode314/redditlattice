import { Motion } from '@motionone/solid'
import { createConnectivitySignal } from '@solid-primitives/connectivity'
import { Gesture } from '@use-gesture/vanilla'
import { spring } from 'motion'
import {
  Component,
  createComputed,
  createEffect,
  createSignal,
  JSXElement,
  on,
  onCleanup,
  Show,
  Suspense,
} from 'solid-js'
import { ErrorBoundary, useLocation } from 'solid-start'
import { Spinner } from 'ui'
import Drawer from '~/components/Drawer'
import Navbar from '~/components/Navbar'
import { useAppState } from '~/stores'
import { clamp, inertialScroll } from '~/utils'
interface Props {
  children: JSXElement
}

const [refresh, setRefresh] = createSignal<() => void>(() => {})
export const useRefresh = () => [refresh, setRefresh] as const

export const BaseLayout: Component<Props> = (props) => {
  const isOnline = createConnectivitySignal()
  const location = useLocation()
  createComputed(
    on(
      () => location.pathname,
      () => setRefresh(() => () => {})
    )
  )

  const [appState, _setAppState] = useAppState()

  const [offset, setOffset] = createSignal<number>(0)
  const [down, setDown] = createSignal<boolean>(false)

  createEffect(
    on(
      () => appState.scrollElement,
      (scroller) => {
        let stopInertialScroll: () => void
        if (!scroller) return
        const gesture = new Gesture(
          scroller,
          {
            onDrag: ({
              velocity,
              offset,
              direction,
              memo = 0,
              movement,
              xy,
              down,
            }) => {
              stopInertialScroll?.()
              setDown(down)
              const _offset = Math.min(movement[1] - memo, 300)
              if (!down) {
                if (_offset === 300) {
                  refresh()()
                }
                setOffset(0)
                stopInertialScroll = inertialScroll(
                  scroller,
                  velocity[1] * direction[1]
                )
                return movement[1]
              }
              let scrollPos = scroller.scrollTop
              if (
                getComputedStyle(scroller)['flex-direction'] ===
                'column-reverse'
              )
                scrollPos += scroller.scrollHeight - scroller.clientHeight
              scrollPos = Math.floor(scrollPos)
              if (scrollPos === 0 && _offset > 0) {
                setOffset(_offset)
                return memo
              } else {
                setOffset(0)
                scroller.scrollTop = -offset[1]
                return movement[1]
              }
            },
          },
          {
            drag: {
              axis: 'y',
              from: () => [0, -scroller.scrollTop],
            },
          }
        )
        onCleanup(() => gesture.destroy())
      }
    )
  )

  return (
    <div flex="~ col" h-full max-h-full relative>
      <div class="bg-tranparent pointer-events-none absolute inset-x-0 top-0 z-10 grid place-content-center p-6">
        <Motion.div
          class="bg-purple relative z-10 rounded-full p-2"
          initial={false}
          animate={{
            transform: `translateY(${offset() - 200}%) rotate(${offset()}deg)`,
          }}
          transition={down() ? { duration: 0 } : { easing: spring() }}
        >
          <div text="3xl" class="i-mdi-refresh"></div>
        </Motion.div>
      </div>
      <Show when={!isOnline()}>
        <div
          bg="gray-800"
          px-5
          py-2
          text="sm"
          font="bold"
          tracking-wide
          uppercase
        >
          Not Online
        </div>
      </Show>
      <Navbar />
      <Drawer />
      <div grow overflow-hidden>
        <Suspense
          fallback={
            <div class="grid place-items-center p-5">
              <Spinner></Spinner>
            </div>
          }
        >
          <ErrorBoundary>{props.children}</ErrorBoundary>
        </Suspense>
      </div>
    </div>
  )
}

export default BaseLayout
