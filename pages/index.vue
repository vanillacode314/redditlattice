<script setup lang="ts">
import { storeToRefs } from "pinia";
import { Item } from "~~/components/ClearableList.vue";

/// STATE ///
const store = useStore();
const { title, searches, subreddits } = storeToRefs(store);
const { addQuery } = store;
const searchTerm = ref<string>("");
const srInput = ref<HTMLElement>();
title.value = `RedditLattice`;
useHead({
  title: "Home - RedditLattice",
});

/// METHODS ///
async function onSubmit() {
  if (!searchTerm.value) return;
  addQuery(searchTerm.value);
  if (searchTerm.value.includes("?")) {
    const [sr, q] = searchTerm.value.split("?");
    await navigateTo(`/r/${sr}?q=${q}`);
  } else {
    await navigateTo(`/r/${searchTerm.value}`);
  }
}

function setSubreddit({ title: sr }: Item) {
  if (searchTerm.value.includes("?")) {
    const [_, search] = searchTerm.value.split("?");
    searchTerm.value = `${sr}?${search}`;
  } else {
    searchTerm.value = sr;
  }
}

function setSearch({ title: search }: Item) {
  if (!searchTerm.value) return;
  if (searchTerm.value.includes("?")) {
    const [sr, _] = searchTerm.value.split("?");
    searchTerm.value = `${sr}?${search}`;
  } else {
    searchTerm.value = `${searchTerm.value}?${search}`;
  }
}

/// LIFECYCLE HOOKS ///
onMounted(() => {
  document.body.classList.add("noscroll");
  document.documentElement.classList.add("noscroll");
  const listItems = document.querySelectorAll(".v-list-item");
  for (const item of listItems) {
    item.addEventListener("focus", (event) => {
      event.preventDefault();
      // @ts-ignore
      if (event.relatedTarget) {
        // Revert focus back to previous blurring element
        // @ts-ignore
        event.relatedTarget.focus();
      } else {
        // No previous focus target, blur instead
        // @ts-ignore
        event.currentTarget.blur();
      }
    });
  }
});
onUnmounted(() => {
  document.body.classList.remove("noscroll");
  document.documentElement.classList.remove("noscroll");
});

const subredditItems = computed(() =>
  subreddits.value.map((sr) => ({ id: sr, title: sr }))
);
const searchesItems = computed(() =>
  searches.value.map((s) => ({ id: s, title: s }))
);

function removeSubreddit({ title }: Item) {
  subreddits.value = subreddits.value.filter((sr) => sr !== title);
}
function removeSearch({ title }: Item) {
  searches.value = searches.value.filter((s) => s !== title);
}
</script>

<template>
  <v-container class="myContainer">
    <v-form
      ref="form"
      @submit.prevent="onSubmit()"
      class="d-flex align-center"
      style="gap: 1rem"
    >
      <span ref="srInput" style="display: contents">
        <v-text-field
          hint="subreddit?query (query is optional)"
          prefix="/r/"
          v-model="searchTerm"
          label="Subreddit"
          required
          clearable
          hide-details
        ></v-text-field>
      </span>
      <v-btn type="submit" class="flex gap-5" icon>
        <icon name="i-mdi-magnify"></icon>
      </v-btn>
    </v-form>
    <div class="scroll-wrapper">
      <clearable-list
        :onclick="setSubreddit"
        :onremove="removeSubreddit"
        :items="subredditItems"
        title="SUBREDDIT"
      ></clearable-list>
      <v-divider></v-divider>
      <clearable-list
        :onclick="setSearch"
        :onremove="removeSearch"
        :items="searchesItems"
        title="SEARCHES"
      ></clearable-list>
    </div>
  </v-container>
</template>
<style scoped>
.myContainer {
  max-height: 100vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}
.scroll-wrapper {
  overflow-y: auto;
  flex-grow: 1;
}
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
