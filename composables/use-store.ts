import { defineStore } from "pinia";

export default defineStore("main", () => {
  const drawer = ref<boolean>(false);
  const subreddits = useLocalStorage<string[]>("subreddits", []);
  const searches = useLocalStorage<string[]>("searches", []);

  function addQuery(query: string) {
    if (query.includes("?")) {
      const [subreddit, search] = query.split("?");
      subreddits.value.push(subreddit.toLowerCase());
      searches.value.push(search.toLowerCase());
    } else {
      subreddits.value.push(query.toLowerCase());
    }
    subreddits.value = [...new Set(subreddits.value)].sort();
    searches.value = [...new Set(searches.value)].sort();
  }

  return { drawer, subreddits, searches, addQuery };
});
