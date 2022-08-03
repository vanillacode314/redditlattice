<script setup lang="ts">
import { storeToRefs } from "pinia";

const store = useStore();
const { searches, subreddits } = storeToRefs(store);
const { addQuery } = store;
const query = ref<string>("");

async function onSubmit() {
  if (!query.value) return;
  addQuery(query.value);
  if (query.value.includes("?")) {
    const [sr, q] = query.value.split("?");
    await navigateTo(`/r/${sr}?q=${q}`);
  } else {
    await navigateTo(`/r/${query.value}`);
  }
}

function setSubreddit(sr: string) {
  if (query.value.includes("?")) {
    const [_, search] = query.value.split("?");
    query.value = `${sr}?${search}`;
  } else {
    query.value = sr;
  }
}
function setSearch(search: string) {
  if (query.value.includes("?")) {
    const [sr, _] = query.value.split("?");
    query.value = `${sr}?${search}`;
  } else {
    query.value = `${query.value}?${search}`;
  }
}
</script>

<template>
  <v-container fluid>
    <v-form
      ref="form"
      @submit.prevent="onSubmit()"
      class="d-flex align-center"
      style="gap: 1rem"
    >
      <v-text-field
        v-model="query"
        label="Subreddit"
        required
        clearable
        hide-details
      ></v-text-field>
      <v-btn type="submit" class="flex gap-5" icon="mdi-magnify"></v-btn>
    </v-form>
    <v-list>
      <v-list-subheader>SUBREDDIT</v-list-subheader>
      <v-list-item
        v-for="subreddit of subreddits"
        :key="subreddit"
        :title="subreddit"
        :value="subreddit"
        @click="setSubreddit(subreddit)"
      ></v-list-item>
      <v-divider></v-divider>
      <v-list-subheader>SEARCHES</v-list-subheader>
      <v-list-item
        v-for="search of searches"
        :key="search"
        :title="search"
        :value="search"
        @click="setSearch(search)"
      ></v-list-item>
    </v-list>
  </v-container>
</template>
