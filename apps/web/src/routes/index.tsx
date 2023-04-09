import {
  createInfiniteQuery,
  createQuery,
  QueryFunction,
} from '@tanstack/solid-query'
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
import { useNavigate, useRoutes } from 'solid-start'
import { AsyncList, List, ListItem, Spinner, Tab, Tabs } from 'ui'
import SearchInput from '~/components/SearchInput'
import { useAppState, useSessionState, useUserState } from '~/stores'
import { parseSchema } from '~/utils'
import { client, trpc } from '~/utils/trpc'

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

  let listRefs: HTMLUListElement[] = []

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
      return new Set(subreddits)
    })
  }

  function removeSearchTerm(term: string) {
    setUserState('redditQueries', (searchTerms) => {
      searchTerms.delete(term)
      return new Map(searchTerms)
    })
  }

  function toggleFavouriteSubreddit(subreddit: string) {
    setUserState('favouriteSubreddits', (favouriteSubreddits) => {
      favouriteSubreddits.has(subreddit)
        ? favouriteSubreddits.delete(subreddit)
        : favouriteSubreddits.add(subreddit)
      return new Set(favouriteSubreddits)
    })
  }

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

  return (
    <main class="pb-5 h-full flex flex-col-reverse overflow-hidden gap-3 max-w-xl mx-auto w-full">
      <SearchInput
        ref={inputElement}
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
                fallback={
                  <div class="grid place-content-center p-5">
                    <h3 class="uppercase font-bold text-xl tracking-wide">
                      No Results
                    </h3>
                  </div>
                }
                reverse
                title="subreddits"
                fetcher={autoCompleteFetcher}
                key={['sr-autocomplete', query()]}
              >
                {({ id, name }, stale) => (
                  <ListItem
                    class={clsx(stale() && 'opacity-50')}
                    key={id}
                    focusable={false}
                    onClick={() => {
                      setQuery(name.toLowerCase())
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
          <Tabs
            activeTab={sessionState.currentTab}
            onChange={(index) => {
              setSessionState('currentTab', index)
              setAppState('scrollElement', listRefs[index])
            }}
          >
            <Tab title="favourites">
              <List
                ref={listRefs[0]}
                reverse
                fallback={
                  <div class="grid place-content-center p-5">
                    <h3 class="uppercase font-bold text-xl tracking-wide">
                      No Favourites
                    </h3>
                  </div>
                }
              >
                <For each={[...userState.favouriteSubreddits].sort()}>
                  {(subreddit) => (
                    <ListItem
                      focusable={false}
                      key={subreddit}
                      onClick={() => {
                        setSubreddit(subreddit)
                        flashSearchInput()
                      }}
                      buttons={[
                        <button
                          class="group outline-none"
                          onClick={(e) => {
                            e.stopPropagation()
                            toggleFavouriteSubreddit(subreddit)
                          }}
                        >
                          <div
                            class="i-mdi-star text-xl transition-colors"
                            classList={{
                              'text-amber-500 group-hover:text-amber-400 group-focus:text-amber-400':
                                userState.favouriteSubreddits.has(subreddit),
                              'text-gray-700 group-hover:text-white group-focus:text-white':
                                !userState.favouriteSubreddits.has(subreddit),
                            }}
                          />
                        </button>,
                      ]}
                    >
                      {subreddit}
                    </ListItem>
                  )}
                </For>
              </List>
            </Tab>
            <Tab title="Recents">
              <List
                ref={listRefs[1]}
                reverse
                fallback={
                  <div class="grid place-content-center p-5">
                    <h3 class="uppercase font-bold text-xl tracking-wide">
                      No Recents
                    </h3>
                  </div>
                }
              >
                <For
                  each={[...userState.redditRecents].sort(
                    ([_q1, t1], [_q2, t2]) => t2 - t1
                  )}
                >
                  {([query]) => (
                    <ListItem
                      focusable={false}
                      key={query}
                      onClick={() => {
                        const [subreddit, searchTerm] = query.split('?')
                        setSubreddit(subreddit)
                        setSearchTerm(searchTerm || '')
                        flashSearchInput()
                      }}
                    >
                      {query}
                    </ListItem>
                  )}
                </For>
              </List>
            </Tab>
            <Tab title="subreddits">
              <List
                ref={listRefs[2]}
                reverse
                fallback={
                  <div class="grid place-content-center p-5">
                    <h3 class="uppercase font-bold text-xl tracking-wide">
                      No Subreddits
                    </h3>
                  </div>
                }
              >
                <For each={[...userState.subreddits].sort()}>
                  {(subreddit) => (
                    <ListItem
                      focusable={false}
                      key={subreddit}
                      onClick={() => {
                        setSubreddit(subreddit)
                        flashSearchInput()
                      }}
                      onRemove={() => removeSubreddit(subreddit)}
                      buttons={[
                        <button
                          class="group outline-none"
                          onClick={(e) => {
                            e.stopPropagation()
                            toggleFavouriteSubreddit(subreddit)
                          }}
                        >
                          <div
                            class="i-mdi-star text-xl transition-colors"
                            classList={{
                              'text-amber-500 group-hover:text-amber-400 group-focus:text-amber-400':
                                userState.favouriteSubreddits.has(subreddit),
                              'text-gray-700 group-hover:text-white group-focus:text-white':
                                !userState.favouriteSubreddits.has(subreddit),
                            }}
                          />
                        </button>,
                      ]}
                    >
                      {subreddit}
                    </ListItem>
                  )}
                </For>
              </List>
            </Tab>
            <Tab title="searches">
              <List
                ref={listRefs[3]}
                reverse
                fallback={
                  <div class="grid place-content-center p-5">
                    <h3 class="uppercase font-bold text-xl tracking-wide">
                      No Searches
                    </h3>
                  </div>
                }
              >
                <For each={[...userState.redditQueries.keys()].sort()}>
                  {(searchTerm) => (
                    <ListItem
                      focusable={false}
                      key={searchTerm}
                      onClick={() => {
                        const sr =
                          subreddit() || userState.redditQueries.get(searchTerm)
                        if (!sr) return
                        setSubreddit(sr)
                        setSearchTerm(searchTerm)
                        flashSearchInput()
                      }}
                      onRemove={() => removeSearchTerm(searchTerm)}
                    >
                      {searchTerm}
                    </ListItem>
                  )}
                </For>
              </List>
            </Tab>
          </Tabs>
        </Show>
      </div>
    </main>
  )
}
