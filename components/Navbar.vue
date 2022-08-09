<script setup lang="ts">
import { storeToRefs } from "pinia";

const store = useStore();
const { navVisible, drawer } = storeToRefs(store);

const isMobile = useMediaQuery("(max-width: 720px)");

let last_known_scroll_position = 0;
let ticking = false;
const threshold = 50; // in pixels

const onScroll = () => {
  const dy = window.scrollY - last_known_scroll_position;
  last_known_scroll_position = window.scrollY;
  const reached_top = window.scrollY < 1;

  if (!ticking) {
    window.requestAnimationFrame(() => {
      if (reached_top) {
        if (dy < 0) {
          navVisible.value = true;
        }
      } else if (Math.abs(dy) > threshold) {
        if (dy > 0) {
          navVisible.value = false;
        } else {
          navVisible.value = true;
        }
      }
      ticking = false;
    });

    ticking = true;
  }
};
onMounted(() => {
  window.addEventListener("scroll", onScroll);
});
onUnmounted(() => {
  window.removeEventListener("scroll", onScroll);
});
</script>

<template>
  <Transition name="slide">
    <v-app-bar
      v-if="navVisible"
      :density="isMobile ? 'default' : 'compact'"
      app
      flat
    >
      <template v-slot:prepend>
        <v-app-bar-nav-icon @click="drawer = !drawer"></v-app-bar-nav-icon>
      </template>
      <v-app-bar-title>RedditLattice</v-app-bar-title>

      <v-spacer></v-spacer>
      <v-btn v-if="$route.path.startsWith('/r/')" icon>
        <v-icon>mdi-magnify</v-icon>
      </v-btn>
    </v-app-bar>
  </Transition>
</template>

<style scoped>
.slide-enter-active,
.slide-leave-active {
  transition: all 0.3s cubic-bezier(0.86, 0, 0.07, 1);
}

.slide-enter-from,
.slide-leave-to {
  transform: translateY(-100%) !important;
}
</style>
