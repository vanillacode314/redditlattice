// @refresh reload
import { MetaProvider } from '@solidjs/meta'
import '@unocss/reset/tailwind.css'
import * as devalue from 'devalue'
import { delMany, entries } from 'idb-keyval'
import { Component, onMount } from 'solid-js'
import {
  Body,
  FileRoutes,
  Head,
  Html,
  Link,
  Meta,
  Routes,
  Scripts,
  Title,
} from 'solid-start'
import 'virtual:uno.css'
import Base from '~/layouts/Base'
import { useAppState, useUserState } from '~/stores'
import './root.css'
import { asyncFilter } from './utils'

export const Root: Component = () => {
  const [appState] = useAppState()
  const [, setUserState] = useUserState()

  const migrateV1toV2 = () => {
    if (localStorage.getItem('migration-v1-to-v2-done')) return
    let userStateV1: any = localStorage.getItem('user-state')
    if (!userStateV1) return
    userStateV1 = devalue.parse(userStateV1)
    if (!userStateV1) return
    userStateV1.redditQueries = userStateV1.searchTerms
    userStateV1.subredditSort = userStateV1.sort
    userStateV1.redditCollections = userStateV1.collections
    userStateV1.redditRecents = userStateV1.recents
    setUserState(userStateV1)
    localStorage.setItem('migration-v1-to-v2-done', 'true')
  }

  const cleanCache = async () => {
    const cache = await caches.open('images-assets')
    if (!cache) return
    const urlsToDelete: IDBValidKey[] = await entries()
      .then((entries) =>
        asyncFilter(entries, async ([_url, { requestUrl }]) => {
          const entry = await cache.match(requestUrl)
          return !entry
        })
      )
      .then((entries) => entries.map(([url, _data]) => url))
    await delMany(urlsToDelete)
  }

  onMount(() => migrateV1toV2())
  onMount(() => cleanCache())

  return (
    <MetaProvider tags={[]}>
      <Html lang="en">
        <Head>
          <Title>
            {appState.title
              ? `${appState.title} - RedditLattice`
              : `RedditLattice`}
          </Title>
          <Meta charset="utf-8" />
          <Meta
            name="viewport"
            content="width=device-width, initial-scale=1, viewport-fit=cover"
          />
          <script
            async
            src="https://www.googletagmanager.com/gtag/js?id=G-XDR9E19TGZ"
          ></script>
          <Link rel="manifest" href="/manifest.webmanifest"></Link>
          <Link rel="icon" href="/favicon.svg" />
        </Head>
        <Body>
          <Base>
            <Routes>
              <FileRoutes />
            </Routes>
            <Scripts />
          </Base>
        </Body>
      </Html>
    </MetaProvider>
  )
}

export default Root
