<script setup lang="ts">
export interface Item {
  id: string;
  title: string;
}
defineProps<{
  title?: string;
  items: Item[];
  onclick: Function;
  onremove: Function;
}>();
</script>

<template>
  <span class="subheader">
    <v-list-subheader v-if="title">{{ title }}</v-list-subheader>
  </span>
  <div class="container">
    <TransitionGroup name="list">
      <clearable-list-item
        v-for="item of items"
        :key="item.id"
        @click="onclick(item)"
        @remove="onremove(item)"
      >
        {{ item.title }}
      </clearable-list-item>
    </TransitionGroup>
  </div>
</template>

<style scoped>
.container {
  position: relative;
}

.subheader {
  display: block;
  padding: 0 0.75rem;
  padding-top: 0.75rem;
}

.list-move, /* apply transition to moving elements */
.list-enter-active,
.list-leave-active {
  transition: all 0.2s ease;
}

.list-enter-from,
.list-leave-to {
  opacity: 0;
  transform: translateX(-100%);
}

/* ensure leaving items are taken out of layout flow so that moving
   animations can be calculated correctly. */
.list-leave-active {
  position: absolute;
}
</style>
