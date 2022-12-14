import {
  onCleanup,
  batch,
  createSignal,
  mergeProps,
  Component,
  Show,
  For,
} from 'solid-js'
import { createStore } from 'solid-js/store'
import { Portal } from 'solid-js/web'
import { config, animated, createSpring } from 'solid-spring'
import { useLocation, useNavigate } from 'solid-start'
import { longpress } from '~/utils/use-longpress'
import { outsideclick } from '~/utils/use-outsideclick'
import { IMAGE_SERVER_BASE_PATH } from '~/consts'
import { TransitionFade } from 'ui/transitions'
import { AutoResizingPicture, Button } from 'ui'
import { TImage, useUserState } from '~/stores'
import { getExtension, download, blobToDataURL, nextFrame } from '~/utils'
import { uniq } from 'lodash-es'
import { del, get } from 'idb-keyval'

interface Props {
  width: number
  image: TImage
  onLoad?: () => void
}

export const ImageCard: Component<Props> = (props) => {
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

  const scale = createSpring(() => ({
    transform: `scale(${popupVisible() ? 1 : 0})`,
    config: config.stiff,
  }))

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

  function getSources() {
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
    const url = await fetch(
      getProcessedImageURL(props.image.url, 0, { passthrough: true })
    )
      .then((res) => res.blob())
      .then((blob) => blobToDataURL(blob))
    download(
      url,
      props.image.title.replaceAll(' ', '-').toLowerCase() + '.' + format
    )
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
            <span class="uppercase font-bold text-sm">{errorMsg()}</span>
          </div>
        }
      >
        <AutoResizingPicture
          style={{ 'border-radius': `${userState.borderRadius}px` }}
          fallback={
            <div class="grid place-items-center h-full">
              <div
                class="bg-white/15"
                animate-pulse
                h-10
                w-10
                rounded-full
              ></div>
            </div>
          }
          width={props.width}
          fallbackHeight={props.width}
          ref={(el) => {
            const dispose = longpress(el, { callback: showPopup })
            onCleanup(dispose)
          }}
          onContextMenu={(e: MouseEvent) => {
            if (e.pointerType === 'touch') return
            e.preventDefault()
            batch(() => {
              setMenuPos(() => ({ x: e.clientX, y: e.clientY }))
              setMenu(true)
            })
          }}
          srcSets={getSources()}
          src={
            userState.processImages
              ? getProcessedImageURL(props.image.url, width())
              : props.image.url
          }
          onLoad={merged.onLoad}
          onError={onError}
          alt={props.image.title}
        ></AutoResizingPicture>
      </Show>
      <Show when={popupVisible()}>
        <Portal mount={document.documentElement}>
          <div
            id={`popup-${props.image.name}`}
            class="fixed inset-0 grid content-center"
            classList={{ 'pointer-events-none': !popupVisible() }}
          >
            <TransitionFade>
              <Show when={popupVisible()}>
                <div
                  class="absolute inset-0 backdrop-blur-[30px] z-10 bg-black/50"
                  onContextMenu={(e) => e.preventDefault()}
                  onClick={() => removePopupImage()}
                ></div>
              </Show>
            </TransitionFade>
            <animated.div
              onContextMenu={(e) => e.preventDefault()}
              class="z-20 w-full flex flex-col bg-black relative"
              style={scale()}
            >
              <img src={props.image.url} alt={props.image.title}></img>
              <img />
              <span class="uppercase tracking-wide bg-black text-white font-bold flex gap-5 items-center px-5">
                <span class="py-5 grow">{props.image.title}</span>
                <button
                  class="py-5"
                  onClick={() => removeFromCache()}
                  type="button"
                >
                  <span class="text-2xl i-mdi-cached"></span>
                </button>
                <button
                  class="py-5"
                  onClick={() => window.open(props.image.url, '_blank')}
                  type="button"
                >
                  <span class="text-2xl i-mdi-open-in-new"></span>
                </button>
                <button
                  class="py-5"
                  onClick={() => downloadImage()}
                  type="button"
                >
                  <span class="text-2xl i-mdi-download"></span>
                </button>
              </span>
            </animated.div>
          </div>
        </Portal>
      </Show>
      <Show when={menu()}>
        <ul
          class="fixed rounded-lg bg-gray-900 p-2 flex flex-col z-10"
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
                  class="rounded hover:bg-gray-800 px-2 py-1 text-xs uppercase font-bold text-left"
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
