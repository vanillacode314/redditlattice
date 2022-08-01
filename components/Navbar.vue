<script setup lang="ts">
import { storeToRefs } from "pinia";

const store = useStore();
const { drawer } = storeToRefs(store);

const isMobile = useMediaQuery("(max-width: 720px)");
const hidden = ref<boolean>(false);

let last_known_scroll_position = 0;
let ticking = false;
const threshold = 50; // in pixels

const onScroll = () => {
  const dy = window.scrollY - last_known_scroll_position;
  last_known_scroll_position = window.scrollY;

  if (!ticking) {
    window.requestAnimationFrame(function () {
      if (Math.abs(dy) > threshold) {
        if (dy > 0) {
          hidden.value = true;
        } else {
          hidden.value = false;
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
  <Transition name="fade">
    <div v-if="!hidden" style="max-height: 10000px">
      <v-app-bar :density="isMobile ? 'default' : 'compact'" app flat>
        <template v-slot:prepend>
          <v-app-bar-nav-icon @click="drawer = !drawer"></v-app-bar-nav-icon>
        </template>

        <v-app-bar-title>RedditLattice</v-app-bar-title>
      </v-app-bar>
    </div>
  </Transition>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
