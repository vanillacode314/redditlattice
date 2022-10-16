// @refresh reload
import { Component, onMount, Suspense } from 'solid-js'
import {
  Body,
  ErrorBoundary,
  FileRoutes,
  Head,
  Html,
  Link,
  Meta,
  Routes,
  Scripts,
  Title,
} from 'solid-start'

import '@unocss/reset/tailwind.css'
import 'uno.css'
import './root.css'
import Base from '~/layouts/Base'
import { useAppState, useUserState } from '~/stores'
import { Spinner } from 'ui'
import { DevtoolsOverlay } from '@solid-devtools/overlay'

export const Root: Component = () => {
  const [appState] = useAppState()
  const [, setUserState] = useUserState()

  const importLegacyState = () => {
    const localSr = localStorage.getItem('subreddits')
    if (localSr) {
      const sr = JSON.parse(localSr)
      setUserState((_) => {
        for (const x of sr) {
          _.subreddits.add(x)
        }
        return { ..._ }
      })
      localStorage.removeItem('subreddits')
    }
    const localSearches = localStorage.getItem('searches')
    if (localSearches) {
      const searches = JSON.parse(localSearches)
      setUserState((_) => {
        for (const x of searches) {
          _.searchTerms.set(x, '')
        }
        return { ..._ }
      })
      localStorage.removeItem('searches')
    }
  }

  onMount(() => importLegacyState())

  return (
    <Html lang="en">
      <Head>
        <Title>
          {appState.title
            ? `${appState.title} - RedditLattice`
            : `RedditLattice`}
        </Title>
        <Meta charset="utf-8" />
        <Meta name="viewport" content="width=device-width, initial-scale=1" />
        <Link rel="manifest" href="/manifest.webmanifest"></Link>
        <Link rel="icon" href="/favicon.svg" />
      </Head>
      <Body>
        <Base>
          <Suspense
            fallback={
              <div class="p-5 grid place-items-center">
                <Spinner></Spinner>
              </div>
            }
          >
            <ErrorBoundary>
              <Routes>
                <FileRoutes />
              </Routes>
            </ErrorBoundary>
          </Suspense>
          <Scripts />
        </Base>
        <DevtoolsOverlay />
      </Body>
    </Html>
  )
}

export default Root
