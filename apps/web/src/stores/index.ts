import { createStore } from 'solid-js/store'
import { isServer } from 'solid-js/web'
import { parse, stringify } from 'devalue'
import { createComputed } from 'solid-js'
import { filterStringKeys } from '~/utils'
import { z } from 'zod'

interface LocalStorageStoreOptions<T = any> {
  serializer: (input: T) => string
  deserializer: (input: string) => T
}
const createLocalStorageStore = <T extends Record<string, any>>(
  localStorageKey: string,
  initialValue: T,
  {
    serializer = JSON.stringify,
    deserializer = JSON.parse,
  }: Partial<LocalStorageStoreOptions<T>> = {}
) => {
  const [store, set] = createStore<T>(initialValue)

  function getLocalStorageValue() {
    const localStorageValue = localStorage.getItem(localStorageKey)
    if (!localStorageValue) {
      localStorage.setItem(localStorageKey, serializer(initialValue))
      return
    }

    try {
      set(deserializer(localStorageValue))
    } catch {
      localStorage.setItem(localStorageKey, serializer(initialValue))
    }
  }

  if (!isServer) {
    getLocalStorageValue()
    window.addEventListener('storage', () => getLocalStorageValue())
  }

  createComputed(
    () => !isServer && localStorage.setItem(localStorageKey, serializer(store))
  )

  return [store, set] as const
}

const imageSchema = z.object({
  name: z.string(),
  url: z.string(),
  title: z.string(),
})
export type TImage = z.infer<typeof imageSchema>

const appStateSchema = z.object({
  title: z.string().default(''),
  drawerVisible: z.boolean().default(false),
  navVisible: z.boolean().default(true),
  isSearching: z.boolean().default(false),
  autoScrolling: z.boolean().default(false),
  images: z
    .object({
      key: z.string().default(''),
      after: z.string().default(''),
      data: z.set(imageSchema).default(() => new Set<TImage>()),
    })
    .default({}),
})
export type TAppState = z.infer<typeof appStateSchema>
const [appState, setAppState] = createStore<TAppState>(appStateSchema.parse({}))
export const useAppState = () => [appState, setAppState] as const

const userStateSchema = z.object({
  subreddits: z.set(z.string()).default(() => new Set<string>()),
  pinterestQueries: z.set(z.string()).default(() => new Set<string>()),
  searchTerms: z.map(z.string(), z.string()).default(() => new Map()),
  sort: z.map(z.string(), z.string()).default(() => new Map()),
  imageSizeMultiplier: z.number().default(2),
  prefferedImageFormat: z.string().default('webp'),
  processImages: z.boolean().default(false),
  hideNSFW: z.boolean().default(true),
  gap: z.number().default(10),
  borderRadius: z.number().default(10),
  collections: z.map(z.string(), z.string()).default(() => new Map()),
  favouriteSubreddits: z.set(z.string()).default(() => new Set<string>()),
  recents: z.map(z.string(), z.number()).default(() => new Map()),
  recentsLimit: z.number().default(5),
  columnMaxWidth: z.number().default(400),
})
export type TUserState = z.infer<typeof userStateSchema>
const [userState, setUserState] = createLocalStorageStore<TUserState>(
  'user-state',
  userStateSchema.parse({}),
  {
    serializer: (obj) => stringify(filterStringKeys(obj)),
    deserializer: (inp) => userStateSchema.parse(parse(inp)),
  }
)
export const useUserState = () => [userState, setUserState] as const
