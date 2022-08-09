<script setup lang="ts">
defineProps<{
  icon: string;
}>();

const active = ref<boolean>(false);
const hidden = ref<boolean>(false);

let last_known_scroll_position = 0;
let ticking = false;
const threshold = 50; // in pixels
const onScroll = () => {
  const dy = window.scrollY - last_known_scroll_position;
  last_known_scroll_position = window.scrollY;

  if (!ticking) {
    window.requestAnimationFrame(function () {
      active.value = false;
      if (Math.abs(dy) > threshold) {
        if (dy > 0) {
          hidden.value = true;
        } else {
          hidden.value = false;
        }
      }
      ticking = false;
    });

    ticking = true;
  }
};

function toggleActive() {
  active.value = !active.value;
}

function close() {
  active.value = false;
}

onMounted(() => {
  window.addEventListener("scroll", onScroll);
});
onUnmounted(() => {
  window.removeEventListener("scroll", onScroll);
});
</script>

<template>
  <transition name="fade">
    <div class="wrapper" v-if="!hidden">
      <transition name="fade">
        <div v-if="active" class="actions">
          <slot name="actions" :close="close"> </slot>
        </div>
      </transition>
      <div class="fab" :class="{ active: active }">
        <slot>
          <v-btn
            size="large"
            @click="toggleActive()"
            :variant="active ? 'flat' : 'elevated'"
            :icon="active ? 'mdi-close' : icon"
          >
          </v-btn>
        </slot>
      </div>
    </div>
  </transition>
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
  transition: opacity 0.2s ease-out, transform 0.3s ease-out;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(1rem);
}
</style>
