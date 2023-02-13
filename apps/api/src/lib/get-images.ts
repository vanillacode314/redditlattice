import { IMAGE_EXTENSION_LIST } from '@api/consts'
import { postSchema, remotePostsDataSchema } from '@api/types'
import z from 'zod'

const expandGallery = z
  .function()
  .args(postSchema)
  .returns(postSchema.array())
  .implement((post) => {
    if (
      !post.url.startsWith(`https://www.reddit.com/gallery/`) ||
      !post.media_metadata
    )
      return [post]

    return Object.values(post.media_metadata).map(({ id, m: mime }) => {
      const fileExtension = mime.replace('image/', '')
      return {
        ...post,
        name: `${post.name}-${id}`,
        url: `https://i.redd.it/${id}.${fileExtension}`,
        title: post.title,
      }
    })
  })

const fetchPosts = z
  .function()
  .args(z.string())
  .returns(remotePostsDataSchema.promise())
  .implement(async (url) => {
    const res = await fetch(url, { redirect: 'error' })
    const data = await res.json()
    return data.data as z.input<typeof remotePostsDataSchema>
  })

export const getImages = z
  .function()
  .args(
    z.object({
      subreddits: z
        .string()
        .array()
        .transform((subreddits) => subreddits.join('+')),
      sort: z.string(),
      after: z.string().optional(),
      q: z
        .string()
        .transform((query) => `(${query})`)
        .array()
        .optional(),
      nsfw: z.boolean().optional(),
    })
  )
  .returns(
    z
      .object({
        images: postSchema
          .pick({
            name: true,
            title: true,
            url: true,
          })
          .array(),
        after: z.string().nullable(),
      })
      .promise()
  )
  .implement(async ({ sort, subreddits, q = [], nsfw = false, after = '' }) => {
    const searchParams = new URLSearchParams({
      restrict_sr: 'true',
      t: 'all',
    })

    /* NOTE: Disabling NSFW Content Permanently */
    searchParams.append('nsfw', `0`)
    searchParams.append('include_over_18', 'off')

    if (after) searchParams.append('after', after)
    if (sort) searchParams.append('sort', sort)
    if (q.length > 0) searchParams.append('q', q.join(' OR '))

    const url = `https://www.reddit.com/r/${subreddits}/${
      q.length > 0 ? 'search' : sort
    }.json?${searchParams.toString()}`

    const { children, after: newAfter } = await fetchPosts(url)

    const images = children
      .flatMap(expandGallery)
      .filter(
        (post) =>
          !post.is_self &&
          !post.is_video &&
          !post.media &&
          !(post.over_18 && !nsfw) &&
          IMAGE_EXTENSION_LIST.some((e) => post.url.endsWith(e))
      )

    return { images, after: newAfter }
  })
