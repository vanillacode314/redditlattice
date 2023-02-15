import * as devalue from 'devalue'
import { createEffect, on } from 'solid-js'
import { createStore } from 'solid-js/store'
import { z } from 'zod'
import { imageSchema } from '~/types'
import { createLocalStorageStore } from '~/utils/store'

export const appStateSchema = z.object({
  title: z.string().default(''),
  drawerVisible: z.boolean().default(false),
  navVisible: z.boolean().default(true),
  isSearching: z.boolean().default(false),
  autoScrolling: z.boolean().default(false),
  scrollElement: z.instanceof(HTMLElement).optional(),
  images: z
    .object({
      key: z.string().default(''),
      after: z.string().default(''),
      data: z.set(imageSchema).default(() => new Set<TImage>()),
    })
    .default({}),
})
const [appState, setAppState] = createStore<TAppState>(appStateSchema.parse({}))
createEffect(
  on(
    () => appState.scrollElement,
    (el) => {
      if (!el) return
      el.id = 'scroller'
    }
  )
)
export const useAppState = () => [appState, setAppState] as const

export const userStateSchema = z.object({
  subreddits: z.set(z.string()).default(() => new Set<string>()),
  pinterestQueries: z.set(z.string()).default(() => new Set<string>()),
  redditQueries: z.map(z.string(), z.string()).default(() => new Map()),
  subredditSort: z.map(z.string(), z.string()).default(() => new Map()),
  imageSizeMultiplier: z.number().default(2),
  prefferedImageFormat: z.enum(['avif', 'webp']).default('webp'),
  processImages: z.boolean().default(false),
  hideNSFW: z.boolean().default(true),
  gap: z.number().default(10),
  borderRadius: z.number().default(10),
  redditCollections: z.map(z.string(), z.string()).default(() => new Map()),
  favouriteSubreddits: z.set(z.string()).default(() => new Set<string>()),
  redditRecents: z.map(z.string(), z.number()).default(() => new Map()),
  recentsLimit: z.number().default(5),
  columnMaxWidth: z.number().default(400),
})
const [userState, setUserState] = createLocalStorageStore(
  'user-state-v2',
  userStateSchema.parse({}),
  {
    schema: userStateSchema,
    serializer: devalue.stringify,
    deserializer: devalue.parse,
  }
)
export const useUserState = () => [userState, setUserState] as const

declare global {
  type TAppState = z.infer<typeof appStateSchema>
  type TUserState = z.infer<typeof userStateSchema>
}
