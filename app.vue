<script setup>
useHead({
  title: "RedditLattice",
  meta: [
    {
      name: "description",
      content:
        "A reddit viewer for image based subreddits. Lays out the images in a tight lattice.",
    },
  ],
});
</script>

<template>
  <v-app theme="myDarkTheme">
    <Drawer />
    <Navbar />
    <v-main>
      <NuxtPage />
      <!-- <Notifications /> -->
    </v-main>
  </v-app>
</template>
