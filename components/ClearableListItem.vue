<script setup lang="ts">
const emit = defineEmits(["click", "remove"]);
</script>

<template>
  <v-sheet
    v-ripple
    class="list-item mx-auto"
    @click="emit('click')"
    tabindex="0"
  >
    <div class="wrapper">
      <span><slot /></span>
      <icon
        name="i-mdi-close-circle"
        size="small"
        @click="emit('remove')"
      ></icon>
    </div>
  </v-sheet>
</template>

<style scoped>
.wrapper {
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  padding: 0.75rem;
}
</style>
