import { Motion, Presence } from '@motionone/solid'
import {spring} from 'motion'
import { DragGesture } from '@use-gesture/vanilla'
import { Component, createEffect, For, Show } from 'solid-js'
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
  const navigate = useNavigate()
  const location = useLocation()

  const [appState, setAppState] = useAppState()

  const open = () => appState.drawerVisible
  const setOpen = (value: boolean) =>
    setAppState({
      drawerVisible: value,
    })

  createEffect(() =>
    open()
      ? navigate(location.pathname + '#drawer', { resolve: false })
      : location.hash === '#drawer' &&
        navigate(location.pathname, { resolve: false })
  )

  return (
    <>
      <div
        ref={(el) => {
          new DragGesture(
            el,
            ({ swipe: [swipeX] }) => swipeX === 1 && setOpen(true)
          )
        }}
        class="w-15 fixed left-0 top-20 z-20 h-40 touch-pan-right"
      ></div>
      <Presence>
        <Show when={open()}>
          <Motion.div
            animate={{ opacity: [0, 1] }}
            exit={{ opacity: [1, 0] }}
            class="fixed inset-0 z-20 bg-white/5"
            onMouseDown={() => setOpen(false)}
            onTouchStart={() => setOpen(false)}
          />
        </Show>
      </Presence>
      <Presence>
        <Show when={open()}>
          <Motion.div
            animate={{
              transform: [`translateX(-100%)`, `translateX(0%)`],
            }}
            exit={{
              transform: [`translateX(0%)`, `translateX(-100%)`],
            }}
            transition={{easing:spring()}}
            class="fixed inset-y-0 left-0 z-30 flex w-80 flex-col gap-5 bg-black"
          >
            <a href="https://raqueebuddinaziz.com" flex="~ col" gap-1 pt-5 px-5>
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
        </Show>
      </Presence>
    </>
  )
}

export default Drawer
