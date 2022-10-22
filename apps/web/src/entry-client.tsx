import { mount, StartClient } from 'solid-start/entry-client'

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js', { scope: '/' })
}

mount(() => <StartClient />, document)
