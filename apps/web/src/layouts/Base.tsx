import { createActiveElement } from '@solid-primitives/active-element'
import { createConnectivitySignal } from '@solid-primitives/connectivity'
import { createEventListener } from '@solid-primitives/event-listener'
import { createShortcut } from '@solid-primitives/keyboard'
import { createMediaQuery } from '@solid-primitives/media'
import screenfull from 'screenfull'
import {
  batch,
  createComputed,
  createSignal,
  on,
  ParentComponent,
  Show,
  Suspense,
} from 'solid-js'
import { ErrorBoundary, useLocation, useNavigate } from 'solid-start'
import { Spinner } from 'ui'
import { createSpring } from 'ui/utils/spring'
import Drawer from '~/components/Drawer'
import Navbar from '~/components/Navbar'
import { useAppState, useSessionState } from '~/stores'
import { getScrollTop } from '~/utils'

const [refresh, setRefresh] = createSignal<() => void>(() => {})
export const useRefresh = () => [refresh, setRefresh] as const

export const BaseLayout: ParentComponent = (props) => {
  const isOnline = createConnectivitySignal()
  const location = useLocation()

  createComputed(() => {
    location.pathname
    setRefresh(() => () => {})
  })
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

  const [down, setDown] = createSignal<boolean>(false)
  const [offset, setOffset] = createSpring(0, down)
  const isMobile = createMediaQuery('(max-width: 768px)')

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

  let touchId: number | null
  let touchStartY: number
  createEventListener(
    () => appState.scrollElement as HTMLElement,
    'touchstart',
    (e) => {
      if (down()) return
      const scrollTop = getScrollTop(appState.scrollElement)
      if (scrollTop > 5) return
      setDown(true)
      touchId = e.changedTouches[0].identifier
      touchStartY = e.changedTouches[0].clientY
    },
    { passive: true }
  )

  let lastTouchY: number | null
  let stoppedAtY: number = Infinity
  let doRefresh = false
  let lastOffset: number | null
  createEventListener(
    () => appState.scrollElement as HTMLElement,
    'touchmove',
    (e) => {
      if (touchId === null) return
      const touch = [...e.changedTouches].find(
        (touch) => touch.identifier === touchId
      )
      if (!touch) return
      if (touch.clientY > stoppedAtY) return
      const dy = touch.clientY - (lastTouchY ?? touchStartY)
      lastTouchY = touch.clientY
      doRefresh = offset() + dy >= 350
      stoppedAtY = doRefresh ? lastTouchY : Infinity
      setOffset(Math.min((lastOffset ?? offset()) + dy, 350))
      lastOffset = offset()
    },
    { passive: true }
  )

  createEventListener(
    () => appState.scrollElement as HTMLElement,
    'touchend',
    (e) => {
      if (touchId === null) return
      const touch = [...e.changedTouches].find(
        (touch) => touch.identifier === touchId
      )
      if (!touch) return
      touchId = null
      lastTouchY = null
      lastOffset = null
      batch(() => {
        setDown(false)
        setOffset(0)
      })
      if (doRefresh) {
        doRefresh = false
        refresh()()
      }
    },
    { passive: true }
  )

  const navigate = useNavigate()
  const activeEl = createActiveElement()
  // createShortcut(
  //   ['Shift', 'h'],
  //   (e) => {
  //     if (activeEl() instanceof HTMLInputElement) return
  //     e.preventDefault()
  //     history.back()
  //   },
  //   { preventDefault: false }
  // )
  // createShortcut(
  //   ['Shift', 'l'],
  //   (e) => {
  //     if (activeEl() instanceof HTMLInputElement) return
  //     e.preventDefault()
  //     history.forward()
  //   },
  //   { preventDefault: false }
  // )
  createShortcut(
    ['f'],
    (e) => {
      if (activeEl() instanceof HTMLInputElement) return
      e.preventDefault()
      screenfull.toggle()
    },
    { preventDefault: false }
  )
  createShortcut(
    ['Escape'],
    (e) => {
      setAppState({ isSearching: false })
      ;(activeEl() as HTMLElement)?.blur()
    },
    { preventDefault: false }
  )
  createShortcut(
    ['/'],
    (e) => {
      if (activeEl() instanceof HTMLInputElement) return
      e.preventDefault()
      if (
        location.pathname.startsWith('/r/') ||
        location.pathname.startsWith('/p/')
      ) {
        setAppState({ isSearching: true })
      } else {
        const input = document.getElementById('search')
        input?.focus()
      }
    },
    { preventDefault: false }
  )

  return (
    <div class="flex flex-col h-full max-h-full relative">
      <div class="bg-tranparent pointer-events-none absolute inset-x-0 top-0 z-10 grid place-content-center p-6">
        <div
          class="bg-purple relative z-10 rounded-full p-2"
          style={{
            transform: `translateY(${offset() - 200}%) rotate(${offset()}deg)`,
          }}
        >
          <div text="3xl" class="i-mdi-refresh"></div>
        </div>
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
            <Spinner />
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
  )
}

export default BaseLayout
