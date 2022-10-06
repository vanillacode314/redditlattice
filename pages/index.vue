<script setup lang="ts">
/// TYPES ///
import { Item } from "~~/components/ClearableList.vue";

import { storeToRefs } from "pinia";

/// STATE ///
const store = useStore();
const { title, searches, subreddits } = storeToRefs(store);
const { addQuery } = store;
const searchTerm = ref<string>("");
const subredditItems = computed(() =>
  subreddits.value.map((sr) => ({ id: sr, title: sr }))
);
const searchesItems = computed(() =>
  searches.value.map((s) => ({ id: s, title: s }))
);

/// METHODS ///
async function onSubmit() {
  console.log(searchTerm.value);
  if (!searchTerm.value) return;

  addQuery(searchTerm.value);
  if (searchTerm.value.includes("?")) {
    const [sr, q] = searchTerm.value.split("?");
    await navigateTo(`/r/${sr}?q=${q}`);
  } else {
    await navigateTo(`/r/${searchTerm.value}`);
  }
}

/** set subreddit for the query input on subreddit item click in list */
function setSubreddit({ title: sr }: Item) {
  if (searchTerm.value.includes("?")) {
    const [_, query] = searchTerm.value.split("?");
    searchTerm.value = `${sr}?${query}`;
  } else {
    searchTerm.value = sr;
  }
}

/** set search for the query input on search item click in list */
function setSearch({ title: query }: Item) {
  if (!searchTerm.value) return;
  if (searchTerm.value.includes("?")) {
    const [sr, _] = searchTerm.value.split("?");
    searchTerm.value = `${sr}?${query}`;
  } else {
    searchTerm.value = `${searchTerm.value}?${query}`;
  }
}

/** remove item from saved subreddit list */
function removeSubreddit({ title }: Item) {
  subreddits.value = subreddits.value.filter((sr) => sr !== title);
}

/** remove item from saved search list */
function removeSearch({ title }: Item) {
  searches.value = searches.value.filter((s) => s !== title);
}

/// LIFECYCLE HOOKS ///
onMounted(() => {
  title.value = `RedditLattice`;
  document.body.classList.add("noscroll");
  document.documentElement.classList.add("noscroll");
});

onUnmounted(() => {
  document.body.classList.remove("noscroll");
  document.documentElement.classList.remove("noscroll");
});

/// HEAD ///
useHead({
  title: "RedditLattice",
});
</script>

<template>
  <main p-5 h-full class="grid grid-rows-[1fr_auto]" gap-5>
    <form
      @submit.prevent="onSubmit"
      flex
      gap-3
      items-center
      row-start-2
      row-end-3
    >
      <div
        ring="~ pink-800"
        flex
        gap-3
        bg-black
        outline-none
        rounded-full
        grow
        py-2
        px-4
        items-center
      >
        <span font="bold" text="gray-500">/r/</span>
        <input
          v-model="searchTerm"
          type="search"
          id="search"
          name="subreddit"
          bg-transparent
          outline-none
          grow
        />
      </div>
      <button
        text="white lg"
        rounded-full
        aspect-square
        p-3
        outline-none
        bg="pink-800 hover:pink-700 focus:pink-700"
        ring="focus:~ focus:blue"
        transition-colors
      >
        <div class="i-mdi-magnify"></div>
      </button>
    </form>
    <div
      class="scroll-wrapper"
      flex="~ col-reverse"
      gap-2
      overflow-auto
      py-5
      row-start-1
      row-end-2
    >
      <clearable-list
        :onclick="setSubreddit"
        :onremove="removeSubreddit"
        :items="subredditItems"
        title="SUBREDDIT"
        reverse
      ></clearable-list>
      <v-divider></v-divider>
      <clearable-list
        :onclick="setSearch"
        :onremove="removeSearch"
        :items="searchesItems"
        title="SEARCHES"
        reverse
      ></clearable-list>
    </div>
  </main>
</template>
<style scoped>
.scroll-wrapper::webkit-scrollbar {
  width: 0.2rem;
}

.scroll-wrapper::webkit-scrollbar-track {
  background-color: #333;
}

.scroll-wrapper::webkit-scrollbar-thumb {
  background-color: #444;
}
</style>
