<script setup lang="ts">
import { storeToRefs } from "pinia";

/// STATE ///
const store = useStore();
const { searches, title, query, navVisible, isSearching, drawerVisible } =
  storeToRefs(store);
const searchTerm = ref<string>("");
const route = useRoute();
const searchInput = ref<HTMLInputElement>(null);

/// METHODS ///
/** hide on scroll */
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

const onSearch = () => {
  isSearching.value = true;
  nextTick().then(() => {
    searchInput.value.focus();
  });
};

const cancelSearch = () => {
  isSearching.value = false;
};

const clearSearch = () => {
  searchTerm.value = "";
  nextTick().then(() => {
    const inp = document.querySelector(
      ".search-field input"
    ) as HTMLInputElement;
    if (!inp) return;
    inp.focus();
  });
};

const search = () => {
  query.value = searchTerm.value;
  searches.value = [...new Set([...searches.value, query.value])].sort();
  isSearching.value = false;
  searchTerm.value = "";
};

/// LIFECYCLE HOOKS ///
onMounted(() => {
  window.addEventListener("scroll", onScroll);
});

onUnmounted(() => {
  window.removeEventListener("scroll", onScroll);
});
</script>

<template>
  <Transition name="slide">
    <nav
      bg="black"
      text="white"
      flex
      gap-5
      px-5
      py-3
      sticky
      top-0
      items-center
      z-20
    >
      <template v-if="!isSearching">
        <button
          type="button"
          @click="drawerVisible = !drawerVisible"
          class="i-mdi-menu"
          text="2xl"
        ></button>
        <span text="xl">
          {{ title }}
        </span>
        <span class="grow" />
      </template>
      <form @submit.prevent="search" contents>
        <template v-if="isSearching">
          <button
            @click="cancelSearch"
            text="2xl white"
            outline-none
            class="i-mdi-arrow-left"
            type="button"
          ></button>
          <input
            ref="searchInput"
            text="xl"
            grow
            bg="black"
            outline-none
            v-model="searchTerm"
          />
        </template>
        <div grid class="wrap-btns">
          <Transition name="fade">
            <template v-if="route.path.startsWith('/r/')">
              <template v-if="isSearching">
                <button
                  type="button"
                  @click="clearSearch"
                  text="2xl"
                  class="i-mdi-close-circle"
                ></button>
              </template>
              <template v-else>
                <button
                  type="button"
                  @click="onSearch"
                  text="2xl"
                  class="i-mdi-magnify"
                ></button>
              </template>
            </template>
          </Transition>
        </div>
      </form>
    </nav>
  </Transition>
</template>

<style scoped>
.wrap-btns {
  display: grid;
}
.wrap-btns > * {
  grid-area: 1/-1;
}
.slide-enter-active,
.slide-leave-active {
  transition: all 0.3s cubic-bezier(0.86, 0, 0.07, 1);
}

.slide-enter-from,
.slide-leave-to {
  transform: translateY(-100%) !important;
}

.fade-enter-active,
.fade-leave-active {
  transition: all 0.2s ease-in;
}

.fade-enter-from,
.fade-leave-to {
  transform: rotate(180deg);
  /* opacity: 0; */
}
</style>
