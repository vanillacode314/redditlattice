import { defineStore } from "pinia";

export enum SortType {
  HOT = "hot",
  NEW = "new",
  TOP = "top",
}

export default defineStore("main", () => {
  const drawerVisible = ref<boolean>(false);
  const navVisible = ref<boolean>(true);
  const isSearching = ref<boolean>(false);
  const title = ref<string>("RedditLattice");
  const query = ref<string>("");
  const isRefreshing = ref<boolean>(false);
  const subreddits = useLocalStorage<string[]>("subreddits", []);
  const searches = useLocalStorage<string[]>("searches", []);
  const sort = useLocalStorage<SortType>("sort", SortType.TOP);

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

  return {
    drawerVisible,
    subreddits,
    searches,
    addQuery,
    sort,
    isRefreshing,
    navVisible,
    title,
    query,
    isSearching,
  };
});
