<script setup lang="ts">
export interface Post {
  name: string;
  url: string;
  title: string;
}

const route = useRoute();
useHead({
  title: `r/${route.params.subreddit} - RedditLattice`,
});

let images = ref<Post[]>([]);

async function onInfinite($state) {
  const lastImage = images.value.at(-1);
  let url: string;
  if (lastImage) {
    url = `/api/getImages?subreddit=${route.params.subreddit}&after=${lastImage.name}`;
  } else {
    url = `/api/getImages?subreddit=${route.params.subreddit}`;
  }
  try {
    const newImages = await $fetch<Post[]>(url);
    images.value = [...images.value, ...newImages];
    $state.loaded();
  } catch (e) {
    $state.error();
  }
}
</script>

<template>
  <div>
    <masonry-wall :items="images" :column-width="300" :gap="0">
      <template #default="{ item: image }">
        <ImageCard :image="image" />
      </template>
    </masonry-wall>
    <infinite-loading
      @infinite="onInfinite"
      :distance="100"
      :identifier="images"
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
.grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
}
img {
  display: block;
  width: 100%;
  object-fit: contain;
}
</style>
