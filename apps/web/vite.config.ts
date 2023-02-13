import path from 'path'
import netlify from 'solid-start-netlify'
import node from 'solid-start-node'
import solid from 'solid-start/vite'
import {
  presetAttributify,
  presetIcons,
  presetUno,
  presetWebFonts,
} from 'unocss'
import Unocss from 'unocss/vite'
import { defineConfig } from 'vite'
import pkgJson from './package.json' assert { type: 'json' }

export default defineConfig({
  define: {
    __version__: JSON.stringify(pkgJson.version),
  },
  resolve: {
    alias: {
      '~': path.resolve(__dirname, 'src'),
      '@ui': path.resolve(__dirname, '../../packages/ui'),
      '@api': path.resolve(__dirname, '../../apps/api/src'),
      '@image-server': path.resolve(__dirname, '../../apps/image-server/src'),
    },
  },
  plugins: [
    solid({ ssr: false, adapter: process.env.NETLIFY ? netlify() : node() }),
    Unocss({
      presets: [
        presetUno(),
        presetAttributify(),
        presetWebFonts({
          provider: 'google',
          fonts: {
            sans: ['Roboto:400,500,600,700'],
          },
        }),
        presetIcons({
          extraProperties: {
            display: 'inline-block',
            'vertical-align': 'middle',
          },
        }),
      ],
    }),
  ],
})
