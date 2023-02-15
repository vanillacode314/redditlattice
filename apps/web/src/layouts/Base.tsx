import { Motion } from '@motionone/solid'
import { createConnectivitySignal } from '@solid-primitives/connectivity'
import { spring } from 'motion'
import {
  Component,
  createEffect,
  createSignal,
  JSXElement,
  on,
  onCleanup,
  Show,
  Suspense,
} from 'solid-js'
import { ErrorBoundary, useLocation, useParams } from 'solid-start'
import { Spinner } from 'ui'
import Drawer from '~/components/Drawer'
import Navbar from '~/components/Navbar'
import { useAppState, useUserState } from '~/stores'

interface Props {
  children: JSXElement
}

const [refresh, setRefresh] = createSignal<(done?: () => {}) => void>(() => {})
export const useRefresh = () => [refresh, setRefresh] as const

export const BaseLayout: Component<Props> = (props) => {
  const isOnline = createConnectivitySignal()

  const [appState, _setAppState] = useAppState()

  const [offset, setOffset] = createSignal(0)
  const [down, setDown] = createSignal<boolean>(false)
  const threshold = 300

  createEffect(
    on(
      () => appState.scrollElement,
      (scroller) => {
        if (!scroller) return
        let startY: number = 0
        let touchId: number = -1
        let shouldRefresh: boolean = false

        const onTouchStart = (e: TouchEvent) => {
          if (touchId > -1) return
          const touch = e.changedTouches[0]
          let scrollPos = scroller.scrollTop
          if (scrollPos < 0)
            scrollPos += scroller.scrollHeight - scroller.clientHeight
          startY = touch.screenY + scrollPos
          touchId = touch.identifier
          setDown(true)
        }

        let ticking: boolean = false
        const onTouchMove = (e: TouchEvent) => {
          if (ticking) return
          requestAnimationFrame(() => {
            if (touchId < 0) {
              ticking = false
              return
            }
            const touch = e.changedTouches[0]
            if (touchId != touch.identifier) {
              ticking = false
              return
            }
            let scrollPos = scroller.scrollTop
            if (scrollPos < 0)
              scrollPos += scroller.scrollHeight - scroller.clientHeight
            const distance = touch.screenY - startY - scrollPos
            shouldRefresh = scroller.scrollTop < 2 && distance >= threshold
            setOffset(Math.min(threshold, distance))
            ticking = false
          })
          ticking = true
        }

        const onTouchEnd = (e: TouchEvent) => {
          if (touchId < 0) return
          const touch = e.changedTouches[0]
          if (!touch) return
          if (touchId != touch.identifier) return
          touchId = -1
          if (shouldRefresh) {
            shouldRefresh = false
            refresh()()
          }
          setOffset(0)
          setDown(false)
        }

        scroller.addEventListener('touchstart', onTouchStart, {
          passive: true,
        })
        scroller.addEventListener('touchmove', onTouchMove, { passive: true })
        scroller.addEventListener('touchend', onTouchEnd, { passive: true })
        scroller.addEventListener('touchcancel', onTouchEnd, { passive: true })
        onCleanup(() => {
          scroller.removeEventListener('touchstart', onTouchStart)
          scroller.removeEventListener('touchmove', onTouchMove)
          scroller.removeEventListener('touchend', onTouchEnd)
          scroller.removeEventListener('touchcancel', onTouchEnd)
        })
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
