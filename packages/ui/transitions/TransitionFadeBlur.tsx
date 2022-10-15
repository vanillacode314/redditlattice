import { Component, createEffect, JSXElement, mergeProps } from "solid-js";
import { Transition } from "solid-transition-group";

interface Props {
  duration?: number;
  blur?: boolean;
  children: JSXElement;
}

export const TransitionFade: Component<Props> = (props) => {
  const merged = mergeProps({ duration: 300, blur: false }, props);

  const animationOptions: KeyframeAnimationOptions = {
    duration: merged.duration,
    fill: "forwards",
  };

  let keyframes: Keyframe[];
  createEffect(() => {
    if (merged.blur) {
      keyframes = [
        {
          opacity: "0",
          filter: "blur(1rem)",
        },
        {
          opacity: "1",
          filter: "blur(0px)",
        },
      ];
    } else {
      keyframes = [
        {
          opacity: "0",
        },
        {
          opacity: "1",
        },
      ];
    }
  });

  return (
    <Transition
      onBeforeEnter={(el: HTMLElement) => {
        el.style.opacity = "0";
        if (merged.blur) {
          el.style.filter = "blur(1rem)";
        }
      }}
      onEnter={(el: HTMLElement, done) => {
        const animation = el.animate(keyframes, animationOptions);
        animation.finished.then(done);
      }}
      onExit={(el, done) => {
        const animation = el.animate(keyframes, {
          ...animationOptions,
          direction: "reverse",
        });
        animation.finished.then(done);
      }}
    >
      {props.children}
    </Transition>
  );
};
