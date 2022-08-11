<script setup lang="ts">
/// TYPES ///
export interface Post {
  name: string;
  url: string;
  title: string;
}
import { SortType } from "~~/composables/use-store";
import { Action } from "~~/components/Fab.vue";

/// COMPONENTS ///
import "@appnest/masonry-layout";

/// STATE ///
import { storeToRefs } from "pinia";
const id = ref<boolean>(true);
const store = useStore();
const { title, query, refreshing, sort } = storeToRefs(store);
const fabActions = ref<Action[]>([
  {
    id: SortType.Top,
    icon: "mdi-arrow-up-bold",
    callback() {
      sort.value = SortType.Top;
    },
  },
  {
    id: SortType.Hot,
    icon: "mdi-fire",
    callback() {
      sort.value = SortType.Hot;
    },
  },
  {
    id: SortType.New,
    icon: "mdi-new-box",
    callback() {
      sort.value = SortType.New;
    },
  },
]);
const route = useRoute();
const router = useRouter();
const images = ref<Post[]>([]);
const masonry = ref(null);

watch(sort, () => {
  images.value = [];
});

watchEffect(() => {
  title.value = `${route.query.q} - /r/${route.params.subreddit}`;
});

query.value = route.query.q as string;
watch(query, () => {
  images.value = [];
  router.push({
    path: `/r/${route.params.subreddit}`,
    query: { q: query.value },
  });
  id.value = !id.value;
});

watchEffect(() => {
  if (!refreshing.value) return;
  images.value = [];
  id.value = !id.value;
});

/// HEAD ///
useHead({
  title: route.query.q
    ? `${route.query.q} - r/${route.params.subreddit} - RedditLattice`
    : `r/${route.params.subreddit} - RedditLattice`,
});

/// METHODS ///
async function onInfinite($state) {
  requestAnimationFrame(() => (refreshing.value = false));
  const lastImage = images.value.at(-1);
  const searchParams = new URLSearchParams({
    subreddit: route.params.subreddit as string,
  });
  if (route.query.q) searchParams.append("q", route.query.q as string);
  if (lastImage) searchParams.append("after", lastImage.name);
  searchParams.append("sort", sort.value);
  const url = `/api/getImages?${searchParams.toString()}`;
  try {
    const newImages = await $fetch<Post[]>(url);
    if (newImages.error) {
      $state.error();
      return;
    }
    if (newImages.length === 0) {
      $state.completed();
      return;
    }
    images.value = [...images.value, ...newImages];
    $state.loaded();
  } catch (e) {
    $state.error();
  }
}

/// LIFECYCLE HOOKS ///
onMounted(() => {
  images.value = [];
  id.value = !id.value;
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
      :identifier="`${route.query.q}-${route.params.subreddit}-${sort}-${id}`"
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
    </infinite-loading>
    <Fab icon="mdi-sort" :actions="fabActions" :active="sort"> </Fab>
  </div>
</template>

<style scoped>
img {
  display: block;
  width: 100%;
  object-fit: contain;
}
</style>
