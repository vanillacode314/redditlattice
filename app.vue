<script lang="ts" setup>
import "@/assets/main.css";
const online = useOnline();

/// HEAD ///
useHead({
  title: "RedditLattice",
});
</script>

<template>
  <div flex="~ col" h-full max-h-full relative>
    <div
      absolute
      top-0
      inset-x-0
      z-10
      p-6
      grid
      place-content-center
      pointer-events-none
      bg-transparent
    >
      <div id="pull-to-refresh" p-2 bg="purple" rounded-full>
        <div text="2xl" class="i-mdi-refresh"></div>
      </div>
    </div>
    <transition name="slide">
      <div
        v-if="!online"
        bg="gray-800"
        px-5
        py-2
        text="sm"
        font="bold"
        tracking-wide
        uppercase
      >
        Not Online
      </div>
    </transition>
    <Navbar />
    <Drawer />
    <div grow overflow-hidden>
      <!-- <div grid place-content-center p-5 v-if="loading"> -->
      <!--   <Spinner /> -->
      <!-- </div> -->
      <NuxtPage />
    </div>
  </div>
</template>

<style>
.page-enter-active,
.page-leave-active {
  transition: all 0.2s;
}
.page-enter-from,
.page-leave-to {
  opacity: 0;
  filter: blur(1rem);
}
</style>

<style scoped>
#pull-to-refresh {
  --initial: -200%;
  --y: calc(var(--offset, 0px) + var(--initial));
  transform: translateY(var(--y)) rotate(var(--angle, 0deg));
}
</style>
