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
        () => {
          if (!doRefresh) return;
          doRefresh = false;
          refreshing.value = true;
          if (route.path === "/") {
            refreshing.value = false;
          }
        },
        { passive: true }
      );

      main.value.addEventListener(
        "touchmove",
        (e) => {
          const y = e.touches[0].pageY;
          // Activate custom pull-to-refresh effects when at the top of the container
          // and user is scrolling up.
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
            showRefresh.value = false;
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
            <div class="refresher" v-if="showRefresh">
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
  transform: translateX(-50%) translateY(0%);
}

.slide-fade-enter-active {
  transition: all 0.4s ease-out;
  animation: none !important;
}

.slide-fade-leave-active {
  transition: all 0.2s ease-in;
  animation: none !important;
}
.slide-fade-enter-from,
.slide-fade-leave-to {
  transform: translateX(-50%) translateY(-100%);
  /* opacity: 0; */
}
</style>
