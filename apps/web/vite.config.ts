import solid from 'solid-start/vite'
import { defineConfig } from 'vite'
import Unocss from '@unocss/vite'
import {
  presetUno,
  presetIcons,
  presetWebFonts,
  presetAttributify,
} from 'unocss'
import path from 'path'
import netlify from 'solid-start-netlify'
import node from 'solid-start-node'
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
        presetAttributify(),
        presetWebFonts({
          provider: 'google',
          fonts: {
            sans: ['Roboto:400,500,600,700'],
          },
        }),
        presetUno(),
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
