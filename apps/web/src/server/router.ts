import dotenv from 'dotenv'
import Redis from 'ioredis'
import { z } from 'zod'
import { getAutocompleteSubreddits } from '~/server/lib/get-autocomplete-subreddits'
import { getImages } from '~/server/lib/get-images'
import { procedure, router } from './app'
dotenv.config()
const redis = new Redis(process.env.REDIS_URL!)

async function cachedOrElse<T>(
  key: string,
  cb: () => T,
  ttl: number = 300
): Promise<T> {
  const cached = await redis.get(key)
  if (cached) return JSON.parse(cached) as T
  const data = await cb()
  await Promise.all([
    redis.set(key, JSON.stringify(data)),
    redis.expire(key, ttl),
  ])
  return data
}

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
      const key = JSON.stringify(input)
      return cachedOrElse(key, async () => {
        const { images, after } = await getImages(input)
        const schema = ['name', 'url', 'title'] as const
        return {
          schema,
          images: buildFromSchema(images, schema),
          after,
        }
      })
    }),
  subredditAutocomplete: procedure
    .input(z.string())
    .query(async ({ input }) => {
      const key = JSON.stringify(input)
      return cachedOrElse(key, async () => {
        const { subreddits } = await getAutocompleteSubreddits(input)
        const schema = ['id', 'name'] as const
        return {
          schema,
          subreddits: buildFromSchema(subreddits, schema),
        }
      })
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
