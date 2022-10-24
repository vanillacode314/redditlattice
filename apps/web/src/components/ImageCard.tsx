import {
  createComputed,
  createSignal,
  mergeProps,
  Component,
  Show,
} from 'solid-js'
import { Portal } from 'solid-js/web'
import { config, animated, createSpring } from 'solid-spring'
import { useLocation, useNavigate } from 'solid-start'
import { longpress } from '~/utils/use-longpress'
import { IMAGE_SERVER_BASE_PATH } from '~/consts'
import { TransitionFade } from 'ui/transitions'
import { AutoResizingPicture, Button } from 'ui'
import { IImage, useUserState } from '~/stores'
import { download, blobToDataURL } from '~/utils'
import * as _ from 'lodash-es'

interface Props {
  width: number
  image: IImage
  onLoad?: () => void
}

export const ImageCard: Component<Props> = (props) => {
  const [userState] = useUserState()
  const merged = mergeProps({ onLoad: () => {} }, props)
  const [error, setError] = createSignal<boolean>(false)
  const navigate = useNavigate()
  const location = useLocation()

  const popupVisible = () => location.hash === '#popup-' + props.image.name
  const width = () =>
    Math.round(props.width / 100) * 100 * userState()!.imageSizeMultiplier

  const scale = createSpring(() => ({
    transform: `scale(${popupVisible() ? 1 : 0})`,
    config: config.stiff,
  }))

  function getProcessedImageURL(
    url: string,
    width: number,
    {
      passthrough = false,
      format = 'webp',
    }: {
      format?: string
      passthrough?: boolean
    } = {}
  ): string {
    if (passthrough) {
      return `${IMAGE_SERVER_BASE_PATH}/?passthrough=true&url=${url}&width=0`
    }
    return `${IMAGE_SERVER_BASE_PATH}/?url=${url}&width=${width}&format=${format}`
  }

  function getSources() {
    const state = userState()!
    const formats = _.uniq([state.prefferedImageFormat, 'webp'])
    return new Map(
      formats.map((format) => [
        `image/${format}`,
        state.processImages
          ? getProcessedImageURL(props.image.url, width(), { format })
          : props.image.url,
      ])
    )
  }

  function popupImage() {
    navigate(location.pathname + location.search + '#popup-' + props.image.name)
  }

  function removePopupImage() {
    history.go(-1)
  }

  async function retry() {
    setError(false)
  }

  function onError() {
    setError(true)
  }

  async function downloadImage() {
    const format = new URL(props.image.url).pathname.split('.').at(-1)
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

  return (
    <>
      <Show
        when={!error()}
        fallback={
          <div
            style={{ height: `${props.width}px` }}
            class="grid place-items-center"
          >
            <Button
              class="bg-purple-800 hover:bg-purple-700"
              onClick={() => retry()}
            >
              Retry
            </Button>
          </div>
        }
      >
        <AutoResizingPicture
          style={{ 'border-radius': `${userState()!.borderRadius}px` }}
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
            longpress(el, { callback: popupImage })
          }}
          srcSets={getSources()}
          src={
            userState()!.processImages
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
              <span class="p-5 uppercase tracking-wide bg-black text-white font-bold flex justify-between items-center">
                {props.image.title}
                <button onClick={() => downloadImage()}>
                  <span class="text-2xl i-mdi-download"></span>
                </button>
              </span>
            </animated.div>
          </div>
        </Portal>
      </Show>
    </>
  )
}

export default ImageCard
