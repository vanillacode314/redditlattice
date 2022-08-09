<script setup lang="ts">
defineProps<{
  icon: string;
}>();

const active = ref<boolean>(false);

function toggleActive() {
  active.value = !active.value;
}

function close() {
  active.value = false;
}
</script>

<template>
  <div class="wrapper">
    <transition name="fade">
      <div v-if="active" class="actions">
        <slot name="actions" :close="close"> </slot>
      </div>
    </transition>
    <div class="fab" :class="{ active: active }">
      <slot>
        <v-btn
          @click="toggleActive()"
          :variant="active ? 'flat' : 'elevated'"
          :icon="active ? 'mdi-close' : icon"
        >
        </v-btn>
      </slot>
    </div>
  </div>
</template>

<style scoped>
.wrapper {
  position: fixed;
  bottom: 1rem;
  right: 1rem;
}
.actions {
  padding: 0.5rem 0;
  display: grid;
  gap: 0.5rem;
}
.fab {
  transition: transform 0.1s ease-in;
}
.fab.active {
  transform: rotate(90deg);
}
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
  transition: transform 0.3s ease-out;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(1rem);
}
</style>
