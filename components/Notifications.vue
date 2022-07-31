<script setup lang="ts">
const snackbar = ref<boolean>(true);
const text = "hi";
</script>

<template>
  <div class="text-center ma-2">
    <v-snackbar v-model="snackbar">
      {{ text }}

      <template v-slot:actions>
        <v-btn color="pink" variant="text" @click="snackbar = false">
          Close
        </v-btn>
      </template>
    </v-snackbar>
  </div>
</template>
