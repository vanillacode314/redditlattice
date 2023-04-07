import { Motion } from '@motionone/solid'
import { createMediaQuery } from '@solid-primitives/media'
import { del, get } from 'idb-keyval'
import { uniq } from 'lodash-es'
import { spring } from 'motion'
import {
  batch,
  Component,
  createSignal,
  For,
  mergeProps,
  onCleanup,
  Show,
} from 'solid-js'
import { createStore } from 'solid-js/store'
import { Portal } from 'solid-js/web'
import { useLocation, useNavigate } from 'solid-start'
import { AutoResizingPicture, Button } from 'ui'
import { IMAGE_SERVER_BASE_PATH } from '~/consts'
import { useUserState } from '~/stores'
import { download, getExtension, nextFrame } from '~/utils'
import { longpress } from '~/utils/use-longpress'
import { outsideclick } from '~/utils/use-outsideclick'

interface Props {
  width: number
  height?: number
  image: TImage
  onLoad?: () => void
  onHasHeight?: (height: number) => void
  ref?: HTMLDivElement | ((instance: HTMLDivElement) => void)
}

export const ImageCard: Component<Props> = (props) => {
  const isMobile = createMediaQuery('(hover: none)')
  const merged = mergeProps({ onLoad: () => {} }, props)

  const navigate = useNavigate()
  const location = useLocation()

  const [userState] = useUserState()

  const [menu, setMenu] = createSignal<boolean>(false)
  const [menuPos, setMenuPos] = createStore<{ x: number; y: number }>({
    x: 0,
    y: 0,
  })
  const [error, setError] = createSignal<boolean>(false)
  const [errorMsg, setErrorMsg] = createSignal<string>('')

  const width = () =>
    Math.round(props.width / 100) * 100 * userState.imageSizeMultiplier

  const popupVisible = () => location.hash === '#popup-' + props.image.name

  const getProcessedImageURL = (
    url: string,
    width: number,
    {
      passthrough = false,
      format = 'webp',
    }: {
      format?: string
      passthrough?: boolean
    } = {}
  ) =>
    passthrough
      ? `${IMAGE_SERVER_BASE_PATH}/?passthrough=true&url=${url}&width=0`
      : `${IMAGE_SERVER_BASE_PATH}/?url=${url}&width=${width}&format=${format}`

  const sources = () => {
    const formats = uniq([userState.prefferedImageFormat, 'webp'])
    return new Map(
      formats.map((format) => [
        `image/${format}`,
        userState.processImages
          ? getProcessedImageURL(props.image.url, width(), { format })
          : props.image.url,
      ])
    )
  }

  const showPopup = () =>
    navigate(location.pathname + location.search + '#popup-' + props.image.name)

  const removePopupImage = () => history.go(-1)

  const retry = () => setError(false)
  const onError = async (_e: Event) => {
    const res = await fetch(props.image.url, { referrer: '' })
    setErrorMsg(`(${res.status} - ${res.statusText})`)
    setError(true)
  }

  async function downloadImage() {
    const format = getExtension(props.image.url)
    const url = props.image.url
    if (url.startsWith('https://i.redd.it')) {
      const id = url.replace('https://i.redd.it/', '')
      download(
        `/ireddit/${id}`,
        props.image.title.replace(/\s/g, '-').toLowerCase() + '.' + format
      )
    } else {
      download(
        url,
        props.image.title.replace(/\s/g, '-').toLowerCase() + '.' + format
      )
    }
  }

  async function removeFromCache() {
    setError(true)
    del(props.image.url)
    nextFrame(async () => {
      const cache = await caches.open('images-assets')
      await cache.delete((await get(props.image.url)).requestUrl)
      await del(props.image.url)
    })
    setError(false)
  }

  return (
    <>
      <Show
        when={!error()}
        fallback={
          <div
            style={{ height: `${props.width}px` }}
            class="grid place-content-center gap-5"
          >
            <Button
              class="bg-purple-800 hover:bg-purple-700"
              onClick={() => retry()}
            >
              Retry
            </Button>
            <span class="text-sm font-bold uppercase">{errorMsg()}</span>
          </div>
        }
      >
        <AutoResizingPicture
          style={{
            'border-radius': `${userState.borderRadius}px`,
          }}
          onHasHeight={props.onHasHeight}
          fallback={
            <div class="grid h-full place-items-center bg-neutral-900/10">
              <div class="bg-white/15 animate-pulse h-10 w-10 rounded-full" />
            </div>
          }
          width={props.width}
          fallbackHeight={props.height || props.width}
          ref={(el) => {
            onCleanup(longpress(el, { callback: showPopup }))
            typeof props.ref === 'function' ? props.ref(el) : (props.ref = el)
          }}
          onContextMenu={(e: MouseEvent) => {
            // @ts-ignore: property exists
            if (e.pointerType === 'touch') return
            e.preventDefault()
            batch(() => {
              setMenuPos(() => ({ x: e.clientX, y: e.clientY }))
              setMenu(true)
            })
          }}
          srcSets={sources()}
          src={
            userState.processImages
              ? getProcessedImageURL(props.image.url, width())
              : props.image.url
          }
          onLoad={merged.onLoad}
          onError={onError}
          alt={props.image.title}
        >
          <span
            classList={{
              'group-hover:opacity-100': !isMobile(),
            }}
            class="w-full bg-gradient-to-t absolute bottom-0 from-black/90 to-transparent px-5 py-3 z-10 opacity-0 transition-opacity font-bold tracking-wider uppercase text-sm"
          >
            {props.image.title}
          </span>
        </AutoResizingPicture>
      </Show>
      <Show when={popupVisible()}>
        <Portal mount={document.documentElement}>
          <div
            id={`popup-${props.image.name}`}
            class="fixed inset-0 grid content-center"
            classList={{ 'pointer-events-none': !popupVisible() }}
          >
            <Show when={popupVisible()}>
              <div
                class="absolute inset-0 z-10 bg-black/50 backdrop-blur-[30px]"
                onContextMenu={(e) => e.preventDefault()}
                onClick={() => removePopupImage()}
              ></div>
            </Show>

            <Motion.div
              initial={{
                transform: `scale(0)`,
              }}
              animate={{
                transform: `scale(1)`,
              }}
              transition={{ easing: spring({ stiffness: 120 }) }}
              onContextMenu={(e) => e.preventDefault()}
              class="relative z-20 flex w-full flex-col bg-black"
            >
              <img src={props.image.url} alt={props.image.title}></img>
              <span class="flex items-center gap-5 bg-black px-5 font-bold uppercase tracking-wide text-white">
                <span class="grow py-5">{props.image.title}</span>
                <button
                  class="py-5"
                  onClick={() => removeFromCache()}
                  type="button"
                >
                  <span class="i-mdi-cached text-2xl"></span>
                </button>
                <button
                  class="py-5"
                  onClick={() => window.open(props.image.url, '_blank')}
                  type="button"
                >
                  <span class="i-mdi-open-in-new text-2xl"></span>
                </button>
                <button
                  class="py-5"
                  onClick={() => downloadImage()}
                  type="button"
                >
                  <span class="i-mdi-download text-2xl"></span>
                </button>
              </span>
            </Motion.div>
          </div>
        </Portal>
      </Show>
      <Show when={menu()}>
        <ul
          class="fixed z-10 flex flex-col rounded-lg bg-gray-900 p-2"
          style={{
            left: menuPos.x + 'px',
            top: menuPos.y + 'px',
          }}
          ref={(el) => {
            const dispose = outsideclick(el, () => setMenu(false))
            onCleanup(dispose)
          }}
        >
          <For
            each={[
              {
                title: 'Open in New Tab',
                handler: () => window.open(props.image.url, '_blank'),
              },
              {
                title: 'Download',
                handler: () => downloadImage(),
              },
              {
                title: 'Invalidate Cache',
                handler: () => removeFromCache(),
              },
            ]}
          >
            {({ title, handler }) => (
              <li class="contents">
                <button
                  type="button"
                  onClick={() => {
                    handler()
                    setMenu(false)
                  }}
                  class="rounded px-2 py-1 text-left text-xs font-bold uppercase hover:bg-gray-800"
                >
                  {title}
                </button>
              </li>
            )}
          </For>
        </ul>
      </Show>
    </>
  )
}

export default ImageCard
