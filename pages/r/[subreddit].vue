<script setup lang="ts">
/// TYPES ///
export interface Post {
  name: string;
  url: string;
  title: string;
}
import { SortType } from "~~/composables/use-store";
import { Action } from "~~/components/Fab.vue";

/// WEB COMPONENTS ///
import "@appnest/masonry-layout";

import { storeToRefs } from "pinia";
const route = useRoute();
const router = useRouter();

/// STATE ///
const id = ref<boolean>(true);
const store = useStore();
const { subreddits, title, query, refreshing, sort } = storeToRefs(store);
const fabActions = ref<Action[]>([
  {
    id: SortType.Top,
    icon: "i-mdi-arrow-up-bold",
    callback() {
      sort.value = SortType.Top;
    },
  },
  {
    id: SortType.Hot,
    icon: "i-mdi-fire",
    callback() {
      sort.value = SortType.Hot;
    },
  },
  {
    id: SortType.New,
    icon: "i-mdi-new-box",
    callback() {
      sort.value = SortType.New;
    },
  },
]);
const images = ref<Post[]>([]);

// id of the last image in the last request, used to request the next set of images after this id
let after = "";

// dynamic navbar title
watchEffect(() => {
  title.value = route.query.q
    ? `${route.query.q} - /r/${route.params.subreddit}`
    : `/r/${route.params.subreddit}`;
});

// flush images when sort type is changed
watch(sort, () => {
  resetState();
});

// onSearch flush images and change route
query.value = route.query.q as string;
watch(query, () => {
  resetState();
  router.push({
    path: `/r/${route.params.subreddit}`,
    query: { q: query.value },
  });
});

// flush images on refresh
watchEffect(() => {
  if (!refreshing.value) return;
  resetState();
});

/// TEMPLATE REFS ///
const masonry = ref(null);

/// HEAD ///
useHead({
  title: route.query.q
    ? `${route.query.q} - r/${route.params.subreddit} - RedditLattice`
    : `r/${route.params.subreddit} - RedditLattice`,
});

/// METHODS ///

/** createSearchParams for local api query */
function createSearchParams(): URLSearchParams {
  const searchParams = new URLSearchParams({
    subreddit: route.params.subreddit as string,
  });
  if (route.query.q) searchParams.append("q", route.query.q as string);
  if (after) searchParams.append("after", after);
  searchParams.append("sort", sort.value);
  console.log(Object.fromEntries([...searchParams]));
  return searchParams;
}

/** infinite loader handler */
async function onInfinite($state) {
  requestAnimationFrame(() => (refreshing.value = false));
  const url = `/api/getImages?${createSearchParams().toString()}`;
  try {
    const data = await $fetch<any>(url);
    const { posts: newPosts, error } = data;

    // return on error
    if (error) {
      $state.error();
      return;
    }
    after = data.after;
    if (newPosts.length === 1) {
      $state.complete();
      return;
    }
    images.value = [...images.value, ...newPosts];
    setTimeout(() => $state.loaded(), 1000);
  } catch (e) {
    $state.error();
  }
}

/** reset grid state */
function resetState() {
  after = "";
  images.value = [];
  // HACK: to manually reset infinite scroll state
  id.value = !id.value;
}

/// LIFECYCLE HOOKS ///
// flush old images on mount and add subreddit to localStorage
onMounted(() => {
  resetState();
  subreddits.value = [
    ...new Set([...subreddits.value, route.params.subreddit as string]),
  ].sort();
});
</script>

<template>
  <div>
    <masonry-layout gap="0" ref="masonry">
      <ImageCard
        :image="image"
        v-for="image of images"
        @load="masonry.scheduleLayout()"
      />
    </masonry-layout>
    <infinite-loading
      @infinite="onInfinite"
      :identifier="`${route.query.q}-${route.params.subreddit}-${id}`"
      :distance="100"
    >
      <template #spinner>
        <div class="d-flex pa-6 justify-center">
          <v-progress-circular indeterminate></v-progress-circular>
        </div>
      </template>
      <template #error="{ retry }">
        <div class="d-flex pa-6 justify-center">
          <v-btn color="error" @click="retry">Retry</v-btn>
        </div>
      </template>
      <template #complete>
        <div class="d-flex pa-6 justify-center font-weight-bold">END</div>
      </template>
    </infinite-loading>
    <Fab icon="i-mdi-sort" :actions="fabActions" :selected="sort"> </Fab>
  </div>
</template>

<style scoped>
img {
  display: block;
  width: 100%;
  object-fit: contain;
}
</style>
