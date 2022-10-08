<script lang="ts" setup>
import { storeToRefs } from "pinia";

/// STATE ///
const store = useStore();
const { title } = storeToRefs(store);
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
  caches.delete("images-assets");
  usageStats.value = await getUsageStats();
};

onMounted(async () => {
  usageStats.value = await getUsageStats();
});
</script>

<template>
  <div p-5 flex flex-col-reverse h-full>
    <Button
      @click="clearCache()"
      bg="green-800 hover:red-700"
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
  </div>
</template>
