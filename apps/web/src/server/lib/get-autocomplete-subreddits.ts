import z from 'zod'
import {
  remoteSubredditAutocompleteDataSchema,
  subredditSchema,
} from '~/server/types'

const fetchAutocompleteResults = z
  .function()
  .args(z.string())
  .returns(remoteSubredditAutocompleteDataSchema.promise())
  .implement(async (url) => {
    const res = await fetch(url, { redirect: 'error' })
    const data = await res.json()
    return data as TRemoteSubredditAutocompleteData
  })

export const getAutocompleteSubreddits = z
  .function()
  .args(z.string())
  .returns(
    z
      .object({
        subreddits: subredditSchema.pick({ id: true, name: true }).array(),
      })
      .promise()
  )
  .implement(async (query) => {
    const searchParams = new URLSearchParams({
      nsfw: '0',
      include_over_18: 'off',
      include_profiles: 'off',
      query,
    })
    const url = `https://www.reddit.com/api/subreddit_autocomplete.json?${searchParams.toString()}`
    const { subreddits: data } = await fetchAutocompleteResults(url)
    const subreddits = data.filter((sr) => sr.allowedPostTypes.images)
    return { subreddits }
  })
