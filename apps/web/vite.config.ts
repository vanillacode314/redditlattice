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
import { version } from './package.json' assert { type: 'json' }

export default defineConfig({
  define: {
    __version__: JSON.stringify(version),
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
    solid({ adapter: netlify() }),
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
