import {
  createEffect,
  createSignal,
  on,
  createMemo,
  For,
  mergeProps,
  onCleanup,
  onMount,
  Component,
  Show,
} from "solid-js";
import { Portal } from "solid-js/web";
import { animated, createSpring } from "solid-spring";
import { useLocation, useNavigate } from "solid-start";
import _ from "lodash";
import type { IPost } from "~/types";
import { longpress } from "~/utils/use-longpress";
import { IMAGE_SERVER_BASE_PATH } from "~/consts";
import { TransitionFade } from "ui/transitions";
import { AutoResizingPicture, Button } from "ui";
import { imageTrpc } from "~/image-client";

interface Props {
  width: number;
  image: Pick<IPost, "name" | "url" | "title">;
  onLoad?: () => void;
}

export const ImageCard: Component<Props> = (props) => {
  const merged = mergeProps({ onLoad: () => {} }, props);
  const [error, setError] = createSignal<boolean>(false);
  const [popupVisible, setPopupVisible] = createSignal<boolean>(false);
  const [animate, setAnimate] = createSignal<boolean>(false);
  const navigate = useNavigate();
  const location = useLocation();

  createEffect(() =>
    popupVisible()
      ? navigate(
          location.pathname + location.search + "#popup-" + props.image.name,
          {
            resolve: false,
          }
        )
      : location.hash === "#popup-" + props.image.name &&
        navigate(location.pathname + location.search, { resolve: false })
  );

  const scale = createSpring(() => ({
    transform: `scale(${animate() ? 1 : 0})`,
    onRest: () => setPopupVisible(animate()),
  }));

  function getProcessedImageURL(
    url: string,
    width: number,
    format: string = "webp"
  ): string {
    return `${IMAGE_SERVER_BASE_PATH}/?url=${url}&width=${width}&format=${format}`;
  }

  function getSources() {
    const width = Math.round(props.width / 50) * 50 * 2;
    return new Map(
      [
        /* "avif", */
        "webp",
      ].map((format) => [
        `image/${format}`,
        getProcessedImageURL(props.image.url, width, format),
      ])
    );
  }

  function popupImage() {
    setAnimate(true);
    setPopupVisible(true);
  }

  function removePopupImage() {
    setAnimate(false);
  }

  async function retry() {
    setError(false);
  }

  function onError() {
    setError(true);
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
                class="bg-white/10"
                animate-pulse
                h-10
                w-10
                rounded-full
              ></div>
            </div>
          }
          width={props.width}
          fallbackHeight={props.width}
          use:longpress
          srcSets={getSources()}
          src={getProcessedImageURL(props.image.url, props.width)}
          onLoad={() => merged.onLoad()}
          onError={() => onError()}
          alt={props.image.title}
        ></AutoResizingPicture>
      </Show>
      <Show when={popupVisible()}>
        <Portal mount={document.body}>
          <div
            class="fixed inset-0 grid place-content-center"
            classList={{ "pointer-events-none": !popupVisible() }}
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
              class="z-20 w-full flex flex-col pointer-events-none bg-black w-full"
              style={scale()}
            >
              <img
                src={popupVisible() ? props.image.url : null}
                alt={props.image.title}
              />
              <span class="p-5 uppercase tracking-wide bg-black text-white font-bold">
                {props.image.title}
              </span>
            </animated.div>
          </div>
        </Portal>
      </Show>
    </>
  );
};

export default ImageCard;
