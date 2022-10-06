<script setup lang="ts">
const emit = defineEmits(["click"]);
</script>
<template>
  <button
    uppercase
    tracking-wide
    text="sm"
    font="bold"
    px-4
    py-2
    rounded
    transition-colors
    @click="emit('click')"
  >
    <slot />
  </button>
</template>
