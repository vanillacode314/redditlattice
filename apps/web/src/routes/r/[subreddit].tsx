import { TRPCClientError } from '@trpc/client'
import { minBy } from 'lodash-es'
import {
  batch,
  createEffect,
  createMemo,
  getOwner,
  Match,
  onCleanup,
  onMount,
  runWithOwner,
  Switch,
} from 'solid-js'
import { useLocation, useParams } from 'solid-start'
import { Button, InfiniteHandler, InfiniteLoading, Masonry, Spinner } from 'ui'
import { trpc } from '~/client'
import Fab from '~/components/Fab'
import ImageCard from '~/components/ImageCard'
import { useRefresh } from '~/layouts/Base'
import { startScroll } from '~/modals/AutoScrollModal'
import { useAppState, useUserState } from '~/stores'
import { actionSchema } from '~/types'
import { parseSchema } from '~/utils'

const [appState, setAppState] = useAppState()

export const CACHE: Map<
  string /* key */,
  Omit<TAppState['images'], 'key'> & { completed: boolean }
> = new Map()

const fabActions = actionSchema.array().parse([
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
])

export default function SubredditPage() {
  const componentOwner = getOwner()!

  const location = useLocation()
  const params = useParams()

  const [userState, setUserState] = useUserState()

  const [, setRefresh] = useRefresh()

  const q = () => new URLSearchParams(location.search.toLowerCase()).getAll('q')
  const subreddits = () =>
    decodeURIComponent(params.subreddit).toLowerCase().split('+')
  const sort = createMemo(
    () => userState.subredditSort.get(subreddits().sort().join('+')) || 'hot'
  )
  const key = createMemo(() => `${subreddits()}-${q().join('+')}-${sort()}`)

  const setSort = (sort: string) =>
    setUserState(
      'subredditSort',
      (current) =>
        new Map([...current.set(subreddits().sort().join('+'), sort)])
    )

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

    /* Update Subreddits */
    setUserState(
      'subreddits',
      (current) => new Set([...current.add(subreddits()[0])])
    )

    /* Update Recents */
    setUserState('redditRecents', (current) => {
      current.set(
        q().length > 0 ? `${subreddits()[0]}?${q()[0]}` : subreddits()[0],
        Math.floor(Date.now() / 1000)
      )
      while (current.size > userState.recentsLimit) {
        const [q, _] = minBy([...current], ([_, timestamp]) => timestamp)!
        current.delete(q)
      }
      return new Map([...current])
    })

    /* Update Search Terms */
    setUserState('redditQueries', (current) => {
      if (q().length > 0) current.set(q()[0], subreddits()[0])
      return new Map([...current])
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
            sort: userState.subredditSort.get(subreddits().sort().join('+')),
            nsfw: !userState.hideNSFW,
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
          if (appState.autoScrolling) startScroll()
        }, 1000)
        return
      }
      setState('completed')
    } catch (error) {
      if (
        error instanceof TRPCClientError &&
        error.cause?.name === 'ObservableAbortError'
      )
        return
      setState('error')
      throw error
    }
  }

  return (
    <div
      class="max-h-full h-full overflow-auto"
      ref={(el) => setAppState('scrollElement', el)}
      style={{ padding: `${userState.gap}px` }}
    >
      <Masonry
        items={[...appState.images.data].map((image) => ({
          id: image.name,
          data: image,
        }))}
        maxWidth={userState.columnMaxWidth}
        maxColumns={userState.maxColumns}
        align="center"
        gap={userState.gap}
        attachScrollHandler={(handler) => {
          appState.scrollElement.addEventListener('scroll', handler, {
            passive: true,
          })
          return () =>
            appState.scrollElement.removeEventListener('scroll', handler)
        }}
      >
        {({ width, data: image, lastHeight, updateHeight, style }) => (
          <ImageCard
            style={style()}
            width={width()}
            height={lastHeight()}
            image={image}
            onHasHeight={updateHeight}
          />
        )}
      </Masonry>
      <InfiniteLoading
        onInfinite={onInfinite}
        target={appState.scrollElement}
        distance={1280}
        key={appState.images.key}
      >
        {(state, load) => (
          <div class="grid place-content-center p-5">
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
