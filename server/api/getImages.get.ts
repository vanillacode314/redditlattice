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
function getKeys(obj: Object, keys: string[]): Object {
  const retval = {};
  for (const [key, value] of Object.entries(obj)) {
    if (keys.includes(key)) retval[key] = value;
  }
  return retval;
}

function expandGallery(posts) {
  return posts.flatMap((post) => {
    if (
      post.url.startsWith(`https://www.reddit.com/gallery/`) &&
      Object.values(post.media_metadata).length > 0
    ) {
      let retVal = [];
      for (const { id, m: mime } of Object.values(post.media_metadata)) {
        const ext = mime.replace("image/", "");
        retVal.push({
          name: `${post.name}-${id}`,
          url: `https://i.redd.it/${id}.${ext}`,
          title: post.title,
        });
      }
      return retVal;
    }
    return [post];
  });
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
    searchParams.append("q", q as string);
    searchParams.append("sort", sort as string);
    if (after) searchParams.append("after", after as string);
    url = `https://www.reddit.com/r/${subreddit}/search.json?${searchParams.toString()}`;
  } else {
    if (after) searchParams.append("after", after as string);
    url = `https://www.reddit.com/r/${subreddit}/${sort}.json?${searchParams.toString()}`;
  }
  const res = await fetch(url, { redirect: "error" });

  if (res.ok) {
    const { data } = await res.json();
    const after = data.after;
    let posts = data.children.map((c) => c.data);
    posts = expandGallery(posts);
    posts = posts.filter(
      (post) =>
        !post.is_self &&
        !post.is_video &&
        !post.media &&
        extension_list.some((e) => post.url?.endsWith(e))
    );
    posts = posts.map((c) => getKeys(c, ["name", "url", "title"]));
    return { posts, after };
  } else {
    return {
      error: res.statusText,
    };
  }
});
