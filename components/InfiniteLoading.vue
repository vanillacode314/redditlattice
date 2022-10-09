<script setup lang="ts">
import { Ref } from "vue";
export type State = "idle" | "error" | "loading" | "completed";
export type InfiniteState = Ref<State>;

const props = withDefaults(
  defineProps<{
    distance?: number;
    target?: string;
    firstload?: boolean;
  }>(),
  {
    firstload: true,
    distance: 0,
    target: "body",
  }
);

const emit = defineEmits<{
  (e: "infinite", $state: typeof state): void;
}>();

const state = ref<State>("idle");

const onScroll = () => {
  const scrollArea = document.querySelector(props.target);
  if (!scrollArea) return;
  const dy =
    scrollArea.scrollHeight - scrollArea.scrollTop - scrollArea.clientHeight;
  if (dy <= props.distance) load();
};

const load = () => {
  state.value = "loading";
  emit("infinite", state);
};

onMounted(() => {
  const scrollArea = document.querySelector(props.target);
  if (!scrollArea) return;
  scrollArea.addEventListener("scroll", onScroll);
  if (props.firstload) load();
});

onUnmounted(() => {
  const scrollArea = document.querySelector(props.target);
  if (!scrollArea) return;
  scrollArea.removeEventListener("scroll", onScroll);
});
</script>

<template>
  <div v-if="state === 'idle'"><slot name="idle"></slot></div>
  <div v-if="state === 'error'"><slot name="error" :retry="load"></slot></div>
  <div v-if="state === 'loading'"><slot name="loading"></slot></div>
  <div v-if="state === 'completed'"><slot name="completed"></slot></div>
</template>
