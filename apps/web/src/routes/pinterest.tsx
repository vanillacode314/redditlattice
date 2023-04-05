import {
  createEffect,
  createSignal,
  For,
  onMount,
  Show,
  untrack,
} from 'solid-js'
import { useNavigate } from 'solid-start'
import { List, ListItem } from 'ui'
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
    const $query = query()
    untrack(() => {
      setSessionState('pinterestQuery', $query)
    })
  })

  const [flashing, setFlashing] = createSignal<boolean>(false)
  const flashSearchInput = () => setFlashing(true)

  function onSubmit() {
    if (!query().trim()) return
    if (query().startsWith('?')) return

    navigate(`/p/${query()}`)
    setQuery('')
  }

  function removePinterestHistory(id: string) {
    setUserState('pinterestQueries', (pinterestQueries) => {
      pinterestQueries.delete(id)
      return new Set(pinterestQueries)
    })
  }

  return (
    <main class="pb-5 h-full flex flex-col-reverse overflow-hidden gap-3 max-w-xl mx-auto w-full">
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
        <List reverse title="history">
          <For each={[...userState.pinterestQueries].sort()}>
            {(searchTerm) => (
              <ListItem
                key={searchTerm}
                focusable={false}
                onClick={() => {
                  setQuery(searchTerm)
                  flashSearchInput()
                }}
                onRemove={() => {
                  removePinterestHistory(searchTerm)
                }}
              >
                {searchTerm}
              </ListItem>
            )}
          </For>
        </List>
      </div>
    </main>
  )
}
