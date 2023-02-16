import { createEffect, createSignal, onMount, Show } from 'solid-js'
import { untrack } from 'solid-js/web'
import { useNavigate } from 'solid-start'
import { List } from 'ui'
import { TransitionFade } from 'ui/transitions'
import SearchInput from '~/components/SearchInput'
import { useAppState, useSessionState, useUserState } from '~/stores'

export default function Home() {
  const [userState, setUserState] = useUserState()
  const [sessionState, setSessionState] = useSessionState()
  const [, setAppState] = useAppState()
  const navigate = useNavigate()

  onMount(() => setAppState('title', 'Pinterest'))

  const [query, setQuery] = createSignal<string>(sessionState.pinterestQuery)
  createEffect(() => {
    const q = query()
    untrack(() => {
      setSessionState('pinterestQuery', q)
    })
  })

  const [flashing, setFlashing] = createSignal<boolean>(false)
  const flashSearchInput = () => setFlashing(true)

  function onSubmit() {
    if (!query().trim()) return
    if (query().startsWith('?')) return

    navigate(`/p/${query()}`)
  }

  function removePinterestHistory(id: string) {
    setUserState('pinterestQueries', (pinterestQueries) => {
      pinterestQueries.delete(id)
      return new Set(pinterestQueries)
    })
  }

  return (
    <main class="pb-5 h-full flex flex-col-reverse overflow-hidden gap-3 max-w-xl mx-auto">
      <SearchInput
        prefix="/p/"
        onSubmit={onSubmit}
        value={query()}
        setValue={setQuery}
        flashing={flashing()}
        setFlashing={setFlashing}
        placeholder="e.g. wallpapers"
      />
      <div
        ref={(el) => setAppState('scrollElement', el)}
        class="flex flex-col-reverse gap-2 grow shrink-1"
      >
        {/* RECENTS LIST */}
        <List
          onClick={(id) => {
            setQuery(id)
            flashSearchInput()
          }}
          onRemove={(id) => {
            removePinterestHistory(id)
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
