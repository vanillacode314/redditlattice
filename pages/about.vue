<script lang="ts" setup>
import { storeToRefs } from "pinia";

/// STATE ///
const store = useStore();
const { title } = storeToRefs(store);
title.value = `About`;

/// HEAD ///
useHead({
  title: "About - RedditLattice",
});
</script>

<template>
  <div flex flex-col gap-5 py-5>
    <div flex flex-col gap-2>
      <span px-5 text="xs gray-500" font="bold" uppercase v-if="title"
        >Summary</span
      >
      <div px-5 flex flex-col gap-5>
        <p>
          A FOSS reddit viewer for image based subreddits. Lays out the images
          in a tight lattice.
        </p>
        <p>
          Uses a custom server to resize images on the fly for faster loading.
        </p>
        <p>
          I freelance as a professional web developer. Contact ME if you need my
          services
        </p>
      </div>
    </div>
    <div flex flex-col gap-2>
      <span px-5 text="xs gray-500" font="bold" uppercase v-if="title"
        >links</span
      >
      <ul>
        <li>
          <a
            href="https://raqueebuddinaziz.com/"
            px-5
            py-3
            flex
            gap-5
            items-center
            bg="black hover:gray-900"
          >
            <div text="2xl" class="i-mdi-face-man-profile"></div>
            <span text="sm" tracking-wide font="bold" uppercase
              >Contact Me</span
            >
          </a>
        </li>
        <li>
          <a
            href="https://github.com/vanillacode314/redditlattice"
            px-5
            py-3
            flex
            gap-5
            items-center
            bg="black hover:gray-900"
          >
            <div text="2xl" class="i-mdi-code-braces"></div>
            <span text="sm" tracking-wide font="bold" uppercase
              >Source Code</span
            >
          </a>
        </li>
      </ul>
    </div>
  </div>
</template>
