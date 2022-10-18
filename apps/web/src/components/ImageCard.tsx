import {
  createComputed,
  createSignal,
  mergeProps,
  Component,
  createMemo,
  Show,
} from 'solid-js'
import { Portal } from 'solid-js/web'
import { animated, createSpring } from 'solid-spring'
import { useLocation, useNavigate } from 'solid-start'
import { longpress } from '~/utils/use-longpress'
import { IMAGE_SERVER_BASE_PATH } from '~/consts'
import { TransitionFade } from 'ui/transitions'
import { AutoResizingPicture, Button } from 'ui'
import { IImage, useUserState } from '~/stores'
import _ from 'lodash'

interface Props {
  width: number
  image: IImage
  onLoad?: () => void
}

export const ImageCard: Component<Props> = (props) => {
  const [userState] = useUserState()
  const merged = mergeProps({ onLoad: () => {} }, props)
  const [error, setError] = createSignal<boolean>(false)
  const [animate, setAnimate] = createSignal<boolean>(false)
  const navigate = useNavigate()
  const location = useLocation()

  const popupVisible = createMemo<boolean>(
    () => location.hash === '#popup-' + props.image.name
  )

  createComputed<'open' | 'closed' | undefined>((prevState) => {
    if (!popupVisible() && animate()) {
      navigate(
        location.pathname + location.search + '#popup-' + props.image.name
      )
      setAnimate(false)
      return 'closed'
    }
    if (popupVisible() && !animate() && prevState !== 'closed') {
      setAnimate(true)
      return 'open'
    }
  }, 'open')

  const scale = createSpring(() => ({
    transform: `scale(${animate() ? 1 : 0})`,
    onRest: () => !animate() && history.go(-1),
  }))

  function getProcessedImageURL(
    url: string,
    width: number,
    format: string = 'webp'
  ): string {
    return `${IMAGE_SERVER_BASE_PATH}/?url=${url}&width=${width}&format=${format}`
  }

  function getSources() {
    const state = userState()!
    const width = Math.round(props.width / 50) * 50 * state.imageSizeMultiplier
    const formats = _.uniq([userState()!.prefferedImageFormat, 'webp'])
    return new Map(
      formats.map((format) => [
        `image/${format}`,
        state.processImages
          ? getProcessedImageURL(props.image.url, width, format)
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
              ? getProcessedImageURL(props.image.url, props.width)
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
              <span class="p-5 uppercase tracking-wide bg-black text-white font-bold">
                {props.image.title}
              </span>
            </animated.div>
          </div>
        </Portal>
      </Show>
    </>
  )
}

export default ImageCard
