import { TRPCClientError } from '@trpc/client'
import {
  createEffect,
  createSignal,
  onMount,
  Show,
  Suspense,
  untrack,
} from 'solid-js'
import { useNavigate } from 'solid-start'
import { AsyncList, List, Spinner } from 'ui'
import { TransitionFade } from 'ui/transitions'
import { trpc } from '~/client'
import SearchInput from '~/components/SearchInput'
import { useAppState, useSessionState, useUserState } from '~/stores'
import { parseSchema } from '~/utils'

const getSubredditsAndSearchTerms = (
  query: string
): [string, string | undefined] => {
  let [sr, q] = query.toLowerCase().split('?') as [string, string | undefined]
  sr = sr.split('+').sort().join('+')
  q = q !== undefined ? q.split('+').sort().join('+') : undefined
  return [sr, q]
}

const getURL = (subreddits: string, searchTerms: string) =>
  searchTerms
    ? `/r/${subreddits}?${searchTerms
        .split('+')
        .map((query) => `q=${query}`)
        .join('&')}`
    : `/r/${subreddits}`

export default function Home() {
  let inputElement!: HTMLInputElement
  const [userState, setUserState] = useUserState()
  const [sessionState, setSessionState] = useSessionState()
  const [, setAppState] = useAppState()

  onMount(() => setAppState('title', 'Collections'))

  const [focused, setFocused] = createSignal<boolean>(sessionState.focused)
  const [query, setQuery] = createSignal<string>(sessionState.collectionQuery)
  createEffect(() => {
    const q = query()
    untrack(() => {
      setSessionState('collectionQuery', q)
    })
  })
  createEffect(() => {
    const _focused = focused()
    untrack(() => {
      if (_focused) inputElement.focus()

      setSessionState('focused', _focused)
    })
  })

  const [flashing, setFlashing] = createSignal<boolean>(false)
  const flashSearchInput = () => setFlashing(true)

  const navigate = useNavigate()

  const removeCollection = (id: string) =>
    setUserState('redditCollections', (collections) => {
      collections.delete(id)
      return new Map([...collections])
    })

  const setCollection = (id: string, value: string) =>
    setUserState((state) => {
      state!.redditCollections.set(id, value)
      return { ...state! }
    })

  function onSubmit() {
    if (!query() || query().startsWith('?')) return

    const [subreddits, searchTerms] = getSubredditsAndSearchTerms(query())
    const id = subreddits + (searchTerms !== undefined ? '?' + searchTerms : '')
    if (!userState.redditCollections.has(id)) setCollection(id, id)

    navigate(getURL(subreddits, searchTerms || ''))
  }

  return (
    <main class="pb-5 h-full flex flex-col-reverse overflow-hidden gap-3 max-w-xl mx-auto">
      <SearchInput
        prefix="/r/"
        onSubmit={onSubmit}
        setValue={setQuery}
        value={query()}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        flashing={flashing()}
        setFlashing={setFlashing}
        placeholder="e.g. wallpapers+earthporn?nature+landscape"
      />

      <div
        ref={(el) => setAppState('scrollElement', el)}
        flex="~ col-reverse"
        gap-2
        grow
        shrink-1
      >
        <Show
          when={!query() || !(focused() && !query().includes('?'))}
          fallback={
            <Suspense
              fallback={
                <div class="grid place-items-center p-5">
                  <Spinner></Spinner>
                </div>
              }
            >
              <AsyncList
                onClick={(id) => {
                  id = id.toLowerCase()
                  let [sr, q] = query().toLowerCase().split('?')
                  if (sr.split('+').includes(id)) return
                  const x = sr.split('+')
                  x[x.length - 1] = id
                  setQuery(q ? x.join('+') + `?q=${q}` : x.join('+'))
                  flashSearchInput()
                }}
                focusable={false}
                reverse
                title="subreddits"
                fetcher={async (query, ac) => {
                  if (!query) return []
                  try {
                    const { schema, subreddits } =
                      await trpc.subredditAutocomplete.query(query, {
                        signal: ac.signal,
                      })
                    return parseSchema<{ id: string; name: string }>(
                      schema,
                      subreddits
                    ).map(({ name }) => ({ id: name, title: name }))
                  } catch (err) {
                    if (err instanceof TRPCClientError) {
                      err.cause?.name !== 'ObservableAbortError' &&
                        console.error(err)
                    }
                  }
                  return []
                }}
                key={() => ['sr-autocomplete', query().split('+').at(-1)!]}
              ></AsyncList>
            </Suspense>
          }
        >
          <List
            onClick={(id) => {
              setQuery(id)
              flashSearchInput()
            }}
            onRemove={(id) => removeCollection(id)}
            reverse
            title="collections"
            items={[...userState.redditCollections]
              .sort()
              .map(([key, value]) => ({
                id: key,
                title: value,
              }))}
          ></List>
        </Show>
      </div>
    </main>
  )
}
