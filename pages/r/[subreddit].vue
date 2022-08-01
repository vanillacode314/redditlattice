<script setup lang="ts">
import "@appnest/masonry-layout";
export interface Post {
  name: string;
  url: string;
  title: string;
}

const route = useRoute();
useHead({
  titleTemplate: () =>
    route.query.q
      ? `${route.query.q} - r/${route.params.subreddit} - RedditLattice`
      : `r/${route.params.subreddit} - RedditLattice`,
});

const images = ref<Post[]>([]);
const masonry = ref(null);

async function onInfinite($state) {
  const lastImage = images.value.at(-1);
  const searchParams = new URLSearchParams({
    subreddit: route.params.subreddit as string,
  });
  if (route.query.q) searchParams.append("q", route.query.q as string);
  if (lastImage) searchParams.append("after", lastImage.name);
  const url = `/api/getImages?${searchParams.toString()}`;
  try {
    const newImages = await $fetch<Post[]>(url);
    images.value = [...images.value, ...newImages];
    requestAnimationFrame(() => {
      masonry.value.layout();
      $state.loaded();
    });
  } catch (e) {
    $state.error();
  }
}
</script>

<template>
  <div>
    <masonry-layout gap="0" ref="masonry">
      <ImageCard :image="image" v-for="image of images" />
    </masonry-layout>
    <infinite-loading
      @infinite="onInfinite"
      :identifier="`${route.query.q}-${route.params.subreddit}`"
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
  </div>
</template>

<style scoped>
img {
  display: block;
  width: 100%;
  object-fit: contain;
}
</style>
