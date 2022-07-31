function getKeys(obj: Object, keys: string[]): Object {
  const retval = {};
  for (const [key, value] of Object.entries(obj)) {
    if (keys.includes(key)) retval[key] = value;
  }
  return retval;
}

export default defineEventHandler(async (event) => {
  let { subreddit, sort, after, q } = useQuery(event);
  if (!sort) sort = "new";
  if (!after) after = "";

  let url: string;
  if (q) {
    url = `https://www.reddit.com/r/${subreddit}/search.json?q=${q}&sort=${sort}&after=${after}`;
  } else {
    url = `https://www.reddit.com/r/${subreddit}/${sort}.json?after=${after}`;
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
