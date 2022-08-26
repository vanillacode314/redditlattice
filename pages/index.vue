<script setup lang="ts">
import { storeToRefs } from "pinia";

/// TYPES ///
import { Item } from "~~/components/ClearableList.vue";

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

/// TEMPLATE REFS ///
const subredditInput = ref<HTMLElement>();

/// METHODS ///
/** checks if a query was provided and redirects to the results page */
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

/** set subreddit for the query input on subreddit item click in list */
function setSubreddit({ title: sr }: Item) {
  if (searchTerm.value.includes("?")) {
    const [_, search] = searchTerm.value.split("?");
    searchTerm.value = `${sr}?${search}`;
  } else {
    searchTerm.value = sr;
  }
}

/** set search for the query input on search item click in list */
function setSearch({ title: search }: Item) {
  if (!searchTerm.value) return;
  if (searchTerm.value.includes("?")) {
    const [sr, _] = searchTerm.value.split("?");
    searchTerm.value = `${sr}?${search}`;
  } else {
    searchTerm.value = `${searchTerm.value}?${search}`;
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

/** makes so that clicking any list item will return focus to the subreddit 
input if it was focused before clicking */
function setupListItemFocusHandlers() {
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
}

/// LIFECYCLE HOOKS ///
onMounted(() => {
  title.value = `RedditLattice`;
  document.body.classList.add("noscroll");
  document.documentElement.classList.add("noscroll");
  setupListItemFocusHandlers();
});

onUnmounted(() => {
  document.body.classList.remove("noscroll");
  document.documentElement.classList.remove("noscroll");
});

/// HEAD ///
useHead({
  title: "Home - RedditLattice",
});
</script>

<template>
  <v-container class="myContainer">
    <v-form
      ref="form"
      @submit.prevent="onSubmit()"
      class="d-flex align-center"
      style="gap: 1rem"
    >
      <span ref="subredditInput" style="display: contents">
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
  height: calc(var(--vh, 1vh) * 100 - var(--navbar-height));
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
