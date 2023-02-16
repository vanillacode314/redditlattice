import { Motion, Presence } from '@motionone/solid'
import { DragGesture } from '@use-gesture/vanilla'
import {
  batch,
  Component,
  createEffect,
  createRenderEffect,
  createSignal,
  For,
  onCleanup,
  onMount,
  Show,
} from 'solid-js'
import { A, useLocation, useNavigate } from 'solid-start'
import { useAppState, useSessionState } from '~/stores'
import { clamp } from '~/utils'

interface ILink {
  title: string
  icon?: string
  href: string
}

const links: ILink[] = [
  {
    title: 'Home',
    icon: 'i-mdi-home',
    href: '/',
  },
  {
    title: 'Collections',
    icon: 'i-mdi-view-grid',
    href: '/collections',
  },
  {
    title: 'Pinterest',
    icon: 'i-mdi-pinterest',
    href: '/pinterest',
  },
  {
    title: 'Settings',
    icon: 'i-mdi-cog',
    href: '/settings',
  },
  {
    title: 'About',
    icon: 'i-mdi-about',
    href: '/about',
  },
]

export const Drawer: Component = () => {
  let drawerElement!: HTMLDivElement
  const navigate = useNavigate()
  const location = useLocation()

  const [appState, setAppState] = useAppState()
  const [sessionState, setSessionState] = useSessionState()

  const [down, setDown] = createSignal<boolean>(false)
  const [offset, setOffset] = createSignal<number>(0)
  const [openOnMount, setOpenOnMount] = createSignal<boolean>(false)

  const setOpen = (value: boolean) => {
    batch(() => {
      setSessionState({
        drawerVisible: value,
      })
      setOffset(0)
    })
  }

  createRenderEffect(() => setOpen(sessionState.drawerVisible))
  createEffect(() =>
    sessionState.drawerVisible
      ? navigate(location.pathname + location.search + '#drawer', {
          resolve: false,
        })
      : location.hash === '#drawer' &&
        navigate(location.pathname + location.search, { resolve: false })
  )

  return (
    <>
      <div
        ref={(el) => {
          setOpenOnMount(sessionState.drawerVisible)
          const gesture = new DragGesture(
            el,
            ({ swipe: [swipeX], movement: [movementX], down }) => {
              batch(() => {
                setDown(down)
                setOffset(movementX)
                if (down) return
                setOpen(movementX > 200 || swipeX === 1)
              })
            },
            {
              axis: 'x',
              bounds: () => ({
                left: 0,
                right: drawerElement?.clientWidth ?? 0,
              }),
              from: () => [-offset(), 0],
              preventScroll: true,
            }
          )
          onCleanup(() => gesture.destroy())
        }}
        class="w-15 fixed left-0 top-20 z-20 h-40 touch-pan-right"
      ></div>
      <Presence>
        <Show when={offset() > 0 || sessionState.drawerVisible}>
          <Motion.div
            animate={{
              opacity: sessionState.drawerVisible
                ? 1
                : clamp(offset(), 0, 200) / 200,
              backdropFilter: `blur(${
                sessionState.drawerVisible ? 4 : clamp(offset(), 0, 4) / 4
              }px)`,
            }}
            exit={{
              opacity: 0,
              backdropFilter: 'blur(0px)',
            }}
            class="fixed inset-0 z-20 bg-white/8"
            onMouseDown={() => setOpen(false)}
            onTouchStart={() => setOpen(false)}
          />
        </Show>
      </Presence>
      <Motion.div
        ref={drawerElement}
        initial={{
          transform: openOnMount() ? 'translateX(0)' : 'translateX(-100%)',
        }}
        animate={{
          transform: sessionState.drawerVisible
            ? `translateX(0)`
            : `translateX(calc(${offset()}px - 100%))`,
        }}
        transition={down() ? { duration: 0 } : { easing: 'ease-out' }}
        class="fixed inset-y-0 left-0 z-30 flex w-80 flex-col gap-5 bg-black"
      >
        <a
          target="_blank"
          class="flex flex-col gap-1 pt-5 px-5"
          href="https://raqueebuddinaziz.com"
        >
          <span class="text-lg uppercase font-black tracking-wider">
            RedditLattice{' '}
          </span>
          <span class="text-xs text-gray-500 font-bold uppercase tracking-wide">
            Made by Raqueebuddin Aziz
          </span>
        </a>
        <div class="border-b border-neutral-800 w-full"></div>
        <ul flex="~ col">
          <For each={links}>
            {({ icon, href, title }) => (
              <A
                class="flex items-center gap-3 bg-black px-5 py-3 text-sm font-bold uppercase tracking-wider transition-colors hover:bg-neutral-900 tap-highlight-none text-gray-100"
                activeClass="bg-neutral-800"
                end={true}
                href={href}
                onClick={() => setOpen(false)}
              >
                {icon && <div text="xl" class={icon} />}
                <span>{title}</span>
              </A>
            )}
          </For>
        </ul>
        <span class="grow" />
        <span
          text="xs gray-500"
          font="bold"
          uppercase
          tracking-wide
          p-5
          self-end
        >
          {__version__}
        </span>
      </Motion.div>
    </>
  )
}

export default Drawer
