import { Component, JSXElement, mergeProps } from "solid-js";
import { TransitionGroup } from "solid-transition-group";

interface Props {
  duration?: number;
  children: JSXElement;
  length: number;
}

export const TransitionStaggeredEnter: Component<Props> = (props) => {
  const merged = mergeProps({ duration: 300 }, props);

  return (
    <TransitionGroup
      onBeforeEnter={(el) => {
        const index = +el.getAttribute("data-index");
        el.style.opacity = 0;
        el.style.transform = `translateY(${index + 1}rem)`;
      }}
      onEnter={(el, done) => {
        const index = +el.getAttribute("data-index");
        if (index === NaN) throw new Error(`${el} has no attribute data-index`);
        const animation = el.animate(
          [
            { transform: `translateY(${index + 1}rem)`, opacity: 0 },
            { transform: "translateY(0rem)", opacity: 1 },
          ],
          {
            delay: index * merged.duration,
            duration: merged.duration,
            easing: "ease",
            fill: "forwards",
          }
        );
        animation.finished.then(done);
      }}
      onExit={(el, done) => {
        const index = +el.getAttribute("data-index");
        if (index === NaN) throw new Error(`${el} has no attribute data-index`);
        const animation = el.animate(
          [
            { transform: "translateY(0rem)", opacity: 1 },
            { transform: `translateY(${index + 1}rem)`, opacity: 0 },
          ],
          {
            delay: (props.length - index - 1) * merged.duration,
            duration: merged.duration,
            easing: "ease",
            fill: "forwards",
          }
        );
        animation.finished.then(done);
      }}
    >
      {props.children}
    </TransitionGroup>
  );
};
