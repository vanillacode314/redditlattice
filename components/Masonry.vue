<script setup lang="ts">
export interface IItem {
  id: string;
  data: unknown;
}

const props = withDefaults(
  defineProps<{
    items: Set<IItem>;
    maxWidth: number;
    gap?: number;
  }>(),
  {
    gap: 0,
  }
);

const cols = ref<number>(0);
const distributedItems = ref<IItem[][]>();

watch(
  () => props.items,
  (newVal, oldVal) => {
    if (!newVal || !oldVal) return;
    const diff = difference(newVal, oldVal);
    addItems(diff);
  }
);

watch(cols, (newVal, oldVal) => {
  resetDistribution();
  setTimeout(() => {
    addItems(props.items);
  });
});

const getShortestColumnIndex: () => number = () => {
  let shortestColIndex = 0;
  let minHeight = Infinity;
  for (const n of new Array(cols.value).keys()) {
    const colEl = document.querySelector(`#masonry-col-${n + 1}`)!;
    const { height } = colEl.getBoundingClientRect();
    if (height >= minHeight) continue;
    minHeight = height;
    shortestColIndex = n;
  }
  return shortestColIndex;
};

const getTallestColumnIndex: () => number = () => {
  let tallestColIndex = 0;
  let maxHeight = 0;
  for (const n of new Array(cols.value).keys()) {
    const colEl = document.querySelector(`#masonry-col-${n + 1}`)!;
    const { height } = colEl.getBoundingClientRect();
    if (height <= maxHeight) continue;
    maxHeight = height;
    tallestColIndex = n;
  }
  return tallestColIndex;
};

const addItems = (items: Iterable<IItem>) => {
  for (const item of items) {
    requestIdleCallback(() => {
      addItem(item);
    });
  }
};

const addItem = (item: IItem) => {
  const idx = getShortestColumnIndex();
  if (distributedItems.value) distributedItems.value[idx].push(item);
};

const setCols = () => {
  const n = Math.ceil(window.innerWidth / props.maxWidth);
  if (cols.value !== n) cols.value = n;
};

const resetDistribution = () => {
  distributedItems.value = Array.from(new Array(cols.value), () => new Array());
};

let timer: any;
const onResize = () => {
  clearTimeout(timer);
  timer = setTimeout(() => setCols(), 1000);
};

onMounted(() => {
  setCols();
  window.addEventListener("resize", onResize);
});

onUnmounted(() => {
  window.removeEventListener("resize", onResize);
});
</script>

<template>
  <div
    grid
    style="align-items: start"
    :style="{
      gridTemplateColumns: `repeat(${cols}, 1fr)`,
      gap: `${gap}px`,
      '--col-count': cols,
    }"
  >
    <div
      v-for="(col, index) in distributedItems"
      :id="`masonry-col-${index + 1}`"
      flex="~ col"
      :style="{ gap: `${gap}px` }"
    >
      <slot :item="item" v-for="item in col" :key="item.id" />
    </div>
  </div>
</template>
