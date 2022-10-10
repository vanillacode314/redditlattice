<script setup lang="ts">
import { Ref } from "vue";
export type State = "idle" | "error" | "loading" | "completed";
export type InfiniteState = Ref<State>;

const props = withDefaults(
  defineProps<{
    distance?: number;
    target?: string;
    firstload?: boolean;
    key?: string;
  }>(),
  {
    key: "",
    distance: 0,
    target: "body",
    firstload: true,
  }
);

const emit = defineEmits<{
  (e: "infinite", $state: typeof state, firstload: boolean): void;
}>();

const state = ref<State>("idle");

watch(
  () => props.key,
  (value) => {
    setup();
  }
);

const onScroll = () => {
  if (state.value !== "idle") return;
  const scrollArea = document.querySelector(props.target);
  if (!scrollArea) return;
  const dy =
    scrollArea.scrollHeight - scrollArea.scrollTop - scrollArea.clientHeight;
  if (dy <= props.distance) load();
};

const load = (firstload: boolean = false) => {
  state.value = "loading";
  emit("infinite", state, firstload);
};

const setup = () => {
  if (props.firstload) load(true);
};

onMounted(() => {
  nextTick().then(() => {
    const scrollArea = document.querySelector(props.target);
    if (!scrollArea) return;
    scrollArea.addEventListener("scroll", onScroll);
    setup();
  });
});

onUnmounted(() => {
  const scrollArea = document.querySelector(props.target);
  if (!scrollArea) return;
  scrollArea.removeEventListener("scroll", onScroll);
});
</script>

<template>
  <div v-if="state === 'idle'"><slot name="idle" :load="load"></slot></div>
  <div v-if="state === 'error'"><slot name="error" :retry="load"></slot></div>
  <div v-if="state === 'loading'"><slot name="loading"></slot></div>
  <div v-if="state === 'completed'"><slot name="completed"></slot></div>
</template>
