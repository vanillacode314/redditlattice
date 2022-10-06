<script lang="ts" setup>
import "@/assets/main.css";
import { storeToRefs } from "pinia";

const route = useRoute();
const router = useRouter();
const online = useOnline();

/// REFS ///
const pullToRefreshIcon = ref<HTMLElement>();

/// STATE ///
const store = useStore();
const { isRefreshing: refreshing } = storeToRefs(store);
let wasScrollHidden: boolean = false;
const loading = ref<boolean>(false);
/** duration for pull to refresh animation on touch release */
const duration: number = 300;

// watch refreshing and when it's set to false reset pull to refresh icon state
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

/// METHODS ///
function setupLoading() {
  router.beforeEach(() => {
    loading.value = true;
  });
  router.afterEach(() => {
    loading.value = false;
  });
}

/**
 * utility function to update pull to refresh icon state depending on user drag distance
 * @param {number} displacement - the drag distance
 */
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

/** utility function to add touch handlers for pull to refresh */
function setupPullToRefresh() {
  updatePullToRefresh(0);
  let _startY: number;
  let _lastY: number;

  // TouchStart
  document.body.addEventListener(
    "touchstart",
    (e) => {
      wasScrollHidden = document.documentElement.classList.contains("noscroll");
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
      if (!wasScrollHidden) document.documentElement.classList.add("noscroll");
    },
    { passive: true }
  );

  // TouchEnd
  document.body.addEventListener(
    "touchend",
    async () => {
      if (!wasScrollHidden)
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
}

/** fix for weird vh unit behaviour */
function getVH() {
  let vh = window.innerHeight * 0.01;
  document.documentElement.style.setProperty("--vh", `${vh}px`);
}

/// LIFECYCLE HOOKS ///
onMounted(() => {
  setupLoading();
  setupPullToRefresh();
  getVH();
  window.addEventListener("resize", getVH);
  return () => window.removeEventListener("resize", getVH);
});

/// HEAD ///
useHead({
  title: "RedditLattice",
});
</script>

<template>
  <transition name="slide">
    <div v-if="!online" bg="gray" class="online-notif">Not Online</div>
  </transition>
  <div flex="~ col" h-full max-h-full>
    <Drawer />
    <Navbar />
    <div grow overflow-hidden>
      <template v-if="loading">
        <div grid place-content-center p-5>
          <Spinner />
        </div>
      </template>
      <template v-else>
        <NuxtPage />
      </template>
    </div>
  </div>
</template>
