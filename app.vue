<script lang="ts" setup>
import { storeToRefs } from "pinia";

const route = useRoute();
const router = useRouter();
const online = useOnline();
const loading = ref<boolean>(false);
const pullToRefreshIcon = ref<HTMLElement>();
const store = useStore();
const { animate, reach, inverseReach } = useUtils();
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

let wasScroll: boolean = false;
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

const duration: number = 300;
watch(refreshing, () => {
  if (refreshing.value) return;
  const yPos = pullToRefreshIcon.value.style
    .getPropertyValue("--y")
    .replace("px", "");
  const startAt = inverseReach(yPos ? +yPos + 200 : 0, 300) * 300;
  animate((elapsed) => {
    const displacement = Math.max(0, (1 - elapsed / duration) * startAt);
    updatePullToRefresh(displacement);
    return displacement === 0;
  });
});

onMounted(() => {
  updatePullToRefresh(0);
  let _startY: number;
  let _lastY: number;

  // TouchStart
  document.body.addEventListener(
    "touchstart",
    (e) => {
      wasScroll = document.documentElement.classList.contains("noscroll");
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
      if (!wasScroll) document.documentElement.classList.add("noscroll");
    },
    { passive: true }
  );

  // TouchEnd
  document.body.addEventListener(
    "touchend",
    async () => {
      if (!wasScroll) document.documentElement.classList.remove("noscroll");
      if (document.scrollingElement.scrollTop !== 0) return;
      let displacement = _lastY - _startY;
      const shouldRefresh = displacement > 250;
      if (shouldRefresh) {
        refreshing.value = true;
        if (!route.path.startsWith("/r/")) {
          requestAnimationFrame(() => (refreshing.value = false));
        }
      } else {
        const yPos = pullToRefreshIcon.value.style
          .getPropertyValue("--y")
          .replace("px", "");
        const startAt = inverseReach(yPos ? +yPos + 200 : 0, 300) * 300;
        animate((elapsed) => {
          const displacement = Math.max(0, (1 - elapsed / duration) * startAt);
          updatePullToRefresh(displacement);
          return displacement === 0;
        });
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
