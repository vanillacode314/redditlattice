import { IAppState, useAppState, useUserState } from '~/stores'
import { useParams, useLocation } from 'solid-start'
import {
  onMount,
  onCleanup,
  createEffect,
  getOwner,
  runWithOwner,
  createMemo,
  Match,
  Switch,
  batch,
} from 'solid-js'
import { IAction } from '~/types'
import ImageCard from '~/components/ImageCard'
import Fab from '~/components/Fab'
import { trpc } from '~/client'
import { Spinner, Masonry, Button, InfiniteLoading, InfiniteHandler } from 'ui'
import { parseSchema } from '~/utils'
import { TRPCClientError } from '@trpc/client'
import { minBy } from 'lodash-es'
import { useRefresh } from '~/layouts/Base'
import { autoScroll } from '~/utils/scroller'
import { speed } from '~/modals/AutoScrollModal'

const [appState, setAppState] = useAppState()

export const CACHE: Map<
  string /* key */,
  Omit<IAppState['images'], 'key'> & { completed: boolean }
> = new Map()

const fabActions: IAction[] = [
  {
    id: 'top',
    icon: 'i-mdi-arrow-up-bold',
  },
  {
    id: 'hot',
    icon: 'i-mdi-fire',
  },
  {
    id: 'new',
    icon: 'i-mdi-new-box',
  },
]

export default function Subreddit() {
  const componentOwner = getOwner()!

  const location = useLocation()
  const params = useParams()

  const [userState, setUserState] = useUserState()

  const [, setRefresh] = useRefresh()

  const q = () => new URLSearchParams(location.search.toLowerCase()).getAll('q')
  const subreddits = () => params.subreddit.toLowerCase().split('+')
  const sort = createMemo(() => userState()!.sort.get(subreddits()[0]) || 'hot')
  const key = createMemo(() => `${subreddits()}-${q().join('+')}-${sort()}`)

  const setSort = (sort: string) =>
    setUserState((state) => {
      state!.sort.set(subreddits().sort().join('+'), sort)
      return { ...state! }
    })

  onMount(() => setSort(sort()))

  const resetState = () => {
    batch(() => {
      setAppState(
        'title',
        q().length > 0
          ? `${q().join('+')} - /r/${subreddits().join('+')}`
          : `/r/${subreddits()}`
      )
      setAppState({
        images: {
          key: key(),
          after: '',
          data: new Set(),
        },
      })
    })
  }

  setRefresh(() => () => {
    CACHE.delete(key())
    resetState()
  })

  createEffect(() => appState.images.key !== key() && resetState())

  createEffect(() => {
    if (subreddits().length > 1) return
    if (q().length > 1) return
    setUserState((state) => {
      /* Update Subreddits */
      state!.subreddits.add(subreddits()[0])

      /* Update Recents */
      state!.recents.set(
        q().length > 0 ? `${subreddits()[0]}?${q()[0]}` : subreddits()[0],
        Math.floor(Date.now() / 1000)
      )
      while (state!.recents.size > state!.recentsLimit) {
        const [q, _] = minBy(
          [...state!.recents],
          ([_, timestamp]) => timestamp
        )!
        state!.recents.delete(q)
      }

      /* Update Search Terms */
      if (q().length > 0)
        state!.searchTerms.set(q()[0].toLowerCase(), subreddits()[0])
      return { ...state! }
    })
  })

  const onInfinite: InfiniteHandler = async (setState, firstload) => {
    if (firstload && CACHE.has(key())) {
      const { after, completed, data } = CACHE.get(key())!
      setAppState('images', (images) => ({
        ...images,
        after,
        data,
      }))
      setState(completed ? 'completed' : 'idle')
      return
    }
    try {
      const ac = new AbortController()
      runWithOwner(componentOwner, () => onCleanup(() => ac.abort()))
      const { newImages, after } = await trpc.getImages
        .query(
          {
            q: q(),
            after: appState.images.after,
            subreddits: subreddits(),
            sort: userState()!.sort.get(subreddits().sort().join('+')),
            nsfw: !userState()!.hideNSFW,
          },
          {
            signal: ac.signal,
          }
        )
        .then(({ schema, images, after }) => ({
          newImages: parseSchema<{ name: string; title: string; url: string }>(
            schema,
            images
          ),
          after,
        }))

      setAppState('images', (images) => ({
        ...images,
        data: new Set([...images.data, ...newImages]),
      }))

      CACHE.set(key(), {
        after,
        data: new Set([...appState.images.data, ...newImages]),
        completed: !after,
      })

      if (after) {
        setAppState('images', { after })
        setTimeout(() => {
          setState('idle')
          if (appState.autoScrolling) autoScroll('#scroller', speed())
        }, 1000)
        return
      }
      setState('completed')
    } catch (e) {
      if (e instanceof TRPCClientError) {
        if (e.cause?.name !== 'ObservableAbortError') {
          setState('error')
          throw e
        }
        return
      }
      setState('error')
      throw e
    }
  }

  return (
    <div
      h-full
      max-h-full
      id="scroller"
      style={{ padding: `${userState()!.gap}px` }}
    >
      <Masonry
        items={[...appState.images.data].map((image) => ({
          id: image.name,
          data: image,
        }))}
        maxWidth={400}
        gap={userState()!.gap}
      >
        {(_, image, width) => (
          <ImageCard width={width()} image={image}></ImageCard>
        )}
      </Masonry>
      <InfiniteLoading
        onInfinite={onInfinite}
        target="#scroller"
        distance={800}
        key={appState.images.key}
      >
        {(state, load) => (
          <div class="grid p-5 place-content-center">
            <Switch>
              <Match when={state === 'idle'}>
                <Button
                  class="bg-purple-800 hover:bg-purple-700"
                  onClick={() => load()}
                >
                  Load More
                </Button>
              </Match>
              <Match when={state === 'completed'}>
                <span uppercase font-bold>
                  {appState.images.data.size > 0 ? 'END' : 'NO IMAGES FOUND'}
                </span>
              </Match>
              <Match when={state === 'error'}>
                <Button
                  onClick={() => load()}
                  class="bg-red-800 hover:bg-red-700"
                >
                  Retry
                </Button>
              </Match>
              <Match when={state === 'loading'}>
                <Spinner />
              </Match>
            </Switch>
          </div>
        )}
      </InfiniteLoading>
      <Fab
        icon="i-mdi-sort"
        actions={fabActions}
        selected={sort()}
        onSelect={(id) => setSort(id)}
      ></Fab>
    </div>
  )
}
