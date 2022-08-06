<script setup lang="ts">
import { storeToRefs } from "pinia";

const store = useStore();
const { drawer } = storeToRefs(store);
</script>
<template>
  <v-navigation-drawer app v-model="drawer">
    <v-list>
      <v-list-item
        title="RedditLattice"
        subtitle="Made by VanillaCode"
        href="https://vanillacode.netlify.app/"
      ></v-list-item>
    </v-list>
    <v-divider></v-divider>
    <v-list variant="flat" density="compact">
      <v-list-item
        title="Home"
        value="home"
        @click="navigateTo('/')"
      ></v-list-item>
      <v-list-item
        title="About"
        value="about"
        @click="navigateTo('/about')"
      ></v-list-item>
    </v-list>
  </v-navigation-drawer>
</template>
