<script setup lang="ts">
import { storeToRefs } from "pinia";

const store = useStore();
const { searches, title, query, navVisible, searching, drawer } =
  storeToRefs(store);
let searchTerm = ref<string>("");

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

function onSearch() {
  searching.value = true;
  nextTick().then(() => {
    const inp = document.querySelector(
      ".search-field input"
    ) as HTMLInputElement;
    if (!inp) return;
    inp.addEventListener("change", () => {
      search();
    });
    inp.focus();
  });
}

function cancelSearch() {
  searching.value = false;
}

function clearSearch() {
  searchTerm.value = "";
  nextTick().then(() => {
    const inp = document.querySelector(
      ".search-field input"
    ) as HTMLInputElement;
    if (inp) inp.focus();
  });
}

function search() {
  query.value = searchTerm.value;
  searches.value = [...new Set([...searches.value, query.value])].sort();
  searching.value = false;
  searchTerm.value = "";
}
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
        <div class="wrap-btns">
          <transition name="fade">
            <template v-if="!searching">
              <v-app-bar-nav-icon
                @click="drawer = !drawer"
              ></v-app-bar-nav-icon>
            </template>
            <template v-else>
              <v-btn icon="mdi-arrow-left" @click="cancelSearch()"></v-btn>
            </template>
          </transition>
        </div>
      </template>
      <template v-if="!searching">
        <v-app-bar-title>
          {{ title }}
        </v-app-bar-title>
      </template>
      <template v-else>
        <v-text-field
          v-model="searchTerm"
          class="search-field"
          variant="plain"
          hide-details
        >
        </v-text-field>
      </template>

      <v-spacer></v-spacer>
      <div class="wrap-btns">
        <transition name="fade">
          <template v-if="!searching">
            <v-btn
              v-if="$route.path.startsWith('/r/')"
              icon="mdi-magnify"
              @click="onSearch()"
            />
          </template>
          <template v-else>
            <v-btn
              v-if="$route.path.startsWith('/r/')"
              icon="mdi-close-circle"
              @click="clearSearch()"
            />
          </template>
        </transition>
      </div>
    </v-app-bar>
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
  opacity: 0;
}
</style>
