import { Motion } from '@motionone/solid'
import { createConnectivitySignal } from '@solid-primitives/connectivity'
import { WindowEventListener } from '@solid-primitives/event-listener'
import { createMediaQuery } from '@solid-primitives/media'
import { Gesture } from '@use-gesture/vanilla'
import { spring } from 'motion'
import {
  batch,
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
import { ErrorBoundary, useLocation, useNavigate } from 'solid-start'
import { Spinner } from 'ui'
import Drawer from '~/components/Drawer'
import Navbar from '~/components/Navbar'
import { useAppState, useSessionState } from '~/stores'
import { getScrollTop, inertialScroll } from '~/utils'
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
  createComputed(
    on(
      () => `${location.pathname}${location.search}`,
      (newPath, oldPath, lastPage) => {
        if (oldPath && newPath !== lastPage) {
          setAppState('lastPage', appState.lastPage.length, oldPath)
          return oldPath
        }
        return appState.lastPage.at(-1)
      },
      {
        defer: true,
      }
    )
  )

  const [appState, setAppState] = useAppState()
  const [sessionState, setSessionState] = useSessionState()

  const [offset, setOffset] = createSignal<number>(0)
  const [down, setDown] = createSignal<boolean>(false)
  const isMobile = createMediaQuery('(max-width: 768px)')
  const isTouch = createMediaQuery('(hover: none)')

  createComputed(() => {
    const route = location.pathname
    if (isMobile()) {
      setAppState('drawerDocked', false)
      return
    }
    batch(() => {
      setSessionState('drawerVisible', false)
      setAppState('drawerDocked', !/^\/(r|p)\//.test(route))
    })
  })

  createEffect(
    on(
      () => appState.scrollElement,
      (scroller) => {
        return
        let stopInertialScroll: (() => void) | undefined
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
              down,
              tap,
            }) => {
              if (!isTouch()) return
              if (tap) return
              stopInertialScroll?.()
              stopInertialScroll = undefined
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
              const scrollPos = getScrollTop(scroller)
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
              filterTaps: true,
            },
          }
        )
        onCleanup(() => gesture.destroy())
      }
    )
  )

  return (
    <>
      <WindowEventListener
        onKeydown={(e) => {
          if (e.shiftKey) {
            switch (e.key.toLowerCase()) {
              case 'h':
                e.preventDefault()
                history.back()
                break
              case 'l':
                e.preventDefault()
                history.forward()
                break
            }
          } else if (e.ctrlKey) {
            switch (e.key.toLowerCase()) {
              case 'f':
            }
          } else {
            switch (e.key.toLowerCase()) {
              case '/':
                if (
                  location.pathname.startsWith('/r/') ||
                  location.pathname.startsWith('/p/')
                ) {
                  e.preventDefault()
                  setAppState({ isSearching: true })
                } else {
                  e.preventDefault()
                  const input = document.getElementById(
                    'search'
                  ) as HTMLInputElement
                  input?.focus()
                }
                break
              case 'Escape':
                setAppState({ isSearching: false })
                const input = document.getElementById(
                  'search'
                ) as HTMLInputElement
                input?.blur()
                break
            }
          }
        }}
      ></WindowEventListener>
      <div class="flex flex-col h-full max-h-full relative">
        <div class="bg-tranparent pointer-events-none absolute inset-x-0 top-0 z-10 grid place-content-center p-6">
          <Motion.div
            class="bg-purple relative z-10 rounded-full p-2"
            initial={false}
            animate={{
              transform: `translateY(${
                offset() - 200
              }%) rotate(${offset()}deg)`,
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
        <Suspense
          fallback={
            <div class="grid place-items-center p-5">
              <Spinner></Spinner>
            </div>
          }
        >
          <ErrorBoundary>
            <div class="grid grid-rows-[auto_1fr] grid-cols-[auto_1fr] grow overflow-hidden">
              <div class="col-start-2 col-end-3 grid">
                <Navbar />
              </div>
              <div class="row-start-1 row-end-3 col-span-1 grid">
                <Drawer />
              </div>
              {props.children}
            </div>
          </ErrorBoundary>
        </Suspense>
      </div>
    </>
  )
}

export default BaseLayout
