<script setup lang="ts">
import { storeToRefs } from "pinia";

const store = useStore();
const { drawerVisible } = storeToRefs(store);

const links = [
  {
    title: "Home",
    href: "/",
  },
  {
    title: "About",
    href: "/about",
  },
  {
    title: "Settings",
    href: "/settings",
  },
];
</script>

<template>
  <div>
    <Transition name="fade">
      <template v-if="drawerVisible">
        <div
          bg="white/5"
          transition-opacity
          fixed
          inset-0
          z-20
          @click="drawerVisible = false"
        />
      </template>
    </Transition>
    <Transition name="slide">
      <template v-if="drawerVisible">
        <div
          class="drawer"
          bg="black"
          fixed
          left-0
          inset-y-0
          shadow="~ gray-500"
          z-30
          w-80
          transition-transform
          transition-opacity
          gap-2
          flex="~ col"
        >
          <a href="https://raqueebuddinaziz.com" flex="~ col" gap-1 p-5>
            <span text="lg">RedditLattice </span>
            <span text="xs gray-500" font="bold" uppercase tracking-wide>
              Made by Raqueebuddin Aziz
            </span>
          </a>
          <div border="b gray-500" w-full></div>
          <div flex="~ col">
            <NuxtLink
              v-for="{ title, href } of links"
              bg="black hover:gray-900"
              px-5
              py-3
              un-text="sm"
              tracking-wide
              font="bold"
              uppercase
              :to="href"
              @click="drawerVisible = false"
              >{{ title }}</NuxtLink
            >
          </div>
        </div>
      </template>
    </Transition>
  </div>
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
