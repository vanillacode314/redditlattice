import { onMount, createSignal, Show, Suspense } from 'solid-js'
import { useNavigate } from 'solid-start'
import { trpc } from '~/client'
import { AsyncList, List, Spinner } from 'ui'
import { TransitionFade } from 'ui/transitions'
import { useAppState, useUserState } from '~/stores'
import { parseSchema, setDifference } from '~/utils'
import { TRPCClientError } from '@trpc/client'

export default function Home() {
  const [userState, setUserState] = useUserState()
  const [, setAppState] = useAppState()
  onMount(() => setAppState('title', 'Home'))

  const navigate = useNavigate()

  const [focused, setFocused] = createSignal<boolean>(false)
  const [flashing, setFlashing] = createSignal<boolean>(false)
  const flashSearchInput = () => setFlashing(true)

  const [query, setQuery] = createSignal<string>('')

  const subreddit = () => query().split('?')[0]
  const setSubreddit = (subreddit: string) => {
    if (query().includes('?')) {
      setQuery(`${subreddit}?${searchTerm()}`)
      return
    }

    setQuery(subreddit)
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
    setUserState('searchTerms', (searchTerms) => {
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
            /r/
          </span>
          <input
            value={query()}
            onInput={(e) => {
              const inp = e.currentTarget
              const start = inp.selectionStart
              setQuery(inp.value)
              inp.setSelectionRange(start, start)
            }}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
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
        id="scroller"
        flex="~ col-reverse"
        gap-2
        py-5
        grow
        shrink-1
        p="t-[70%]"
      >
        {/* AUTOCOMPLETE LIST */}
        <Show
          when={!query() || !(focused() && !query().includes('?'))}
          fallback={
            <Suspense
              fallback={
                <div class="p-5 grid place-items-center">
                  <Spinner></Spinner>
                </div>
              }
            >
              <AsyncList
                onClick={(id) => {
                  setQuery(id.toLowerCase())
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
                key={() => ['sr-autocomplete', query()]}
              ></AsyncList>
            </Suspense>
          }
        >
          {/* FAVOURITES LIST */}
          <List
            onClick={(id) => {
              setSubreddit(id)
              flashSearchInput()
            }}
            reverse
            buttons={[
              (id) => (
                <button
                  class="outline-none group"
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
            title="favourites"
            items={[...userState.favouriteSubreddits].sort().map((sr) => ({
              id: sr,
              title: sr,
            }))}
          ></List>
          <div border="b gray-800"></div>
          {/* RECENTS LIST */}
          <List
            onClick={(id) => {
              setQuery(id)
              flashSearchInput()
            }}
            reverse
            title="recents"
            items={[...userState.recents]
              .sort(([_q1, t1], [_q2, t2]) => t2 - t1)
              .map(([q, _]) => ({
                id: q,
                title: q,
              }))}
          ></List>
          <div border="b gray-800"></div>
          {/* SUBREDDITS LIST */}
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
                  class="outline-none group"
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
            title="subreddits"
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
          <div border="b gray-800"></div>
          {/* SEARCH TERMS LIST */}
          <List
            onClick={(id) => {
              const sr = subreddit() || userState.searchTerms.get(id)
              if (!sr) return
              setSubreddit(sr)
              setSearchTerm(id)
              flashSearchInput()
            }}
            onRemove={(id) => removeSearchTerm(id)}
            reverse
            title="searches"
            items={[...userState.searchTerms.keys()].sort().map((q) => ({
              id: q,
              title: q,
            }))}
          ></List>
        </Show>
      </div>
    </main>
  )
}
