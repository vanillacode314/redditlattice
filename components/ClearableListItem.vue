<script setup lang="ts">
const emit = defineEmits(["click", "remove"]);
</script>

<template>
  <div
    bg="hover:gray-800 focus-within:gray-800"
    cursor-pointer
    flex
    transition-colors
  >
    <div @click="emit('click')" class="grow" px-4 py-2 tabindex="0">
      <slot />
    </div>
    <button
      @click="emit('remove')"
      outline-none
      text="gray-700 hover:white focus:white lg"
      px-4
      transition-colors
    >
      <div text="xl" class="i-mdi-close-circle"></div>
    </button>
  </div>
</template>
