<script setup lang="ts">
import { storeToRefs } from "pinia";

const store = useStore();
const { drawer } = storeToRefs(store);

const isMobile = ref<boolean>(false);

onMounted(() => {
  const mm = window.matchMedia("(max-width: 720px)");
  mm.onchange = ({ matches }) => (isMobile.value = matches);
  return () => (mm.onchange = null);
});
</script>

<template>
  <!-- <v-app-bar -->
  <!--   :density="isMobile ? 'default' : 'compact'" -->
  <!--   app -->
  <!--   hide-on-scroll -->
  <!--   flat -->
  <!-- > -->
  <!--   <template v-slot:prepend> -->
  <!--     <v-app-bar-nav-icon @click="drawer = !drawer"></v-app-bar-nav-icon> -->
  <!--   </template> -->
  <!---->
  <!--   <v-app-bar-title>RedditLattice</v-app-bar-title> -->
  <!-- </v-app-bar> -->
</template>
