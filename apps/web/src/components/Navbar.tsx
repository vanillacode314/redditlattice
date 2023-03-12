import { Gesture } from '@use-gesture/vanilla'
import screenfull from 'screenfull'
import {
  Component,
  createEffect,
  createSignal,
  on,
  onCleanup,
  onMount,
  Show,
} from 'solid-js'
import { useLocation, useNavigate, useSearchParams } from 'solid-start'
import AutoScrollModal, { showAutoScrollModal } from '~/modals/AutoScrollModal'
import { useAppState, useSessionState } from '~/stores'
import { clamp } from '~/utils'

export const Navbar: Component = () => {
  const [appState, setAppState] = useAppState()
  const [_sessionState, setSessionState] = useSessionState()

  const [height, setHeight] = createSignal<number>(0)
  const [query, setQuery] = createSignal<string>('')
  const [fullscreen, setFullscreen] = createSignal<boolean>(false)

  const navigate = useNavigate()

  const setScrolling = (val: boolean) => setAppState('autoScrolling', val)
  const scrolling = () => appState.autoScrolling

  let cancelScroll: () => void
  async function toggleScroll() {
    if (scrolling()) {
      cancelScroll?.()
      setScrolling(false)
      return
    }
    cancelScroll = await showAutoScrollModal()
    setScrolling(true)
  }

  createEffect(() => {
    if (!screenfull.isEnabled) return
    fullscreen() ? screenfull.request() : screenfull.exit()
  })

  onMount(() => {
    if (!screenfull.isEnabled) return
    screenfull.on('change', () => {
      setFullscreen(screenfull.isFullscreen)
    })
  })

  const location = useLocation()
  const [, setSearchParams] = useSearchParams()

  const showBack = () =>
    location.pathname.startsWith('/r/') || location.pathname.startsWith('/p/')

  const toggleDrawer = () => setSessionState('drawerVisible', (_) => !_)

  const navVisible = () => appState.navVisible
  const setNavVisible = (val: boolean) => {
    setAppState({
      navVisible: val,
    })
  }

  const [down, setDown] = createSignal<boolean>(false)

  createEffect(
    on(
      () => location.pathname,
      () => {
        setNavVisible(true)
        setAppState('navOffset', 0)
      }
    )
  )

  createEffect(() => setAppState('navOffset', navVisible() ? 0 : height()))

  createEffect(
    on(
      () => appState.scrollElement,
      (scroller) => {
        if (!scroller) return
        const originalPaddingTop = +scroller.style.paddingTop.replace('px', '')
        const gesture = new Gesture(
          scroller,
          {
            onScroll: ({ delta }) => {
              setDown(true)
              setAppState('navOffset', (value) =>
                clamp(value + delta[1], 0, height())
              )
              scroller.style.paddingTop = `${
                appState.navOffset + originalPaddingTop
              }px`
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
    <>
      <div class="relative z-20 overflow-hidden bg-black">
        <div style={{ 'margin-bottom': -appState.navOffset + 'px' }} />
        <nav
          ref={(el) => {
            requestAnimationFrame(function handler() {
              const h = parseFloat(getComputedStyle(el).height)
              if (!h) {
                requestAnimationFrame(handler)
                return
              }
              setHeight(h)
            })
          }}
          class="relative z-20 flex items-center gap-5 px-5 py-3 text-white md:border-b border-neutral-800"
        >
          <Show
            when={!appState.isSearching}
            fallback={
              <form
                class="contents"
                onSubmit={(e) => {
                  e.preventDefault()
                  if (location.pathname.startsWith('/p/')) {
                    navigate(`/p/${query()}`)
                  }
                  if (location.pathname.startsWith('/r/')) {
                    setSearchParams({ q: query() })
                  }
                  setQuery('')
                  setAppState({ isSearching: false })
                }}
              >
                <button
                  aria-label="search"
                  type="button"
                  onClick={() => setAppState({ isSearching: false })}
                >
                  <span text="2xl" class="i-mdi-arrow-left"></span>
                </button>
                <input
                  id="search"
                  ref={(el) => {
                    requestAnimationFrame(() => {
                      el.focus()
                    })
                  }}
                  value={query()}
                  onInput={(e) => setQuery(e.currentTarget.value.toLowerCase())}
                  onBlur={() => setAppState({ isSearching: false })}
                  required
                  text="xl"
                  grow
                  bg="black"
                  outline-none
                />
                <div grid class="[&_*]:grid-area-[1/-1]">
                  <Show when={query()}>
                    <button
                      aria-label="clear"
                      type="button"
                      onClick={() => setQuery('')}
                      onFocus={(e) => e.relatedTarget?.focus()}
                    >
                      <span text="2xl" class="i-mdi-close-circle"></span>
                    </button>
                  </Show>
                </div>
              </form>
            }
          >
            <button
              aria-label="menu"
              classList={{
                hidden: appState.drawerDocked,
              }}
              type="button"
              onClick={() => (showBack() ? navigate('/') : toggleDrawer())}
            >
              <span
                text="2xl"
                classList={{
                  'i-mdi-menu': !showBack(),
                  'i-mdi-arrow-left': showBack(),
                }}
              ></span>
            </button>
            <span class="text-semibold truncate font-semibold">
              {appState.title || 'RedditLattice'}
            </span>
            <span class="grow" />
            <Show when={showBack()}>
              <button
                aria-label="search"
                type="button"
                title="search"
                onClick={() => setAppState({ isSearching: true })}
              >
                <span text="2xl" class="i-mdi-magnify"></span>
              </button>
              <AutoScrollModal onClose={(success) => setScrolling(success)} />
              <button
                aria-label="autoscroll"
                type="button"
                title="autoscroll"
                onClick={toggleScroll}
              >
                <span
                  text="2xl"
                  classList={{
                    'i-mdi-play': !scrolling(),
                    'i-mdi-pause': scrolling(),
                  }}
                ></span>
              </button>
              <button
                aria-label="fullscreen"
                title="fullscreen"
                type="button"
                onClick={() => setFullscreen((_) => !_)}
              >
                <span
                  text="2xl"
                  classList={{
                    'i-mdi-fullscreen': !fullscreen(),
                    'i-mdi-fullscreen-exit': fullscreen(),
                  }}
                ></span>
              </button>
              <button
                aria-label="scroll to top"
                type="button"
                title="search"
                onClick={() => {
                  appState.scrollElement?.scrollTo({
                    top: 0,
                    behavior: 'smooth',
                  })
                }}
              >
                <span text="2xl" class="i-mdi-arrow-up"></span>
              </button>
            </Show>
          </Show>
        </nav>
      </div>
    </>
  )
}

export default Navbar
