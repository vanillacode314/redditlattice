import { defineStore } from "pinia";

export enum SortType {
  Hot = "hot",
  New = "new",
  Top = "top",
}

export default defineStore("main", () => {
  /** true if drawer is open else false */
  const drawer = ref<boolean>(false);
  /** true if navBar is visible else false */
  const navVisible = ref<boolean>(true);
  /** true if the user is searching on /r/ route else false */
  const searching = ref<boolean>(false);
  /** title shown in the navbar */
  const title = ref<string>("RedditLattice");
  /** current query used on / */
  const query = ref<string>("");
  /** true if state of app is refreshing used for pull to refresh */
  const refreshing = ref<boolean>(false);
  /** list of subreddits ever visited by the user */
  const subreddits = useLocalStorage<string[]>("subreddits", []);
  /** list of searches ever done by the user */
  const searches = useLocalStorage<string[]>("searches", []);
  /** current sortType the user is using */
  const sort = useLocalStorage<SortType>("sort", SortType.Top);

  /**
   * updates the subreddits and searches array in localStorage from the given queryString
   *
   * @param {string} query - query string (subreddit) or (subreddit?search)
   */
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
    drawer,
    subreddits,
    searches,
    addQuery,
    sort,
    refreshing,
    navVisible,
    title,
    query,
    searching,
  };
});
