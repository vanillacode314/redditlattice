<script setup lang="ts">
export interface Action {
  id: string;
  icon: string;
  callback: Function;
}

const props = defineProps<{
  icon: string;
  actions: Action[];
  active: Action["id"];
}>();

const selected = ref<boolean>(false);
const hidden = ref<boolean>(false);

let last_known_scroll_position = 0;
let ticking = false;
const threshold = 50; // in pixels
const transitionDuration = 100;

function onBeforeEnter(el) {
  const index = Number(el.dataset.index);
  el.style.opacity = 0;
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

const onScroll = () => {
  const dy = window.scrollY - last_known_scroll_position;
  last_known_scroll_position = window.scrollY;

  if (!ticking) {
    window.requestAnimationFrame(function () {
      selected.value = false;
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
  selected.value = !selected.value;
}

function close() {
  selected.value = false;
}

onMounted(() => {
  window.addEventListener("scroll", onScroll);
});
onUnmounted(() => {
  window.removeEventListener("scroll", onScroll);
});
</script>

<template>
  <transition name="fade">
    <div class="wrapper" v-if="!hidden">
      <div class="actions">
        <TransitionGroup
          :css="false"
          @before-enter="onBeforeEnter"
          @enter="onEnter"
          @leave="onLeave"
        >
          <span
            :data-index="index"
            v-for="(action, index) in selected ? actions : []"
            :key="action.id"
          >
            <v-btn
              :icon="action.icon"
              v-if="selected"
              :color="active === action.id ? 'primary' : ''"
              @click="
                () => {
                  action.callback();
                  close();
                }
              "
            />
          </span>
        </TransitionGroup>
      </div>
      <div class="fab" :class="{ active: selected }">
        <slot>
          <v-btn
            size="large"
            @click="toggleActive()"
            :variant="selected ? 'flat' : 'elevated'"
            :icon="selected ? 'mdi-close' : icon"
          >
          </v-btn>
        </slot>
      </div>
    </div>
  </transition>
</template>

<style scoped>
.wrapper {
  position: fixed;
  bottom: 1rem;
  right: 1rem;
}

.actions {
  padding: 0.5rem 0;
  display: grid;
  justify-content: center;
  gap: 0.5rem;
}

.fab {
  transition: transform 0.1s ease-in;
}

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
