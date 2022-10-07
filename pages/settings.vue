<script lang="ts" setup>
import { storeToRefs } from "pinia";

/// STATE ///
const store = useStore();
const { title } = storeToRefs(store);
title.value = `About`;

/// HEAD ///
useHead({
  title: "About - RedditLattice",
});

const clearCache = () => {
  caches.delete("images-assets");
};
</script>

<template>
  <div p-5 flex flex-col-reverse h-full>
    <Button @click="clearCache()" bg="red-800 hover:red-700"
      >Clear Cache</Button
    >
  </div>
</template>
