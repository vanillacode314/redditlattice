import { getKeys } from '@api/utils'
import { ISubreddit, IRemoteSubredditAutocompleteData } from '@api/types'

const SELECT_KEYS = ['id', 'name'] as const
type ReturnKeys = typeof SELECT_KEYS[number]

async function fetchAutocompleteResults(
  url: string
): Promise<IRemoteSubredditAutocompleteData> {
  const res = await fetch(url, { redirect: 'error' })
  const data = await res.json()
  return data
}

export const getAutocompleteSubreddits: (query: string) => Promise<{
  subreddits: Pick<ISubreddit, ReturnKeys>[]
}> = async (query) => {
  const searchParams = new URLSearchParams({
    nsfw: '0',
    include_over_18: 'off',
    include_profiles: 'off',
    query,
  })
  const url = `https://www.reddit.com/api/subreddit_autocomplete.json?${searchParams.toString()}`

  const { subreddits: data } = await fetchAutocompleteResults(url)

  const subreddits = data
    .filter((sr) => sr.allowedPostTypes.images)
    .map((sr) => getKeys(sr, SELECT_KEYS))

  return { subreddits }
}
