<script setup lang="ts">
import { storeToRefs } from "pinia";

/// STATE ///
const store = useStore();
const { addSearch } = store;
const { title, query, navVisible, isSearching, drawerVisible } =
  storeToRefs(store);
const searchTerm = ref<string>("");
const route = useRoute();
const searchInput = ref<HTMLInputElement>();

let scroller: HTMLElement | null;

watch(
  route,
  () => {
    nextTick().then(() => {
      navVisible.value = true;
      if (scroller) scroller.removeEventListener("scroll", onScroll);
      scroller = document.getElementById("scroller");
      if (scroller) scroller.addEventListener("scroll", onScroll);
    });
  },

  { immediate: true }
);

/// METHODS ///
/** hide on scroll */
let last_known_scroll_position = 0;
let ticking = false;
const threshold = 50; // in pixels

const onScroll = () => {
  if (!scroller) return;
  const dy = scroller.scrollTop - last_known_scroll_position;
  last_known_scroll_position = scroller.scrollTop;
  const reached_top = scroller.scrollTop === 0;

  if (!ticking) {
    requestAnimationFrame(() => {
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
  requestAnimationFrame(() => {
    searchInput.value?.focus();
  });
};

const cancelSearch = () => {
  isSearching.value = false;
};

const clearSearch = () => {
  searchTerm.value = "";
  requestAnimationFrame(() => {
    const inp = document.querySelector<HTMLInputElement>(".search-field input");
    if (!inp) return;
    inp.focus();
  });
};

const search = () => {
  query.value = searchTerm.value;
  addSearch(query.value);
  isSearching.value = false;
  searchTerm.value = "";
};
</script>

<template>
  <Transition name="slide">
    <nav
      v-if="navVisible"
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
          @click="
            !route.path.startsWith('/r/')
              ? (drawerVisible = !drawerVisible)
              : $router.push({ path: '/' })
          "
          :class="
            !route.path.startsWith('/r/') ? 'i-mdi-menu' : 'i-mdi-arrow-left'
          "
          text="2xl"
        ></button>
        <span text="xl" truncate>
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
