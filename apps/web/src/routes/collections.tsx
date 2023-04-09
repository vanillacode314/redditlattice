import { type QueryFunction } from '@tanstack/solid-query'
import { TRPCClientError } from '@trpc/client'
import clsx from 'clsx'
import {
  createEffect,
  createSignal,
  For,
  onMount,
  Show,
  Suspense,
  untrack,
} from 'solid-js'
import { useNavigate } from 'solid-start'
import { AsyncList, List, ListItem, Spinner } from 'ui'
import SearchInput from '~/components/SearchInput'
import { useAppState, useSessionState, useUserState } from '~/stores'
import { parseSchema } from '~/utils'
import { trpc } from '~/utils/trpc'

const getSubredditsAndSearchTerms = (
  query: string
): [string, string | undefined] => {
  let [sr, q] = query.toLowerCase().split('?') as [string, string | undefined]
  sr = sr.split('+').filter(Boolean).sort().join('+')
  q =
    q !== undefined ? q.split('+').filter(Boolean).sort().join('+') : undefined
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
    const $focused = focused()
    untrack(() => {
      if ($focused) inputElement.focus()

      setSessionState('focused', $focused)
    })
  })

  const [flashing, setFlashing] = createSignal<boolean>(false)
  const flashSearchInput = () => setFlashing(true)

  const autoCompleteFetcher: QueryFunction<
    { id: string; name: string }[],
    [string, string]
  > = async ({ queryKey: [_, query] }) => {
    if (!query) return [] as { id: string; name: string }[]
    try {
      const { subreddits, schema } = await trpc.subredditAutocomplete.query(
        query
      )
      return parseSchema<{ id: string; name: string }>(schema, subreddits)
    } catch (err) {
      if (err instanceof TRPCClientError) {
        err.cause?.name !== 'ObservableAbortError' && console.error(err)
      } else {
        throw err
      }
    }
    return [] as { id: string; name: string }[]
  }
  const navigate = useNavigate()

  const removeCollection = (id: string) =>
    setUserState('redditCollections', ($redditCollections) => {
      $redditCollections.delete(id)
      return new Map($redditCollections)
    })

  const setCollection = (id: string, value: string) =>
    setUserState('redditCollections', ($redditCollections) => {
      $redditCollections.set(id, value)
      return new Map($redditCollections)
    })

  function onSubmit() {
    if (!query() || query().startsWith('?')) return

    const [subreddits, searchTerms] = getSubredditsAndSearchTerms(query())
    const id = subreddits + (searchTerms !== undefined ? '?' + searchTerms : '')
    if (!userState.redditCollections.has(id)) setCollection(id, id)

    navigate(getURL(subreddits, searchTerms || ''))
    setQuery('')
  }

  return (
    <main class="pb-5 h-full flex flex-col-reverse overflow-hidden gap-3 max-w-xl w-full mx-auto">
      <SearchInput
        ref={inputElement}
        prefix="/r/"
        onSubmit={onSubmit}
        setValue={setQuery}
        value={query()}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        flashing={flashing()}
        setFlashing={setFlashing}
        placeholder="e.g. wallpapers+earthporn?nature+landscape"
        buttons={[
          <button
            type="button"
            onClick={() => {
              const name = prompt('Enter a nickname for the collection')
              if (!name) return
              const [sr, q] = query().toLowerCase().split('?')
              let id = sr.split('+').sort().join('+')
              if (q) id += `?${q.split('+').sort().join('+')}`
              setCollection(id, name)
            }}
            onFocus={(e) => (e.relatedTarget as HTMLInputElement)?.focus()}
          >
            <span class="i-mdi-edit text-xl"></span>
          </button>,
        ]}
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
                reverse
                title="subreddits"
                fetcher={autoCompleteFetcher}
                key={['sr-autocomplete', query().split('+').at(-1)!]}
              >
                {({ id, name }, stale) => (
                  <ListItem
                    class={clsx(stale() && 'opacity-50')}
                    key={id}
                    focusable={false}
                    onClick={() => {
                      const autocompleteResult = name.toLowerCase()
                      let [subreddit, searchTerm] = query()
                        .toLowerCase()
                        .split('?')
                      if (subreddit.split('+').includes(autocompleteResult))
                        return
                      const newQuery = subreddit.split('+')
                      newQuery[newQuery.length - 1] = autocompleteResult
                      setQuery(newQuery.join('+'))
                      flashSearchInput()
                    }}
                  >
                    {name}
                  </ListItem>
                )}
              </AsyncList>
            </Suspense>
          }
        >
          <List reverse title="collections">
            <For each={[...userState.redditCollections].sort()}>
              {([collection, nickname]) => (
                <ListItem
                  key={collection}
                  onClick={() => {
                    setQuery(collection)
                    flashSearchInput()
                  }}
                  onRemove={() => removeCollection(collection)}
                >
                  {nickname}
                </ListItem>
              )}
            </For>
          </List>
        </Show>
      </div>
    </main>
  )
}
