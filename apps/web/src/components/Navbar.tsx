import { useAppState } from '~/stores'
import { useSearchParams, useLocation, useNavigate } from 'solid-start'
import {
  onMount,
  createEffect,
  createSignal,
  onCleanup,
  on,
  Show,
  Component,
} from 'solid-js'
import { createSpring, animated } from 'solid-spring'
import { TransitionFade } from 'ui/transitions'
import { throttle } from 'lodash-es'

export const Navbar: Component = () => {
  const [mounted, setMounted] = createSignal<boolean>(false)
  const [height, setHeight] = createSignal<number>(0)
  const [appState, setAppState] = useAppState()
  const [query, setQuery] = createSignal<string>('')

  const navigate = useNavigate()
  const location = useLocation()
  const [, setSearchParams] = useSearchParams()

  const showBack = () => location.pathname.startsWith('/r/')

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
    if (Math.abs(dy) > threshold) {
      if (dy > 0) {
        setNavVisible(false)
      } else {
        setNavVisible(true)
      }
    }
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

  onMount(() => {
    setMounted(true)
  })

  return (
    <div class="overflow-hidden shrink-0 z-20 relative bg-black">
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
        class="text-white flex gap-5 px-5 py-3 sticky top-0 items-center z-20 relative"
      >
        <Show
          when={!appState.isSearching}
          fallback={
            <form
              class="contents"
              onSubmit={(e) => {
                e.preventDefault()
                setSearchParams({ q: query() })
                setQuery('')
                setAppState({ isSearching: false })
              }}
            >
              <button
                type="button"
                text="2xl"
                class="i-mdi-arrow-left"
                onClick={() => setAppState({ isSearching: false })}
              ></button>
              <input
                ref={(el) => {
                  requestAnimationFrame(() => {
                    el.focus()
                  })
                }}
                value={query()}
                onInput={(e) => setQuery(e.currentTarget.value)}
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
                      text="2xl"
                      class="i-mdi-close-circle"
                      onClick={() => setQuery('')}
                      onFocus={(e) => e.relatedTarget?.focus()}
                    ></button>
                  </Show>
                </TransitionFade>
              </div>
            </form>
          }
        >
          <button
            type="button"
            text="2xl"
            classList={{
              'i-mdi-menu': !showBack(),
              'i-mdi-arrow-left': showBack(),
            }}
            onClick={() => (showBack() ? history.go(-1) : toggleDrawer())}
          ></button>
          <span text="xl" truncate>
            {appState.title || 'RedditLattice'}
          </span>
          <span class="grow" />
          {/* <TransitionFade blur duration={200}> */}
          <Show when={showBack()}>
            <button
              type="button"
              text="2xl"
              class="i-mdi-magnify"
              onClick={() => setAppState({ isSearching: true })}
            ></button>
          </Show>
          {/* </TransitionFade> */}
        </Show>
      </nav>
    </div>
  )
}

export default Navbar
