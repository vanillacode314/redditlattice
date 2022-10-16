export interface ISubreddit {
  allowedPostTypes: {
    images: boolean
  }
  id: string
  name: string
}

export interface IRemoteSubredditAutocompleteData {
  subreddits: ISubreddit[]
}

export interface IRemotePostsData {
  children: { data: IPost }[]
  after: string
}

export interface IPost {
  is_self: boolean
  is_video: boolean
  media: unknown
  media_metadata: Record<string, any>
  name: string
  url: string
  title: string
}
