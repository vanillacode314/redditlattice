<script setup lang="ts">
defineProps<{ name: string; size?: string }>();
</script>
<template>
  <span
    :class="[
      {
        'text-h5': !size,
        'text-h6': size === 'small',
      },
      name,
    ]"
  ></span>
</template>
