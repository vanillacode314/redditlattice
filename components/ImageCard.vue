<script setup lang="ts">
import type { IPost } from "~~/types";
const props = defineProps<{
  image: Pick<IPost, "name" | "url" | "title">;
}>();

const emit = defineEmits<{
  (e: "load"): void;
}>();

const imgElement = ref<HTMLImageElement>();
const pictureElement = ref<HTMLPictureElement>();
const popupVisible = computed<boolean>(() =>
  route.hash.startsWith("#popup")
    ? route.hash.replace("#popup-", "") === props.image.name
    : false
);
const srcSets = ref<Map<string, string>>(new Map());
const error = ref<boolean>(false);
const route = useRoute();
const router = useRouter();

function onImageLoad() {
  if (!pictureElement.value) return;
  pictureElement.value.style.blockSize = `${getWidth()}px`;
  function checkSize() {
    if (!imgElement.value) return;
    if (!pictureElement.value) return;
    if (imgElement.value.naturalHeight) {
      pictureElement.value.style.blockSize = `${
        (imgElement.value.naturalHeight / imgElement.value.naturalWidth) *
        getWidth()
      }px`;
      emit("load");
      return;
    }
    requestAnimationFrame(() => checkSize());
  }
  requestAnimationFrame(() => checkSize());
  window.addEventListener("resize", () => {
    requestAnimationFrame(() => checkSize());
  });
}

function getWidth(): number {
  if (!pictureElement.value) return 400;
  const cols =
    +getComputedStyle(pictureElement.value).getPropertyValue(
      "--_masonry-layout-col-count"
    ) || 1;
  const grid = document.querySelector<HTMLDivElement>(".image-grid");
  if (!grid) return 400;
  return grid.getBoundingClientRect().width / cols;
}

function getProcessedImageURL(
  url: string,
  width: number,
  format: string = "webp"
): string {
  return `https://redditlattice-server-production.up.railway.app/?url=${url}&width=${width}&format=${format}`;
}

function updateSources() {
  const width = Math.ceil(getWidth() / 100) * 200;
  [
    /* "avif", */
    "webp",
  ].forEach((format) =>
    srcSets.value.set(
      `image/${format}`,
      getProcessedImageURL(props.image.url, width, format)
    )
  );

  if (imgElement.value)
    imgElement.value.src = getProcessedImageURL(props.image.url, width);
}

function popupImage() {
  navigateTo({ hash: `#popup-${props.image.name}` });
}

function removePopupImage() {
  router.back();
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
    <Button bg="purple-800 hover:purple-700" @click="retry">Retry</Button>
  </div>
  <picture
    ref="pictureElement"
    v-longpress="popupImage"
    v-else
    transition-height
    overflow-hidden
  >
    <source v-for="[format, url] in srcSets" :srcset="url" :type="format" />
    <img
      @error="onError()"
      ref="imgElement"
      :key="image.name"
      :alt="image.title"
    />
  </picture>
  <div :class="{ isOnTop: popupVisible }" @click.self="removePopupImage">
    <Transition name="scale">
      <div v-if="popupVisible" class="overlay" w-full bg="black">
        <img
          :src="image.url"
          :key="image.name"
          :alt="image.title"
          bg="black"
          w-full
        />
        <span
          @click.stop="removePopupImage"
          bg="black"
          p-5
          uppercase
          tracking-wider
          font="bold"
          text="sm"
        >
          {{ image.title }}
        </span>
      </div>
    </Transition>
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
