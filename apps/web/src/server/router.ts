import { z } from 'zod'
import { getAutocompleteSubreddits } from '~/server/lib/get-autocomplete-subreddits'
import { getImages } from '~/server/lib/get-images'
import { procedure, router } from './app'

export const appRouter = router({
  getImages: procedure
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
        images: buildFromSchema(images, schema),
        after,
      }
    }),
  subredditAutocomplete: procedure
    .input(z.string())
    .query(async ({ input }) => {
      const { subreddits } = await getAutocompleteSubreddits(input)
      const schema = ['id', 'name'] as const
      type Z = Schema<
        (typeof subreddits)[number],
        ['allowedPostTypes', 'id', 'name']
      >
      return {
        schema,
        subreddits: buildFromSchema(subreddits, schema),
      }
    }),
})

export type AppRouter = typeof appRouter

type Schema<T, U extends ReadonlyArray<keyof T>> = {
  [K in keyof U]: T[U[K]]
}

function buildFromSchema<
  T extends Record<string, unknown>,
  U extends ReadonlyArray<keyof T>
>(arr: T[], schema: U): Schema<T, U>[] {
  return arr.map((obj) => {
    const values: Schema<T, U> = [] as unknown as Schema<T, U>
    for (const key of schema) {
      values.push(obj[key])
    }
    return values
  })
}
