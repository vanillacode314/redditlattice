import { createStore } from 'solid-js/store'
import { createStorageSignal } from '@solid-primitives/storage'
import { parse, stringify } from 'devalue'
import _ from 'lodash'
import { createRenderEffect } from 'solid-js'

export interface IImage {
  name: string
  url: string
  title: string
}

interface IAppState {
  title: string
  drawerVisible: boolean
  navVisible: boolean
  isSearching: boolean
  images: {
    key: string
    after: string
    data: Set<IImage>
  }
}

export interface IUserState {
  subreddits: Set<string>
  searchTerms: Map<string, string>
  sort: Map<string, string>
  imageSizeMultiplier: number
  prefferedImageFormat: string
  processImages: boolean
  hideNSFW: boolean
}

const [appState, setAppState] = createStore<IAppState>({
  title: '',
  drawerVisible: false,
  navVisible: true,
  isSearching: false,
  images: {
    key: '',
    after: '',
    data: new Set(),
  },
})

function GET_DEFAULT_USER_STATE(): IUserState {
  return {
    subreddits: new Set(),
    searchTerms: new Map(),
    sort: new Map(),
    imageSizeMultiplier: 2,
    prefferedImageFormat: 'webp',
    processImages: false,
    hideNSFW: true,
  }
}

const [userState, setUserState] = createStorageSignal<IUserState>(
  'user-state',
  GET_DEFAULT_USER_STATE(),
  {
    serializer: stringify,
    deserializer: parse,
  }
)

export const useAppState = () => [appState, setAppState] as const
export const useUserState = () => [userState, setUserState] as const

createRenderEffect(() =>
  setUserState((state) => {
    state = _.merge(GET_DEFAULT_USER_STATE(), state)
    return state
  })
)