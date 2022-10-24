import { initTRPC } from '@trpc/server'
import { z } from 'zod'
import { getImages } from '@api/lib/get-images'
import { getAutocompleteSubreddits } from '@api/lib/get-autocomplete-subreddits'

const t = initTRPC.create()

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
      return {
        schema: ['name', 'url', 'title'] as const,
        images: images.map(
          ({ name, url, title }) => [name, url, title] as const
        ),
        after,
      }
    }),
  subredditAutocomplete: t.procedure
    .input(z.string())
    .query(async ({ input }) => {
      const { subreddits } = await getAutocompleteSubreddits(input)
      return {
        schema: ['id', 'name'] as const,
        subreddits: subreddits.map(({ id, name }) => [id, name] as const),
      }
    }),
})

export type AppRouter = typeof appRouter
