import { defineStore } from "pinia";

export default defineStore("main", () => {
  const drawer = ref<boolean>(false);

  return { drawer };
});
