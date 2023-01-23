import { onMount, createSignal, Show } from 'solid-js'
import { useNavigate } from 'solid-start'
import { List } from 'ui'
import { TransitionFade } from 'ui/transitions'
import { useAppState, useUserState } from '~/stores'

export default function Home() {
  const [userState, _setUserState] = useUserState()
  const [, setAppState] = useAppState()
  const navigate = useNavigate()

  onMount(() => setAppState('title', 'Pinterest'))

  const [query, setQuery] = createSignal<string>('')

  const [flashing, setFlashing] = createSignal<boolean>(false)
  const flashSearchInput = () => setFlashing(true)

  function onSubmit(e: SubmitEvent) {
    e.preventDefault()
    if (!query().trim()) return
    if (query().startsWith('?')) return

    navigate(`/p/${query()}`)
  }

  return (
    <main pb-5 h-full flex flex-col-reverse overflow-hidden>
      <form
        class="grid grid-cols-[1fr_auto]"
        gap-3
        items-center
        px-5
        onSubmit={onSubmit}
      >
        <div
          class="grid grid-cols-[auto_1fr_auto] transitions-colors duration-250"
          border="2 hover:pink-700 focus:pink-700"
          classList={{
            'border-pink-500': flashing(),
            'border-pink-900': !flashing(),
          }}
          onTransitionEnd={() => {
            if (flashing()) setFlashing(false)
          }}
          gap-3
          bg-black
          outline-none
          rounded-full
          py-2
          px-5
          items-center
        >
          <span font="bold" text="gray-500">
            /p/
          </span>
          <input
            value={query()}
            onInput={(e) => {
              const inp = e.currentTarget
              const start = inp.selectionStart
              setQuery(inp.value.toLowerCase())
              inp.setSelectionRange(start, start)
            }}
            type="text"
            placeholder="e.g. wallpapers"
            class="placeholder:text-gray-500"
            id="search"
            name="query"
            min-w-0
            bg-transparent
            outline-none
          />
          <TransitionFade blur duration={100}>
            <Show when={query()}>
              <button
                type="button"
                class="grid place-items-center"
                onClick={() => setQuery('')}
                onFocus={(e) => e.relatedTarget?.focus?.()}
              >
                <span class="i-mdi-close-circle text-xl"></span>
              </button>
            </Show>
          </TransitionFade>
        </div>
        <button
          text="white xl"
          rounded-full
          w-13
          h-13
          outline-none
          grid
          place-items-center
          bg="pink-800 hover:pink-700 focus:pink-700"
          ring="focus:~ focus:blue"
          transition-colors
          shrink-0
          style={{ '-webkit-tap-highlight-color': 'transparent' }}
        >
          <div class="i-mdi-magnify"></div>
        </button>
      </form>
      <div
        id="scroller"
        flex="~ col-reverse"
        gap-2
        py-5
        grow
        shrink-1
        p="t-[70%]"
      >
        {/* RECENTS LIST */}
        <List
          onClick={(id) => {
            setQuery(id)
            flashSearchInput()
          }}
          reverse
          title="history"
          items={[...userState.pinterestQueries].sort().map((q) => ({
            id: q,
            title: q,
          }))}
        ></List>
      </div>
    </main>
  )
}
