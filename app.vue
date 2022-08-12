<script lang="ts" setup>
import { storeToRefs } from "pinia";

const route = useRoute();
const router = useRouter();
const online = useOnline();
const loading = ref<boolean>(false);
const store = useStore();
const { reach, sleep } = useUtils();
const { refreshing } = storeToRefs(store);
router.beforeEach(() => {
  loading.value = true;
});
router.afterEach(() => {
  loading.value = false;
});

const refreshIconAngle = ref<number>(0);
const refreshIconOffset = ref<number>(-200);

const main = ref<HTMLElement>();

useHead({
  title: "RedditLattice",
  meta: [
    {
      name: "description",
      content:
        "A reddit viewer for image based subreddits. Lays out the images in a tight lattice.",
    },
    {
      name: "theme-color",
      content: "#000000",
    },
  ],
});

let animHandler: number;
watch(refreshing, () => {
  let displacement = 400;
  if (refreshing.value) {
    cancelAnimationFrame(animHandler);
    animHandler = undefined;
    return;
  } else {
    displacement = 400;
    moveBack();
  }
  async function moveBack() {
    displacement -= 50;
    refreshIconOffset.value =
      reach(displacement, 300, {
        stiffness: 200,
      }) - 200;
    refreshIconAngle.value = reach(displacement, 360, {
      stiffness: 300,
    });
    if (displacement > 0) {
      animHandler = requestAnimationFrame(moveBack);
      await sleep(0.01);
    } else {
      displacement = 0;
      refreshIconOffset.value =
        reach(displacement, 300, {
          stiffness: 200,
        }) - 200;
      refreshIconAngle.value = reach(displacement, 360, {
        stiffness: 300,
      });
    }
  }
});

watch(
  main,
  () => {
    if (!main.value) return;
    requestAnimationFrame(() => {
      let _startY: number;
      let _lastY: number;

      // TouchStart
      main.value.addEventListener(
        "touchstart",
        (e) => {
          if (refreshing.value) return;
          _startY = e.touches[0].pageY;
        },
        { passive: true }
      );

      // TouchEnd
      main.value.addEventListener(
        "touchend",
        async () => {
          let displacement = _lastY - _startY;
          document.documentElement.style.overflow = "auto";
          const shouldRefresh = displacement > 250;
          if (shouldRefresh) {
            refreshing.value = true;
            if (route.path === "/") {
              requestAnimationFrame(() => (refreshing.value = false));
            }
          } else {
            async function moveBack() {
              displacement -= 50;
              refreshIconOffset.value =
                reach(displacement, 300, {
                  stiffness: 200,
                }) - 200;
              refreshIconAngle.value = reach(displacement, 360, {
                stiffness: 300,
              });
              if (displacement > 0) {
                animHandler = requestAnimationFrame(moveBack);
                await sleep(0.01);
              } else {
                displacement = 0;
                refreshIconOffset.value =
                  reach(displacement, 300, {
                    stiffness: 200,
                  }) - 200;
                refreshIconAngle.value = reach(displacement, 360, {
                  stiffness: 300,
                });
              }
            }
            moveBack();
          }
        },
        { passive: true }
      );

      // TouchMove
      main.value.addEventListener(
        "touchmove",
        (e) => {
          if (refreshing.value) return;
          const displacement = _lastY - _startY;
          if (document.scrollingElement.scrollTop !== 0 && displacement < 70)
            return;
          _lastY = e.touches[0].pageY;
          requestAnimationFrame(() => {
            const displacement = _lastY - _startY;
            refreshIconOffset.value =
              reach(displacement, 300, {
                stiffness: 200,
              }) - 200;
            refreshIconAngle.value = reach(displacement, 360, {
              stiffness: 300,
            });
          });
          if (document.documentElement.style.overflow !== "hidden")
            document.documentElement.style.overflow = "hidden";
        },
        { passive: true }
      );
    });
  },
  { immediate: true }
);
</script>

<template>
  <transition name="slide">
    <div v-if="!online" class="online-notif">Not Online</div>
  </transition>
  <v-app theme="myDarkTheme">
    <Drawer />
    <Navbar />
    <v-main>
      <template v-if="loading">
        <div class="d-flex pa-6 justify-center">
          <v-progress-circular indeterminate></v-progress-circular>
        </div>
      </template>
      <template v-else>
        <div class="main" :class="{ refreshing: refreshing }" ref="main">
          <NuxtPage />
          <div
            class="refresher"
            :style="{
              '--angle': `${refreshIconAngle}deg`,
              '--y': `${refreshIconOffset}%`,
            }"
          >
            <v-btn variant="flat" icon="mdi-refresh" color="primary"></v-btn>
          </div>
        </div>
      </template>
      <!-- <Notifications /> -->
    </v-main>
  </v-app>
</template>

<style>
body,
html {
  overscroll-behavior-y: none;
}
.noscroll {
  overscroll-behavior-y: none;
  overflow: hidden;
}
</style>

<style scoped lang="scss">
@keyframes spin {
  from {
    transform: translateX(-50%) translateY(var(--y)) rotate(0deg);
  }
  to {
    transform: translateX(-50%) translateY(var(--y)) rotate(360deg);
  }
}
.online-notif {
  background-color: #222;
  padding: 0.5rem;
  display: grid;
  place-content: center;
  z-index: 10000;
  position: fixed;
  bottom: 0;
  left: 0;
  font-size: small;
  text-transform: uppercase;
  font-weight: bold;
  right: 0;
}
.main {
  height: 100%;
  position: relative;
  &.refreshing {
    touch-action: none;
    .refresher {
      animation: spin 1s infinite;
    }
  }
}
.refresher {
  z-index: 10;
  position: absolute;
  top: 1rem;
  left: 50%;
  transform: translateX(-50%) translateY(var(--y)) rotate(var(--angle));
}

.slide-enter-active {
  transition: transform 0.3s ease-in;
}
.slide-leave-active {
  transition: transform 0.3s ease-out;
}
.slide-enter-from,
.slide-leave-to {
  transform: translateY(100%);
}
</style>
