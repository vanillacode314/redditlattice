<script setup lang="ts">
export interface IItem {
  id: string;
  data: unknown;
}

const props = withDefaults(
  defineProps<{
    items: IItem[];
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
  async (newVal, oldVal) => {
    if (!newVal || !oldVal) return;
    const newItems = newVal.filter((i) => !oldVal.some((j) => i.id === j.id));
    const deletedItems = oldVal.filter(
      (i) => !newVal.some((j) => i.id === j.id)
    );
    await addItems(newItems);
    removeItems(deletedItems);
  }
);

watch(cols, () => {
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

const addItems = async (items: Array<IItem>) => {
  if (!items.length) return;
  return await new Promise<void>((resolve) => {
    let count = 0;
    const len = items.length;
    const handleItem = (item: IItem) => {
      count++;
      addItem(item);
      if (count < len) {
        requestAnimationFrame(() => handleItem(items[count]));
        return;
      }
      resolve();
    };
    requestAnimationFrame(() => handleItem(items[count]));
  });
};

const addItem = (item: IItem) => {
  const idx = getShortestColumnIndex();
  distributedItems.value![idx].push(item);
};

const removeItems = (items: Array<IItem>) => {
  for (const [x, col] of distributedItems.value!.entries()) {
    let newCol = [];
    for (const [y, item] of col.entries()) {
      const shouldRemove = items.some((i) => i.id === item.id);
      if (!shouldRemove) newCol.push(item);
    }
    distributedItems.value![x] = newCol;
  }
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
