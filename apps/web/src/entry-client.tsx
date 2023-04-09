import { QueryClientProvider } from '@tanstack/solid-query'
import { isDev } from 'solid-js/web'
import { mount, StartClient } from 'solid-start/entry-client'
import { queryClient, trpc } from './utils/trpc'

function initGtag() {
  window.dataLayer ||= []
  window.gtag = function (...args: unknown[]) {
    dataLayer.push(args)
  }
  gtag('js', new Date())
  gtag('config', 'G-XDR9E19TGZ', {
    cookie_domain: window.location.hostname,
    cookie_flags: 'SameSite=None;Secure',
  })
}

mount(
  () => (
    <QueryClientProvider client={queryClient}>
      <StartClient />
    </QueryClientProvider>
  ),
  document
)

if (!isDev && 'serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js', { scope: '/' })
  navigator.serviceWorker.addEventListener('controllerchange', () =>
    window.location.reload()
  )
}

initGtag()
