<script lang="ts" setup>
import { storeToRefs } from "pinia";

/// STATE ///
const store = useStore();
const { title } = storeToRefs(store);
title.value = `RedditLattice`;

/// HEAD ///
useHead({
  title: "About - RedditLattice",
});
</script>
<template>
  <v-container>
    <div class="content">
      <p>
        A FOSS reddit viewer for image based subreddits. Lays out the images in
        a tight lattice.
      </p>
      <p>
        I freelance as a professional web developer. Contact ME if you need my
        services
      </p>
    </div>
    <v-list>
      <v-sheet v-ripple class="mx-auto">
        <a href="https://vanillacode.netlify.app/">
          <div class="item">
            <icon name="i-mdi-face-man-profile"></icon>
            <span>Contact Me</span>
          </div>
        </a>
      </v-sheet>
      <v-sheet v-ripple class="mx-auto">
        <a href="https://github.com/vanillacode314/redditlattice">
          <div class="item">
            <icon name="i-mdi-code-braces"></icon>
            <span>Source Code</span>
          </div>
        </a>
      </v-sheet>
    </v-list>
  </v-container>
</template>

<style scoped>
.content {
  padding-inline: 1rem;
  display: grid;
  gap: 1rem;
}
.links {
  display: grid;
  gap: 0.5rem;
  padding: 1rem 0;
}
a {
  all: unset;
  cursor: pointer;
}
.item {
  align-items: center;
  display: flex;
  gap: 1rem;
  padding: 0.75rem;
}
</style>
