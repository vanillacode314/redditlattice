<script setup lang="ts">
export interface Item {
  id: string;
  title: string;
}

defineProps<{
  title?: string;
  items: Item[];
  reverse?: boolean;
  onclick: (item: Item) => void;
  onremove: (item: Item) => void;
}>();
</script>

<template>
  <div flex flex-col gap-2 :class="{ 'flex-col-reverse': reverse }">
    <span text="xs gray-500" font="bold" uppercase v-if="title">{{
      title
    }}</span>
    <ul flex="~ col" :class="{ 'flex-col-reverse': reverse }">
      <TransitionGroup name="list">
        <li v-for="item of items" :key="item.id">
          <clearable-list-item
            :key="item.id"
            @click="onclick(item)"
            @remove="onremove(item)"
          >
            {{ item.title }}
          </clearable-list-item>
        </li>
      </TransitionGroup>
    </ul>
  </div>
</template>

<style scoped>
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
