<script lang="ts" setup>
import { storeToRefs } from "pinia";

const route = useRoute();
const router = useRouter();
const online = useOnline();
const loading = ref<boolean>(false);
const pullToRefreshIcon = ref<HTMLElement>();
const store = useStore();
const { reach, inverseReach } = useUtils();
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
});

function updatePullToRefresh(displacement: number) {
  if (!pullToRefreshIcon.value) return;
  pullToRefreshIcon.value.style.setProperty(
    "--angle",
    `${reach(displacement / 300, 360)}deg`
  );
  pullToRefreshIcon.value.style.setProperty(
    "--y",
    `${reach(displacement / 300, 300) - 200}px`
  );
}

let duration: number = 300;
let start: DOMHighResTimeStamp = undefined;
let previousTimeStamp: DOMHighResTimeStamp = undefined;
let done: boolean = false;
watch(refreshing, () => {
  let startAt: number;
  if (refreshing.value) return;
  const r = pullToRefreshIcon.value.style
    .getPropertyValue("--y")
    .replace("px", "");
  startAt = inverseReach(r ? +r + 200 : 0, 300) * 300;
  function step(timestamp: DOMHighResTimeStamp) {
    if (start === undefined) {
      start = timestamp;
    }
    const elapsed = timestamp - start;
    if (previousTimeStamp !== timestamp) {
      const displacement = Math.max(0, (1 - elapsed / duration) * startAt);
      updatePullToRefresh(displacement);
      done = displacement === 0;
    }
    if (!done) {
      previousTimeStamp = timestamp;
      requestAnimationFrame(step);
      return;
    }
    start = undefined;
  }
  requestAnimationFrame(step);
});

onMounted(() => {
  updatePullToRefresh(0);
  let _startY: number;
  let _lastY: number;

  // TouchStart
  document.body.addEventListener(
    "touchstart",
    (e) => {
      if (refreshing.value) return;
      _startY = e.touches[0].pageY;
      _lastY = e.touches[0].pageY;
    },
    { passive: true }
  );

  // TouchMove
  document.body.addEventListener(
    "touchmove",
    (e) => {
      _lastY = e.touches[0].pageY;
      if (refreshing.value) return;
      const displacement = _lastY - _startY;
      const threshold = 100;
      if (document.scrollingElement.scrollTop !== 0 || displacement < threshold)
        return;
      requestAnimationFrame(() => {
        updatePullToRefresh(displacement);
      });
      document.documentElement.classList.add("noscroll");
    },
    { passive: true }
  );

  // TouchEnd
  document.body.addEventListener(
    "touchend",
    async () => {
      document.documentElement.classList.remove("noscroll");
      if (document.scrollingElement.scrollTop !== 0) return;
      let displacement = _lastY - _startY;
      const shouldRefresh = displacement > 250;
      if (shouldRefresh) {
        refreshing.value = true;
        if (!route.path.startsWith("/r/")) {
          requestAnimationFrame(() => (refreshing.value = false));
        }
      } else {
        const r = pullToRefreshIcon.value.style
          .getPropertyValue("--y")
          .replace("px", "");
        const startAt = inverseReach(r ? +r + 200 : 0, 300) * 300;
        function step(timestamp: DOMHighResTimeStamp) {
          if (start === undefined) {
            start = timestamp;
          }
          const elapsed = timestamp - start;
          if (previousTimeStamp !== timestamp) {
            displacement = Math.max(0, (1 - elapsed / duration) * startAt);
            done = displacement === 0;
            updatePullToRefresh(displacement);
          }
          if (!done) {
            previousTimeStamp = timestamp;
            requestAnimationFrame(step);
            return;
          }
          start = undefined;
        }
        requestAnimationFrame(step);
      }
    },
    { passive: true }
  );
});
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
            <v-btn variant="flat" color="primary" icon>
              <icon name="i-mdi-refresh"></icon>
            </v-btn>
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

body::-webkit-scrollbar {
  width: 0.3rem;
}

body::-webkit-scrollbar-track {
  background-color: transparent;
}

body::-webkit-scrollbar-thumb {
  background-color: #444;
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
  will-change: transform;
  transform: translateX(-50%) translateY(var(--y, -200px))
    rotate(var(--angle, 0deg));
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
