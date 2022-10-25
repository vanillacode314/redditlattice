import { onMount, batch, createSignal, Show, Suspense } from 'solid-js'
import { useNavigate } from 'solid-start'
import { trpc } from '~/client'
import { AsyncList, List, Spinner } from 'ui'
import { TransitionFade } from 'ui/transitions'
import { useAppState, useUserState } from '~/stores'
import { parseSchema } from '~/utils'
import { TRPCClientError } from '@trpc/client'

export default function Home() {
  const [userState, setUserState] = useUserState()
  const [, setAppState] = useAppState()

  onMount(() => setAppState('title', ''))

  const [focused, setFocused] = createSignal<boolean>(false)
  const [query, setQuery] = createSignal<string>('')

  const navigate = useNavigate()

  function onSubmit(e: SubmitEvent) {
    e.preventDefault()
    if (!query()) return
    if (query().startsWith('?')) return
    let [sr, q] = query().toLowerCase().split('?')
    sr = sr.split('+').sort().join('+')
    q = q ? q.split('+').sort().join('+') : ''
    let id = sr
    if (q) id += '?' + q
    if (!userState()!.collections.has(id)) setCollection(id, id)
    if (q) {
      navigate(
        `/r/${sr}?${q
          .split('+')
          .map((query) => `q=${query}`)
          .join('&')}`
      )
    } else {
      navigate(`/r/${sr}`)
    }
  }

  function removeCollection(id: string) {
    setUserState((state) => {
      state!.collections.delete(id)
      return { ...state! }
    })
  }

  function setCollection(id: string, value: string) {
    setUserState((state) => {
      state!.collections.set(id, value)
      return { ...state! }
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
          ring="~ pink-800 hover:pink-700 focus:pink-700"
          transition-colors
          class="grid grid-cols-[auto_1fr_auto_auto]"
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
            onInput={(e) => setQuery(e.currentTarget.value.toLowerCase())}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder="e.g. wallpapers+earthporn?nature+landscape"
            class="placeholder:text-gray-500"
            type="text"
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
          </TransitionFade>
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
        id="scroller"
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
                <div class="p-5 grid place-items-center">
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
                key={query().split('+').at(-1)}
              ></AsyncList>
            </Suspense>
          }
        >
          <List
            onClick={(id) => setQuery(id)}
            onRemove={(id) => removeCollection(id)}
            reverse
            title="collections"
            items={[...userState()!.collections].sort().map(([key, value]) => ({
              id: key,
              title: value,
            }))}
          ></List>
        </Show>
      </div>
    </main>
  )
}
