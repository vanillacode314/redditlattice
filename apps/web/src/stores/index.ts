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
      const data = deserializer(localStorageValue)
      set(data)
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

export interface IImage {
  name: string
  url: string
  title: string
}

export interface IAppState {
  title: string
  drawerVisible: boolean
  navVisible: boolean
  isSearching: boolean
  autoScrolling: boolean
  images: {
    key: string
    after: string
    data: Set<IImage>
  }
}

const userStateSchema = z.object({
  subreddits: z.set(z.string()),
  searchTerms: z.map(z.string(), z.string()),
  sort: z.map(z.string(), z.string()),
  imageSizeMultiplier: z.number(),
  prefferedImageFormat: z.string(),
  processImages: z.boolean(),
  hideNSFW: z.boolean(),
  gap: z.number(),
  borderRadius: z.number(),
  collections: z.map(z.string(), z.string()),
  recents: z.map(z.string(), z.number()),
  recentsLimit: z.number(),
  columnMaxWidth: z.number(),
})

type TUserState = z.infer<typeof userStateSchema>

const [appState, setAppState] = createStore<IAppState>({
  title: '',
  drawerVisible: false,
  navVisible: true,
  isSearching: false,
  autoScrolling: false,
  images: {
    key: '',
    after: '',
    data: new Set(),
  },
})

function GET_DEFAULT_USER_STATE(): TUserState {
  return {
    subreddits: new Set(),
    searchTerms: new Map(),
    sort: new Map(),
    imageSizeMultiplier: 2,
    prefferedImageFormat: 'webp',
    processImages: false,
    hideNSFW: true,
    gap: 10,
    borderRadius: 10,
    collections: new Map(),
    columnMaxWidth: 400,
    recents: new Map(),
    recentsLimit: 5,
  }
}

const [userState, setUserState] = createLocalStorageStore<TUserState>(
  'user-state',
  GET_DEFAULT_USER_STATE(),
  {
    serializer: (obj) => stringify(filterStringKeys(obj)),
    deserializer: parse,
  }
)

export const useAppState = () => [appState, setAppState] as const
export const useUserState = () => [userState, setUserState] as const
