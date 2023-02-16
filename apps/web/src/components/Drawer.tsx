import { Motion, Presence } from '@motionone/solid'
import { DragGesture } from '@use-gesture/vanilla'
import { spring } from 'motion'
import {
  batch,
  Component,
  createEffect,
  createSignal,
  For,
  Show,
} from 'solid-js'
import { A, useLocation, useNavigate } from 'solid-start'
import { useAppState } from '~/stores'

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

  const [down, setDown] = createSignal<boolean>(false)
  const [offset, setOffset] = createSignal<number>(0)
  const setOpen = (value: boolean) => {
    batch(() => {
      setAppState({
        drawerVisible: value,
      })
      setOffset(value ? drawerElement.clientWidth : 0)
    })
  }

  createEffect(() => setOpen(appState.drawerVisible))
  createEffect(() =>
    appState.drawerVisible
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
          new DragGesture(
            el,
            ({ swipe: [swipeX], movement: [movementX], down }) => {
              batch(() => {
                setDown(down)
                console.log(movementX)
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
        }}
        class="w-15 fixed left-0 top-20 z-20 h-40 touch-pan-right"
      ></div>
      <Presence>
        <Show when={offset() > 200}>
          <Motion.div
            animate={{ opacity: [0, 1] }}
            exit={{ opacity: [1, 0] }}
            class="fixed inset-0 z-20 bg-white/5"
            onMouseDown={() => setOpen(false)}
            onTouchStart={() => setOpen(false)}
          />
        </Show>
      </Presence>
      <Motion.div
        ref={drawerElement}
        animate={{
          x: offset() - (drawerElement?.clientWidth ?? 0),
        }}
        transition={down() ? { duration: 0 } : { easing: 'ease-out' }}
        onMotionComplete={() => offset() === 0 && setOpen(false)}
        class="fixed inset-y-0 left-0 z-30 flex w-80 flex-col gap-5 bg-black"
      >
        <a
          target="_blank"
          class="flex flex-col gap-1 pt-5 px-5"
          href="https://raqueebuddinaziz.com"
        >
          <span text="lg">RedditLattice </span>
          <span text="xs gray-500" font="bold" uppercase tracking-wide>
            Made by Raqueebuddin Aziz
          </span>
        </a>
        <div border="b gray-700" w-full></div>
        <ul flex="~ col">
          <For each={links}>
            {({ icon, href, title }) => (
              <A
                style={{ '-webkit-tap-highlight-color': 'transparent' }}
                class="flex items-center gap-3 bg-black px-5 py-3 text-sm font-bold uppercase tracking-wide transition-colors hover:bg-gray-900"
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
