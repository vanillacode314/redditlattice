<script lang="ts" setup>
import { storeToRefs } from "pinia";

const route = useRoute();
const router = useRouter();
const loading = ref<boolean>(false);
const store = useStore();
const { refreshing, navVisible } = storeToRefs(store);
router.beforeEach(() => {
  loading.value = true;
});
router.afterEach(() => {
  loading.value = false;
});

let showRefresh = ref<boolean>(false);
const angle = ref<number>(0);
const my_y = ref<number>(-200);

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

watchEffect(() => {
  if (refreshing.value) return;
  showRefresh.value = false;
});

watch(
  loading,
  () => {
    if (loading.value) return;
    requestAnimationFrame(() => {
      let _startY: number;
      let _lastY: number;
      let doRefresh: boolean = false;

      main.value.addEventListener(
        "touchstart",
        (e) => {
          _startY = e.touches[0].pageY;
        },
        { passive: true }
      );

      main.value.addEventListener(
        "touchend",
        async () => {
          if (doRefresh) {
            doRefresh = false;
            refreshing.value = true;
            if (route.path === "/") {
              refreshing.value = false;
            }
          } else {
            let x = Math.min((_lastY - _startY) / 500, 1);
            while (x > 0.00001) {
              x *= 0.95;
              angle.value = Math.sin((x * Math.PI) / 2) * 180;
              my_y.value = Math.sin((x * Math.PI) / 2) * 200 - 200;
              await new Promise((resolve) => setTimeout(resolve, 10));
            }
            angle.value = 0;
            my_y.value = -200;
            showRefresh.value = true;
          }
        },
        { passive: true }
      );

      main.value.addEventListener(
        "touchmove",
        (e) => {
          const y = e.touches[0].pageY;
          _lastY = y;
          const x = Math.min((y - _startY) / 500, 1);
          angle.value = Math.sin((x * Math.PI) / 2) * 180;
          my_y.value = Math.sin((x * Math.PI) / 2) * 100 - 100;
          if (
            document.scrollingElement.scrollTop === 0 &&
            y > _startY &&
            !main.value.classList.contains("refreshing")
          ) {
            if (!navVisible.value) return;
            // refresh inbox.
            showRefresh.value = true;
            doRefresh = true;
          } else {
            doRefresh = false;
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
          <!-- <div class="overlay"></div> -->
          <transition name="slide-fade">
            <div
              class="refresher"
              v-if="showRefresh"
              :style="{
                '--angle': `${angle}deg`,
                '--y': `${my_y}%`,
              }"
            >
              <v-btn variant="flat" icon="mdi-refresh" color="primary"></v-btn>
            </div>
          </transition>
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
</style>

<style scoped lang="scss">
@keyframes spin {
  from {
    transform: translateY(0%) translateX(-50%) rotate(0deg);
  }
  to {
    transform: translateY(0%) translateX(-50%) rotate(360deg);
  }
}
.main {
  height: 100%;
  position: relative;
  .overlay {
    transition: opacity 0.3s;
    opacity: 0;
  }
  &.refreshing {
    touch-action: none;
    .overlay {
      opacity: 1;
      position: fixed;
      backdrop-filter: blur(1px);
      inset: 0;
    }
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
