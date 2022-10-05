<script setup lang="ts">
import type { Post } from "@/pages/r/[subreddit].vue";
const props = defineProps<{
  image: Post;
}>();

const emit = defineEmits(["load"]);
const imgElement = ref<HTMLImageElement>(null);
const pictureElement = ref<HTMLPictureElement>(null);
const popupVisible = ref<boolean>(false);
const srcSets = ref<Map<string, string>>(new Map());
const error = ref<boolean>(false);

function onImageLoad() {
  if (!imgElement.value) return;
  if (imgElement.value.naturalHeight) {
    imgElement.value.style.aspectRatio = "auto";
    emit("load");
    return;
  }
  requestAnimationFrame(() => onImageLoad());
}

function getProcessedImageURL(
  url: string,
  width: number,
  format: string = "webp"
): string {
  return `https://redditlattice-server-production.up.railway.app/?url=${url}&width=${width}&format=${format}`;
}

function updateSources() {
  const cols =
    +getComputedStyle(pictureElement.value).getPropertyValue(
      "--_masonry-layout-col-count"
    ) || 1;
  const width =
    Math.ceil(
      (
        pictureElement.value.parentNode as HTMLDivElement
      ).getBoundingClientRect().width / cols
    ) * 2;

  [
    /* "avif", */
    "webp",
  ].forEach((format) =>
    srcSets.value.set(
      `image/${format}`,
      getProcessedImageURL(props.image.url, width, format)
    )
  );

  imgElement.value.src = getProcessedImageURL(props.image.url, width);
}

function popupImage() {
  popupVisible.value = true;
  document.documentElement.classList.add("noscroll");
}

function removePopupImage() {
  popupVisible.value = false;
  document.documentElement.classList.remove("noscroll");
}

async function retry() {
  error.value = false;
  await nextTick();
  onImageLoad();
}

function onError() {
  error.value = true;
}

onMounted(async () => {
  await nextTick();
  updateSources();
  onImageLoad();
});
</script>

<template>
  <div class="retry-box" v-if="error">
    <v-btn color="primary" @click="retry">Retry</v-btn>
  </div>
  <picture ref="pictureElement" v-longpress="popupImage" v-else>
    <source v-for="[format, url] in srcSets" :srcset="url" :type="format" />
    <img
      @error="onError()"
      v-longpress="popupImage"
      ref="imgElement"
      :key="image.name"
      :alt="image.title"
      style="aspect-ratio: 1"
    />
  </picture>
  <div :class="{ isOnTop: popupVisible }" @click.self="removePopupImage">
    <transition name="scale">
      <div v-if="popupVisible" class="overlay">
        <img :src="image.url" :key="image.name" :alt="image.title" />
        <span class="text" @click.stop="removePopupImage">
          <v-sheet>{{ image.title }}</v-sheet>
        </span>
      </div>
    </transition>
  </div>
</template>

<style scoped>
.retry-box {
  display: grid;
  place-content: center;
  aspect-ratio: 1;
}
img {
  display: block;
  width: 100%;
  object-fit: contain;
}
.isOnTop {
  position: fixed;
  inset: 0;
  z-index: 3000;
  backdrop-filter: blur(25px) brightness(50%);
}
.overlay {
  position: fixed;
  top: 50%;
  transform: translateY(-50%);
  /* border: 2px solid white; */
  transform-origin: bottom;
  display: grid;
}
.overlay .text {
  display: block;
}
.overlay .text > * {
  font-size: 1rem;
  text-transform: uppercase;
  font-weight: bold;
  padding: 1rem;
}
.scale-enter-active {
  position: fixed;
  top: 50%;
  transform-origin: bottom;
  transition: transform 0.6s cubic-bezier(0.16, 1, 0.3, 1);
}
.scale-leave-active {
  position: fixed;
  top: 50%;
  transform-origin: bottom;
  transition: transform 0.6s cubic-bezier(0.16, 1, 0.3, 1);
}
.scale-enter-to,
.scale-leave-from {
  transform: translateY(-50%) scale(100%);
}
.scale-enter-from,
.scale-leave-to {
  transform: translateY(-100%) scale(0%);
}
</style>
