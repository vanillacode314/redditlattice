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

  function onSubmit(e: SubmitEvent) {
    e.preventDefault()
    if (!query() || query().startsWith('?')) return

    const [subreddits, searchTerms] = getSubredditsAndSearchTerms(query())
    const id = subreddits + (searchTerms !== undefined ? '?' + searchTerms : '')
    if (!userState.redditCollections.has(id)) setCollection(id, id)

    navigate(getURL(subreddits, searchTerms || ''))
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
          class="transitions-colors duration-250 grid grid-cols-[auto_1fr_auto_auto]"
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
            onBlur={() => setFocused(false)}
            placeholder="e.g. wallpapers+earthporn?nature+landscape"
            class="min-w-0 placeholder:text-gray-500"
            type="text"
            id="search"
            name="subreddit"
            min-w-0
            bg-transparent
            outline-none
          />

          <Show when={query()}>
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
              onFocus={(e) => e.relatedTarget?.focus()}
            >
              <span class="i-mdi-edit text-xl"></span>
            </button>
          </Show>

          <TransitionFade blur duration={100}>
            <Show when={query()}>
              <button
                type="button"
                onClick={() => setQuery('')}
                onFocus={(e) => e.relatedTarget?.focus()}
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
        flex="~ col-reverse"
        gap-2
        py-5
        grow
        shrink-1
        p="t-[70%]"
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
