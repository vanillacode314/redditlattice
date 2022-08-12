<script lang="ts" setup>
import { storeToRefs } from "pinia";

const route = useRoute();
const router = useRouter();
const online = useOnline();
const loading = ref<boolean>(false);
const pullToRefreshIcon = ref<HTMLElement>();
const store = useStore();
const { reach, sleep } = useUtils();
const { refreshing } = storeToRefs(store);
router.beforeEach(() => {
  loading.value = true;
});
router.afterEach(() => {
  loading.value = false;
});
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

function updatePullToRefresh(displacement: number) {
  return requestAnimationFrame(() => {
    pullToRefreshIcon.value.style.setProperty(
      "--angle",
      `${reach(displacement, 360, {
        stiffness: 300,
      })}deg`
    );
    pullToRefreshIcon.value.style.setProperty(
      "--y",
      `${
        reach(displacement, 300, {
          stiffness: 200,
        }) - 200
      }px`
    );
  });
}
updatePullToRefresh(0);
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
    displacement -= 10;
    animHandler = updatePullToRefresh(displacement);
    if (displacement > 0) {
      await sleep(1);
      moveBack();
    } else {
      updatePullToRefresh(0);
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

      // TouchMove
      main.value.addEventListener(
        "touchmove",
        (e) => {
          if (refreshing.value) return;
          _lastY = e.touches[0].pageY;
          const displacement = _lastY - _startY;
          const threshold = 100;
          if (
            document.scrollingElement.scrollTop !== 0 ||
            displacement < threshold
          )
            return;
          updatePullToRefresh(displacement);
          document.documentElement.classList.add("noscroll");
        },
        { passive: true }
      );

      // TouchEnd
      main.value.addEventListener(
        "touchend",
        async () => {
          document.documentElement.classList.remove("noscroll");
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
              animHandler = updatePullToRefresh(displacement);
              if (displacement > 0) {
                moveBack();
                await sleep(0.01);
              } else {
                updatePullToRefresh(0);
              }
            }
            moveBack();
          }
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
          <div ref="pullToRefreshIcon" class="refresher">
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
