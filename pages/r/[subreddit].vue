<script setup lang="ts">
import type { IAction, SortType } from "~/types";
import type { InfiniteState } from "~~/components/InfiniteLoading.vue";

/// WEB COMPONENTS ///
import "@appnest/masonry-layout";

import { storeToRefs } from "pinia";
import { RouteLocationNormalizedLoaded } from "vue-router";
const route = useRoute();

/// STATE ///
const store = useStore();
const { addSubreddit } = store;
const { images, title, query, sort } = storeToRefs(store);
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

// dynamic navbar title
watchEffect(() => {
  title.value = route.query.q
    ? `${route.query.q} - r/${route.params.subreddit}`
    : `r/${route.params.subreddit}`;
});

// flush images when sort type is changed
watch(sort, () => {
  resetState();
});

// onSearch flush images and change route
query.value = route.query.q as string;
watch(query, (q) => {
  resetState();
  navigateTo({
    path: `/r/${route.params.subreddit}`,
    query: { q },
  });
});

/// METHODS ///
const createSearchParams: () => URLSearchParams = () => {
  const searchParams = new URLSearchParams({
    subreddit: route.params.subreddit as string,
  });
  if (route.query.q) searchParams.append("q", route.query.q as string);
  if (images.value.after) searchParams.append("after", images.value.after);
  searchParams.append("sort", sort.value);
  return searchParams;
};

/** infinite loader handler */
const onInfinite = async ($state: InfiniteState) => {
  try {
    const { posts: newPosts, after: a } = await $fetch("/api/getImages", {
      query: Object.fromEntries(createSearchParams()),
    });
    images.value.data = [...images.value.data, ...newPosts];

    if (!a) {
      setTimeout(() => ($state.value = "completed"));
      return;
    }

    images.value.after = a;
    setTimeout(() => ($state.value = "idle"));
  } catch (e) {
    setTimeout(() => ($state.value = "error"));
  }
};

const resetState = () => {
  images.value.key = getKey(route);
  images.value.after = "";
  images.value.data = [];
};

const getKey: (route: RouteLocationNormalizedLoaded) => string = (route) => {
  return `${route.params.subreddit}-${route.query.q}`;
};

/// LIFECYCLE HOOKS ///
// flush old images on mount and add subreddit to localStorage
onMounted(async () => {
  await nextTick();
  if (images.value.key !== getKey(route)) resetState();
  addSubreddit(route.params.subreddit as string);
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
  key: (route) => `${route.query.q}-${route.params.subreddit}`,
  keepalive: true,
});
</script>

<template>
  <div max-h-full id="scroller" class="image-grid">
    <masonry-layout gap="0" ref="masonry">
      <ImageCard
        v-for="image of images.data"
        :image="image"
        @load="masonry.scheduleLayout()"
      />
    </masonry-layout>

    <InfiniteLoading target="#scroller" :distance="300" @infinite="onInfinite">
      <template #loading>
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
            {{ images.data.length > 0 ? "END" : "NO IMAGES FOUND" }}
          </div>
        </div>
      </template>
    </InfiniteLoading>
    <Fab icon="i-mdi-sort" :actions="fabActions" :selected="sort"> </Fab>
  </div>
</template>
