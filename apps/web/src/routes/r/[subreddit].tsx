import { createInfiniteQuery, createQuery } from '@tanstack/solid-query'
import { minBy } from 'lodash-es'
import {
  createEffect,
  createMemo,
  Match,
  onMount,
  Suspense,
  Switch,
  untrack,
} from 'solid-js'
import { useLocation, useParams } from 'solid-start'
import {
  Animate,
  AnimationProvider,
  Button,
  InfiniteHandler,
  InfiniteLoading,
  Masonry,
  Spinner,
} from 'ui'
import Fab from '~/components/Fab'
import ImageCard from '~/components/ImageCard'
import { useRefresh } from '~/layouts/Base'
import { startScroll } from '~/modals/AutoScrollModal'
import { useAppState, useUserState } from '~/stores'
import { actionSchema } from '~/types'
import { parseSchema } from '~/utils'
import { queryClient, trpc } from '~/utils/trpc'

const [appState, setAppState] = useAppState()

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

const heightMap = new Map<string, number>()
export default function SubredditPage() {
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
    heightMap.clear()
    queryClient.invalidateQueries({ queryKey: [key()] })
  }
  setRefresh(() => resetState)

  createEffect(() =>
    setAppState(
      'title',
      q().length > 0
        ? `${q().join('+')} - /r/${subreddits().join('+')}`
        : `/r/${subreddits()}`
    )
  )

  createEffect(() => {
    if (subreddits().length > 1) return
    if (q().length > 1) return

    /* Update Subreddits */
    setUserState(
      'subreddits',
      (current) => new Set([...current.add(subreddits()[0])])
    )

    /* Update Recents */
    setUserState('redditRecents', ($redditRecents) => {
      $redditRecents.set(
        q().length > 0 ? `${subreddits()[0]}?${q()[0]}` : subreddits()[0],
        Math.floor(Date.now() / 1000)
      )
      while ($redditRecents.size > userState.recentsLimit) {
        const [q, _] = minBy(
          [...$redditRecents],
          ([_, timestamp]) => timestamp
        )!
        $redditRecents.delete(q)
      }
      return new Map($redditRecents)
    })

    /* Update Search Terms */
    setUserState('redditQueries', ($redditQueries) => {
      if (q().length > 0) $redditQueries.set(q()[0], subreddits()[0])
      return new Map($redditQueries)
    })
  })

  const items = createInfiniteQuery(() => [key()], {
    queryFn: ({ pageParam = undefined }) =>
      trpc.getImages
        .query({
          q: q(),
          after: pageParam,
          subreddits: subreddits(),
          sort: userState.subredditSort.get(subreddits().sort().join('+'))!,
          nsfw: !userState.hideNSFW,
        })
        .then(({ schema, images, after }) => ({
          images: parseSchema<{ name: string; title: string; url: string }>(
            schema,
            images
          ),
          after: after ?? undefined,
        })),
    getNextPageParam: (lastPage) => lastPage.after,
  })

  const onInfinite: InfiniteHandler = async (setState, firstload) => {
    const newItems = await items.fetchNextPage()
    const newState = !newItems.hasNextPage
      ? 'completed'
      : newItems.isError
      ? 'error'
      : 'idle'
    setState(newState)
    if (newState !== 'error' && appState.autoScrolling) startScroll()
  }

  return (
    <div
      class="max-h-full h-full overflow-auto"
      ref={(el) => setAppState('scrollElement', el)}
      style={{ padding: `${userState.gap}px` }}
    >
      <Suspense
        fallback={
          <div class="grid place-items-center p-5">
            <Spinner />
          </div>
        }
      >
        <Masonry
          items={(items.data?.pages ?? [])
            .flatMap(({ images }) => images)
            .map((image) => ({
              id: image.name,
              data: image,
            }))}
          maxWidth={userState.columnMaxWidth}
          maxColumns={userState.maxColumns}
          align="center"
          gap={userState.gap}
          scrollingElement={appState.scrollElement}
          getInitialHeight={(id, width) => heightMap.get(id) ?? width}
        >
          {({ id, width, data: image, lastHeight, updateHeight, y }) => (
            <AnimationProvider
              config={{
                width: { value: width(), immediate: true },
                height: lastHeight(),
                y: y(),
                // options: {
                //   stiffness: 0.1,
                //   damping: 0.2,
                // },
                transition: {
                  durationMs: 200,
                  easing: 'ease-out',
                },
              }}
            >
              <Animate
                style={{
                  'border-radius': userState.borderRadius + 'px',
                }}
                class="absolute overflow-hidden"
              >
                <ImageCard
                  width={width()}
                  height={lastHeight()}
                  image={image()}
                  onHasHeight={(height) => {
                    heightMap.set(untrack(id), height)
                    updateHeight(height)
                  }}
                />
              </Animate>
            </AnimationProvider>
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
                    {(items.data?.pages.flat() ?? []).length > 0
                      ? 'END'
                      : 'NO IMAGES FOUND'}
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
      </Suspense>
      <Fab
        icon="i-mdi-sort"
        actions={fabActions}
        selected={sort()}
        onSelect={(id) => setSort(id)}
      ></Fab>
    </div>
  )
}
