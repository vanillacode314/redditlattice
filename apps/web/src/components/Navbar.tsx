import { throttle } from 'lodash-es'
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
import { animated, createSpring } from 'solid-spring'
import { useLocation, useNavigate, useSearchParams } from 'solid-start'
import { TransitionFade } from 'ui/transitions'
import AutoScrollModal, { showAutoScrollModal } from '~/modals/AutoScrollModal'
import { useAppState } from '~/stores'

export const Navbar: Component = () => {
  const [mounted, setMounted] = createSignal<boolean>(false)
  const [height, setHeight] = createSignal<number>(0)
  const [appState, setAppState] = useAppState()
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

  const toggleDrawer = () => {
    setAppState((_) => ({
      drawerVisible: !_.drawerVisible,
    }))
  }

  const navVisible = () => appState.navVisible
  const setNavVisible = (val: boolean) => {
    setAppState({
      navVisible: val,
    })
  }

  const slide = createSpring(() => ({
    from: { marginBottom: -1 * height() },
    to: { marginBottom: 0 },
    reverse: !navVisible(),
    immediate: !mounted(),
  }))

  let last_known_scroll_position = 0
  const threshold = 30 // in pixels
  const onScroll = throttle((e: Event) => {
    const el = e.currentTarget as HTMLElement
    if (!el) return
    const dy = el.scrollTop - last_known_scroll_position
    last_known_scroll_position = el.scrollTop
    if (el.scrollTop < 5) {
      setNavVisible(true)
      return
    }
    if (Math.abs(dy) > threshold) setNavVisible(dy <= 0)
  }, 100)

  createEffect(
    on(
      () => location.pathname,
      () => {
        setNavVisible(true)
        const scroller = document.getElementById('scroller')
        if (!scroller) return
        scroller.addEventListener('scroll', onScroll, { passive: true })
        onCleanup(() => scroller.removeEventListener('scroll', onScroll))
      }
    )
  )

  onMount(() => setMounted(true))

  return (
    <div class="relative z-20 shrink-0 overflow-hidden bg-black">
      <animated.div style={slide()}></animated.div>
      <nav
        ref={(el) => {
          if (height()) return
          requestAnimationFrame(function handler() {
            const style = getComputedStyle(el)
            const h = parseFloat(style.height)
            if (!h) {
              requestAnimationFrame(handler)
              return
            }
            setHeight(h)
          })
        }}
        class="relative sticky top-0 z-20 flex items-center gap-5 px-5 py-3 text-white"
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
                type="button"
                onClick={() => setAppState({ isSearching: false })}
              >
                <span text="2xl" class="i-mdi-arrow-left"></span>
              </button>
              <input
                ref={(el) => {
                  requestAnimationFrame(() => {
                    el.focus()
                  })
                }}
                value={query()}
                onInput={(e) => setQuery(e.currentTarget.value.toLowerCase())}
                required
                text="xl"
                grow
                bg="black"
                outline-none
              />
              <div grid class="[&_*]:grid-area-[1/-1]">
                <TransitionFade blur duration={200}>
                  <Show when={query()}>
                    <button
                      type="button"
                      onClick={() => setQuery('')}
                      onFocus={(e) => e.relatedTarget?.focus()}
                    >
                      <span text="2xl" class="i-mdi-close-circle"></span>
                    </button>
                  </Show>
                </TransitionFade>
              </div>
            </form>
          }
        >
          <button
            type="button"
            onClick={() => (showBack() ? history.go(-1) : toggleDrawer())}
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
          {/* <TransitionFade blur duration={200}> */}
          <Show when={showBack()}>
            <button
              type="button"
              title="search"
              onClick={() => setAppState({ isSearching: true })}
            >
              <span text="2xl" class="i-mdi-magnify"></span>
            </button>
            <AutoScrollModal onClose={(success) => setScrolling(success)} />
            <button type="button" title="autoscroll" onClick={toggleScroll}>
              <span
                text="2xl"
                classList={{
                  'i-mdi-play': !scrolling(),
                  'i-mdi-pause': scrolling(),
                }}
              ></span>
            </button>
            <button
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
          </Show>
          {/* </TransitionFade> */}
        </Show>
      </nav>
    </div>
  )
}

export default Navbar
