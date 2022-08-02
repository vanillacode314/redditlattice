<script setup lang="ts">
import type { Post } from "@/pages/r/[subreddit].vue";
const props = defineProps<{
  image: Post;
}>();

const emit = defineEmits(["load"]);
const img = ref<HTMLImageElement>(null);

function onImageLoad() {
  if (!img.value) return;
  if (img.value.naturalHeight) {
    img.value.style.aspectRatio = "auto";
    emit("load");
    return;
  }
  requestAnimationFrame(() => onImageLoad());
}

onMounted(() => {
  onImageLoad();
});
</script>

<template>
  <img
    ref="img"
    :src="image.url"
    :key="image.name"
    :alt="image.title"
    loading="lazy"
    style="aspect-ratio: 1"
  />
</template>
