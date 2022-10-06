<script setup lang="ts">
import { storeToRefs } from "pinia";

const store = useStore();
const { drawerVisible } = storeToRefs(store);
</script>

<template>
  <Transition name="fade">
    <template v-if="drawerVisible" transition-opacity>
      <div bg="white/5" fixed inset-0 z-10 @click="drawerVisible = false" />
    </template>
  </Transition>
  <Transition name="slide">
    <template v-if="drawerVisible">
      <div
        bg="black"
        fixed
        left-0
        inset-y-0
        shadow="~ gray-500"
        z-20
        w-80
        transition-transform
        transition-opacity
        gap-2
        flex="~ col"
      >
        <a href="https://raqueebuddinaziz.com" flex="~ col" gap-1 p-5>
          <span text="lg">RedditLattice </span>
          <span text="xs gray-500" font="bold" uppercase>
            Made by Raqueebuddin Aziz
          </span>
        </a>
        <div border="b gray-500" w-full></div>
        <div flex="~ col">
          <NuxtLink
            bg="black hover:gray-900"
            px-5
            py-3
            to="/"
            un-text="sm"
            tracking-wide
            font="bold"
            uppercase
            @click="drawerVisible = false"
            >Home</NuxtLink
          >
          <NuxtLink
            bg="black hover:gray-900"
            px-5
            py-3
            tracking-wide
            un-text="sm"
            font="bold"
            uppercase
            to="/about"
            @click="drawerVisible = false"
            >About</NuxtLink
          >
        </div>
      </div>
    </template>
  </Transition>
</template>

<style scoped>
.slide-enter-from,
.slide-leave-to {
  opacity: 0;
  transform: translateX(-100%);
}

.slide-enter-to,
.slide-leave-from {
  opacity: 1;
  transform: translateX(0%);
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
.fade-enter-to,
.fade-leave-from {
  opacity: 1;
}
</style>
