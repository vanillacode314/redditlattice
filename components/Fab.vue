<script setup lang="ts">
import type { IAction } from "~/types";
/// STATE ///
const props = defineProps<{
  icon: string;
  actions: IAction[];
  selected: IAction["id"];
}>();
const active = ref<boolean>(false);
const hidden = ref<boolean>(false);

let last_known_scroll_position = 0;
let ticking = false;
const threshold = 50; // in pixels
const transitionDuration = 100;

/// METHODS ///
/** hide on scroll */
const onScroll = () => {
  const scroller = document.getElementById("scroller");
  const dy = scroller.scrollTop - last_known_scroll_position;
  last_known_scroll_position = scroller.scrollTop;

  if (!ticking) {
    window.requestAnimationFrame(function () {
      active.value = false;
      if (Math.abs(dy) > threshold) {
        if (dy > 0) {
          hidden.value = true;
        } else {
          hidden.value = false;
        }
      }
      ticking = false;
    });

    ticking = true;
  }
};

function toggleActive() {
  active.value = !active.value;
}

function close() {
  active.value = false;
}

/// TRANSITION METHODS ///
function onBeforeEnter(el: HTMLElement) {
  const index = Number(el.dataset.index);
  el.style.opacity = "0";
  el.style.transform = `translateY(${index + 1}rem)`;
}

function onEnter(el: HTMLElement, done) {
  const index = Number(el.dataset.index);
  const fadeUp = [
    { transform: `translateY(${index + 1}rem)`, opacity: 0 },
    { transform: "translateY(0rem)", opacity: 1 },
  ];
  const anim = el.animate(fadeUp, {
    delay: (props.actions.length - index - 1) * transitionDuration,
    duration: transitionDuration,
    easing: "ease",
    fill: "forwards",
  });
  anim.onfinish = done;
}

function onLeave(el: HTMLElement, done) {
  const index = Number(el.dataset.index);
  const fadeDown = [
    { transform: "translateY(0rem)", opacity: 1 },
    { transform: `translateY(${index + 1}rem)`, opacity: 0 },
  ];
  const anim = el.animate(fadeDown, {
    delay: index * transitionDuration,
    duration: transitionDuration,
    easing: "ease",
    fill: "forwards",
  });
  anim.onfinish = done;
}

/// LIFECYCLE HOOKS ///
onMounted(() => {
  const scroller = document.getElementById("scroller");
  if (scroller) scroller.addEventListener("scroll", onScroll);
});
onUnmounted(() => {
  const scroller = document.getElementById("scroller");
  if (scroller) scroller.removeEventListener("scroll", onScroll);
});
</script>

<template>
  <transition name="fade">
    <div v-if="!hidden" fixed bottom-5 right-5 grid gap-5>
      <div flex="~ col" items-center gap-2>
        <TransitionGroup
          :css="false"
          @before-enter="onBeforeEnter"
          @enter="onEnter"
          @leave="onLeave"
        >
          <span
            :data-index="index"
            v-for="(action, index) in active ? actions : []"
            :key="action.id"
          >
            <button
              text="2xl"
              p-3
              outline-none
              rounded-full
              shadow
              v-if="selected"
              :bg="
                selected === action.id
                  ? 'purple-800 hover:purple-700 focus:purple-700'
                  : 'black hover:gray-900 focus:gray-900'
              "
              @click="
                () => {
                  action.callback();
                  close();
                }
              "
            >
              <div :class="action.icon" />
            </button>
          </span>
        </TransitionGroup>
      </div>
      <div class="fab" :class="{ active }" transition>
        <slot>
          <button
            @click="toggleActive()"
            bg="black hover:gray-900 focus:gray-900"
            outline-none
            p-4
            shadow
            rounded-full
          >
            <div :class="active ? 'i-mdi-close' : icon" text="2xl"></div>
          </button>
        </slot>
      </div>
    </div>
  </transition>
</template>

<style scoped>
.fab.active {
  transform: rotate(90deg);
}

.fade-enter-active,
.fade-leave-active {
  transition: transform 0.2s ease-out;
}

.fade-enter-from,
.fade-leave-to {
  transform: translateX(100%) !important;
}
</style>
