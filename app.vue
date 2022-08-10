<script lang="ts" setup>
import { storeToRefs } from "pinia";

const route = useRoute();
const router = useRouter();
const loading = ref<boolean>(false);
const store = useStore();
const { reach, sleep } = useUtils();
const { refreshing, navVisible } = storeToRefs(store);
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
  ],
});

watchEffect(async () => {
  if (refreshing.value) return;
  let displacement = 400;
  function moveBack() {
    displacement *= 0.9;
    refreshIconOffset.value =
      reach(displacement, 300, {
        stiffness: 200,
      }) - 200;
    refreshIconAngle.value = reach(displacement, 360, {
      stiffness: 300,
    });
  }
  while (displacement > 0.00001) {
    requestAnimationFrame(moveBack);
    await sleep(10);
  }
  displacement = 0;
  requestAnimationFrame(moveBack);
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
              // console.log("before");
              // await sleep(100);
              // console.log("after");
              refreshing.value = false;
            }
          } else {
            function moveBack() {
              displacement *= 0.9;
              refreshIconOffset.value =
                reach(displacement, 300, {
                  stiffness: 200,
                }) - 200;
              refreshIconAngle.value = reach(displacement, 360, {
                stiffness: 300,
              });
            }
            while (displacement > 0.00001) {
              requestAnimationFrame(moveBack);
              await sleep(10);
            }
            displacement = 0;
            requestAnimationFrame(moveBack);
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
          if (document.scrollingElement.scrollTop !== 0 && displacement < 30)
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
</style>
