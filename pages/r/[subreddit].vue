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
const { subreddits, title, query, isRefreshing, sort } = storeToRefs(store);
const fabActions = ref<Action[]>([
  {
    id: SortType.TOP,
    icon: "i-mdi-arrow-up-bold",
    callback() {
      sort.value = SortType.TOP;
    },
  },
  {
    id: SortType.HOT,
    icon: "i-mdi-fire",
    callback() {
      sort.value = SortType.HOT;
    },
  },
  {
    id: SortType.NEW,
    icon: "i-mdi-new-box",
    callback() {
      sort.value = SortType.NEW;
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
  return searchParams;
}

/** infinite loader handler */
async function onInfinite($state) {
  requestAnimationFrame(() => (isRefreshing.value = false));
  const url = `/api/getImages?${createSearchParams().toString()}`;
  try {
    const data = await $fetch<any>(url);
    const { posts: newPosts, error } = data;

    // return on error
    if (error) {
      $state.error();
      return;
    }
    images.value = [...images.value, ...newPosts];
    if (newPosts.length === 1) {
      $state.complete();
      return;
    }
    if (!data.after) {
      $state.complete();
      return;
    }
    after = data.after;
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
// flush old images on mount and add subreddit to localStoragebuttoe
onMounted(() => {
  resetState();
  subreddits.value = [
    ...new Set([...subreddits.value, route.params.subreddit as string]),
  ].sort();
});

const { cleanUp } = onRefresh({
  callback(state) {
    resetState();
    state.set(false);
  },
});

onUnmounted(() => cleanUp());
</script>

<template>
  <div overflow-auto max-h-full id="scroller">
    <masonry-layout gap="0" ref="masonry">
      <ImageCard
        v-for="image of images"
        :image="image"
        @load="masonry.scheduleLayout()"
      />
    </masonry-layout>
    <infinite-loading
      target="#scroller"
      @infinite="onInfinite"
      :identifier="`${route.query.q}-${route.params.subreddit}-${id}`"
      :distance="400"
    >
      <template #spinner>
        <div grid place-content-center p-5>
          <Spinner />
        </div>
      </template>
      <template #error="{ retry }">
        <div p-5 grid place-content-center>
          <Button bg="red-800 hover:red-700" @click="retry">Retry</Button>
        </div>
      </template>
      <template #complete>
        <div font-bold tracking-wide uppercase text="sm" font="bold">END</div>
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
