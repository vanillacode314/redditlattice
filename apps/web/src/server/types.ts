import z from 'zod'
export const subredditSchema = z.object({
  allowedPostTypes: z.object({
    images: z.boolean(),
  }),
  id: z.string(),
  name: z.string(),
})

export const remoteSubredditAutocompleteDataSchema = z.object({
  subreddits: subredditSchema.array(),
})

export const postSchema = z.object({
  is_self: z.boolean(),
  is_video: z.boolean(),
  media: z.unknown(),
  media_metadata: z
    .record(z.string(), z.object({ id: z.string(), m: z.string() }))
    .nullish(),
  name: z.string(),
  url: z.string().transform((url) => {
    const newUrl = new URL(url)
    newUrl.protocol = 'https'
    return newUrl.toString()
  }),
  title: z.string(),
  over_18: z.boolean(),
})

export const remotePostsDataSchema = z.object({
  children: z
    .object({ data: postSchema })
    .transform(({ data }) => data)
    .array(),
  after: z.string().nullable(),
})

declare global {
  type TSubreddit = z.infer<typeof subredditSchema>
  type TRemoteSubredditAutocompleteData = z.infer<
    typeof remoteSubredditAutocompleteDataSchema
  >
  type TRemotePostsData = z.infer<typeof remotePostsDataSchema>
  type TPost = z.infer<typeof postSchema>
}
