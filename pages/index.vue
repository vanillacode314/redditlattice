<script setup lang="ts">
const subreddit = ref<string>(null);

async function onSubmit() {
  if (!subreddit.value) return;
  if (subreddit.value.includes("?")) {
    const [sr, q] = subreddit.value.split("?");
    await navigateTo(`/r/${sr}?q=${q}`);
  } else {
    await navigateTo(`/r/${subreddit.value}`);
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
        v-model="subreddit"
        label="Subreddit"
        required
        clearable
        hide-details
      ></v-text-field>
      <v-btn type="submit" class="flex gap-5" icon="mdi-magnify"></v-btn>
    </v-form>
  </v-container>
</template>
