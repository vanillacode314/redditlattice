import { mount, StartClient } from 'solid-start/entry-client'

function initGtag() {
  window.dataLayer = window.dataLayer || []
  window.gtag = function () {
    dataLayer.push(arguments)
  }
  gtag('js', new Date())
  gtag('config', 'G-XDR9E19TGZ', {
    cookie_domain: window.location.hostname,
    cookie_flags: 'SameSite=None;Secure',
  })
}

mount(() => <StartClient />, document)

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js', { scope: '/' })
}

initGtag()
