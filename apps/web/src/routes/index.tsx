import { TRPCClientError } from '@trpc/client'
import { createEffect, createSignal, onMount, Show, Suspense } from 'solid-js'
import { untrack } from 'solid-js/web'
import { useNavigate } from 'solid-start'
import { AsyncList, List, Spinner, Tab, Tabs } from 'ui'
import { TransitionFade } from 'ui/transitions'
import { trpc } from '~/client'
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

  function onSubmit(e: SubmitEvent) {
    e.preventDefault()
    if (!query().trim()) return
    if (query().startsWith('?')) return

    if (searchTerm()) {
      navigate(`/r/${subreddit()}?q=${searchTerm()}`)
    } else {
      navigate(`/r/${query()}`)
    }
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
    <main pb-5 h-full flex flex-col-reverse overflow-hidden>
      <form
        class="grid grid-cols-[1fr_auto]"
        gap-3
        items-center
        px-5
        onSubmit={onSubmit}
      >
        <div
          class="transitions-colors duration-250 grid grid-cols-[auto_1fr_auto]"
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
            /r/
          </span>
          <input
            ref={inputElement}
            value={query()}
            onInput={(e) => {
              const inp = e.currentTarget
              const start = inp.selectionStart
              setQuery(inp.value.toLowerCase())
              inp.setSelectionRange(start, start)
            }}
            onFocus={() => setFocused(true)}
            onBlur={(e) => setFocused(false)}
            type="text"
            placeholder="e.g. wallpapers?red"
            class="placeholder:text-gray-500"
            id="search"
            name="subreddit"
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
        ref={(el) => setAppState('scrollElement', el)}
        class="flex flex-col-reverse gap-2 py-5 shrink-1 grow"
      >
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
                  onClick={(id) => {
                    setQuery(id)
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
                  items={[
                    ...setDifference(
                      userState.subreddits,
                      userState.favouriteSubreddits
                    ),
                  ]
                    .sort()
                    .map((sr) => ({
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
