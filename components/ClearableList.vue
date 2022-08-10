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
  <clearable-list-item
    v-for="item of items"
    :key="item.id"
    @click="onclick(item)"
    @remove="onremove(item)"
  >
    {{ item.title }}
  </clearable-list-item>
</template>

<style scoped>
.subheader {
  display: block;
  padding: 0 0.75rem;
  padding-top: 0.75rem;
}
</style>
