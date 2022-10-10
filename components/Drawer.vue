<script setup lang="ts">
import { storeToRefs } from "pinia";

const store = useStore();
const { drawerVisible } = storeToRefs(store);
const version = __version__;

interface ILink {
  title: string;
  icon?: string;
  href: string;
}

const links: ILink[] = [
  {
    title: "Home",
    icon: "i-mdi-home",
    href: "/",
  },
  {
    title: "Settings",
    icon: "i-mdi-cog",
    href: "/settings",
  },
  {
    title: "About",
    icon: "i-mdi-about",
    href: "/about",
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
          z-30
          w-80
          gap-5
          flex="~ col"
        >
          <a href="https://raqueebuddinaziz.com" flex="~ col" gap-1 pt-5 px-5>
            <span text="lg">RedditLattice </span>
            <span text="xs gray-500" font="bold" uppercase tracking-wide>
              Made by Raqueebuddin Aziz
            </span>
          </a>
          <div border="b gray-700" w-full></div>
          <div flex="~ col">
            <NuxtLink
              v-for="{ icon, title, href } of links"
              flex
              gap-3
              bg="black hover:gray-900"
              px-5
              py-3
              un-text="sm"
              tracking-wide
              font="bold"
              uppercase
              items-center
              :to="href"
              @click="drawerVisible = false"
            >
              <div v-if="icon" text="2xl" :class="icon" />
              <span>
                {{ title }}
              </span>
            </NuxtLink>
          </div>
          <span class="grow" />
          <span
            text="xs gray-500"
            font="bold"
            uppercase
            tracking-wide
            p-5
            self-end
          >
            {{ version }}
          </span>
        </div>
      </template>
    </Transition>
  </div>
</template>

<style scoped>
.slide-enter-from,
.slide-leave-to {
  transform: translateX(-100%);
}

.slide-leave-active {
  transition: all 0.2s ease-out;
}
.slide-enter-active {
  transition: all 0.2s ease-in;
}

.slide-enter-to,
.slide-leave-from {
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
