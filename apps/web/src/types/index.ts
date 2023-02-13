import z from 'zod'

export const imageSchema = z.object({
  name: z.string(),
  url: z.string(),
  title: z.string(),
})

export const actionSchema = z.object({
  id: z.string(),
  icon: z.string(),
})

export const postSchema = z.object({
  is_self: z.boolean(),
  is_video: z.boolean(),
  media: z.unknown(),
  media_metadata: z.record(z.string(), z.unknown()),
  name: z.string(),
  url: z.string(),
  title: z.string(),
})

export const remotePostsDataSchema = z.object({
  children: z.object({
    data: postSchema.array(),
  }),
  after: z.string(),
})

declare global {
  type TAction = z.infer<typeof actionSchema>
  type TPost = z.infer<typeof postSchema>
  type TRemotePostsData = z.infer<typeof remotePostsDataSchema>
  type TImage = z.infer<typeof imageSchema>
}
