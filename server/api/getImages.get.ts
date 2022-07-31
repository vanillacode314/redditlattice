function getKeys(obj: Object, keys: string[]): Object {
  const retval = {};
  for (const [key, value] of Object.entries(obj)) {
    if (keys.includes(key)) retval[key] = value;
  }
  return retval;
}

export default defineEventHandler(async (event) => {
  let { subreddit, sort, after, q } = useQuery(event);
  if (!sort) sort = "top";

  let url: string;
  const searchParams = new URLSearchParams({
    nsfw: "1",
    include_over_18: "on",
    restrict_sr: "true",
    t: "all",
  });
  if (q) {
    searchParams.append("q", q);
    searchParams.append("sort", sort);
    if (after) searchParams.append("after", after);
    url = `https://www.reddit.com/r/${subreddit}/search.json?${searchParams.toString()}`;
  } else {
    if (after) searchParams.append("after", after);
    url = `https://www.reddit.com/r/${subreddit}/${sort}.json?${searchParams.toString()}`;
  }
  const res = await fetch(url);

  if (res.ok) {
    const { data } = await res.json();
    let items = data.children.map((c) => c.data);
    const extension_list = [
      ".jpg",
      ".jpeg",
      ".png",
      ".svg",
      ".gif",
      ".jpe",
      ".jif",
      ".webp",
      ".tiff",
      ".tif",
      ".psd",
      ".bmp",
      ".raw",
      ".jp2",
    ];
    items = items.filter(
      (i) =>
        !i.is_self &&
        !i.is_video &&
        !i.media &&
        extension_list.some((e) => i.url?.endsWith(e))
    );
    items = items.map((c) =>
      getKeys(c, ["name", "url", "title", "", "thumbnail"])
    );
    return items;
  }
});
