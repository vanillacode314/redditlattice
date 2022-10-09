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
  const images = ref<{
    key: string;
    after: string;
    data: Pick<IPost, "name" | "url" | "title">[];
  }>({ after: "", key: "", data: [] });

  function addQuery(query: string) {
    if (query.includes("?")) {
      const [sr, search] = query.split("?");
      addSubreddit(sr);
      addSearch(search);
      return;
    }
    addSubreddit(query);
  }

  function addSubreddit(name: string) {
    if (!name) return;
    if (!subreddits.value.includes(name))
      subreddits.value.push(name.toLowerCase());
    subreddits.value.sort();
  }

  function addSearch(name: string) {
    if (!name) return;
    if (!searches.value.includes(name)) searches.value.push(name.toLowerCase());
    searches.value.sort();
  }

  return {
    addSubreddit,
    addSearch,
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
