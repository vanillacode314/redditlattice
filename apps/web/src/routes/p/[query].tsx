import { useAppState, useUserState } from '~/stores'
import { useParams } from 'solid-start'
import {
  onCleanup,
  createEffect,
  createMemo,
  Match,
  Switch,
  batch,
  onMount,
} from 'solid-js'
import ImageCard from '~/components/ImageCard'
import { Spinner, Masonry, Button, InfiniteLoading, InfiniteHandler } from 'ui'
import { useRefresh } from '~/layouts/Base'

const [appState, setAppState] = useAppState()

let ws: WebSocket | undefined
export default function Subreddit() {
  const params = useParams()

  const [userState, setUserState] = useUserState()

  const [, setRefresh] = useRefresh()

  const query = () => params.query.toLowerCase()
  const key = createMemo(() => `pinterest-${query()}`)

  const resetState = () => {
    ws?.close()
    ws = undefined
    batch(() => {
      setAppState('title', `/p/${query()}`)
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
    resetState()
  })

  onMount(() => {
    setUserState('pinterestQueries', (queries) => {
      queries.add(query().toLowerCase())
      return new Set(queries)
    })
  })

  createEffect(() => appState.images.key !== key() && resetState())

  const onInfinite: InfiniteHandler = async (setState, _firstload) => {
    if (!ws) {
      ws = new WebSocket('wss://pinterest-scraper-production.up.railway.app/')
      ws.onopen = () => {
        ws!.send(query())
      }
      ws.onmessage = ({ data }) => {
        const newImages = JSON.parse(data) as any[]
        setAppState('images', 'data', (data) => {
          for (const image of newImages) {
            data.add(image)
          }
          return new Set(data)
        })
        setState('idle')
      }
      return
    }
    ws.send(query())
  }

  return (
    <div
      h-full
      max-h-full
      id="scroller"
      style={{ padding: `${userState.gap}px` }}
    >
      <Masonry
        items={[...appState.images.data].map((image) => ({
          id: image.name,
          data: image,
        }))}
        maxWidth={userState.columnMaxWidth}
        gap={userState.gap}
      >
        {(_, image, width) => (
          <ImageCard width={width()} image={image}></ImageCard>
        )}
      </Masonry>
      <InfiniteLoading
        onInfinite={onInfinite}
        target="#scroller"
        distance={1280}
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
    </div>
  )
}