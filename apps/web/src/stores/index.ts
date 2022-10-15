import { createStore } from "solid-js/store";
import { createStorageSignal } from "@solid-primitives/storage";
import { parse, stringify } from "devalue";

export interface IImage {
  name: string;
  url: string;
  title: string;
}

interface IAppState {
  title: string;
  drawerVisible: boolean;
  navVisible: boolean;
  isSearching: boolean;
  images: {
    key: string;
    after: string;
    data: Set<IImage>;
  };
}

export interface IUserState {
  subreddits: Set<string>;
  searchTerms: Map<string, string>;
  sort: Map<string, string>;
}

const appStore = createStore<IAppState>({
  title: "",
  drawerVisible: false,
  navVisible: true,
  isSearching: false,
  images: {
    key: "",
    after: "",
    data: new Set(),
  },
});

const userSignal = createStorageSignal<IUserState>(
  "user-state",
  {
    subreddits: new Set(),
    searchTerms: new Map(),
    sort: new Map(),
  },
  {
    serializer: stringify,
    deserializer: parse,
  }
);

export const useAppState = () => appStore;
export const useUserState = () => userSignal;
