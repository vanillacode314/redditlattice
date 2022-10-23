import { useAppState, useUserState } from '~/stores'
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

const [appState, setAppState] = useAppState()

export default function Subreddit() {
  const componentOwner = getOwner()!
  const [userState, setUserState] = useUserState()
  const location = useLocation()
  const q = () => new URLSearchParams(location.search.toLowerCase()).getAll('q')
  const params = useParams()
  const subreddits = () => params.subreddit.toLowerCase().split('+')
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

  const sort = createMemo(() => userState()!.sort.get(subreddits()[0]) || 'hot')

  const setSort = (sort: string) =>
    setUserState((state) => {
      state!.sort.set(subreddits().sort().join('+'), sort)
      return { ...state! }
    })

  onMount(() => setSort(sort()))

  const key = createMemo(() => `${subreddits()}-${q().join('+')}-${sort()}`)
  createEffect(() => console.log(q()))

  const resetState = () => {
    batch(() => {
      setAppState(
        'title',
        q()
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

  createEffect(() => appState.images.key !== key() && resetState())

  createEffect(() => {
    if (subreddits().length > 1) return
    if (q().length > 1) return
    setUserState((state) => {
      state!.subreddits.add(subreddits()[0])
      if (q().length > 0)
        state!.searchTerms.set(q()[0].toLowerCase(), subreddits()[0])
      return { ...state! }
    })
  })

  const onInfinite: InfiniteHandler = async (setState, firstload) => {
    if (firstload && appState.images.data.size > 0) {
      setState('idle')
      return
    }
    try {
      const ac = new AbortController()
      runWithOwner(componentOwner, () => onCleanup(() => ac.abort()))
      const { images: newImages, after } = await trpc.getImages.query(
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
      setAppState('images', (images) => ({
        ...images,
        data: new Set([...images.data, ...newImages]),
      }))

      if (after) {
        setAppState('images', { after })
        setState('idle')
        return
      }
      setState('completed')
    } catch (e) {
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
