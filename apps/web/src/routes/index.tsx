import { TRPCClientError } from '@trpc/client'
import { createEffect, createSignal, onMount, Show, Suspense } from 'solid-js'
import { untrack } from 'solid-js/web'
import { useNavigate } from 'solid-start'
import { AsyncList, List, Spinner, Tab, Tabs } from 'ui'
import { trpc } from '~/client'
import SearchInput from '~/components/SearchInput'
import { useAppState, useSessionState, useUserState } from '~/stores'
import { parseSchema, setDifference } from '~/utils'

export default function Home() {
  let inputElement!: HTMLInputElement
  const [userState, setUserState] = useUserState()
  const [sessionState, setSessionState] = useSessionState()
  const [, setAppState] = useAppState()
  onMount(() => setAppState('title', 'Home'))

  const navigate = useNavigate()

  const [focused, setFocused] = createSignal<boolean>(sessionState.focused)
  const [flashing, setFlashing] = createSignal<boolean>(false)
  const flashSearchInput = () => setFlashing(true)

  let listRefs: HTMLElement[] = []

  const [query, setQuery] = createSignal<string>(sessionState.redditQuery)
  createEffect(() => {
    const q = query()
    untrack(() => {
      setSessionState('redditQuery', q)
    })
  })
  createEffect(() => {
    const _focused = focused()
    untrack(() => {
      if (_focused) inputElement.focus()
      setSessionState('focused', _focused)
    })
  })

  const subreddit = () => query().split('?')[0]
  const setSubreddit = (subreddit: string) => {
    if (query().includes('?')) {
      setQuery(`${subreddit}?${searchTerm()}`)
      return
    }

    setQuery(subreddit + '?')
  }

  const searchTerm = () => query().split('?')[1] ?? ''
  const setSearchTerm = (searchTerm: string) =>
    setQuery(`${subreddit()}?${searchTerm}`)

  function onSubmit() {
    if (!query().trim()) {
      flashSearchInput()
      return
    }
    if (query().startsWith('?')) return

    if (searchTerm()) {
      navigate(`/r/${subreddit()}?q=${searchTerm()}`)
    } else {
      navigate(`/r/${query()}`)
    }
    setQuery('')
  }

  function removeSubreddit(name: string) {
    setUserState('subreddits', (subreddits) => {
      subreddits.delete(name)
      return new Set([...subreddits])
    })
  }

  function removeSearchTerm(term: string) {
    setUserState('redditQueries', (searchTerms) => {
      searchTerms.delete(term)
      return new Map([...searchTerms])
    })
  }

  function toggleFavouriteSubreddit(subreddit: string) {
    setUserState('favouriteSubreddits', (favouriteSubreddits) => {
      favouriteSubreddits.has(subreddit)
        ? favouriteSubreddits.delete(subreddit)
        : favouriteSubreddits.add(subreddit)
      return new Set([...favouriteSubreddits])
    })
  }

  return (
    <main class="pb-5 h-full flex flex-col-reverse overflow-hidden gap-3 max-w-xl mx-auto w-full">
      <SearchInput
        value={query()}
        setValue={setQuery}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        onSubmit={onSubmit}
        prefix="/r/"
        placeholder="e.g wallpapers?red"
        flashing={flashing()}
        setFlashing={setFlashing}
      />
      <div class="flex flex-col-reverse gap-2 shrink-1 grow overflow-hidden">
        {/* AUTOCOMPLETE LIST */}
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
                ref={(el) => setAppState('scrollElement', el)}
                onClick={(id) => {
                  setQuery(id.toLowerCase())
                  flashSearchInput()
                }}
                fallback={
                  <div class="grid place-content-center p-5">
                    <h3 class="uppercase font-bold text-xl tracking-wide">
                      No Results
                    </h3>
                  </div>
                }
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
                key={() => ['sr-autocomplete', query()]}
              ></AsyncList>
            </Suspense>
          }
        >
          <Tabs
            activeTab={sessionState.currentTab}
            onChange={(index) => {
              setSessionState('currentTab', index)
              setAppState('scrollElement', listRefs[index])
            }}
          >
            <Tab title="favourites">
              <Show
                when={userState.favouriteSubreddits.size > 0}
                fallback={
                  <div class="grid place-content-center p-5">
                    <h3 class="uppercase font-bold text-xl tracking-wide">
                      No Favourites
                    </h3>
                  </div>
                }
              >
                <List
                  ref={listRefs[0]}
                  onClick={(id) => {
                    setSubreddit(id)
                    flashSearchInput()
                  }}
                  reverse
                  buttons={[
                    (id) => (
                      <button
                        class="group outline-none"
                        onClick={(e) => {
                          e.stopPropagation()
                          toggleFavouriteSubreddit(id)
                        }}
                      >
                        <div
                          class="i-mdi-star text-xl transition-colors"
                          classList={{
                            'text-amber-500 group-hover:text-amber-400 group-focus:text-amber-400':
                              userState.favouriteSubreddits.has(id),
                            'text-gray-700 group-hover:text-white group-focus:text-white':
                              !userState.favouriteSubreddits.has(id),
                          }}
                        />
                      </button>
                    ),
                  ]}
                  items={[...userState.favouriteSubreddits]
                    .sort()
                    .map((sr) => ({
                      id: sr,
                      title: sr,
                    }))}
                ></List>
              </Show>
            </Tab>
            <Tab title="Recents">
              <Show
                when={userState.redditRecents.size > 0}
                fallback={
                  <div class="grid place-content-center p-5">
                    <h3 class="uppercase font-bold text-xl tracking-wide">
                      No Recents
                    </h3>
                  </div>
                }
              >
                <List
                  ref={listRefs[1]}
                  onClick={(id) => {
                    const [subreddit, searchTerm] = id.split('?')
                    setSubreddit(subreddit)
                    setSearchTerm(searchTerm || '')
                    flashSearchInput()
                  }}
                  reverse
                  items={[...userState.redditRecents]
                    .sort(([_q1, t1], [_q2, t2]) => t2 - t1)
                    .map(([q, _]) => ({
                      id: q,
                      title: q,
                    }))}
                ></List>
              </Show>
            </Tab>
            <Tab title="subreddits">
              <Show
                when={userState.subreddits.size > 0}
                fallback={
                  <div class="grid place-content-center p-5">
                    <h3 class="uppercase font-bold text-xl tracking-wide">
                      No Subreddits
                    </h3>
                  </div>
                }
              >
                <List
                  ref={listRefs[2]}
                  onClick={(id) => {
                    setSubreddit(id)
                    flashSearchInput()
                  }}
                  onRemove={(id) => removeSubreddit(id)}
                  reverse
                  buttons={[
                    (id) => (
                      <button
                        class="group outline-none"
                        onClick={(e) => {
                          e.stopPropagation()
                          toggleFavouriteSubreddit(id)
                        }}
                      >
                        <div
                          class="i-mdi-star text-xl transition-colors"
                          classList={{
                            'text-amber-500 group-hover:text-amber-400 group-focus:text-amber-400':
                              userState.favouriteSubreddits.has(id),
                            'text-gray-700 group-hover:text-white group-focus:text-white':
                              !userState.favouriteSubreddits.has(id),
                          }}
                        />
                      </button>
                    ),
                  ]}
                  items={[...userState.subreddits].sort().map((sr) => ({
                    id: sr,
                    title: sr,
                  }))}
                ></List>
              </Show>
            </Tab>
            <Tab title="searches">
              <Show
                when={userState.redditQueries.size > 0}
                fallback={
                  <div class="grid place-content-center p-5">
                    <h3 class="uppercase font-bold text-xl tracking-wide">
                      No Searches
                    </h3>
                  </div>
                }
              >
                <List
                  ref={listRefs[3]}
                  onClick={(id) => {
                    const sr = subreddit() || userState.redditQueries.get(id)
                    if (!sr) return
                    setSubreddit(sr)
                    setSearchTerm(id)
                    flashSearchInput()
                  }}
                  onRemove={(id) => removeSearchTerm(id)}
                  reverse
                  items={[...userState.redditQueries.keys()]
                    .sort()
                    .map((q) => ({
                      id: q,
                      title: q,
                    }))}
                ></List>
              </Show>
            </Tab>
          </Tabs>
        </Show>
      </div>
    </main>
  )
}
