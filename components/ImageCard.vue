<script setup lang="ts">
import type { Post } from "@/pages/r/[subreddit].vue";
const props = defineProps<{
  image: Post;
}>();
const emit = defineEmits(["load"]);
const imgElement = ref<HTMLImageElement>(null);
const isOnTop = ref<boolean>(false);

function onImageLoad() {
  if (!imgElement.value) return;
  const width = imgElement.value?.getBoundingClientRect().width ?? 0;
  imgElement.value.src = `http://redditlattice-server.vercel.app/?url=${props.image.url}&width=${width}&format=webp`;
  if (imgElement.value.naturalHeight) {
    imgElement.value.style.aspectRatio = "auto";
    emit("load");
    return;
  }
  requestAnimationFrame(() => onImageLoad());
}

onMounted(() => {
  onImageLoad();
});

function popupImage() {
  isOnTop.value = true;
  document.documentElement.classList.add("noscroll");
}

function removePopupImage() {
  isOnTop.value = false;
  document.documentElement.classList.remove("noscroll");
}
</script>

<!-- :src="`http://localhost:3000/?url=${image.url}&width=${1080}&format=avif`" -->
<template>
  <img
    v-longpress="popupImage"
    ref="imgElement"
    :key="image.name"
    :alt="image.title"
    style="aspect-ratio: 1"
  />
  <div :class="{ isOnTop: isOnTop }" @click.self="removePopupImage">
    <transition name="scale">
      <div v-if="isOnTop" class="overlay">
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
