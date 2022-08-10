<script setup lang="ts">
const emit = defineEmits(["click", "remove"]);
</script>

<template>
  <v-sheet v-ripple class="mx-auto" @click="emit('click')">
    <div class="item">
      <span><slot /></span>
      <v-icon size="small" @click.stop="emit('remove')"
        >mdi-close-circle</v-icon
      >
    </div>
  </v-sheet>
</template>

<style scoped>
.item {
  display: flex;
  justify-content: space-between;
  padding: 0.75rem;
}
</style>
