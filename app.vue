<script lang="ts" setup>
import { storeToRefs } from "pinia";

const route = useRoute();
const router = useRouter();
const loading = ref<boolean>(false);
const store = useStore();
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
  ],
});

onMounted(() => {
  let _startY;

  main.value.addEventListener(
    "touchstart",
    (e) => {
      _startY = e.touches[0].pageY;
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
        // refresh inbox.
        refreshing.value = true;
        if (route.path === "/") {
          refreshing.value = false;
        }
      }
    },
    { passive: true }
  );
});
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
          <div class="overlay"></div>
          <transition name="slide-fade">
            <div class="refresher">
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
    transform: translateX(-50%) rotate(0deg);
  }
  to {
    transform: translateX(-50%) rotate(360deg);
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
      transform: translateX(-50%);
      opacity: 1;
      animation: spin 1s ease infinite;
      animation-delay: 0.1s;
    }
  }
  .refresher {
    transition: opacity 0.3s ease-out, transform 0.1s ease-out;
    opacity: 0;
    z-index: 10;
    position: absolute;
    top: 1rem;
    left: 50%;
    transform: translateX(-50%) translateY(-100%);
  }
}
</style>
