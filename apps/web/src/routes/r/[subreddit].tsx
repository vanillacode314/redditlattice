import { useAppState, useUserState } from '~/stores'
import { useParams, useSearchParams } from 'solid-start'
import {
  onCleanup,
  createEffect,
  getOwner,
  runWithOwner,
  createMemo,
  Match,
  Switch,
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
  const [searchParams, _] = useSearchParams()
  const params = useParams()
  const subreddit = () => params.subreddit.toLowerCase()
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

  const sort = createMemo(() => userState().sort.get(subreddit()) || 'top')

  const setSort = (sort: string) => {
    setUserState((state) => {
      state.sort.set(subreddit(), sort)
      return { ...state }
    })
  }

  const key = createMemo(() => `${subreddit()}-${searchParams.q}-${sort()}`)

  const resetState = () => {
    setAppState(
      'title',
      searchParams.q
        ? `${searchParams.q} - /r/${subreddit()}`
        : `/r/${subreddit()}`
    )
    setAppState({
      images: {
        key: key(),
        after: '',
        data: new Set(),
      },
    })
  }

  createEffect(() => {
    if (appState.images.key !== key()) resetState()
  })

  createEffect(() => {
    setUserState((state) => {
      state.subreddits.add(subreddit())
      if (searchParams.q)
        state.searchTerms.set(searchParams.q.toLowerCase(), subreddit())
      return { ...state }
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
          q: searchParams.q,
          after: appState.images.after,
          subreddit: params.subreddit,
          sort: userState().sort.get(subreddit()),
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
    <div h-full max-h-full id="scroller">
      <Masonry
        items={[...appState.images.data].map((image) => ({
          id: image.name,
          data: image,
        }))}
        maxWidth={400}
      >
        {(id, image, width) => (
          <ImageCard width={width()} image={image}></ImageCard>
        )}
      </Masonry>
      <InfiniteLoading
        onInfinite={onInfinite}
        target="#scroller"
        distance={400}
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
