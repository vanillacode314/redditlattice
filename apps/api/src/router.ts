import { initTRPC } from '@trpc/server'
import { z } from 'zod'
import { getImages } from '@api/lib/get-images'
import { getAutocompleteSubreddits } from '@api/lib/get-autocomplete-subreddits'

const t = initTRPC.create()

export function buildFromSchema<R extends {} = {}, S extends keyof R = keyof R>(
  schema: readonly S[],
  data: readonly R[]
): Array<Array<R[keyof R]>> {
  return data.map((item) => schema.map((fieldName) => item[fieldName]))
}

export const appRouter = t.router({
  getImages: t.procedure
    .input(
      z.object({
        subreddits: z.array(z.string()),
        q: z.array(z.string()).optional(),
        after: z.string().optional(),
        sort: z.string(),
        nsfw: z.boolean().optional(),
      })
    )
    .query(async ({ input }) => {
      const { images, after } = await getImages(input)
      const schema = ['name', 'url', 'title'] as const
      return {
        schema,
        images: buildFromSchema(schema, images),
        after,
      }
    }),
  subredditAutocomplete: t.procedure
    .input(z.string())
    .query(async ({ input }) => {
      const { subreddits } = await getAutocompleteSubreddits(input)
      const schema = ['id', 'name'] as const
      return {
        schema,
        subreddits: buildFromSchema(schema, subreddits),
      }
    }),
})

export type AppRouter = typeof appRouter
