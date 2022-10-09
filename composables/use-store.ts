import { defineStore } from "pinia";
import { IPost, SortType } from "~/types";

export default defineStore("main", () => {
  const drawerVisible = ref<boolean>(false);
  const navVisible = ref<boolean>(true);
  const isSearching = ref<boolean>(false);
  const title = ref<string>("RedditLattice");
  const query = ref<string>("");
  const subreddits = useLocalStorage<string[]>("subreddits", []);
  const searches = useLocalStorage<string[]>("searches", []);
  const sort = useLocalStorage<SortType>("sort", SortType.TOP);
  const images = ref<Pick<IPost, "name" | "url" | "title">[]>([]);
  const savedScroll = ref<number>(0);

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
    savedScroll,
    images,
    drawerVisible,
    subreddits,
    searches,
    addQuery,
    sort,
    navVisible,
    title,
    query,
    isSearching,
  };
});
