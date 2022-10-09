<script setup lang="ts">
import { IAction, SortType, IPost } from "~/types";

/// WEB COMPONENTS ///
import "@appnest/masonry-layout";

import { storeToRefs } from "pinia";
const route = useRoute();
const router = useRouter();

/// STATE ///
const id = ref<boolean>(true);
const store = useStore();
const { subreddits, title, query, sort } = storeToRefs(store);
const images = ref<IPost[]>([]);
const fabActions = ref<IAction[]>([
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
const masonry = ref();

// id of the last image in the last request, used to request the next set of images after this id
let after = "";

// dynamic navbar title
watch(route, () => {
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

/// METHODS ///
const createSearchParams: () => URLSearchParams = () => {
  const searchParams = new URLSearchParams({
    subreddit: route.params.subreddit as string,
  });
  if (route.query.q) searchParams.append("q", route.query.q as string);
  if (after) searchParams.append("after", after);
  searchParams.append("sort", sort.value);
  return searchParams;
};

/** infinite loader handler */
const onInfinite = async ($state: any) => {
  const url = `/api/getImages?${createSearchParams().toString()}`;
  try {
    const { posts: newPosts, after: a } = await $fetch(url);
    images.value = [...images.value, ...newPosts];

    if (!a) {
      setTimeout(() => $state.complete());
      return;
    }

    after = a;
    setTimeout(() => $state.loaded());
  } catch (e) {
    setTimeout(() => $state.error());
  }
};

const resetState = () => {
  after = "";
  images.value = [];
  // HACK: manually reset infinite scroll state
  id.value = !id.value;
};

/// LIFECYCLE HOOKS ///
// flush old images on mount and add subreddit to localStorage
onMounted(() => {
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

useHead({
  title: route.query.q
    ? `${route.query.q} - r/${route.params.subreddit} - RedditLattice`
    : `r/${route.params.subreddit} - RedditLattice`,
});

definePageMeta({
  key: (route) => route.query.q + "-" + route.params.subreddit,
  keepalive: true,
});
</script>

<template>
  <div max-h-full id="scroller">
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
      :distance="300"
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
        <div p-5 grid place-content-center>
          <div font-bold tracking-wide uppercase text="sm" font="bold">
            {{ images.length > 0 ? "END" : "NO IMAGES FOUND" }}
          </div>
        </div>
      </template>
    </infinite-loading>

    <Fab icon="i-mdi-sort" :actions="fabActions" :selected="sort"> </Fab>
  </div>
</template>
