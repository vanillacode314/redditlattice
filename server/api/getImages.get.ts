import { IMAGE_EXTENSION_LIST } from "~/consts";
import type { IPost, IRemotePostsData } from "~/types";
import { getKeys } from "~~/composables/use-utils";

type ReturnKeys = "name" | "url" | "title";

function expandGallery(post: IPost): Pick<IPost, ReturnKeys>[] {
  if (
    !post.url.startsWith(`https://www.reddit.com/gallery/`) ||
    Object.values(post.media_metadata).length === 0
  )
    return [post];
  return Array.from(
    Object.values(post.media_metadata).map(({ id, m: mime }) => {
      const fileExtension = mime.replace("image/", "");
      return {
        name: `${post.name}-${id}`,
        url: `https://i.redd.it/${id}.${fileExtension}`,
        title: post.title,
      };
    })
  );
}

export default defineEventHandler(async (event) => {
  let { subreddit, sort, after: before, q } = useQuery(event);
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
    if (before) searchParams.append("after", before as string);
    url = `https://www.reddit.com/r/${subreddit}/search.json?${searchParams.toString()}`;
  } else {
    if (before) searchParams.append("after", before as string);
    url = `https://www.reddit.com/r/${subreddit}/${sort}.json?${searchParams.toString()}`;
  }

  const {
    data: { children, after },
  } = await $fetch(url, { redirect: "error" });

  const posts: Pick<IPost, ReturnKeys>[] = children
    .map((c) => c.data)
    .flatMap(expandGallery)
    .filter(
      (post: IPost) =>
        !post.is_self &&
        !post.is_video &&
        !post.media &&
        IMAGE_EXTENSION_LIST.some((e) => post.url?.endsWith(e))
    )
    .map((post: IPost) => getKeys(post, ["name", "url", "title"]));

  return { posts, after };
});
