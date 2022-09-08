<script setup lang="ts">
import type { Post } from "@/pages/r/[subreddit].vue";
const props = defineProps<{
  image: Post;
}>();
const emit = defineEmits(["load"]);
const imgElement = ref<HTMLImageElement>(null);
const popupVisible = ref<boolean>(false);

function onImageLoad() {
  if (!imgElement.value) return;
  if (imgElement.value.naturalHeight) {
    imgElement.value.style.aspectRatio = "auto";
    emit("load");
    return;
  }
  requestAnimationFrame(() => onImageLoad());
}

onMounted(async () => {
  await nextTick();
  const cols =
    +getComputedStyle(imgElement.value).getPropertyValue(
      "--_masonry-layout-col-count"
    ) || 1;
  const width =
    Math.ceil(
      imgElement.value.parentNode.getBoundingClientRect().width / cols
    ) * 2;
  imgElement.value.src = `https://redditlattice-server.vercel.app/?url=${props.image.url}&width=${width}&format=webp`;
  onImageLoad();
});

function popupImage() {
  popupVisible.value = true;
  document.documentElement.classList.add("noscroll");
}

function removePopupImage() {
  popupVisible.value = false;
  document.documentElement.classList.remove("noscroll");
}
</script>

<template>
  <img
    v-longpress="popupImage"
    ref="imgElement"
    loading="lazy"
    :key="image.name"
    :alt="image.title"
    style="aspect-ratio: 1"
  />
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
img {
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
