<script lang="ts" setup>
import { get, set, update } from "idb-keyval";
import { storeToRefs } from "pinia";
import { IDB_LRU_CACHE_KEY } from "~~/consts";

/// STATE ///
const store = useStore();
const { title } = storeToRefs(store);
const cacheLimit = ref<number>(0);
title.value = `Settings`;

/// HEAD ///
useHead({
  title: "Settings - RedditLattice",
});

const usageStats = ref<{ total: number; used: number }>({ total: 0, used: 0 });

const getUsageStats = async () => {
  const { quota, usage } = await navigator.storage.estimate();
  return {
    total: quota,
    used: usage,
  };
};

const clearCache = async () => {
  await caches.delete("images-assets");
  usageStats.value = await getUsageStats();
};

const updateLimit = async (qty: number = -1) => {
  let limit: number;

  await update(IDB_LRU_CACHE_KEY, (cacheDb) => {
    cacheDb = cacheDb || { limit: 500 };
    if (qty > -1) cacheDb.limit = qty;
    limit = cacheDb.limit;
    console.log(cacheDb);
    return cacheDb;
  });
  cacheLimit.value = limit;
};

const saveChanges = async () => {
  updateLimit(cacheLimit.value);
};

onMounted(async () => {
  usageStats.value = await getUsageStats();
  updateLimit();
});
</script>

<template>
  <div p-5 flex flex-col-reverse h-full gap-5>
    <Button
      @click="saveChanges()"
      bg="green-800 hover:green-700"
      relative
      overflow-hidden
      transition-colors
    >
      <span> Save Changes </span>
    </Button>
    <Button
      @click="clearCache()"
      bg="blue-800 hover:red-700"
      relative
      overflow-hidden
      transition-colors
    >
      <div
        bg="red-800"
        absolute
        inset-y-0
        left-0
        :style="{ width: `${100 * (usageStats.used / usageStats.total)}%` }"
      ></div>
      <span z-10 relative>
        Clear Cache ({{ formatBytes(usageStats.used) }}/{{
          formatBytes(usageStats.total)
        }})
      </span>
    </Button>
    <div
      ring="~ pink-800"
      flex
      gap-3
      bg-black
      outline-none
      rounded
      py-2
      px-4
      items-center
    >
      <span uppercase font="bold" text="xs gray-500">Max cache entries</span>
      <input
        v-model="cacheLimit"
        type="number"
        id="cache-limit"
        bg-transparent
        outline-none
      />
      <span uppercase font="bold" text="xs gray-500">Images</span>
    </div>
  </div>
</template>
