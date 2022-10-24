import {
  Show,
  createEffect,
  on,
  onCleanup,
  createSignal,
  Component,
  JSXElement,
} from 'solid-js';
import { useLocation } from 'solid-start';
import Drawer from '~/components/Drawer';
import Navbar from '~/components/Navbar';
import { animated, createSpring } from 'solid-spring';
import { createConnectivitySignal } from '@solid-primitives/connectivity';
import { useAppState } from '~/stores';

interface Props {
  children: JSXElement;
}
export const BaseLayout: Component<Props> = (props) => {
  const isOnline = createConnectivitySignal;
  const location = useLocation();
  const [offset, setOffset] = createSignal(0);
  const [down, setDown] = createSignal<boolean>(false);
  const [, setAppState] = useAppState();
  const threshold = 300;

  createEffect(
    on(
      () => location.pathname,
      () => {
        const scroller = document.getElementById('scroller');
        let startY: number = 0;
        let touchId: number = -1;
        let shouldRefresh: boolean = false;
        if (!scroller) return;

        const onTouchStart = (e: TouchEvent) => {
          if (touchId > -1) return;
          const touch = e.changedTouches[0];
          let scrollPos = scroller.scrollTop;
          if (scrollPos < 0)
            scrollPos += scroller.scrollHeight - scroller.clientHeight;
          startY = touch.screenY + scrollPos;
          touchId = touch.identifier;
          setDown(true);
        };

        let ticking: boolean = false;
        const onTouchMove = (e: TouchEvent) => {
          if (ticking) return;
          requestAnimationFrame(() => {
            if (touchId < 0) {
              ticking = false;
              return;
            }
            const touch = e.changedTouches[0];
            if (touchId != touch.identifier) {
              ticking = false;
              return;
            }
            let scrollPos = scroller.scrollTop;
            if (scrollPos < 0)
              scrollPos += scroller.scrollHeight - scroller.clientHeight;
            const distance = touch.screenY - startY - scrollPos;
            shouldRefresh = scroller.scrollTop < 2 && distance >= threshold;
            setOffset(Math.min(threshold, distance));
            ticking = false;
          });
          ticking = true;
        };

        const onTouchEnd = (e: TouchEvent) => {
          if (touchId < 0) return;
          const touch = e.changedTouches[0];
          if (!touch) return;
          if (touchId != touch.identifier) return;
          touchId = -1;
          if (shouldRefresh) {
            shouldRefresh = false;
            setAppState('images', {
              key: '',
              after: '',
              data: new Set(),
            });
          }
          setDown(false);
          setOffset(0);
        };
        scroller.addEventListener('touchstart', onTouchStart, {
          passive: true,
        });
        scroller.addEventListener('touchmove', onTouchMove, { passive: true });
        scroller.addEventListener('touchend', onTouchEnd, { passive: true });
        scroller.addEventListener('touchcancel', onTouchEnd, { passive: true });
        onCleanup(() => {
          scroller.removeEventListener('touchstart', onTouchStart);
          scroller.removeEventListener('touchmove', onTouchMove);
          scroller.removeEventListener('touchend', onTouchEnd);
          scroller.removeEventListener('touchcancel', onTouchEnd);
        });
      }
    )
  );

  const move = createSpring(() => ({
    from: {
      transform: `translateY(0px) rotate(0deg)`,
    },
    to: {
      transform: `translateY(${offset() - 200}%) rotate(${offset()}deg)`,
    },
    immediate: down(),
  }));

  return (
    <div flex="~ col" h-full max-h-full relative>
      <div class="bg-tranparent pointer-events-none place-content-center grid p-6 z-10 inset-x-0 top-0 absolute">
        <animated.div
          class="p-2 bg-purple z-10 rounded-full relative"
          style={move()}
        >
          <div text="3xl" class="i-mdi-refresh"></div>
        </animated.div>
      </div>
      <Show when={!isOnline()}>
        <div
          bg="gray-800"
          px-5
          py-2
          text="sm"
          font="bold"
          tracking-wide
          uppercase
        >
          Not Online
        </div>
      </Show>
      <Navbar />
      <Drawer />
      <div grow overflow-hidden>
        {props.children}
      </div>
    </div>
  );
};

export default BaseLayout;
