import { differenceBy } from 'lodash-es'
import {
  createEffect,
  createMemo,
  getOwner,
  Match,
  onCleanup,
  onMount,
  runWithOwner,
  Switch,
  untrack,
} from 'solid-js'
import { useParams } from 'solid-start'
import {
  Animate,
  AnimationProvider,
  Button,
  InfiniteHandler,
  InfiniteLoading,
  Masonry,
  Spinner,
} from 'ui'
import z from 'zod'
import ImageCard from '~/components/ImageCard'
import { PINTEREST_SERVER_BASE_PATH } from '~/consts'
import { useRefresh } from '~/layouts/Base'
import { useAppState, useUserState } from '~/stores'
import { parseSchema } from '~/utils'

const heightMap = new Map<string, number>()
const [appState, setAppState] = useAppState()

export function messageSchema<TSchema extends z.ZodTypeAny>(
  dataSchema?: TSchema
) {
  const _dataSchema: TSchema = dataSchema || (z.any() as any)
  return z.object({
    code: z
      .string()
      .min(3)
      .regex(/^[A-Z_]+$/, {
        message: 'code can only contain uppercase letters and underscores',
      }),
    data: _dataSchema,
  })
}

let socket: WebSocket | undefined
let sessionId: string = ''
export default function Subreddit() {
  const componentOwner = getOwner()
  const params = useParams()

  const [userState, setUserState] = useUserState()

  const [, setRefresh] = useRefresh()

  const query = () => decodeURIComponent(params.query).toLowerCase()
  const key = createMemo(() => `pinterest-${query()}`)

  createEffect(() => {
    setAppState({ title: `/p/${query()}` })
  })
  const resetState = () => {
    heightMap.clear()
    setAppState('images', {
      key: key(),
      after: '',
      data: new Set<any>(),
    })
  }

  setRefresh(() => resetState)

  onMount(() => {
    setUserState('pinterestQueries', ($pinterestQueries) => {
      $pinterestQueries.add(query())
      return new Set($pinterestQueries)
    })
  })

  function parseResponse(schema: any, images: any) {
    const newImages = parseSchema<Record<'name' | 'url' | 'title', string>>(
      schema,
      images
    )
    const addedImages = differenceBy(
      newImages,
      [...appState.images.data.values()],
      'name'
    )
    setAppState('images', 'data', (data) => new Set([...data, ...addedImages]))
    return addedImages
  }

  const onInfinite: InfiniteHandler = async (setState, firstload, reload) => {
    function attachEvents(socket: WebSocket) {
      function onError() {
        setState('error')
      }
      socket.addEventListener('error', onError)

      function onMessage({ data: message }: MessageEvent) {
        const { code, data } = messageSchema().parse(JSON.parse(message))
        const { schema, images } = data
        switch (code) {
          case 'SESSION_ID':
            sessionId = data.sessionId
            parseResponse(schema, images)
            setState('idle')
            return
          case 'IMAGES':
            const addedImages = parseResponse(schema, images)
            if (addedImages.length === 0) {
              reload()
              return
            }
            setState('idle')
            return
          case 'ERROR':
            setState('error')
            return
        }
      }
      socket.addEventListener('message', onMessage)

      runWithOwner(componentOwner, () =>
        onCleanup(() => {
          if (!socket) return
          socket.removeEventListener('message', onMessage)
          socket.removeEventListener('error', onError)
        })
      )
    }
    if (firstload && socket) {
      attachEvents(socket)
    }
    function sendMessage(code: string): void {
      socket!.send(
        JSON.stringify({
          code,
          data: {
            query: query(),
            sessionId,
          },
        })
      )
    }
    if (socket?.readyState === 1) {
      sendMessage(!firstload ? 'GET_IMAGES' : 'INSTANTIATE')
      return
    }
    if (socket?.readyState === 0) return
    socket = new WebSocket(PINTEREST_SERVER_BASE_PATH)
    socket.addEventListener('open', () => sendMessage('INSTANTIATE'))
    attachEvents(socket)
  }

  return (
    <div
      h-full
      max-h-full
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
        scrollingElement={appState.scrollElement}
        getInitialHeight={(id, width) => heightMap.get(id) ?? width}
      >
        {({ id, width, data: image, lastHeight, updateHeight, y }) => (
          <AnimationProvider
            config={{
              width: { value: width(), immediate: true },
              height: lastHeight(),
              y: y(),
              options: {
                stiffness: 0.1,
                damping: 0.2,
              },
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
                <span class="uppercase font-bold">
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
