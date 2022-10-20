import { createEffect, For, Component } from 'solid-js'
import { A, useLocation, useNavigate } from 'solid-start'
import { DragGesture } from '@use-gesture/vanilla'
import { useAppState } from '~/stores'
import { Animate } from 'ui/animation'

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
  const [appState, setAppState] = useAppState()
  const open = () => appState.drawerVisible
  const setOpen = (value: boolean) =>
    setAppState({
      drawerVisible: value,
    })
  const navigate = useNavigate()
  const location = useLocation()
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
        class="fixed left-0 h-40 w-15 top-20 touch-pan-right"
      ></div>
      <Animate
        when={open()}
        animation={() => ({
          from: { opacity: 0 },
          to: { opacity: 1 },
        })}
        class="bg-white/5 fixed inset-0 z-20"
        onMouseDown={() => setOpen(false)}
        onTouchStart={() => setOpen(false)}
      />
      <Animate
        when={open()}
        animation={() => ({
          from: { transform: `translateX(-100%)` },
          to: { transform: `translateX(0%)` },
        })}
        class="z-30 w-80 bg-black fixed left-0 gap-5 flex flex-col inset-y-0"
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
                class="flex gap-3 px-5 py-3 uppercase items-center tracking-wide text-sm font-bold bg-black hover:bg-gray-900 transition-colors"
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
      </Animate>
    </>
  )
}

export default Drawer
