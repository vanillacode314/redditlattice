import { IMAGE_EXTENSION_LIST } from "@api/consts";
import { getKeys, isEmpty } from "@api/utils";
import { IRemotePostsData, IPost } from "@api/types";

const SELECT_KEYS = ["name", "url", "title"] as const;
type ReturnKeys = typeof SELECT_KEYS[number];

function expandGallery(post: IPost): IPost[] {
  if (
    !post.url.startsWith(`https://www.reddit.com/gallery/`) ||
    isEmpty(post.media_metadata || {})
  )
    return [post];
  return Array.from(
    Object.values(post.media_metadata).map(({ id, m: mime }) => {
      const fileExtension = mime.replace("image/", "");
      return {
        ...post,
        name: `${post.name}-${id}`,
        url: `https://i.redd.it/${id}.${fileExtension}`,
        title: post.title,
      };
    })
  );
}

async function fetchPosts(url: string): Promise<IRemotePostsData> {
  const res = await fetch(url, { redirect: "error" });
  const data = await res.json();
  return getKeys(data.data, ["children", "after"]);
}

export const getImages: (fn: {
  subreddit: string;
  sort?: string;
  after?: string;
  q?: string;
}) => Promise<{ images: Pick<IPost, ReturnKeys>[]; after: string }> = async ({
  subreddit,
  sort = "top",
  after,
  q,
}) => {
  const searchParams = new URLSearchParams({
    nsfw: "1",
    include_over_18: "on",
    restrict_sr: "true",
    t: "all",
  });

  if (after) searchParams.append("after", after);
  if (sort) searchParams.append("sort", sort);
  if (q) searchParams.append("q", q);

  const url = q
    ? `https://www.reddit.com/r/${subreddit}/search.json?${searchParams.toString()}`
    : `https://www.reddit.com/r/${subreddit}/${sort}.json?${searchParams.toString()}`;

  const { children, after: newAfter } = await fetchPosts(url);

  const images = children
    .map((c) => c.data)
    .flatMap(expandGallery)
    .filter(
      (post) =>
        !post.is_self &&
        !post.is_video &&
        !post.media &&
        IMAGE_EXTENSION_LIST.some((e) => post.url?.endsWith(e))
    )
    .map((post) => getKeys(post, SELECT_KEYS));

  return { images, after: newAfter };
};
